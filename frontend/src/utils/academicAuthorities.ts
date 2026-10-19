export type AcademicAuthority = 'School-based' | 'UHPAB' | 'UVTAB' | 'UNMEB'

export const ACADEMIC_AUTHORITY_OPTIONS: { value: AcademicAuthority; label: string }[] = [
  { value: 'School-based', label: 'School-based curriculum' },
  { value: 'UHPAB', label: 'UHPAB — Health programmes' },
  { value: 'UVTAB', label: 'UVTAB — Vocational & technical' },
  { value: 'UNMEB', label: 'UNMEB — Legacy records' },
]

export function resolveAcademicAuthority(regulator?: string | null): AcademicAuthority {
  const value = (regulator ?? '').toUpperCase()
  if (value.includes('UHPAB')) return 'UHPAB'
  if (value.includes('UVTAB')) return 'UVTAB'
  if (value.includes('UNMEB')) return 'UNMEB'
  return 'School-based'
}

export const VERIFIED_ACADEMIC_COURSES: { authority: AcademicAuthority; name: string }[] = [
  ...[
    'Certificate in Nursing',
    'Certificate in Midwifery',
    'Certificate in Mental Health Nursing',
    'Certificate in Emergency Care',
    'Certificate in Environmental Health Sciences',
    'Certificate in Medical Laboratory Techniques',
    'Certificate in Medical Records and Health Informatics',
    'Certificate in Medical Theatre Techniques',
    'Certificate in Pharmacy',
    'Diploma in Nursing',
    'Diploma in Midwifery',
    'Diploma in Mental Health Nursing',
    'Diploma in Paediatrics and Child Health Nursing',
    'Diploma in Public Health Nursing',
    'Advanced Diploma in Palliative Care Nursing',
  ].map(name => ({ authority: 'UHPAB' as const, name })),
  ...[
    'Certificate in Biomedical Engineering',
    'Diploma in Biomedical Engineering',
    'Certificate in Food Science and Nutrition',
    'Diploma in Food Science and Nutrition',
    'Certificate in Sonography',
    'Diploma in Sonography',
    'Certificate in Medical Records',
    'Diploma in Medical Records',
    'National Certificate — Technology Education and Training',
    'Uganda Certificate in Practical Competencies (UCPC) — Technology',
    'National Certificate — Agriculture Education and Training',
    'Uganda Certificate in Practical Competencies (UCPC) — Agriculture',
    'National Certificate — Home Science Education and Training',
    'Uganda Certificate in Practical Competencies (UCPC) — Home Science',
    'Hotel and Institutional Catering',
    'Cosmetology and Beauty',
    'Fashion and Design',
    'Leather Tanning',
  ].map(name => ({ authority: 'UVTAB' as const, name })),
]
