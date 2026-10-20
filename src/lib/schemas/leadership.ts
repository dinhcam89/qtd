import { z } from 'astro/zod';

export const leaderMemberSchema = z.object({
  position: z.string(),
  name: z.string(),
  photo: z.string().nullable().optional(),
  term: z.string().nullable().optional(),
});

export const leadershipSchema = z.object({
  board_of_directors: z.array(leaderMemberSchema),
  supervisory_board: z.array(leaderMemberSchema),
  executive_board: z.array(leaderMemberSchema),
});

export type LeaderMember = z.infer<typeof leaderMemberSchema>;
export type LeadershipData = z.infer<typeof leadershipSchema>;
