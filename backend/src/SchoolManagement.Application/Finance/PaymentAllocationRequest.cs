namespace SchoolManagement.Application.Finance;

public sealed record PaymentAllocationRequest(Guid StudentInvoiceId, decimal Amount, string? Notes = null);
