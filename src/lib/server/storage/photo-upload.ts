import { putObject, type R2Storage } from './r2';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const SUPPORTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type SupportedPhotoType = (typeof SUPPORTED_PHOTO_TYPES)[number];

export interface ValidatedPhoto {
	bytes: Uint8Array;
	contentType: SupportedPhotoType;
	width: number;
	height: number;
}

export class PhotoValidationError extends Error {}

function readUint16(bytes: Uint8Array, offset: number): number {
	return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number): number {
	return (
		((bytes[offset] << 24) |
			(bytes[offset + 1] << 16) |
			(bytes[offset + 2] << 8) |
			bytes[offset + 3]) >>>
		0
	);
}

function detectJpeg(bytes: Uint8Array): { width: number; height: number } | null {
	if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
		return null;
	}

	let offset = 2;

	while (offset + 9 < bytes.length) {
		if (bytes[offset] !== 0xff) {
			offset++;
			continue;
		}

		const marker = bytes[offset + 1];
		offset += 2;

		if (marker === 0xd8 || marker === 0xd9 || marker === 0x01) {
			continue;
		}

		if (offset + 2 > bytes.length) return null;

		const segmentLength = readUint16(bytes, offset);

		if (segmentLength < 2 || offset + segmentLength > bytes.length) {
			return null;
		}

		const isStartOfFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf);

		if (isStartOfFrame && segmentLength >= 7) {
			return {
				height: readUint16(bytes, offset + 3),
				width: readUint16(bytes, offset + 5)
			};
		}

		offset += segmentLength;
	}

	return null;
}

function detectPng(bytes: Uint8Array): { width: number; height: number } | null {
	const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

	if (!signature.every((value, index) => bytes[index] === value)) {
		return null;
	}

	if (bytes.length < 24 || new TextDecoder().decode(bytes.slice(12, 16)) !== 'IHDR') {
		return null;
	}

	return {
		width: readUint32(bytes, 16),
		height: readUint32(bytes, 20)
	};
}

function detectWebp(bytes: Uint8Array): { width: number; height: number } | null {
	if (
		bytes.length < 30 ||
		new TextDecoder().decode(bytes.slice(0, 4)) !== 'RIFF' ||
		new TextDecoder().decode(bytes.slice(8, 12)) !== 'WEBP'
	) {
		return null;
	}

	const chunk = new TextDecoder().decode(bytes.slice(12, 16));

	if (chunk === 'VP8X') {
		const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
		const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);

		return { width, height };
	}

	if (chunk === 'VP8 ' && bytes.length >= 30) {
		if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
			return null;
		}

		return {
			width: readUint16(bytes, 26) & 0x3fff,
			height: readUint16(bytes, 28) & 0x3fff
		};
	}

	if (chunk === 'VP8L' && bytes.length >= 25) {
		if (bytes[20] !== 0x2f) return null;

		const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);

		return {
			width: 1 + (bits & 0x3fff),
			height: 1 + ((bits >>> 14) & 0x3fff)
		};
	}

	return null;
}

export async function validatePhoto(
	file: File,
	detectedContentType?: SupportedPhotoType
): Promise<ValidatedPhoto> {
	const contentType = detectedContentType ?? (file.type as SupportedPhotoType);

	if (!SUPPORTED_PHOTO_TYPES.includes(contentType)) {
		throw new PhotoValidationError('Only JPEG, PNG, and WebP images are allowed');
	}

	if (file.size > MAX_PHOTO_BYTES) {
		throw new PhotoValidationError('Image must be 5 MiB or smaller');
	}

	const bytes = new Uint8Array(await file.arrayBuffer());

	if (bytes.length === 0 || bytes.length > MAX_PHOTO_BYTES) {
		throw new PhotoValidationError('Invalid image size');
	}

	let dimensions: { width: number; height: number } | null = null;

	switch (contentType) {
		case 'image/jpeg':
			dimensions = detectJpeg(bytes);
			break;
		case 'image/png':
			dimensions = detectPng(bytes);
			break;
		case 'image/webp':
			dimensions = detectWebp(bytes);
			break;
	}

	if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
		throw new PhotoValidationError('Invalid image file');
	}

	return {
		bytes,
		contentType,
		width: dimensions.width,
		height: dimensions.height
	};
}

export async function uploadPhoto(
	bucket: R2Storage,
	file: File,
	detectedContentType?: SupportedPhotoType
): Promise<{
	objectKey: string;
	contentType: SupportedPhotoType;
	byteSize: number;
	width: number;
	height: number;
}> {
	const validated = await validatePhoto(file, detectedContentType);
	const objectKey = `images/${crypto.randomUUID()}`;

	await putObject(bucket, objectKey, validated.bytes, validated.contentType);

	return {
		objectKey,
		contentType: validated.contentType,
		byteSize: validated.bytes.byteLength,
		width: validated.width,
		height: validated.height
	};
}
