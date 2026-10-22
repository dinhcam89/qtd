import { z } from 'astro/zod';

export const holidayNoticeSchema = z.object({
  title: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  return_date: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
});

export const scheduleSchema = z.object({
  working_days: z.string(),
  morning_hours: z.string(),
  afternoon_hours: z.string(),
  notes: z.string().nullable().optional(),
  holidays: z.array(holidayNoticeSchema).optional().default([]),
});

export type HolidayNotice = z.infer<typeof holidayNoticeSchema>;
export type ScheduleData = z.infer<typeof scheduleSchema>;
