import {expect, it, vi} from 'vitest';
import {mount, shallowMount, flushPromises} from '@vue/test-utils';
import SiteList from '../../../src/client/components/SiteList.vue';
import SiteDetails from '../../../src/client/components/SiteDetails.vue';
import SiteSection from '../../../src/client/components/SiteSection.vue';
import EditSite from '../../../src/client/components/EditSite.vue';
import AddSection from '../../../src/client/components/AddSection.vue';
import {SiteApi} from '../../../src/client/services/site';
import {deferred, details, routerFor, record, section, site} from '../helpers';

it('SiteList shows loading, sorts sites, links to details, and renders names as safe text', async () => {
    const pending = deferred<typeof site[]>(); vi.spyOn(SiteApi.prototype, 'list').mockReturnValue(pending.promise);
    const router = await routerFor();
    const wrapper = mount(SiteList, {global: {plugins: [router], stubs: {AddSite: true}}});
    expect(wrapper.get('[role="status"]').text()).toContain('Loading');
    pending.resolve([{...site, id: 2, name: 'Zulu'}, {...site, name: 'Alpha <img src=x onerror=alert(1)>'}]); await flushPromises();
    const names = wrapper.findAll('tbody .font-bold').map(node => node.text());
    expect(names[0]).toContain('Alpha <img'); expect(names[1]).toBe('Zulu'); expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('tbody a.button').attributes('href')).toBe('/1');
});
it('SiteList filters names/domains, highlights matches, and keeps search in the URL', async () => {
    vi.spyOn(SiteApi.prototype, 'list').mockResolvedValue([{...site, name: 'Alpha'}, {...site, id: 2, name: 'Zulu', domain: 'zulu.test'}]);
    const router = await routerFor('/?s=Alpha');
    const wrapper = mount(SiteList, {global: {plugins: [router], stubs: {AddSite: true}}}); await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(1); expect(wrapper.get('.highlight').text()).toContain('A');
    await wrapper.get('input[type="search"]').setValue('zulu'); await flushPromises();
    expect(wrapper.findAll('tbody tr')).toHaveLength(1); expect(wrapper.get('tbody').text()).toContain('Zulu');
    expect(router.currentRoute.value.query.s).toBe('zulu');
    await wrapper.get('input').setValue('no-matching-site'); await flushPromises(); expect(wrapper.get('.empty-state').text()).toContain('No sites match');
    await wrapper.get('input').setValue(''); await flushPromises(); expect(wrapper.findAll('tbody tr')).toHaveLength(2);
});
it.each(['empty', 'failure'])('SiteList displays its %s state', async state => {
    const list = vi.spyOn(SiteApi.prototype, 'list');
    if (state === 'empty') list.mockResolvedValue([]); else list.mockRejectedValue(new Error('Offline'));
    const router = await routerFor();
    const wrapper = mount(SiteList, {global: {plugins: [router], stubs: {AddSite: true}}}); await flushPromises();
    expect(wrapper.text()).toContain(state === 'empty' ? 'No sites found.' : 'Unable to load sites.');
    expect(wrapper.find('table').exists()).toBe(false);
});
it('SiteDetails displays loaded site metadata and wires section and record changes into local state', async () => {
    const fixture = structuredClone(details);
    fixture.sections.push({...section, id: 4, name: 'Second', data: []});
    fixture.sections[0].data.push({...record, id: 5, name: 'Second record'});
    vi.spyOn(SiteApi.prototype, 'details').mockResolvedValue(fixture);
    const router = await routerFor('/1');
    const wrapper = shallowMount(SiteDetails, {props: {id: 1}, global: {plugins: [router], stubs: {PageHeading: {template: '<h1><slot/></h1>'}, Alert: false}}});
    expect(wrapper.text()).toContain('Loading'); await flushPromises();
    expect(wrapper.get('h1').text()).toBe('Example'); expect(wrapper.get('.site__header_url_link').attributes('href')).toBe('https://example.com');
    wrapper.getComponent(EditSite).vm.$emit('updated', {...site, name: 'Renamed'}); await flushPromises(); expect(wrapper.get('h1').text()).toBe('Renamed');
    const groups = () => wrapper.findAllComponents(SiteSection);
    expect(groups().map(group => group.props('section').id)).toEqual([2, 4]);
    groups()[0].vm.$emit('section-moved', 2, 'down'); await flushPromises(); expect(groups().map(group => group.props('section').id)).toEqual([4, 2]);
    groups()[1].vm.$emit('section-updated', 2, {...section, name: 'Updated section'}); await flushPromises();
    expect(groups()[1].props('section').name).toBe('Updated section'); expect(groups()[1].props('section').data).toHaveLength(2);
    groups()[1].vm.$emit('record-moved', 2, 3, 'right'); await flushPromises(); expect(groups()[1].props('section').data.map(row => row.id)).toEqual([5, 3]);
    groups()[1].vm.$emit('record-updated', 2, 3, {...record, name: 'Updated record'}); await flushPromises();
    expect(groups()[1].props('section').data[1].name).toBe('Updated record');
    groups()[1].vm.$emit('record-added', 2, {...record, id: 6}); await flushPromises(); expect(groups()[1].props('section').data).toHaveLength(3);
    groups()[1].vm.$emit('record-deleted', 2, 3); await flushPromises(); expect(groups()[1].props('section').data.map(row => row.id)).toEqual([5, 6]);
    wrapper.getComponent(AddSection).vm.$emit('added', {...section, id: 7}); await flushPromises(); expect(groups()[2].props('section').data).toEqual([]);
    groups()[0].vm.$emit('section-deleted', 4); await flushPromises(); expect(groups().map(group => group.props('section').id)).toEqual([2, 7]);
});
it('SiteDetails shows a readable load error with navigation back to sites', async () => {
    vi.spyOn(SiteApi.prototype, 'details').mockRejectedValue(new Error('Offline'));
    const router = await routerFor('/1');
    const wrapper = mount(SiteDetails, {props: {id: 1}, global: {plugins: [router]}}); await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to load sites. Please try again.');
    expect(wrapper.get('a').attributes('href')).toBe('/');
});
