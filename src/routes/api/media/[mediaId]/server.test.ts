import { describe, expect, it, vi } from 'vitest';

const { getMediaMock } = vi.hoisted(() => ({
        getMediaMock: vi.fn()
}));

vi.mock('$lib/server/media/get', () => ({
        getMedia: getMediaMock,
        MediaNotFoundError: class MediaNotFoundError extends Error {}
}));

import { GET } from './+server';

const makeEvent = (options: {
        user?: { id: string } | null;
        db?: D1Database;
        bucket?: unknown;
        mediaId?: string;
}) =>
        ({
                locals: {
                        user: options.user === undefined ? { id: 'user-1' } : options.user
                },
                params: {
                        mediaId: options.mediaId
                },
                platform: {
                        env: {
                                DB: options.db === undefined ? ({} as D1Database) : options.db,
                                MEDIA_BUCKET:
                                        options.bucket === undefined ? {} : options.bucket
                        }
                }
        }) as Parameters<typeof GET>[0];

describe('GET /api/media/[mediaId]', () => {
        it('returns 401 for unauthenticated users', async () => {
                const response = await GET(
                        makeEvent({
                                user: null
                        })
                );

                expect(response.status).toBe(401);
        });

        it('returns 503 when storage is unavailable', async () => {
                const response = await GET({
                        locals: {
                                user: { id: 'user-1' }
                        },
                        params: {
                                mediaId: 'media-1'
                        },
                        platform: {
                                env: {
                                        DB: {} as D1Database
                                }
                        }
                } as Parameters<typeof GET>[0]);

                expect(response.status).toBe(503);
        });

        it('returns 400 when mediaId is missing', async () => {
                const response = await GET(
                        makeEvent({
                                mediaId: ''
                        })
                );

                expect(response.status).toBe(400);
        });

        it('returns 404 when media is hidden or missing', async () => {
                const MediaNotFoundError = (
                        await import('$lib/server/media/get')
                ).MediaNotFoundError;

                getMediaMock.mockRejectedValueOnce(
                        new MediaNotFoundError('Media not found')
                );

                const response = await GET(
                        makeEvent({
                                mediaId: 'hidden-media'
                        })
                );

                expect(response.status).toBe(404);
        });

        it('returns 403 when membership is required', async () => {
                getMediaMock.mockRejectedValueOnce(
                        new Error('Membership required')
                );

                const response = await GET(
                        makeEvent({
                                mediaId: 'media-1'
                        })
                );

                expect(response.status).toBe(403);
        });

        it('returns the image with the stored content type and size', async () => {
                const body = new ReadableStream({
                        start(controller) {
                                controller.enqueue(new Uint8Array([1, 2, 3]));
                                controller.close();
                        }
                });

                getMediaMock.mockResolvedValueOnce({
                        object: {
                                body
                        },
                        contentType: 'image/jpeg',
                        byteSize: 3
                });

                const response = await GET(
                        makeEvent({
                                mediaId: 'media-1'
                        })
                );

                expect(response.status).toBe(200);
                expect(response.headers.get('content-type')).toBe('image/jpeg');
                expect(response.headers.get('content-length')).toBe('3');
                expect(response.headers.get('cache-control')).toBe('private, no-store');
                expect(response.headers.get('x-content-type-options')).toBe('nosniff');
                await expect(response.arrayBuffer()).resolves.toEqual(
                        new Uint8Array([1, 2, 3]).buffer
                );
        });
});
