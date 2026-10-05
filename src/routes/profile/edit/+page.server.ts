import { error, fail, redirect } from '@sveltejs/kit';
import {
	getOwnProfile,
	updateOwnProfile,
	ProfileValidationError
} from '$lib/server/profile/update';
import { checkUploadContentLength } from '$lib/validation/photo-upload';
import { rateLimitUpload } from '$lib/server/security/rate-limit';
import { MAX_BANNER_BYTES } from '$lib/validation/banner';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) redirect(303, '/login?redirectTo=%2Fprofile%2Fedit');
	if (!platform?.env?.DB) error(503, 'Your profile is unavailable. Please try again.');
	try {
		return { profile: await getOwnProfile(platform.env.DB, locals.user.id) };
	} catch {
		error(503, 'Your profile is unavailable. Please try again.');
	}
};

export const actions: Actions = {
	default: async ({ locals, platform, request }) => {
		if (!locals.user) return fail(401, { message: 'Sign in to edit your profile.' });
		const size = checkUploadContentLength(request.headers.get('content-length'));
		if (size === 'too_large') return fail(413, { message: 'Choose a photo smaller than 5 MiB.' });
		if (size !== 'ok')
			return fail(400, { message: 'Could not read this submission. Please try again.' });
		let form: FormData;
		try {
			form = await request.formData();
		} catch {
			return fail(400, { message: 'Could not read this submission. Please try again.' });
		}
		const values = {
			name: typeof form.get('name') === 'string' ? String(form.get('name')) : '',
			description:
				typeof form.get('description') === 'string' ? String(form.get('description')) : '',
			removePhoto: form.get('removePhoto') === 'on'
		};
		const file = form.get('photo');
		const banner = form.has('banner') ? form.get('banner') : undefined;
		if (
			banner !== undefined &&
			(typeof banner !== 'string' || new TextEncoder().encode(banner).length > MAX_BANNER_BYTES)
		)
			return fail(400, { values, message: 'This drawing is too large. Try a smaller drawing.' });
		if (typeof banner === 'string') Object.assign(values, { banner });
		const photo = file instanceof File && file.size > 0 ? file : undefined;
		if (!platform?.env?.DB)
			return fail(503, { values, message: 'Could not save your profile. Please try again.' });
		try {
			if (photo) {
				const limit = await rateLimitUpload(platform.env.UPLOAD_RATE_LIMITER, locals.user.id);
				if (!limit.allowed)
					return fail(429, {
						values,
						message: 'Too many photo uploads. Please try again shortly.'
					});
			}
			await updateOwnProfile({
				d1: platform.env.DB,
				userId: locals.user.id,
				input: { name: form.get('name'), description: form.get('description') },
				photo,
				removePhoto: values.removePhoto,
				banner,
				bucket: platform.env.MEDIA_BUCKET
			});
		} catch (err) {
			if (err instanceof ProfileValidationError) return fail(400, { values, message: err.message });
			console.error('Failed to save profile:', err);
			return fail(503, { values, message: 'Could not save your profile. Please try again.' });
		}
		redirect(303, '/journal');
	}
};
