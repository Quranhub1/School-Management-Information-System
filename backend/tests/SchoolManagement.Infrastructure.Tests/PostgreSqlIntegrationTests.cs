using Npgsql;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests;

public sealed class PostgreSqlIntegrationTests : IClassFixture<PostgreSqlIntegrationFixture>
{
    private readonly PostgreSqlIntegrationFixture fixture;

    public PostgreSqlIntegrationTests(PostgreSqlIntegrationFixture fixture) => this.fixture = fixture;

    [Fact]
    public async Task Database_is_reachable_and_contains_expected_schema()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('JournalEntries', 'JournalEntryLines');
            """, connection);
        Assert.Equal(2L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Posted_journal_immutability_function_is_installed()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM pg_proc
            WHERE proname = 'prevent_posted_journal_mutation';
            """, connection);
        Assert.Equal(1L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Posted_journal_immutability_triggers_are_installed()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM pg_trigger
            WHERE tgname IN ('trg_journal_entries_immutable', 'trg_journal_entry_lines_immutable');
            """, connection);
        Assert.Equal(2L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Posted_journal_update_and_delete_are_rejected_by_the_database_boundary()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var journalId = Guid.NewGuid();
        var entryNumber = $"CI-IMM-{Guid.NewGuid():N}";

        try
        {
            await InsertPostedJournalAsync(connection, transaction, journalId, entryNumber);
            await AssertDatabaseMutationRejectedAsync(connection, transaction, $"UPDATE \"JournalEntries\" SET \"Description\" = 'tampered' WHERE \"Id\" = '{journalId}';");
            await AssertDatabaseMutationRejectedAsync(connection, transaction, $"DELETE FROM \"JournalEntries\" WHERE \"Id\" = '{journalId}';");
            await transaction.RollbackAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [Fact]
    public async Task Posted_journal_line_insert_is_rejected_before_foreign_key_validation()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var journalId = Guid.NewGuid();
        var entryNumber = $"CI-LINE-{Guid.NewGuid():N}";

        try
        {
            await InsertPostedJournalAsync(connection, transaction, journalId, entryNumber);
            await AssertDatabaseMutationRejectedAsync(connection, transaction, $"INSERT INTO \"JournalEntryLines\" (\"Id\", \"JournalEntryId\", \"AccountId\", \"Description\", \"Debit\", \"Credit\", \"CreatedAt\") VALUES ('{Guid.NewGuid()}', '{journalId}', '{Guid.NewGuid()}', 'tampered line', 1, 0, CURRENT_TIMESTAMP);");
            await transaction.RollbackAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    [Fact]
    public async Task Finance_migrations_are_applied_to_the_ci_database()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*) FROM "__EFMigrationsHistory"
            WHERE "MigrationId" IN (
                '20260908120000_AddPostedJournalDatabaseImmutability',
                '20260908123001_FinanceAuditBoundary',
                '20260908130000_AddFiscalPeriods',
                '20260908140000_EnforceJournalFiscalPeriods',
                '20260908150000_AddBudgetManagement',
                '20260908150000_HardenBankReconciliation',
                '20260908160000_AddJournalEntrySourceFields',
                '20260908170000_AddJournalReversalReference');
            """, connection);
        Assert.Equal(8L, (long)(await command.ExecuteScalarAsync())!);
    }

    private static async Task InsertPostedJournalAsync(NpgsqlConnection connection, NpgsqlTransaction transaction, Guid journalId, string entryNumber)
    {
        await using var insert = new NpgsqlCommand("""
            INSERT INTO "JournalEntries"
                ("Id", "EntryNumber", "EntryDate", "Description", "Status", "PostedAt", "PostedBy", "CreatedAt", "SourceType", "SourceId", "ReversalOfJournalEntryId")
            VALUES
                (@id, @entryNumber, CURRENT_TIMESTAMP, 'PostgreSQL immutability integration test', 'Posted', CURRENT_TIMESTAMP, 'ci-test', CURRENT_TIMESTAMP, 'CiTest', @sourceId, NULL);
            """, connection, transaction);
        insert.Parameters.AddWithValue("id", journalId);
        insert.Parameters.AddWithValue("entryNumber", entryNumber);
        insert.Parameters.AddWithValue("sourceId", journalId);
        await insert.ExecuteNonQueryAsync();
    }

    private static async Task AssertDatabaseMutationRejectedAsync(NpgsqlConnection connection, NpgsqlTransaction transaction, string sql)
    {
        await using var savepoint = new NpgsqlCommand("SAVEPOINT mutation_attempt;", connection, transaction);
        await savepoint.ExecuteNonQueryAsync();
        try
        {
            await using var command = new NpgsqlCommand(sql, connection, transaction);
            var exception = await Assert.ThrowsAsync<PostgresException>(() => command.ExecuteNonQueryAsync());
            Assert.Equal("23001", exception.SqlState);
        }
        finally
        {
            await using var rollback = new NpgsqlCommand("ROLLBACK TO SAVEPOINT mutation_attempt;", connection, transaction);
            await rollback.ExecuteNonQueryAsync();
        }
    }
}

public sealed class PostgreSqlIntegrationFixture
{
    private readonly string connectionString =
        Environment.GetEnvironmentVariable("ConnectionStrings__SchoolManagement")
        ?? "Host=127.0.0.1;Port=5432;Database=school_management_ci;Username=school_management;Password=ci_validation";

    public async Task<NpgsqlConnection> OpenConnectionAsync()
    {
        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        return connection;
    }
}
