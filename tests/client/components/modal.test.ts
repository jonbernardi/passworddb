import {expect, it, vi} from 'vitest';
import {mount, flushPromises} from '@vue/test-utils';
import Modal from '../../../src/client/components/Modal.vue';

it('opens through the trigger, emits lifecycle events, renders title/icon, and closes through cancel', async () => {
    const wrapper = mount(Modal, {props: {id: 'test', title: 'Edit', trigger: 'Edit site', triggerIcon: 'edit'}, attachTo: document.body});
    expect(wrapper.get('.dialog__trigger use').attributes('href')).toBe('#icon-edit');
    await flushPromises();
    await wrapper.get('.dialog__trigger').trigger('click'); await flushPromises();
    expect(wrapper.get('dialog').element.open).toBe(true);
    expect(wrapper.get('dialog').attributes('aria-labelledby')).toBe('modal-title-test');
    expect(wrapper.get('h3').text()).toBe('Edit'); expect(wrapper.emitted('beforeopen')).toHaveLength(1); expect(wrapper.emitted('open')).toHaveLength(1);
    await wrapper.get('.dialog__action__cancel').trigger('click'); await flushPromises();
    expect(wrapper.get('dialog').element.open).toBe(false); expect(wrapper.emitted('close')).toHaveLength(1);
});
it('responds to v-model and stays open when busy changes', async () => {
    const wrapper = mount(Modal, {props: {id: 'model', modelValue: false}});
    await wrapper.setProps({modelValue: true}); await flushPromises();
    expect(wrapper.get('dialog').element.open).toBe(true);
    await wrapper.setProps({busy: true}); expect(wrapper.get('dialog').element.open).toBe(true);
    expect(wrapper.get('dialog').attributes('closedby')).toBe('none');
    const event = new Event('cancel', {cancelable: true}); wrapper.get('dialog').element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await wrapper.setProps({modelValue: false}); expect(wrapper.get('dialog').element.open).toBe(false);
});
it('disables opening and dismissal controls while disabled or busy', async () => {
    const wrapper = mount(Modal, {props: {id: 'disabled', disabled: true}});
    await flushPromises();
    await wrapper.get('.dialog__trigger').trigger('click'); expect(wrapper.get('dialog').element.open).toBe(false);
    await wrapper.setProps({disabled: false, busy: true});
    expect(wrapper.get('.dialog__trigger').element.disabled).toBe(true);
    expect(wrapper.get('.dialog__close__button').element.disabled).toBe(true);
    expect(wrapper.get('.dialog__action__cancel').element.disabled).toBe(true);
});
it.each(['sm', 'md', 'lg', 'xl'])('supports %s sizing', size => {
    expect(mount(Modal, {props: {id: size, size}}).get('dialog').classes()).toContain(`dialog--${size}`);
});
it('supports hidden/custom triggers, custom title/actions, and persistent dialogs', () => {
    const wrapper = mount(Modal, {props: {id: 'custom', hideTrigger: true, persistent: true, size: 'custom-width'}, slots: {title: '<h2>Custom title</h2>', actions: '<button>Done</button>'}});
    expect(wrapper.find('.dialog__trigger').exists()).toBe(false); expect(wrapper.find('.dialog__outer').exists()).toBe(false);
    expect(wrapper.get('h2').text()).toBe('Custom title'); expect(wrapper.get('.dialog__actions').text()).toBe('Done');
    expect(wrapper.get('dialog').classes()).toContain('custom-width'); expect(wrapper.get('dialog').attributes('closedby')).toBe('none');
});
it('focuses the first visible eligible field when autofocus is absent', async () => {
    const wrapper = mount(Modal, {props: {id: 'focus'}, slots: {default: '<form><input disabled><input type="hidden"><input id="eligible"></form>'}, attachTo: document.body});
    const input = wrapper.get('#eligible').element;
    vi.spyOn(input, 'getClientRects').mockReturnValue([{width: 100, height: 30}] as unknown as DOMRectList);
    await flushPromises();
    await wrapper.get('.dialog__trigger').trigger('click'); await flushPromises();
    expect(document.activeElement).toBe(input);
});
