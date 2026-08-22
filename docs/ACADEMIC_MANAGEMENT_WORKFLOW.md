# Academic Management Workflow

## Purpose

Define the school-side workflow that sits above the existing academic domain and result/GPA/CGPA processing.

## Local workflow

```text
Academic Year
    ↓
Academic Period
    ↓
Programme / Curriculum Version
    ↓
Course Offering
    ↓
Student Course Registration
    ↓
Attendance / Assessment
    ↓
Approved Results
    ↓
Progression / Academic Standing
    ↓
Transcript / Completion
```

## Academic year

An academic year is a configurable local record with a name, start date, end date, current flag and active flag. The existing domain already models these properties. New academic-management screens must use this entity rather than introducing a duplicate academic-year model.

## Academic period

The UI should use the institution's configured terminology (semester, term, trimester or block). Periods belong to an academic year and provide the boundary for registration, attendance, assessment and reporting.

## Course offering

A course offering identifies the course/curriculum course being delivered in a particular academic period and programme context. It is the bridge between curriculum planning and student registration.

## Registration

Students are registered against course offerings. Registration must preserve historical attempts and must distinguish ordinary registration from repeat/retake where the existing academic model supports it.

## Results

Assessment results continue through the existing result workflow. Special codes such as `X` must remain status codes and must never be coerced to numeric zero.

## Progression

Progression decisions are school records. The system must be able to record progress, repeat, defer, withdraw, complete and other configured academic-standing outcomes without claiming to replace a regulator or examining-board system.

## Reporting

Academic reports and transcripts must use approved result data and must be generated locally. No Internet service is required.

## Scope boundary

This workflow is for school academic administration. UHPAB/UVTAB rules are represented through configurable profiles where required; the SMIS does not become a board examination system.
