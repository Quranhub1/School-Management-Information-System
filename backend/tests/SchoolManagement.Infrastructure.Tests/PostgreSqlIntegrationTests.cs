using Npgsql;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests;

[CollectionDefinition("PostgreSQL integration", DisableParallelization = true)]
public sealed class PostgreSqlIntegrationCollection : ICollectionFixture<PostgreSqlIntegrationFixture>;

[Collection("PostgreSQL integration")]
public sealed class PostgreSqlIntegrationTests(PostgreSqlIntegrationFixture fixture)
{
    [Fact]
    public async Task Database_is_reachable_and_contains_expected_schema()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        var database = (string?)await new NpgsqlCommand("SELECT current_database();", connection).ExecuteScalarAsync();

        Assert.Equal("school_management_ci", database);

        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('JournalEntries', 'JournalEntryLines', 'FiscalPeriods');
            """, connection);

        Assert.Equal(3L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Posted_journal_immutability_triggers_are_installed()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM pg_trigger
            WHERE NOT tgisinternal
              AND tgname IN ('trg_journal_entries_immutable', 'trg_journal_entry_lines_immutable');
            """, connection);

        Assert.Equal(2L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Posted_journal_immutability_function_is_installed()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = 'prevent_posted_journal_mutation';
            """, connection);

        Assert.Equal(1L, (long)(await command.ExecuteScalarAsync())!);
    }

    [Fact]
    public async Task Finance_migrations_are_applied_to_the_ci_database()
    {
        await using var connection = await fixture.OpenConnectionAsync();
        await using var command = new NpgsqlCommand("""
            SELECT COUNT(*)
            FROM "__EFMigrationsHistory"
            WHERE "MigrationId" IN (
                '20260908120000_AddPostedJournalDatabaseImmutability',
                '20260908130000_AddFiscalPeriods',
                '20260908150000_HardenBankReconciliation');
            """, connection);

        Assert.Equal(3L, (long)(await command.ExecuteScalarAsync())!);
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
