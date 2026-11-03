import {expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {h} from 'vue';
import {RouterLink} from 'vue-router';
import Button from '../../../src/client/components/Button.vue';
import Icon from '../../../src/client/components/Icon.vue';
import IconSprite from '../../../src/client/components/IconSprite.vue';
import FormInput from '../../../src/client/components/FormInput.vue';
import FormField from '../../../src/client/components/FormField.vue';
import FormLabel from '../../../src/client/components/FormLabel.vue';
import FormSwitch from '../../../src/client/components/FormSwitch.vue';
import Alert from '../../../src/client/components/Alert.vue';
import PageHeading from '../../../src/client/components/PageHeading.vue';
import AppHeader from '../../../src/client/components/AppHeader.vue';
import App from '../../../src/client/App.vue';
import {icons} from '../../../src/client/icons';
import {routerFor} from '../helpers';

it.each(['primary', 'secondary', 'danger', 'success', 'info', 'quiet'] as const)('Button renders %s styling, text, and its icon', color => {
    const wrapper = mount(Button, {props: {color, icon: 'plus'}, slots: {default: 'Save'}});
    expect(wrapper.classes()).toContain(`button--${color}`);
    expect(wrapper.text()).toBe('Save'); expect(wrapper.get('use').attributes('href')).toBe('#icon-plus');
    expect(wrapper.attributes('type')).toBe('button');
});
it('Button forwards form attributes and disables native buttons', async () => {
    const wrapper = mount(Button, {props: {type: 'submit', disabled: true}, attrs: {form: 'editor'}});
    expect(wrapper.element.disabled).toBe(true); expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('form')).toBe('editor'); expect(wrapper.attributes('type')).toBe('submit');
});
it('Button supports anchors, router links, and custom icon slots', async () => {
    const anchor = mount(Button, {props: {tag: 'a'}, attrs: {href: '/download'}, slots: {icon: '<span>Custom</span>'}});
    expect(anchor.element.tagName).toBe('A'); expect(anchor.attributes('href')).toBe('/download');
    expect(anchor.find('svg').exists()).toBe(false);
    const router = await routerFor();
    const link = mount(Button, {props: {tag: 'router-link'}, attrs: {to: '/1'}, global: {plugins: [router], components: {RouterLink}}});
    expect(link.get('a').attributes('href')).toBe('/1');
});
it('Icon names always resolve to symbols included in the sprite', () => {
    const sprite = mount(IconSprite);
    expect(sprite.findAll('symbol')).toHaveLength(Object.keys(icons).length);
    for (const name of Object.keys(icons) as (keyof typeof icons)[]) {
        const icon = mount(Icon, {props: {name}});
        expect(icon.get('use').attributes('href')).toBe(`#icon-${name}`);
        expect(sprite.get(`#icon-${name} path`).attributes('d')).toBe(icons[name]);
    }
});
it.each(['text', 'email', 'password', 'search', 'number', 'textarea'] as const)('FormInput emits edits for %s and renders null as empty', async type => {
    const wrapper = mount(FormInput, {props: {type, modelValue: null}});
    const input = wrapper.get(type === 'textarea' ? 'textarea' : 'input');
    expect(input.element.value).toBe('');
    await input.setValue(type === 'number' ? '42' : 'Edited');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([type === 'number' ? 42 : 'Edited']);
});
it('FormInput selects options and respects disabled, full, and invalid props', async () => {
    const wrapper = mount(FormInput, {props: {type: 'select', modelValue: 'a', full: false, invalid: true}, attrs: {disabled: true}, slots: {default: '<option value="a">A</option><option value="b">B</option>'}});
    expect(wrapper.classes()).not.toContain('form-input--full'); expect(wrapper.classes()).toContain('form-input--invalid');
    expect(wrapper.get('select').element.disabled).toBe(true);
    await wrapper.setProps({disabled: false}); await wrapper.get('select').setValue('b');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b']);
});
it.each(['checkbox', 'switch'] as const)('FormInput %s emits a boolean', async type => {
    const wrapper = mount(FormInput, {props: {type, modelValue: false}});
    await wrapper.get('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
});
it('FormSwitch forwards attributes to the checkbox and displays its checked state and label', async () => {
    const wrapper = mount(FormSwitch, {props: {modelValue: true, label: 'Enabled'}, attrs: {id: 'enabled', disabled: true}});
    expect(wrapper.classes()).toContain('form-switch--checked'); expect(wrapper.text()).toBe('Enabled');
    expect(wrapper.get('input').attributes('id')).toBe('enabled'); expect(wrapper.get('input').element.disabled).toBe(true);
    await wrapper.setProps({modelValue: false}); expect(wrapper.classes()).toContain('form-switch--unchecked');
});
it('FormLabel links its control and supports required/hidden labels', () => {
    const wrapper = mount(FormLabel, {props: {required: true, hideLabel: true}, attrs: {for: 'name'}, slots: {default: 'Name'}});
    expect(wrapper.attributes('for')).toBe('name'); expect(wrapper.classes()).toEqual(expect.arrayContaining(['sr-only', 'label--required']));
});
it('FormField links the label, help and all error messages to an invalid input', async () => {
    const wrapper = mount(FormField, {props: {id: 'name', label: 'Name', modelValue: '', help: 'A name', errors: ['Required', 'Too short'], required: true}, attrs: {'aria-describedby': 'external'}});
    expect(wrapper.get('label').attributes('for')).toBe('name');
    expect(wrapper.get('input').attributes('aria-describedby')).toBe('external name-errors name-description');
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    expect(wrapper.get('input').classes()).toContain('form-input--invalid');
    expect(wrapper.findAll('.field__errors__message').map(node => node.text())).toEqual(['Required', 'Too short']);
    await wrapper.get('input').setValue('Updated'); expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Updated']);
    await wrapper.setProps({errors: []}); expect(wrapper.find('.field__errors').exists()).toBe(false);
    expect(wrapper.get('input').attributes('aria-invalid')).toBeUndefined();
});
it('FormField generates unique IDs and supports string errors and options', () => {
    const first = mount(FormField, {props: {modelValue: '', label: 'First', errors: 'Invalid'}});
    const second = mount(FormField, {props: {modelValue: '', label: 'Second', type: 'select'}, slots: {options: '<option value="x">X</option>'}});
    const siblings = mount({render: () => h('div', [h(FormField, {modelValue: '', label: 'A'}), h(FormField, {modelValue: '', label: 'B'})])});
    const ids = siblings.findAll('input').map(input => input.attributes('id'));
    expect(ids[0]).not.toBe(ids[1]);
    expect(first.get('.field__errors').text()).toBe('Invalid'); expect(second.findAll('option')).toHaveLength(1);
});
it.each(['default', 'info', 'warning', 'danger', 'success'] as const)('Alert renders %s and action slots', type => {
    const wrapper = mount(Alert, {props: {type}, slots: {default: 'Message', actions: '<button>Retry</button>'}});
    expect(wrapper.attributes('role')).toBe('alert'); expect(wrapper.classes()).toContain(`alert--${type}`);
    expect(wrapper.get('.alert__actions').text()).toBe('Retry');
});
it('PageHeading renders its title and optional actions', () => {
    const wrapper = mount(PageHeading, {slots: {default: 'Sites', actions: '<button>Add</button>'}});
    expect(wrapper.get('h1').text()).toBe('Sites'); expect(wrapper.get('.page-heading__actions').text()).toBe('Add');
    expect(mount(PageHeading).find('.page-heading__actions').exists()).toBe(false);
});
it('AppHeader and App render navigation, the current route, and the shared sprite', async () => {
    const router = await routerFor();
    const header = mount(AppHeader, {global: {plugins: [router]}});
    expect(header.get('a').attributes('href')).toBe('/'); expect(header.text()).toContain('Password Database');
    const app = mount(App, {global: {plugins: [router]}});
    expect(app.get('main').text()).toContain('Sites route'); expect(app.find('symbol#icon-copy').exists()).toBe(true);
});
