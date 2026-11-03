import {describe, expect, it, vi} from 'vitest';
import {mount, flushPromises} from '@vue/test-utils';
import AddSite from '../../../src/client/components/AddSite.vue';
import EditSite from '../../../src/client/components/EditSite.vue';
import AddSection from '../../../src/client/components/AddSection.vue';
import EditSection from '../../../src/client/components/EditSection.vue';
import AddRecord from '../../../src/client/components/AddRecord.vue';
import EditRecord from '../../../src/client/components/EditRecord.vue';
import DeleteSite from '../../../src/client/components/DeleteSite.vue';
import DeleteSection from '../../../src/client/components/DeleteSection.vue';
import DeleteRecord from '../../../src/client/components/DeleteRecord.vue';
import FormField from '../../../src/client/components/FormField.vue';
import {SiteApi} from '../../../src/client/services/site';
import {SectionApi} from '../../../src/client/services/section';
import {DataApi} from '../../../src/client/services/data';
import {FormValidationError} from '../../../src/client/services/base';
import {deferred, openModal, record, routerFor, section, site} from '../helpers';

const forms = [
    {name: 'AddSite', Component: AddSite, Service: SiteApi, props: {}, value: site, editing: false, event: null},
    {name: 'EditSite', Component: EditSite, Service: SiteApi, props: {site_id: 1}, value: site, editing: true, event: 'updated'},
    {name: 'AddSection', Component: AddSection, Service: SectionApi, props: {site_id: 1}, value: section, editing: false, event: 'added'},
    {name: 'EditSection', Component: EditSection, Service: SectionApi, props: {section_id: 2}, value: section, editing: true, event: 'section-updated'},
    {name: 'AddRecord', Component: AddRecord, Service: DataApi, props: {section_id: 2}, value: record, editing: false, event: 'record-added'},
    {name: 'EditRecord', Component: EditRecord, Service: DataApi, props: {section_id: 2, data_id: 3}, value: record, editing: true, event: 'record-updated'},
] as const;
for (const entry of forms) {
    describe(entry.name, () => {
        async function create() {
            const router = await routerFor('/1');
            if (entry.editing) vi.spyOn(entry.Service.prototype, 'get').mockResolvedValue(structuredClone(entry.value));
            const wrapper = mount(entry.Component, {props: entry.props, global: {plugins: [router]}, attachTo: document.body});
            await openModal(wrapper);
            return {wrapper, router};
        }
        it('submits edited input and emits or navigates only after API success', async () => {
            const save = vi.spyOn(entry.Service.prototype, entry.editing ? 'update' : 'add').mockResolvedValue(structuredClone(entry.value));
            const {wrapper, router} = await create();
            const push = vi.spyOn(router, 'push');
            await wrapper.get('input[name="name"]').setValue('Changed');
            await wrapper.get('form').trigger('submit'); await flushPromises();
            expect(save).toHaveBeenCalledTimes(1);
            const args = save.mock.calls[0]; const payload = args.at(-1);
            expect(payload).toMatchObject({name: 'Changed'});
            if (entry.name === 'AddSite') expect(push).toHaveBeenCalledWith({name: 'site', params: {id: site.id}});
            else {
                const expected = entry.name === 'AddRecord' ? [2, record] : entry.name === 'EditRecord' ? [2, 3, record] : [entry.value];
                expect(wrapper.emitted(entry.event!)?.[0]).toEqual(expected);
                expect(wrapper.get('dialog').element.open).toBe(false);
            }
        });
        it('displays server field errors and allows a corrected retry', async () => {
            const fields = entry.name.endsWith('Record')
                ? {name: ['Heading error'], 'data.0.name': ['Row name error'], 'data.0.value': ['Row value error']}
                : entry.name.endsWith('Site')
                    ? {name: ['Name error'], domain: ['Domain error'], url: ['URL error'], notes: ['Notes error']}
                    : {name: ['Name error']};
            const save = vi.spyOn(entry.Service.prototype, entry.editing ? 'update' : 'add')
                .mockRejectedValueOnce(new FormValidationError('Invalid form', fields)).mockResolvedValue(structuredClone(entry.value));
            const {wrapper} = await create();
            await wrapper.get('form').trigger('submit'); await flushPromises();
            expect(wrapper.get('dialog').element.open).toBe(true);
            expect(wrapper.get('[role="alert"]').text()).toContain('Invalid form');
            for (const message of Object.values(fields).flat()) expect(wrapper.findAll('.field__errors').map(node => node.text())).toContain(message);
            expect(wrapper.findAllComponents(FormField).some(field => field.props('errors')?.length)).toBe(true);
            await wrapper.get('input[name="name"]').setValue('Corrected');
            await wrapper.get('form').trigger('submit'); await flushPromises();
            expect(save).toHaveBeenCalledTimes(2); expect(wrapper.find('.field__errors').exists()).toBe(false);
        });
        it('shows request failures without emitting a successful change', async () => {
            vi.spyOn(entry.Service.prototype, entry.editing ? 'update' : 'add').mockRejectedValue(new Error('Offline'));
            const {wrapper} = await create();
            await wrapper.get('form').trigger('submit'); await flushPromises();
            expect(wrapper.get('[role="alert"]').text()).toContain('Unable');
            expect(wrapper.get('dialog').element.open).toBe(true);
            if (entry.event) expect(wrapper.emitted(entry.event)).toBeUndefined();
        });
        it('prevents duplicate submissions while a request is pending', async () => {
            const pending = deferred<never>();
            const save = vi.spyOn(entry.Service.prototype, entry.editing ? 'update' : 'add').mockReturnValue(pending.promise);
            const {wrapper} = await create();
            await wrapper.get('form').trigger('submit'); await wrapper.get('form').trigger('submit');
            expect(save).toHaveBeenCalledTimes(1);
            pending.reject(new Error('Offline')); await flushPromises();
        });
        if (entry.editing) it('reports load failures and keeps Save disabled', async () => {
            const router = await routerFor('/1');
            vi.spyOn(entry.Service.prototype, 'get').mockRejectedValue(new Error('Offline'));
            const wrapper = mount(entry.Component, {props: entry.props, global: {plugins: [router]}, attachTo: document.body});
            await openModal(wrapper);
            expect(wrapper.get('[role="alert"]').text()).toMatch(/load/);
            expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
        });
    });
}
for (const Component of [AddRecord, EditRecord]) {
    it(`${Component.__name} disables Save with no rows and enables it after adding a row`, async () => {
        const save = vi.spyOn(DataApi.prototype, Component === AddRecord ? 'add' : 'update').mockResolvedValue(record);
        vi.spyOn(DataApi.prototype, 'get').mockResolvedValue({...record, data: [record.data[0]]});
        const wrapper = mount(Component, {props: {section_id: 2, data_id: 3}, attachTo: document.body}); await openModal(wrapper);
        await wrapper.get('[title="Remove Row"]').trigger('click');
        expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined();
        await wrapper.get('form').trigger('submit'); expect(save).not.toHaveBeenCalled();
        await wrapper.get('.records_add button').trigger('click');
        expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined();
    });
}
const deletions = [
    {name: 'DeleteSite', Component: DeleteSite, Service: SiteApi, props: {site_id: 1}, id: 1, event: null, payload: []},
    {name: 'DeleteSection', Component: DeleteSection, Service: SectionApi, props: {section_id: 2}, id: 2, event: 'section-deleted', payload: [2]},
    {name: 'DeleteRecord', Component: DeleteRecord, Service: DataApi, props: {section_id: 2, data_id: 3}, id: 3, event: 'record-deleted', payload: [2, 3]},
] as const;
for (const entry of deletions) {
    it(`${entry.name} uses danger styling and deletes only after confirmation`, async () => {
        const remove = vi.spyOn(entry.Service.prototype, 'delete').mockResolvedValue(undefined);
        const router = await routerFor('/1'); const push = vi.spyOn(router, 'push');
        const wrapper = mount(entry.Component, {props: entry.props, global: {plugins: [router]}, attachTo: document.body});
        await openModal(wrapper); expect(remove).not.toHaveBeenCalled();
        expect(wrapper.get('button[type="submit"]').classes()).toContain('button--danger');
        await wrapper.get('form').trigger('submit'); await flushPromises();
        expect(remove).toHaveBeenCalledExactlyOnceWith(entry.id);
        if (entry.event) expect(wrapper.emitted(entry.event)?.[0]).toEqual(entry.payload);
        else expect(push).toHaveBeenCalledWith({name: 'sites'});
    });
    it(`${entry.name} does not report deletion when the API fails`, async () => {
        vi.spyOn(entry.Service.prototype, 'delete').mockRejectedValue(new Error('Offline'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const router = await routerFor('/1'); const push = vi.spyOn(router, 'push');
        const wrapper = mount(entry.Component, {props: entry.props, global: {plugins: [router]}, attachTo: document.body});
        await openModal(wrapper); await wrapper.get('form').trigger('submit'); await flushPromises();
        expect(wrapper.get('dialog').element.open).toBe(true);
        if (entry.event) expect(wrapper.emitted(entry.event)).toBeUndefined();
        expect(push).not.toHaveBeenCalled();
    });
}
