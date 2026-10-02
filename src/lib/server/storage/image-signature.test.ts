import { describe, expect, it, vi } from 'vitest';
import { IMAGE_HEADER_LENGTH, detectImageType, detectImageTypeFromFile } from './image-signature';

function header(...prefix: number[]): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(IMAGE_HEADER_LENGTH);
	bytes.set(prefix);
	return bytes;
}

function ascii(text: string): number[] {
	return Array.from(text, (char) => char.charCodeAt(0));
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WEBP')];

describe('detectImageType', () => {
	it('detects a JPEG header', () => {
		expect(detectImageType(header(...JPEG))).toBe('image/jpeg');
	});

	it('detects a PNG header', () => {
		expect(detectImageType(header(...PNG))).toBe('image/png');
	});

	it('detects a WebP header', () => {
		expect(detectImageType(header(...WEBP))).toBe('image/webp');
	});

	it('rejects a PNG signature with one wrong byte', () => {
		expect(detectImageType(header(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0b))).toBeNull();
	});

	it('rejects a RIFF container that is not WebP', () => {
		expect(
			detectImageType(header(...ascii('RIFF'), 0x24, 0x00, 0x00, 0x00, ...ascii('WAVE')))
		).toBeNull();
	});

	it('rejects SVG markup', () => {
		expect(detectImageType(header(...ascii('<svg xmlns=')))).toBeNull();
	});

	it('rejects HTML markup', () => {
		expect(detectImageType(header(...ascii('<!DOCTYPE h')))).toBeNull();
	});

	it('rejects a Windows executable (MZ)', () => {
		expect(detectImageType(header(0x4d, 0x5a, 0x90, 0x00))).toBeNull();
	});

	it('rejects an ELF executable', () => {
		expect(detectImageType(header(0x7f, 0x45, 0x4c, 0x46))).toBeNull();
	});

	it('rejects empty input', () => {
		expect(detectImageType(new Uint8Array())).toBeNull();
	});

	it('rejects input shorter than the header, even with a valid signature prefix', () => {
		expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
		expect(detectImageType(new Uint8Array(PNG))).toBeNull();
	});
});

describe('detectImageTypeFromFile', () => {
	it('detects by content, ignoring the filename and declared type', async () => {
		const file = new File([header(...JPEG)], 'photo.png', { type: 'image/png' });

		await expect(detectImageTypeFromFile(file)).resolves.toBe('image/jpeg');
	});

	it('rejects SVG content declared as an image', async () => {
		const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'photo.svg', {
			type: 'image/svg+xml'
		});

		await expect(detectImageTypeFromFile(file)).resolves.toBeNull();
	});

	it('reads only the header bytes', async () => {
		const file = new File([header(...PNG), new Uint8Array(1024)], 'photo.png');
		const slice = vi.spyOn(file, 'slice');

		await expect(detectImageTypeFromFile(file)).resolves.toBe('image/png');
		expect(slice).toHaveBeenCalledWith(0, IMAGE_HEADER_LENGTH);
	});
});
