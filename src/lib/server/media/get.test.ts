import { describe, expect, it, vi } from 'vitest';

const { getDbMock, getObjectMock } = vi.hoisted(() => ({
	getDbMock: vi.fn(),
	getObjectMock: vi.fn()
}));

vi.mock('$lib/server/db', () => ({
	getDb: getDbMock
}));

vi.mock('$lib/server/storage/r2', () => ({
	getObject: getObjectMock
}));

import { getMedia, MediaNotFoundError } from './get';

describe('getMedia', () => {
	it('returns not found when the media is not attached to a visible ready post', async () => {
		getDbMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([])
						})
					})
				})
			})
		});

		await expect(
			getMedia({
				d1: {} as D1Database,
				mediaId: 'media-1',
				bucket: {
					put: vi.fn(),
					get: vi.fn(),
					delete: vi.fn()
				}
			})
		).rejects.toBeInstanceOf(MediaNotFoundError);

		expect(getObjectMock).not.toHaveBeenCalled();
	});

	it('returns the R2 object for visible ready media', async () => {
		const object = {
			body: new ReadableStream(),
			httpEtag: '"test"'
		};

		getDbMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									objectKey: 'images/test-image',
									contentType: 'image/jpeg',
									byteSize: 1234
								}
							])
						})
					})
				})
			})
		});

		getObjectMock.mockResolvedValueOnce(object);

		await expect(
			getMedia({
				d1: {} as D1Database,
				mediaId: 'media-1',
				bucket: {
					put: vi.fn(),
					get: vi.fn(),
					delete: vi.fn()
				}
			})
		).resolves.toEqual({
			object,
			contentType: 'image/jpeg',
			byteSize: 1234
		});

		expect(getObjectMock).toHaveBeenCalledWith(expect.anything(), 'images/test-image');
	});

	it('returns not found when the R2 object is missing', async () => {
		getDbMock.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				from: vi.fn().mockReturnValue({
					innerJoin: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							limit: vi.fn().mockResolvedValue([
								{
									objectKey: 'images/missing',
									contentType: 'image/jpeg',
									byteSize: 1234
								}
							])
						})
					})
				})
			})
		});

		getObjectMock.mockResolvedValueOnce(null);

		await expect(
			getMedia({
				d1: {} as D1Database,
				mediaId: 'media-1',
				bucket: {
					put: vi.fn(),
					get: vi.fn(),
					delete: vi.fn()
				}
			})
		).rejects.toBeInstanceOf(MediaNotFoundError);
	});
});
