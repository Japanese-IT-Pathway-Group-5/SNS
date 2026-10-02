const SECURITY_HEADERS = {
	'Content-Security-Policy':
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff'
} as const;

export function addSecurityHeaders(response: Response): Response {
	const headers = new Headers(response.headers);

	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		headers.set(name, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
