import {expect, it, vi} from 'vitest';
import {mount, flushPromises} from '@vue/test-utils';
import {defineComponent, h, ref} from 'vue';
import RecordForm from '../../../src/client/components/RecordForm.vue';
import RecordValue from '../../../src/client/components/RecordValue.vue';
import DataGroup from '../../../src/client/components/DataGroup.vue';
import SiteSection from '../../../src/client/components/SiteSection.vue';
import MoveRecord from '../../../src/client/components/MoveRecord.vue';
import MoveSection from '../../../src/client/components/MoveSection.vue';
import {DataApi} from '../../../src/client/services/data';
import {SectionApi} from '../../../src/client/services/section';
import type {Field} from '../../../src/shared/types';
import {deferred, record, section} from '../helpers';

function editor(initial: Field[], errors: Record<string, string[]> = {}) {
    const rows = ref(initial); const messages = ref(errors); const disabled = ref(false);
    const wrapper = mount(defineComponent({setup: () => () => h(RecordForm, {
        prefix: 'test', modelValue: rows.value, errors: messages.value, disabled: disabled.value,
        'onUpdate:modelValue': (value: Field[]) => rows.value = value,
    })}));
    return {wrapper, rows, messages, disabled};
}
it('RecordForm adds each field type and removes the final row', async () => {
    const {wrapper, rows} = editor([]);
    for (const type of ['text', 'textarea', 'boolean']) {
        await wrapper.get('select').setValue(type); await wrapper.get('.records_add button').trigger('click');
    }
    expect(rows.value.map(row => [row.type, row.value])).toEqual([['text', null], ['textarea', null], ['boolean', false]]);
    expect(wrapper.find('textarea').exists()).toBe(true); expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
    for (let index = 0; index < 3; index++) await wrapper.findAll('[title="Remove Row"]')[0].trigger('click');
    expect(rows.value).toEqual([]);
});
it('RecordForm moves complete rows, respects boundaries, and keeps errors with rows', async () => {
    const {wrapper, rows, messages} = editor([
        {name: 'First', type: 'text', value: 'A'}, {name: 'Second', type: 'textarea', value: 'B'},
    ], {'data.0.name': ['First name error'], 'data.1.value': ['Second value error']});
    expect(wrapper.findAll('.record__actions')[0].findAll('button')[0].attributes('disabled')).toBeDefined();
    await wrapper.findAll('.record__actions')[0].findAll('button')[1].trigger('click');
    expect(rows.value.map(row => row.value)).toEqual(['B', 'A']);
    expect(wrapper.findAll('.record__fields')[0].text()).toContain('Second value error');
    expect(wrapper.findAll('.record__fields')[1].text()).toContain('First name error');
    await wrapper.findAll('[title="Remove Row"]')[0].trigger('click');
    expect(wrapper.findAll('.record__fields')[0].text()).toContain('First name error');
    await wrapper.get('.records_add button').trigger('click');
    expect(wrapper.findAll('.record__fields')[1].find('.field__errors').exists()).toBe(false);
    messages.value = {}; await flushPromises(); expect(wrapper.find('.field__errors').exists()).toBe(false);
});
it('RecordForm disables all editing controls while saving and displays collection/row/type errors', async () => {
    const {wrapper, disabled, rows} = editor([{name: 'Field', type: 'text', value: null}], {
        data: ['Too many rows'], 'data.0': ['Invalid row'], 'data.0.type': ['Invalid type'],
    });
    expect(wrapper.text()).toContain('Too many rows'); expect(wrapper.text()).toContain('Invalid type'); expect(wrapper.text()).toContain('Invalid row');
    disabled.value = true; await flushPromises();
    expect(wrapper.findAll('button, input, select').every(control => control.attributes('disabled') !== undefined)).toBe(true);
    await wrapper.get('[title="Remove Row"]').trigger('click'); expect(rows.value).toHaveLength(1);
});
it.each(['text', 'textarea'] as const)('RecordValue copies exact %s values and resets feedback', async type => {
    vi.useFakeTimers(); const writeText = vi.fn().mockResolvedValue(undefined); vi.stubGlobal('navigator', {clipboard: {writeText}});
    const value = type === 'text' ? '  secret  ' : 'First\nSecond';
    const wrapper = mount(RecordValue, {props: {record: {name: 'Password', type, value}}});
    await wrapper.get('button').trigger('click'); await flushPromises();
    expect(writeText).toHaveBeenCalledExactlyOnceWith(value);
    expect(wrapper.get('button').attributes('aria-label')).toBe('Copy Password');
    expect(wrapper.get('use').attributes('href')).toBe('#icon-check'); expect(wrapper.get('[role="status"]').text()).toContain('Copied');
    await vi.advanceTimersByTimeAsync(2000); expect(wrapper.get('use').attributes('href')).toBe('#icon-copy');
});
it('RecordValue handles clipboard failures and resets feedback when values change', async () => {
    vi.stubGlobal('navigator', {clipboard: {writeText: vi.fn().mockRejectedValue(new Error('Denied'))}});
    const wrapper = mount(RecordValue, {props: {record: {name: 'Field', type: 'text', value: 'secret'}}});
    await wrapper.get('button').trigger('click'); await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toContain('Unable to copy');
    await wrapper.setProps({record: {name: 'Field', type: 'text', value: 'updated'}});
    expect(wrapper.get('[role="status"]').text()).toBe(''); wrapper.unmount();
});
it.each([true, false, null, ''])('RecordValue omits copy for %j', value => {
    const field: Field = typeof value === 'boolean' ? {name: 'Field', type: 'boolean', value} : {name: 'Field', type: 'text', value};
    const wrapper = mount(RecordValue, {props: {record: field}}); expect(wrapper.find('button').exists()).toBe(false);
    if (typeof value === 'boolean') expect(wrapper.get('use').attributes('href')).toBe(value ? '#icon-check' : '#icon-close');
});
for (const [name, Component, Service, props, args, event, payload] of [
    ['MoveSection', MoveSection, SectionApi, {site_id: 1, section_id: 2, dir: 'down'}, [1, 2, 'down'], 'section-moved', [2, 'down']],
    ['MoveRecord', MoveRecord, DataApi, {section_id: 2, data_id: 3, dir: 'right'}, [2, 3, 'right'], 'record-moved', [2, 3, 'right']],
] as const) {
    it(`${name} waits for the API, blocks duplicate clicks, and emits success`, async () => {
        const pending = deferred<void>(); const move = vi.spyOn(Service.prototype, 'move').mockReturnValue(pending.promise);
        const wrapper = mount(Component, {props});
        await wrapper.get('button').trigger('click'); await wrapper.get('button').trigger('click');
        expect(move).toHaveBeenCalledExactlyOnceWith(...args); expect(wrapper.emitted(event)).toBeUndefined();
        pending.resolve(); await flushPromises(); expect(wrapper.emitted(event)?.[0]).toEqual(payload);
    });
    it(`${name} stays put on failure and disables boundary controls`, async () => {
        const move = vi.spyOn(Service.prototype, 'move').mockRejectedValue(new Error('Offline'));
        const wrapper = mount(Component, {props}); await wrapper.get('button').trigger('click'); await flushPromises();
        expect(wrapper.emitted(event)).toBeUndefined(); expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
        await wrapper.setProps({disabled: true}); await wrapper.get('button').trigger('click'); expect(move).toHaveBeenCalledTimes(1);
    });
}
it('DataGroup renders fields and forwards record edit/delete/move events', () => {
    const wrapper = mount(DataGroup, {props: {section_id: 2, item: record, first: true, last: false}, global: {stubs: {EditRecord: true, DeleteRecord: true, MoveRecord: true}}});
    expect(wrapper.get('h3').text()).toBe('Credentials'); expect(wrapper.findAll('tr')).toHaveLength(2);
    expect(wrapper.text()).toContain('alice');
    wrapper.getComponent({name: 'EditRecord'}).vm.$emit('record-updated', 2, 3, record);
    wrapper.getComponent({name: 'DeleteRecord'}).vm.$emit('record-deleted', 2, 3);
    wrapper.getComponent(MoveRecord).vm.$emit('record-moved', 2, 3, 'right');
    expect(wrapper.emitted('record-updated')?.[0]).toEqual([2, 3, record]);
    expect(wrapper.emitted('record-deleted')?.[0]).toEqual([2, 3]);
    expect(wrapper.emitted('record-moved')?.[0]).toEqual([2, 3, 'right']);
});
it('SiteSection passes boundary props and forwards section and record events', () => {
    const wrapper = mount(SiteSection, {props: {section, first: true, last: false}, global: {stubs: {MoveSection: true, EditSection: true, DeleteSection: true, AddRecord: true, DataGroup: true}}});
    expect(wrapper.get('h2').text()).toBe('Login'); expect(wrapper.getComponent(MoveSection).props('disabled')).toBe(true);
    wrapper.getComponent({name: 'EditSection'}).vm.$emit('section-updated', section);
    wrapper.getComponent(DataGroup).vm.$emit('record-updated', 2, 3, record);
    expect(wrapper.emitted('section-updated')?.[0]).toEqual([2, section]);
    expect(wrapper.emitted('record-updated')?.[0]).toEqual([2, 3, record]);
});

