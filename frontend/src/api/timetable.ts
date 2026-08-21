import { apiFetch } from './client';

export type TimetableEntry = {
  id: string;
  teachingGroupId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  sessionType?: string;
  isActive: boolean;
};

export type CreateTimetableEntry = Omit<TimetableEntry, 'id' | 'isActive'>;

export function listTimetable(teachingGroupId?: string) {
  const query = teachingGroupId ? `?teachingGroupId=${encodeURIComponent(teachingGroupId)}` : '';
  return apiFetch<TimetableEntry[]>(`/api/timetable${query}`);
}

export function createTimetableEntry(input: CreateTimetableEntry) {
  return apiFetch<TimetableEntry>('/api/timetable', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deactivateTimetableEntry(id: string) {
  return apiFetch<void>(`/api/timetable/${id}`, { method: 'DELETE' });
}
