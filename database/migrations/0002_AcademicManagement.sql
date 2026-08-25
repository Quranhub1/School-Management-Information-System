-- Migration 0002: Academic Management (Classes, Streams, Subjects)
-- Depends on: 0001_InitialCreate.sql

BEGIN;

CREATE TABLE academic_classes (
    id uuid PRIMARY KEY,
    programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    academic_period_id uuid NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    code varchar(40) NOT NULL,
    name varchar(200),
    year_of_study int NOT NULL DEFAULT 1,
    max_enrolment int,
    status int NOT NULL DEFAULT 0,
    created_at_utc timestamptz NOT NULL DEFAULT now(),
    UNIQUE (programme_id, academic_period_id, code)
);

CREATE TABLE streams (
    id uuid PRIMARY KEY,
    academic_class_id uuid NOT NULL REFERENCES academic_classes(id) ON DELETE CASCADE,
    code varchar(40) NOT NULL,
    name varchar(200),
    capacity int,
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (academic_class_id, code)
);

CREATE TABLE subjects (
    id uuid PRIMARY KEY,
    programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    year_of_study int NOT NULL DEFAULT 1,
    period_sequence int,
    is_compulsory boolean NOT NULL DEFAULT true,
    elective_group varchar(80),
    is_active boolean NOT NULL DEFAULT true,
    UNIQUE (programme_id, course_id)
);

CREATE INDEX ix_academic_classes_programme ON academic_classes(programme_id);
CREATE INDEX ix_academic_classes_period ON academic_classes(academic_period_id);
CREATE INDEX ix_streams_class ON streams(academic_class_id);
CREATE INDEX ix_subjects_programme ON subjects(programme_id);
CREATE INDEX ix_subjects_programme_year ON subjects(programme_id, year_of_study);

COMMIT;
