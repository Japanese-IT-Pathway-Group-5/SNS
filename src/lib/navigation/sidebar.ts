export const SIDEBAR_CONTEXT = 'claymore-sidebar';
export const SIDEBAR_COOKIE = 'claymore_sidebar_v1';

/** Non-sensitive device preference, validated before it affects server-rendered layout. */
export function parseSidebarPreference(value: string | undefined) {
	const match = value?.match(/^(expanded|collapsed):(\d{3})$/);
	if (!match) return null;
	const width = Number(match[2]);
	if (width < 192 || width > 320) return null;
	return { collapsed: match[1] === 'collapsed', width };
}

export interface SidebarState {
	collapsed: boolean;
	width: number;
	restored: boolean;
}
