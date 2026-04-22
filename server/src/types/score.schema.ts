import { z } from 'zod';

export const scoreSchema = z.object({
  score: z.number().int().positive('Score must be greater than 0'),
  snakeLength: z.number().int().positive('Snake length must be greater than 0'),
  gameDuration: z.number().positive('Game duration must be greater than 0'),
  gameMode: z.string().optional().default('classic'),
});

export type ScoreInput = z.infer<typeof scoreSchema>;
