import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getProfile, updateProfile, rateLimit, ValidationError } = vi.hoisted(() => ({
	getProfile: vi.fn(),
	updateProfile: vi.fn(),
	rateLimit: vi.fn(),
	ValidationError: class extends Error {}
}));
vi.mock('$lib/server/profile/update', () => ({
	getOwnProfile: getProfile,
	updateOwnProfile: updateProfile,
	ProfileValidationError: ValidationError
}));
vi.mock('$lib/server/security/rate-limit', () => ({ rateLimitUpload: rateLimit }));
import { actions, load } from './+page.server';

function event(userId: string | null = 'account-a', photo = false) {
	const form = new FormData();
	form.set('name', 'Aiko');
	form.set('description', 'An ordinary day.');
	form.set('userId', 'account-b');
	if (photo) form.set('photo', new File(['image'], 'photo.png', { type: 'image/png' }));
	return {
		locals: { user: userId ? { id: userId } : null },
		platform: { env: { DB: {}, MEDIA_BUCKET: {} } },
		url: new URL('http://localhost/profile/edit'),
		request: new Request('http://localhost/profile/edit', {
			method: 'POST',
			body: form,
			headers: { 'content-length': '1000' }
		})
	} as unknown as Parameters<NonNullable<typeof actions.default>>[0] & Parameters<typeof load>[0];
}

describe('edit profile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		updateProfile.mockResolvedValue(undefined);
		rateLimit.mockResolvedValue({ allowed: true });
	});
	it('protects the page and writes from signed-out users', async () => {
		await expect(load(event(null))).rejects.toMatchObject({
			status: 303,
			location: '/login?redirectTo=%2Fprofile%2Fedit'
		});
		expect(await actions.default!(event(null))).toMatchObject({ status: 401 });
		expect(updateProfile).not.toHaveBeenCalled();
	});
	it('loads only editable public profile fields from the current account', async () => {
		getProfile.mockResolvedValue({ name: 'Aiko', image: null, description: '' });
		expect(await load(event())).toEqual({
			profile: { name: 'Aiko', image: null, description: '' }
		});
		expect(getProfile).toHaveBeenCalledWith({}, 'account-a');
	});
	it('ignores submitted user IDs and returns to the journal after saving', async () => {
		await expect(actions.default!(event())).rejects.toMatchObject({
			status: 303,
			location: '/journal'
		});
		expect(updateProfile).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: 'account-a',
				input: { name: 'Aiko', description: 'An ordinary day.' }
			})
		);
	});
	it('preserves fields when validation fails', async () => {
		updateProfile.mockRejectedValue(new ValidationError('Check the description.'));
		expect(await actions.default!(event())).toMatchObject({
			status: 400,
			data: {
				values: { name: 'Aiko', description: 'An ordinary day.' },
				message: 'Check the description.'
			}
		});
	});
	it('does not write when photo uploads are rate limited', async () => {
		rateLimit.mockResolvedValue({ allowed: false, status: 429 });
		expect(await actions.default!(event('account-a', true))).toMatchObject({ status: 429 });
		expect(updateProfile).not.toHaveBeenCalled();
	});
	it('rejects oversized submissions before reading their body', async () => {
		const e = event();
		e.request.headers.set('content-length', '6000000');
		expect(await actions.default!(e)).toMatchObject({ status: 413 });
		expect(updateProfile).not.toHaveBeenCalled();
	});
});
