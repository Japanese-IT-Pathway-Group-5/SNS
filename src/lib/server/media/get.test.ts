import { describe, expect, it, vi } from 'vitest';

const { requireMembershipMock, getDbMock, getObjectMock } = vi.hoisted(() => ({
        requireMembershipMock: vi.fn(),
        getDbMock: vi.fn(),
        getObjectMock: vi.fn()
}));

vi.mock('$lib/server/auth/authorization', () => ({
        requireMembership: requireMembershipMock
}));

vi.mock('$lib/server/db', () => ({
        getDb: getDbMock
}));

vi.mock('$lib/server/storage/r2', () => ({
        getObject: getObjectMock
}));

import { getMedia, MediaNotFoundError } from './get';

describe('getMedia', () => {
        it('requires membership', async () => {
                requireMembershipMock.mockRejectedValueOnce(new Error('Membership required'));

                await expect(
                        getMedia({
                                d1: {} as D1Database,
                                userId: 'user-1',
                                mediaId: 'media-1',
                                bucket: {
                                put: vi.fn(),
                                get: vi.fn(),
                                delete: vi.fn()
                        }
                        })
                ).rejects.toThrow('Membership required');

                expect(requireMembershipMock).toHaveBeenCalledWith(
                        expect.anything(),
                        'user-1'
                );
        });

        it('returns not found when the media is not attached to a visible ready post', async () => {
                requireMembershipMock.mockResolvedValueOnce(undefined);

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
                                userId: 'user-1',
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
                requireMembershipMock.mockResolvedValueOnce(undefined);

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
                                userId: 'user-1',
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

                expect(getObjectMock).toHaveBeenCalledWith(
                        expect.anything(),
                        'images/test-image'
                );
        });

        it('returns not found when the R2 object is missing', async () => {
                requireMembershipMock.mockResolvedValueOnce(undefined);

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
                                userId: 'user-1',
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
