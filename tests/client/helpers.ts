import {createMemoryHistory, createRouter} from 'vue-router';
import {flushPromises, type VueWrapper} from '@vue/test-utils';

export const site = {id: 1, name: 'Example', domain: 'example.com', url: 'https://example.com', notes: 'Notes', created_at: '2026-01-01', updated_at: '2026-01-01'};
export const record = {id: 3, section_id: 2, name: 'Credentials', sort: 0, data: [
    {name: 'Username', type: 'text' as const, value: 'alice'},
    {name: 'Enabled', type: 'boolean' as const, value: true},
], created_at: site.created_at, updated_at: site.updated_at};
export const section = {id: 2, site_id: 1, name: 'Login', sort: 0, data: [record], created_at: site.created_at, updated_at: site.updated_at};
export const details = {...site, sections: [section]};
export async function routerFor(path = '/') {
    const router = createRouter({history: createMemoryHistory(), routes: [
        {path: '/', name: 'sites', component: {template: '<div>Sites route</div>'}},
        {path: '/:id', name: 'site', component: {template: '<div>Site route</div>'}},
    ]});
    await router.push(path);
    await router.isReady();
    return router;
}
export async function openModal(wrapper: VueWrapper) {
    await flushPromises();
    await wrapper.get('.dialog__trigger').trigger('click');
    await flushPromises();
}
export function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((res, rej) => {resolve = res; reject = rej;});
    return {promise, resolve, reject};
}
