import { z } from 'zod';

export const BANNER_WIDTH = 800;
export const BANNER_HEIGHT = 320;
export const MAX_BANNER_BYTES = 48 * 1024;
export const MAX_BANNER_POINTS = 2500;
export const MAX_BANNER_STROKES = 120;
export const bannerColors = [
	'ink',
	'accent',
	'teal-soft',
	'peach-solid',
	'lime-solid',
	'butter',
	'surface'
] as const;
export const bannerTools = ['pen', 'pencil', 'marker', 'eraser'] as const;
const point = z.tuple([
	z.number().int().min(0).max(BANNER_WIDTH),
	z.number().int().min(0).max(BANNER_HEIGHT)
]);
export const bannerSchema = z
	.object({
		version: z.literal(1),
		strokes: z
			.array(
				z
					.object({
						tool: z.enum(bannerTools),
						color: z
							.string()
							.refine(
								(value) =>
									bannerColors.includes(value as (typeof bannerColors)[number]) ||
									/^#[0-9a-f]{6}$/i.test(value)
							),
						size: z.number().int().min(1).max(32),
						opacity: z.number().min(0).max(1).optional(),
						points: z.array(point).min(1).max(MAX_BANNER_POINTS)
					})
					.strict()
			)
			.max(MAX_BANNER_STROKES)
	})
	.strict()
	.refine(
		(value) =>
			value.strokes.reduce((count, stroke) => count + stroke.points.length, 0) <= MAX_BANNER_POINTS
	);
export type Banner = z.infer<typeof bannerSchema>;
export type BannerStroke = Banner['strokes'][number];

export function parseBanner(value: unknown): Banner | null {
	if (typeof value !== 'string' || new TextEncoder().encode(value).length > MAX_BANNER_BYTES)
		return null;
	try {
		const result = bannerSchema.safeParse(JSON.parse(value));
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}

export function strokeColor(stroke: BannerStroke) {
	const color = stroke.tool === 'eraser' ? 'surface' : stroke.color;
	return color.startsWith('#') ? color : `var(--color-${color})`;
}
