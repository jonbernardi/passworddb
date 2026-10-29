import '../css/app.css';
import { createInertiaApp } from '@inertiajs/svelte';
import { mount } from 'svelte';
import Layout from './components/Layout.svelte';

const pages = import.meta.glob('./Pages/**/*.svelte');

createInertiaApp({
    layout: () => Layout,
    resolve: (name) => pages[`./Pages/${name}.svelte`](),
    setup({ el, App, props }) {
        mount(App, {
            target: el,
            props,
        });
    },
});
