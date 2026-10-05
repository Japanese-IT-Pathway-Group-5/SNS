import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core';
import type { R2Storage } from '$lib/server/storage/r2';

const { select, write, values, where, upload, cleanup, detect } = vi.hoisted(() => ({
	select: vi.fn(),
	write: vi.fn(),
	values: vi.fn(),
	where: vi.fn(),
	upload: vi.fn(),
	cleanup: vi.fn(),
	detect: vi.fn()
}));
vi.mock('$lib/server/db', () => ({
	getDb: () => ({
		select: () => ({ from: () => ({ where: () => ({ limit: select }) }) }),
		update: () => ({
			set: (input: unknown) => {
				values(input);
				return {
					where: (condition: unknown) => {
						where(condition);
						return { returning: write };
					}
				};
			}
		})
	})
}));
vi.mock('$lib/server/storage/photo-upload', () => ({
	uploadPhoto: upload,
	PhotoValidationError: class extends Error {}
}));
vi.mock('$lib/server/storage/photo-cleanup', () => ({ cleanupUploadedPhoto: cleanup }));
vi.mock('$lib/server/storage/image-signature', () => ({ detectImageTypeFromFile: detect }));
import { updateOwnProfile, ProfileValidationError } from './update';

const oldId = '11111111-1111-4111-8111-111111111111';
const newId = '22222222-2222-4222-8222-222222222222';
const input = { name: ' New name ', description: ' A small moment. ', userId: 'account-b' };
const bucket = {} as R2Storage;

describe('profile writes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		select.mockResolvedValue([
			{ name: 'Old', description: '', image: `/api/profile/photo/${oldId}` }
		]);
		write.mockResolvedValue([{ id: 'account-a' }]);
		upload.mockResolvedValue({ objectKey: `images/${newId}` });
		detect.mockResolvedValue('image/png');
	});
	it('updates the authenticated account and checks the previous image before replacing it', async () => {
		await updateOwnProfile({
			d1: {} as D1Database,
			userId: 'account-a',
			input,
			removePhoto: false
		});
		const query = new SQLiteSyncDialect().sqlToQuery(where.mock.calls[0][0]);
		expect(query.params).toEqual(['account-a', `/api/profile/photo/${oldId}`]);
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'New name', description: 'A small moment.' })
		);
	});
	it('does not write invalid names or oversized descriptions', async () => {
		await expect(
			updateOwnProfile({
				d1: {} as D1Database,
				userId: 'account-a',
				input: { name: ' ', description: '' },
				removePhoto: false
			})
		).rejects.toThrow(ProfileValidationError);
		expect(write).not.toHaveBeenCalled();
	});
	it('rolls back a new photo on database failure and keeps the old photo', async () => {
		write.mockRejectedValue(new Error('D1 failed'));
		await expect(
			updateOwnProfile({
				d1: {} as D1Database,
				userId: 'account-a',
				input,
				removePhoto: false,
				bucket,
				photo: new File(['photo'], 'photo.png')
			})
		).rejects.toThrow('D1 failed');
		expect(cleanup).toHaveBeenCalledExactlyOnceWith(bucket, `images/${newId}`);
	});
	it('replaces the saved image before cleaning up its old object', async () => {
		await updateOwnProfile({
			d1: {} as D1Database,
			userId: 'account-a',
			input,
			removePhoto: false,
			bucket,
			photo: new File(['photo'], 'photo.png')
		});
		expect(values).toHaveBeenCalledWith(
			expect.objectContaining({ image: `/api/profile/photo/${newId}` })
		);
		expect(cleanup).toHaveBeenCalledExactlyOnceWith(bucket, `images/${oldId}`);
	});
	it('clears a removed image and does not delete external Google photos', async () => {
		select.mockResolvedValue([
			{ name: 'Old', description: '', image: 'https://example.com/avatar.png' }
		]);
		await updateOwnProfile({
			d1: {} as D1Database,
			userId: 'account-a',
			input,
			removePhoto: true,
			bucket
		});
		expect(values).toHaveBeenCalledWith(expect.objectContaining({ image: null }));
		expect(cleanup).not.toHaveBeenCalled();
	});
	it('rejects forged image bytes before uploading', async () => {
		detect.mockResolvedValue(null);
		await expect(
			updateOwnProfile({
				d1: {} as D1Database,
				userId: 'account-a',
				input,
				removePhoto: false,
				bucket,
				photo: new File(['<script>'], 'photo.png', { type: 'image/png' })
			})
		).rejects.toThrow(ProfileValidationError);
		expect(upload).not.toHaveBeenCalled();
	});
	it('saves validated editable strokes, clears empty banners and preserves omitted banners', async () => {
		const banner = JSON.stringify({
			version: 1,
			strokes: [{ tool: 'pen', color: 'accent', size: 5, points: [[10, 20]] }]
		});
		const args = { d1: {} as D1Database, userId: 'account-a', input, removePhoto: false };
		await updateOwnProfile({ ...args, banner });
		expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ banner }));
		await updateOwnProfile({ ...args, banner: '' });
		expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ banner: null }));
		await updateOwnProfile(args);
		expect(values.mock.lastCall?.[0]).not.toHaveProperty('banner');
	});
	it('rejects unsafe drawing data without writing the profile', async () => {
		await expect(
			updateOwnProfile({
				d1: {} as D1Database,
				userId: 'account-a',
				input,
				removePhoto: false,
				banner: '<svg onload="alert(1)" />'
			})
		).rejects.toThrow(ProfileValidationError);
		expect(write).not.toHaveBeenCalled();
	});
});
