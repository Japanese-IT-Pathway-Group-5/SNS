import { describe, expect, it } from 'vitest';
import {
	MAX_PHOTO_BYTES,
	MAX_PHOTO_REQUEST_BYTES,
	checkUploadContentLength,
	validatePhotoUpload
} from './photo-upload';

function formWith(value?: string | File): FormData {
	const formData = new FormData();

	if (value !== undefined) {
		formData.append('file', value);
	}

	return formData;
}

describe('MAX_PHOTO_BYTES', () => {
	it('is 5 MiB', () => {
		expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024);
	});
});

describe('validatePhotoUpload', () => {
	it('accepts a file exactly at the size limit', () => {
		const file = new File([new Uint8Array(MAX_PHOTO_BYTES)], 'photo.jpg');

		expect(validatePhotoUpload(formWith(file))).toEqual({ success: true, file });
	});

	it('reports a file one byte over the limit as too large', () => {
		const file = new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], 'photo.jpg');

		expect(validatePhotoUpload(formWith(file))).toEqual({ success: false, error: 'too_large' });
	});

	it('reports an empty file as invalid', () => {
		const file = new File([], 'photo.jpg');

		expect(validatePhotoUpload(formWith(file))).toEqual({ success: false, error: 'invalid' });
	});

	it('reports a missing file field as invalid', () => {
		expect(validatePhotoUpload(formWith())).toEqual({ success: false, error: 'invalid' });
	});

	it('reports a text field instead of a file as invalid', () => {
		expect(validatePhotoUpload(formWith('not a file'))).toEqual({
			success: false,
			error: 'invalid'
		});
	});
});

describe('checkUploadContentLength', () => {
	it('accepts a length within the request limit', () => {
		expect(checkUploadContentLength('1024')).toBe('ok');
		expect(checkUploadContentLength(String(MAX_PHOTO_REQUEST_BYTES))).toBe('ok');
	});

	it('rejects a length over the request limit', () => {
		expect(checkUploadContentLength(String(MAX_PHOTO_REQUEST_BYTES + 1))).toBe('too_large');
		expect(checkUploadContentLength('99999999999999999999999')).toBe('too_large');
	});

	it('reports a missing header', () => {
		expect(checkUploadContentLength(null)).toBe('missing');
	});

	it.each(['', 'abc', '-1', '1.5', ' 12', '1e6'])('rejects malformed value %j', (value) => {
		expect(checkUploadContentLength(value)).toBe('invalid');
	});
});
