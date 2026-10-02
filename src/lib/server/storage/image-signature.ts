export type DetectedImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export const IMAGE_HEADER_LENGTH = 12;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_SIGNATURE_OFFSET = 8;

function matchesAt(bytes: Uint8Array, signature: number[], offset = 0): boolean {
	return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function detectImageType(header: Uint8Array): DetectedImageType | null {
	if (header.length < IMAGE_HEADER_LENGTH) {
		return null;
	}

	if (matchesAt(header, JPEG_SIGNATURE)) {
		return 'image/jpeg';
	}

	if (matchesAt(header, PNG_SIGNATURE)) {
		return 'image/png';
	}

	if (
		matchesAt(header, RIFF_SIGNATURE) &&
		matchesAt(header, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)
	) {
		return 'image/webp';
	}

	return null;
}

export async function detectImageTypeFromFile(file: Blob): Promise<DetectedImageType | null> {
	const header = await file.slice(0, IMAGE_HEADER_LENGTH).arrayBuffer();

	return detectImageType(new Uint8Array(header));
}
