# Academic Years and Periods Implementation

The academic-years-periods branch adds protected API endpoints over the existing AcademicYear and Semester entities and local administrative React pages. Validation covers date ordering, academic-year boundaries, duplicate period names/sequences and overlapping periods. Current flags are scoped so only one year and one period can be current at a time.
