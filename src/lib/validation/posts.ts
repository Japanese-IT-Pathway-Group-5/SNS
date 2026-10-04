import { z } from 'zod';

export const MAX_POST_LENGTH = 2000;
export const MAX_REPLY_LENGTH = 500;

export const unicodeCodePointLength = (value: string): number => [...value].length;

export const postInputSchema = z.object({
	submissionId: z.string().trim().min(1).max(200),
	body: z.string().refine((value) => unicodeCodePointLength(value.trim()) <= MAX_POST_LENGTH, {
		message: `Post must be ${MAX_POST_LENGTH} characters or fewer`
	}),
	mediaId: z
		.string()
		.regex(/^images\/[A-Za-z0-9_-]+$/, 'Invalid image key')
		.optional()
		.nullable()
});

export const updatePostInputSchema = z.object({
	body: z.string().refine((value) => unicodeCodePointLength(value.trim()) <= MAX_POST_LENGTH, {
		message: `Post must be ${MAX_POST_LENGTH} characters or fewer`
	})
});

export const replyInputSchema = z.object({
	body: z
		.string()
		.trim()
		.min(1, 'Reply is required')
		.refine((value) => unicodeCodePointLength(value) <= MAX_REPLY_LENGTH, {
			message: `Reply must be ${MAX_REPLY_LENGTH} characters or fewer`
		})
});

export type PostInput = z.infer<typeof postInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
export type ReplyInput = z.infer<typeof replyInputSchema>;
