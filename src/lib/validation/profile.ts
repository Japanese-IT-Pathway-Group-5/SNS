import { z } from 'zod';
import { unicodeCodePointLength } from './posts';

export const MAX_PROFILE_DESCRIPTION_LENGTH = 200;

export const profileDescriptionSchema = z
	.string()
	.trim()
	.refine((value) => unicodeCodePointLength(value) <= MAX_PROFILE_DESCRIPTION_LENGTH, {
		message: `Description must be ${MAX_PROFILE_DESCRIPTION_LENGTH} characters or fewer.`
	});

export const profileInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, 'Please enter your name.')
		.max(80, 'Name must be 80 characters or fewer.'),
	description: profileDescriptionSchema
});
