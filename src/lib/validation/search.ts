import { z } from 'zod';

export const MAX_SEARCH_LENGTH = 120;
export const searchQuerySchema = z
	.string()
	.trim()
	.max(MAX_SEARCH_LENGTH, `Search must be ${MAX_SEARCH_LENGTH} characters or fewer.`);
