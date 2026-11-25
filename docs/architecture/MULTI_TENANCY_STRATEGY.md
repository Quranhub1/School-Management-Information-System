# Multi-Tenancy Data Isolation Strategy

## Overview

This document describes the multi-tenancy data isolation strategy for SMIS. The system supports multiple institutions (tenants) with strict data isolation at the database level.

## Architecture

### Tenant Identification

Each institution is a tenant identified by `institution_id` (UUID). All tenant-scoped entities include this foreign key.

### Data Isolation Levels

| Level | Description | Implementation |
|-------|-------------|----------------|
| **Row-Level Security (RLS)** | PostgreSQL policies filter rows by tenant | Database policies on all tenant-scoped tables |
| **Application-Level** | Services enforce tenant context | CampusAccessService, query filters |
| **API-Level** | Controllers validate tenant access | Authorization policies |

### Tenant Context Resolution

```csharp
// In CampusAccessService
public async Task<List<Guid>> GetAccessibleCampusIdsAsync(ClaimsPrincipal user, CancellationToken ct)
{
    // Resolve user's institution and accessible campuses
    // Returns list of campus IDs the user can access
}
```

All queries are filtered by accessible campus/institution IDs.

## Database Schema

### Tenant-Scoped Tables

All core entities include `institution_id` or `campus_id`:

```sql
-- Example: Students table
CREATE TABLE students (
    id uuid PRIMARY KEY,
    institution_id uuid NOT NULL REFERENCES institutions(id),
    campus_id uuid REFERENCES campuses(id),
    -- ... other fields
);

-- RLS Policy
CREATE POLICY students_tenant_isolation ON students
    USING (institution_id = current_setting('app.current_institution_id')::uuid);
```

### Shared Tables (Reference Data)

Some tables are shared across tenants:
- `roles` - System roles
- `currencies` - Currency codes
- `countries` - Country codes
- `timezones` - Timezone data

## Implementation

### 1. Database-Level RLS (PostgreSQL)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
-- ... etc

-- Create policies
CREATE POLICY students_tenant_isolation ON students
    USING (institution_id = current_setting('app.current_institution_id')::uuid);
```

### 2. Application-Level Context

```csharp
// TenantContextMiddleware sets the tenant context
public class TenantContextMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var institutionId = context.User.GetInstitutionId();
        if (institutionId != null)
        {
            // Set PostgreSQL session variable
            await _dbContext.Database.ExecuteSqlRawAsync(
                $"SET LOCAL app.current_institution_id = '{institutionId}'");
        }
        await next(context);
    }
}
```

### 3. Query Filters (EF Core)

```csharp
// In DbContext
modelBuilder.Entity<Student>().HasQueryFilter(s => 
    s.InstitutionId == _tenantContext.CurrentInstitutionId);
```

### 4. Authorization Policies

```csharp
// Permission-based access control
options.AddPolicy("Students.Read", policy => 
    policy.RequireAuthenticatedUser()
          .RequirePermission("students.read"));
```

## Migration Strategy

### Existing Data

1. Add `institution_id` columns to all tenant tables
2. Backfill with default institution for existing data
3. Create RLS policies
4. Enable RLS

### New Institutions

1. Create institution record
2. Create default campus
3. Seed reference data
4. Assign admin users

## Security Considerations

1. **Never trust client-provided tenant IDs** - Always resolve from authenticated user
2. **Use parameterized queries** - Prevent SQL injection in RLS context setting
3. **Audit all cross-tenant queries** - Log any query that bypasses RLS
4. **Test isolation** - Automated tests verify tenant data separation

## Testing

```csharp
[Fact]
public async Task TenantA_CannotAccessTenantB_Data()
{
    // Arrange: Create two institutions with data
    var tenantA = await CreateInstitution();
    var tenantB = await CreateInstitution();
    var studentA = await CreateStudent(tenantA);
    var studentB = await CreateStudent(tenantB);
    
    // Act: Query as tenant A user
    var results = await _studentService.GetAllAsync(tenantA.User);
    
    // Assert: Only tenant A data returned
    Assert.Contains(results, s => s.Id == studentA.Id);
    Assert.DoesNotContain(results, s => s.Id == studentB.Id);
}
```

## Future Enhancements

1. **Schema-per-tenant** - For stricter isolation (separate databases)
2. **Tenant-aware caching** - Cache keys include tenant ID
3. **Cross-tenant reporting** - Admin-only aggregated views
4. **Tenant provisioning API** - Self-service institution onboarding