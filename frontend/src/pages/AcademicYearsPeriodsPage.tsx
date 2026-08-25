import React from 'react';
import AcademicYearsPage from './AcademicYearsPage';
import AcademicPeriodsPage from './AcademicPeriodsPage';

export default function AcademicYearsPeriodsPage() {
  return (
    <main aria-label="Academic years and periods">
      <header>
        <h1>Academic Calendar</h1>
        <p>Manage academic years and their terms or semesters from one workspace.</p>
      </header>
      <AcademicYearsPage />
      <hr />
      <AcademicPeriodsPage />
    </main>
  );
}
