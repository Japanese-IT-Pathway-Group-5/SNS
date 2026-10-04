import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createDraftPersistence,
	clearUserDraft,
	DRAFT_CLEAR_EVENT,
	DRAFT_SAVE_DELAY,
	draftKey
} from './persistence';

describe('device draft persistence', () => {
	let entries: Map<string, string>;
	let storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
	beforeEach(() => {
		vi.useFakeTimers();
		entries = new Map();
		storage = {
			getItem: (key) => entries.get(key) ?? null,
			setItem: vi.fn((key, value) => {
				entries.set(key, value);
			}),
			removeItem: (key) => {
				entries.delete(key);
			}
		};
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});
	it('logout broadcasts cancellation and removes both account key versions', () => {
		const events = new EventTarget();
		vi.stubGlobal('window', events);
		vi.stubGlobal('localStorage', storage);
		entries.set(draftKey('a'), 'new draft');
		entries.set('composer_draft_a', 'legacy');
		entries.set(draftKey('b'), 'keep');
		const cancelled = vi.fn();
		events.addEventListener(DRAFT_CLEAR_EVENT, (event) => cancelled((event as CustomEvent).detail));
		clearUserDraft('a');
		expect(cancelled).toHaveBeenCalledWith('a');
		expect(entries.has(draftKey('a'))).toBe(false);
		expect(entries.has('composer_draft_a')).toBe(false);
		expect(entries.get(draftKey('b'))).toBe('keep');
	});
	it('debounces writes to the latest text and preserves line breaks and whitespace', () => {
		const status = vi.fn();
		const draft = createDraftPersistence('a', () => storage, status);
		draft.schedule('first');
		vi.advanceTimersByTime(200);
		draft.schedule(' 今日🌱\n ');
		vi.advanceTimersByTime(DRAFT_SAVE_DELAY - 1);
		expect(storage.setItem).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1);
		expect(entries.get(draftKey('a'))).toBe(' 今日🌱\n ');
		expect(storage.setItem).toHaveBeenCalledTimes(1);
		expect(status).toHaveBeenLastCalledWith('saved');
	});
	it('restores only this account and migrates its legacy key on the next save', () => {
		entries.set('composer_draft_a', 'legacy draft');
		entries.set(draftKey('b'), 'other account');
		const a = createDraftPersistence('a', () => storage, vi.fn());
		expect(a.restore()).toBe('legacy draft');
		a.schedule('updated');
		a.flush();
		expect(entries.has('composer_draft_a')).toBe(false);
		expect(entries.get(draftKey('a'))).toBe('updated');
		expect(createDraftPersistence('b', () => storage, vi.fn()).restore()).toBe('other account');
	});
	it('clear cancels queued writes and flush cannot resurrect a discarded draft', () => {
		entries.set(draftKey('a'), 'saved');
		entries.set(draftKey('b'), 'keep');
		const draft = createDraftPersistence('a', () => storage, vi.fn());
		draft.schedule('pending');
		draft.clear();
		draft.flush();
		vi.runAllTimers();
		expect(entries.has(draftKey('a'))).toBe(false);
		expect(entries.get(draftKey('b'))).toBe('keep');
	});
	it('flush saves before the debounce completes and empty text removes the draft', () => {
		const draft = createDraftPersistence('a', () => storage, vi.fn());
		draft.schedule('new');
		draft.flush();
		expect(entries.get(draftKey('a'))).toBe('new');
		draft.schedule('');
		draft.flush();
		expect(entries.has(draftKey('a'))).toBe(false);
	});
	it('storage denial and quota failure produce an unavailable status without throwing', () => {
		const status = vi.fn();
		const draft = createDraftPersistence(
			'a',
			() => {
				throw new Error('blocked');
			},
			status
		);
		expect(draft.restore()).toBe('');
		draft.schedule('keep in memory');
		vi.runAllTimers();
		expect(status).toHaveBeenLastCalledWith('unavailable');
		expect(() => draft.clear()).not.toThrow();
		const quota = createDraftPersistence(
			'a',
			() => ({
				...storage,
				setItem() {
					throw new Error('quota');
				}
			}),
			status
		);
		quota.schedule('text');
		quota.flush();
		expect(status).toHaveBeenLastCalledWith('unavailable');
	});
});
