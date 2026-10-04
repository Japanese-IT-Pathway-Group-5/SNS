import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: '.',
	testMatch: 'composer.spec.ts',
	use: { baseURL: 'http://127.0.0.1:4174' },
	webServer: {
		command: 'pnpm dev --host 127.0.0.1 --port 4174',
		url: 'http://127.0.0.1:4174/dev/components',
		reuseExistingServer: !process.env.CI
	}
});
