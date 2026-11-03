import {afterEach, beforeEach, vi} from 'vitest';
import {enableAutoUnmount} from '@vue/test-utils';

enableAutoUnmount(afterEach);

// jsdom has no dialog top layer. Model native lifecycle events, not component behavior.
function toggleEvent(type: string, oldState: string, newState: string) {
    const event = new Event(type);
    Object.defineProperties(event, {oldState: {value: oldState}, newState: {value: newState}});
    return event;
}
Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {configurable: true, value(this: HTMLDialogElement) {
        if (this.open) return;
        this.dispatchEvent(toggleEvent('beforetoggle', 'closed', 'open'));
        this.open = true;
        queueMicrotask(() => this.dispatchEvent(toggleEvent('toggle', 'closed', 'open')));
    }},
    close: {configurable: true, value(this: HTMLDialogElement) {
        if (!this.open) return;
        this.dispatchEvent(toggleEvent('beforetoggle', 'open', 'closed'));
        this.open = false;
        this.dispatchEvent(new Event('close'));
        queueMicrotask(() => this.dispatchEvent(toggleEvent('toggle', 'open', 'closed')));
    }},
});

beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unexpected network request in component test')));
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
});
