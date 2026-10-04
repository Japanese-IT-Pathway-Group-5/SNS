export const DRAFT_SAVE_DELAY = 400;
export const DRAFT_CLEAR_EVENT = 'composer-draft-clear';
export const draftKey = (userId: string) => `composer_draft_v1_${encodeURIComponent(userId)}`;
const legacyKey = (userId: string) => `composer_draft_${userId}`;
export type DraftStatus = 'idle' | 'saving' | 'saved' | 'unavailable';
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function removeDraft(storage: DraftStorage, userId: string) {
	storage.removeItem(draftKey(userId));
	storage.removeItem(legacyKey(userId));
}

// Called by both logout forms. Notify mounted composers before navigation so
// their pending timers and unmount/pagehide flushes cannot resurrect the draft.
export function clearUserDraft(userId: string) {
	window.dispatchEvent(new CustomEvent(DRAFT_CLEAR_EVENT, { detail: userId }));
	try {
		removeDraft(localStorage, userId);
	} catch {
		// Logout remains available when device storage is blocked.
	}
}

export function createDraftPersistence(
	userId: string,
	getStorage: () => DraftStorage,
	onStatus: (status: DraftStatus) => void
) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: string | undefined;
	function cancelTimer() {
		clearTimeout(timer);
		timer = undefined;
	}
	function flush() {
		cancelTimer();
		if (pending === undefined) return;
		const text = pending;
		pending = undefined;
		try {
			const storage = getStorage();
			if (text.length) {
				storage.setItem(draftKey(userId), text);
				storage.removeItem(legacyKey(userId));
			} else {
				removeDraft(storage, userId);
			}
			onStatus(text.length ? 'saved' : 'idle');
		} catch {
			onStatus('unavailable');
		}
	}
	return {
		restore() {
			try {
				const storage = getStorage();
				const text = storage.getItem(draftKey(userId)) ?? storage.getItem(legacyKey(userId)) ?? '';
				onStatus(text.length ? 'saved' : 'idle');
				return text;
			} catch {
				onStatus('unavailable');
				return '';
			}
		},
		schedule(text: string) {
			cancelTimer();
			pending = text;
			onStatus(text.length ? 'saving' : 'idle');
			timer = setTimeout(flush, DRAFT_SAVE_DELAY);
		},
		flush,
		clear() {
			cancelTimer();
			pending = undefined;
			try {
				removeDraft(getStorage(), userId);
				onStatus('idle');
			} catch {
				onStatus('unavailable');
			}
		}
	};
}
