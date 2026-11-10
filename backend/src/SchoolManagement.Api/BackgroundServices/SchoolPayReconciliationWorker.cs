using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.BackgroundServices;

public sealed class SchoolPayReconciliationWorker(
    IHttpClientFactory httpClientFactory,
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<SchoolPayOptions> optionsMonitor,
    ILogger<SchoolPayReconciliationWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            var options = optionsMonitor.CurrentValue;
            if (options.Enabled && options.ReconciliationEnabled)
            {
                if (string.IsNullOrWhiteSpace(options.SchoolCode) || string.IsNullOrWhiteSpace(options.ApiPassword))
                {
                    logger.LogWarning("SchoolPay reconciliation is enabled but SchoolCode or ApiPassword is not configured.");
                }
                else
                {
                    try
                    {
                        await ReconcileAsync(options, stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        break;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "SchoolPay transaction reconciliation failed.");
                    }
                }
            }

            var interval = TimeSpan.FromMinutes(Math.Clamp(options.ReconciliationIntervalMinutes, 5, 1440));
            await Task.Delay(interval, stoppingToken);
        }
    }

    private async Task ReconcileAsync(SchoolPayOptions options, CancellationToken cancellationToken)
    {
        if (!options.SchoolCode.All(char.IsDigit))
            throw new InvalidOperationException("SchoolPay SchoolCode must contain digits only.");

        // Uganda uses UTC+3 year-round. SchoolPay's Sync API expects school-local dates.
        var schoolLocalToday = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(3));
        var lookbackDays = Math.Clamp(options.ReconciliationLookbackDays, 1, 30);
        var fromDate = schoolLocalToday.AddDays(-lookbackDays).ToString("yyyy-MM-dd");
        var toDate = schoolLocalToday.ToString("yyyy-MM-dd");
        var hash = SchoolPaySyncHash.Compute(options.SchoolCode, fromDate, options.ApiPassword);
        var baseUrl = string.IsNullOrWhiteSpace(options.BaseUrl)
            ? "https://schoolpay.co.ug/paymentapi"
            : options.BaseUrl.TrimEnd('/');
        var requestUrl = $"{baseUrl}/AndroidRS/SchoolRangeTransactions/{options.SchoolCode}/{fromDate}/{toDate}/{hash}";

        var client = httpClientFactory.CreateClient(nameof(SchoolPayReconciliationWorker));
        client.Timeout = TimeSpan.FromSeconds(Math.Clamp(options.RequestTimeoutSeconds, 5, 120));
        if (!client.DefaultRequestHeaders.Accept.Any(x => x.MediaType == "application/json"))
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        using var response = await client.GetAsync(requestUrl, cancellationToken);
        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<SchoolPaySyncResponse>(cancellationToken: cancellationToken)
            ?? throw new InvalidOperationException("SchoolPay Sync API returned an empty response.");

        if (payload.ReturnCode != 0)
            throw new InvalidOperationException($"SchoolPay Sync API returned code {payload.ReturnCode}: {payload.ReturnMessage}");

        var transactions = (payload.Transactions ?? []).Concat(payload.SupplementaryFeePayments ?? []).ToList();
        var processed = 0;

        foreach (var transaction in transactions)
        {
            cancellationToken.ThrowIfCancellationRequested();
            // Isolate each provider transaction in its own scope so a failed EF save
            // cannot leave tracked entities that contaminate the next transaction.
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<SchoolManagementDbContext>();
            var schoolPay = scope.ServiceProvider.GetRequiredService<ISchoolPayService>();
            if (!string.Equals(transaction.TransactionCompletionStatus, "Completed", StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(transaction.SchoolPayReceiptNumber) ||
                string.IsNullOrWhiteSpace(transaction.SourceChannelTransactionId) ||
                string.IsNullOrWhiteSpace(transaction.SourcePaymentChannel) ||
                transaction.Amount <= 0)
            {
                logger.LogWarning("Skipping incomplete SchoolPay transaction with receipt {ReceiptNumber}.", transaction.SchoolPayReceiptNumber);
                continue;
            }

            var paymentCode = transaction.StudentPaymentCode?.Trim();
            var registrationNumber = transaction.StudentRegistrationNumber?.Trim();
            if (string.IsNullOrWhiteSpace(paymentCode) && string.IsNullOrWhiteSpace(registrationNumber))
            {
                logger.LogWarning("Skipping SchoolPay receipt {ReceiptNumber}: no student payment code was supplied.", transaction.SchoolPayReceiptNumber);
                continue;
            }

            var students = await db.Students.IgnoreQueryFilters()
                .Where(x => !x.IsArchived &&
                    ((!string.IsNullOrWhiteSpace(paymentCode) && x.StudentNumber == paymentCode) ||
                     (!string.IsNullOrWhiteSpace(registrationNumber) && x.StudentNumber == registrationNumber)))
                .Take(2)
                .ToListAsync(cancellationToken);
            if (students.Count != 1)
            {
                logger.LogWarning("Skipping SchoolPay receipt {ReceiptNumber}: student identifier did not match exactly one active SMIS student.", transaction.SchoolPayReceiptNumber);
                continue;
            }

            try
            {
                await schoolPay.ProcessNotificationAsync(
                    transaction.SchoolPayReceiptNumber,
                    transaction.SchoolPayReceiptNumber,
                    students[0].Id,
                    null,
                    transaction.Amount,
                    "UGX",
                    null,
                    transaction.StudentName,
                    transaction.SourcePaymentChannel,
                    JsonSerializer.Serialize(transaction),
                    cancellationToken,
                    transaction.SourceChannelTransactionId,
                    transaction.TransactionCompletionStatus);
                processed++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Continue the batch. The unique receipt and provider-transaction indexes
                // prevent a later reconciliation pass from duplicating a committed payment.
                logger.LogError(ex, "Could not reconcile SchoolPay receipt {ReceiptNumber}.", transaction.SchoolPayReceiptNumber);
            }
        }

        logger.LogInformation(
            "SchoolPay reconciliation checked {TransactionCount} provider transactions from {FromDate} through {ToDate}; {ProcessedCount} were posted or confirmed.",
            transactions.Count,
            fromDate,
            toDate,
            processed);
    }
}

internal sealed record SchoolPaySyncResponse(
    int ReturnCode,
    string? ReturnMessage,
    List<SchoolPaySyncTransaction>? Transactions,
    List<SchoolPaySyncTransaction>? SupplementaryFeePayments);

internal sealed record SchoolPaySyncTransaction(
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] decimal Amount,
    string? PaymentDateAndTime,
    string? SchoolPayReceiptNumber,
    string? SettlementBankCode,
    string? SourceChannelTransDetail,
    string? SourceChannelTransactionId,
    string? SourcePaymentChannel,
    string? StudentClass,
    string? StudentName,
    string? StudentPaymentCode,
    string? StudentRegistrationNumber,
    string? SupplementaryFeeDescription,
    string? SupplementaryFeeId,
    string? TransactionCompletionDateAndTime,
    string? TransactionCompletionStatus);