it('RecordForm edits text, textarea, and boolean fields through their real controls', async () => {
    const {wrapper, rows} = editor([
        {name: 'Text', type: 'text', value: null},
        {name: 'Notes', type: 'textarea', value: null},
        {name: 'Enabled', type: 'boolean', value: false},
    ]);
    await wrapper.get('#test-0-name').setValue('Renamed');
    await wrapper.get('#test-0-value').setValue('Updated');
    await wrapper.get('textarea').setValue('Line one\nLine two');
    await wrapper.get('input[type="checkbox"]').setValue(true);
    expect(rows.value).toEqual([
        {name: 'Renamed', type: 'text', value: 'Updated'},
        {name: 'Notes', type: 'textarea', value: 'Line one\nLine two'},
        {name: 'Enabled', type: 'boolean', value: true},
    ]);
});
it('SiteSection forwards every section and record mutation to its parent', () => {
    const wrapper = mount(SiteSection, {props: {section, first: false, last: false}, global: {stubs: {MoveSection: true, EditSection: true, DeleteSection: true, AddRecord: true, DataGroup: true}}});
    wrapper.getComponent(MoveSection).vm.$emit('section-moved', 2, 'up');
    wrapper.getComponent({name: 'DeleteSection'}).vm.$emit('section-deleted', 2);
    wrapper.getComponent({name: 'AddRecord'}).vm.$emit('record-added', 2, record);
    wrapper.getComponent(DataGroup).vm.$emit('record-deleted', 2, 3);
    wrapper.getComponent(DataGroup).vm.$emit('record-moved', 2, 3, 'right');
    expect(wrapper.emitted('section-moved')?.[0]).toEqual([2, 'up']);
    expect(wrapper.emitted('section-deleted')?.[0]).toEqual([2]);
    expect(wrapper.emitted('record-added')?.[0]).toEqual([2, record]);
    expect(wrapper.emitted('record-deleted')?.[0]).toEqual([2, 3]);
    expect(wrapper.emitted('record-moved')?.[0]).toEqual([2, 3, 'right']);
});
