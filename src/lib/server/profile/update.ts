import { and, eq, isNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { profileInputSchema } from '$lib/validation/profile';
import { detectImageTypeFromFile } from '$lib/server/storage/image-signature';
import { uploadPhoto, PhotoValidationError } from '$lib/server/storage/photo-upload';
import type { R2Storage } from '$lib/server/storage/r2';
import { cleanupUploadedPhoto } from '$lib/server/storage/photo-cleanup';
import { parseBanner } from '$lib/validation/banner';

export class ProfileValidationError extends Error {}

export function profilePhotoKey(image: string | null | undefined) {
	const match = image?.match(/^\/api\/profile\/photo\/([0-9a-f-]{36})$/);
	return match ? `images/${match[1]}` : null;
}

export async function getOwnProfile(d1: D1Database, userId: string) {
	if (!userId) throw new Error('Authentication required');
	const [profile] = await getDb(d1)
		.select({
			name: user.name,
			image: user.image,
			description: user.description,
			banner: user.banner
		})
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);
	if (!profile) throw new Error('Profile not found');
	return { ...profile, description: profile.description ?? '', banner: profile.banner ?? '' };
}

export async function updateOwnProfile({
	d1,
	userId,
	input,
	photo,
	removePhoto,
	banner,
	bucket
}: {
	d1: D1Database;
	userId: string;
	input: unknown;
	photo?: File;
	removePhoto: boolean;
	banner?: unknown;
	bucket?: R2Storage;
}) {
	if (!userId) throw new Error('Authentication required');
	const parsed = profileInputSchema.safeParse(input);
	if (!parsed.success)
		throw new ProfileValidationError(
			parsed.error.issues[0]?.message ?? 'Check your profile details.'
		);
	const existing = await getOwnProfile(d1, userId);
	let savedBanner: string | null | undefined;
	if (banner !== undefined) {
		if (banner === '') savedBanner = null;
		else {
			const drawing = parseBanner(banner);
			if (!drawing)
				throw new ProfileValidationError('This drawing could not be saved. Try a smaller drawing.');
			savedBanner = drawing.strokes.length ? JSON.stringify(drawing) : null;
		}
	}
	let uploaded: Awaited<ReturnType<typeof uploadPhoto>> | undefined;
	let image = removePhoto ? null : existing.image;
	if (photo) {
		if (!bucket) throw new Error('Image storage unavailable');
		const detected = await detectImageTypeFromFile(photo);
		if (!detected) throw new ProfileValidationError('Choose a JPEG, PNG or WebP photo.');
		try {
			uploaded = await uploadPhoto(bucket, photo, detected);
		} catch (err) {
			if (err instanceof PhotoValidationError) throw new ProfileValidationError(err.message);
			throw err;
		}
		image = `/api/profile/photo/${uploaded.objectKey.slice('images/'.length)}`;
	}
	try {
		const rows = await getDb(d1)
			.update(user)
			.set({
				name: parsed.data.name,
				description: parsed.data.description || null,
				image,
				...(savedBanner !== undefined ? { banner: savedBanner } : {}),
				updatedAt: new Date()
			})
			.where(
				and(
					eq(user.id, userId),
					existing.image === null ? isNull(user.image) : eq(user.image, existing.image)
				)
			)
			.returning({ id: user.id });
		if (rows.length === 0) throw new Error('Profile not found');
	} catch (err) {
		if (uploaded && bucket) {
			try {
				await cleanupUploadedPhoto(bucket, uploaded.objectKey);
			} catch {
				console.error('Failed to clean up uncommitted profile photo.');
			}
		}
		throw err;
	}
	const oldKey = profilePhotoKey(existing.image);
	if (oldKey && image !== existing.image && bucket) {
		try {
			await cleanupUploadedPhoto(bucket, oldKey);
		} catch {
			console.error('Failed to clean up replaced profile photo.');
		}
	}
}
