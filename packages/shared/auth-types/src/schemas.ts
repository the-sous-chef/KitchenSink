import { z } from 'zod';

/** @implements REQ-005 REQ-039 FR-005 FR-039 ARCH-003 MOD-003 */
export const UpsertUserRequestSchema = z.object({
    sub: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    picture: z.string().url().optional(),
});

/** @implements REQ-005 REQ-039 FR-005 FR-039 ARCH-003 MOD-003 */
export type UpsertUserRequest = z.infer<typeof UpsertUserRequestSchema>;
