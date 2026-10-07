import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	testDir: '.',
	testMatch: 'layout.spec.ts',
	use: { baseURL: 'http://127.0.0.1:4175' },
	webServer: {
		cwd: fileURLToPath(new URL('../../', import.meta.url)),
		command: `"${process.execPath}" node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 4175 --strictPort`,
		url: 'http://127.0.0.1:4175',
		reuseExistingServer: !process.env.CI
	}
});
