-- Finance integrity hardening for PostgreSQL.
-- Apply after the EF schema exists. The statements are idempotent.

CREATE TABLE IF NOT EXISTS "FinanceAuditEvents" (
    "Id" uuid PRIMARY KEY,
    "OccurredAt" timestamptz NOT NULL DEFAULT now(),
    "Action" varchar(80) NOT NULL,
    "EntityType" varchar(120) NOT NULL,
    "EntityId" uuid NULL,
    "SourceType" varchar(120) NULL,
    "SourceId" uuid NULL,
    "PerformedBy" varchar(200) NULL,
    "Reason" varchar(1000) NULL,
    "MetadataJson" text NULL
);

CREATE INDEX IF NOT EXISTS "IX_FinanceAuditEvents_Entity"
    ON "FinanceAuditEvents" ("EntityType", "EntityId", "OccurredAt");

CREATE OR REPLACE FUNCTION finance_reject_posted_journal_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD."Status" = 'Posted' THEN
            RAISE EXCEPTION 'Posted journal entries are immutable; create a reversal instead.';
        END IF;
        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD."Status" = 'Posted' THEN
        -- The only legal transition involving a posted row is no transition at all.
        -- Reversals are separate journal entries and therefore never edit history.
        RAISE EXCEPTION 'Posted journal entries are immutable; create a reversal instead.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "TR_JournalEntries_ImmutablePosted" ON "JournalEntries";
CREATE TRIGGER "TR_JournalEntries_ImmutablePosted"
BEFORE UPDATE OR DELETE ON "JournalEntries"
FOR EACH ROW EXECUTE FUNCTION finance_reject_posted_journal_mutation();

CREATE OR REPLACE FUNCTION finance_reject_posted_journal_line_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    parent_status text;
BEGIN
    SELECT "Status" INTO parent_status
    FROM "JournalEntries"
    WHERE "Id" = CASE WHEN TG_OP = 'DELETE' THEN OLD."JournalEntryId" ELSE NEW."JournalEntryId" END;

    IF parent_status = 'Posted' THEN
        RAISE EXCEPTION 'Lines belonging to a posted journal entry are immutable; create a reversal instead.';
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS "TR_JournalEntryLines_ImmutablePosted" ON "JournalEntryLines";
CREATE TRIGGER "TR_JournalEntryLines_ImmutablePosted"
BEFORE INSERT OR UPDATE OR DELETE ON "JournalEntryLines"
FOR EACH ROW EXECUTE FUNCTION finance_reject_posted_journal_line_mutation();

CREATE OR REPLACE FUNCTION finance_audit_journal_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    event_action text;
    entity_id uuid;
    performed_by text;
    source_type text;
    source_id uuid;
    reason text;
BEGIN
    entity_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."Id" ELSE NEW."Id" END;
    performed_by := CASE WHEN TG_OP = 'DELETE' THEN OLD."PostedBy" ELSE NEW."PostedBy" END;
    source_type := CASE WHEN TG_OP = 'DELETE' THEN OLD."SourceType" ELSE NEW."SourceType" END;
    source_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."SourceId" ELSE NEW."SourceId" END;
    reason := CASE WHEN TG_OP = 'DELETE' THEN 'Journal entry deleted before posting' ELSE NULL END;

    event_action := CASE
        WHEN TG_OP = 'INSERT' THEN 'JournalEntryCreated'
        WHEN TG_OP = 'DELETE' THEN 'JournalEntryDeleted'
        WHEN OLD."Status" = 'Draft' AND NEW."Status" = 'Posted' THEN 'JournalEntryPosted'
        ELSE 'JournalEntryChanged'
    END;

    INSERT INTO "FinanceAuditEvents"
        ("Id", "OccurredAt", "Action", "EntityType", "EntityId", "SourceType", "SourceId", "PerformedBy", "Reason", "MetadataJson")
    VALUES
        (gen_random_uuid(), now(), event_action, 'JournalEntry', entity_id, source_type, source_id, performed_by, reason,
         jsonb_build_object('entryNumber', CASE WHEN TG_OP = 'DELETE' THEN OLD."EntryNumber" ELSE NEW."EntryNumber" END,
                            'status', CASE WHEN TG_OP = 'DELETE' THEN OLD."Status" ELSE NEW."Status" END)::text);

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS "TR_JournalEntries_Audit" ON "JournalEntries";
CREATE TRIGGER "TR_JournalEntries_Audit"
AFTER INSERT OR UPDATE OR DELETE ON "JournalEntries"
FOR EACH ROW EXECUTE FUNCTION finance_audit_journal_mutation();

-- Audit history itself is append-only.
CREATE OR REPLACE FUNCTION finance_reject_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Finance audit events are append-only.';
END;
$$;

DROP TRIGGER IF EXISTS "TR_FinanceAuditEvents_Immutable" ON "FinanceAuditEvents";
CREATE TRIGGER "TR_FinanceAuditEvents_Immutable"
BEFORE UPDATE OR DELETE ON "FinanceAuditEvents"
FOR EACH ROW EXECUTE FUNCTION finance_reject_audit_mutation();
