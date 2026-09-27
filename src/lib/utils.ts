import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes a redirect target to prevent open redirect vulnerabilities (CWE-601).
 * Allows only same-origin relative paths.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback = '/'): string {
	if (!url) return fallback;

	if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) {
		try {
			const parsed = new URL(url, 'http://localhost');
			if (parsed.origin === 'http://localhost') {
				return parsed.pathname + parsed.search + parsed.hash;
			}
		} catch {
			return fallback;
		}
	}

	return fallback;
}
