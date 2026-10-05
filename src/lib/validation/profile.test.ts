import { describe, expect, it } from 'vitest';
import { profileDescriptionSchema } from './profile';

describe('profile description', () => {
	it('accepts 200 emoji as 200 characters and rejects 201', () => {
		expect(profileDescriptionSchema.safeParse('🌱'.repeat(200)).success).toBe(true);
		expect(profileDescriptionSchema.safeParse('🌱'.repeat(201)).success).toBe(false);
	});
	it('allows clearing a description and preserves internal lines', () => {
		expect(profileDescriptionSchema.parse('  ')).toBe('');
		expect(profileDescriptionSchema.parse('  今日\nA little moment.  ')).toBe(
			'今日\nA little moment.'
		);
	});
	it('rejects missing text and uploaded files', () => {
		expect(profileDescriptionSchema.safeParse(null).success).toBe(false);
		expect(profileDescriptionSchema.safeParse(new File(['text'], 'bio.txt')).success).toBe(false);
	});
});
