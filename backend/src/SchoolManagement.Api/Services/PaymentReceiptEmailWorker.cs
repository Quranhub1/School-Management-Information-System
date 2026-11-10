using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace SchoolManagement.Api.Services;

public sealed class PaymentReceiptEmailWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<PaymentReceiptEmailWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        do
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var receiptService = scope.ServiceProvider.GetRequiredService<PaymentReceiptEmailService>();
                var processed = await receiptService.ProcessPendingReceiptsAsync(stoppingToken);
                if (processed > 0)
                    logger.LogInformation("Payment receipt email worker sent {Count} receipt email(s).", processed);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Payment receipt email worker iteration failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
