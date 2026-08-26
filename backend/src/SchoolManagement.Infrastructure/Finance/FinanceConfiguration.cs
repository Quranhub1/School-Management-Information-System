using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Finance;

public sealed class FinanceConfiguration : IEntityTypeConfiguration<FeeStructure>
{
    public void Configure(EntityTypeBuilder<FeeStructure> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(x => new { x.ProgrammeId, x.AcademicYearId, x.Name }).IsUnique();
        builder.HasIndex(x => new { x.AcademicYearId, x.IsActive });
    }
}

public sealed class StudentInvoiceConfiguration : IEntityTypeConfiguration<StudentInvoice>
{
    public void Configure(EntityTypeBuilder<StudentInvoice> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.PaidAmount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.InvoiceNumber).IsUnique();
        builder.HasIndex(x => new { x.StudentId, x.Status });
    }
}

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ReceiptNumber).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.PaymentMethod).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Reference).HasMaxLength(120);
        builder.HasIndex(x => x.ReceiptNumber).IsUnique();
        builder.HasIndex(x => new { x.StudentInvoiceId, x.PaidAt });
    }
}

public sealed class SponsorshipConfiguration : IEntityTypeConfiguration<Sponsorship>
{
    public void Configure(EntityTypeBuilder<Sponsorship> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SponsorName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(x => new { x.StudentId, x.Status });
    }
}

public sealed class InstalmentPlanConfiguration : IEntityTypeConfiguration<InstalmentPlan>
{
    public void Configure(EntityTypeBuilder<InstalmentPlan> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.TotalAmount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(x => new { x.StudentId, x.Status });
    }
}

public sealed class InstalmentPaymentConfiguration : IEntityTypeConfiguration<InstalmentPayment>
{
    public void Configure(EntityTypeBuilder<InstalmentPayment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.PaymentMethod).HasMaxLength(40);
        builder.Property(x => x.ReceiptNumber).HasMaxLength(50);
        builder.Property(x => x.Reference).HasMaxLength(100);
        builder.HasIndex(x => new { x.InstalmentPlanId, x.Status });
    }
}

public sealed class MobileMoneyTransactionConfiguration : IEntityTypeConfiguration<MobileMoneyTransaction>
{
    public void Configure(EntityTypeBuilder<MobileMoneyTransaction> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.TransactionRef).IsUnique();
        builder.Property(x => x.TransactionRef).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Provider).HasMaxLength(30).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.ErrorMessage).HasMaxLength(500);
        builder.HasIndex(x => new { x.StudentId, x.Status });
    }
}

public sealed class DailyCollectionConfiguration : IEntityTypeConfiguration<DailyCollection>
{
    public void Configure(EntityTypeBuilder<DailyCollection> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CashierName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Notes).HasMaxLength(1000);
        builder.Property(x => x.CashExpected).HasPrecision(18, 2);
        builder.Property(x => x.CashActual).HasPrecision(18, 2);
        builder.Property(x => x.MobileMoneyTotal).HasPrecision(18, 2);
        builder.Property(x => x.BankTotal).HasPrecision(18, 2);
        builder.Property(x => x.CardTotal).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(x => new { x.CollectionDate, x.CashierUserId });
    }
}

public sealed class DailyCollectionPaymentConfiguration : IEntityTypeConfiguration<DailyCollectionPayment>
{
    public void Configure(EntityTypeBuilder<DailyCollectionPayment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PaymentMethod).HasMaxLength(40).IsRequired();
        builder.Property(x => x.ReceiptNumber).HasMaxLength(50);
        builder.Property(x => x.Reference).HasMaxLength(100);
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
    }
}
