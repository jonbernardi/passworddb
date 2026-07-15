import '../css/app.css';
import { createInertiaApp } from '@inertiajs/svelte';
import { mount } from 'svelte';
import Layout from './components/Layout.svelte';

const pages = import.meta.glob('./Pages/**/*.svelte');

createInertiaApp({
    resolve: async (name) => {
        const page = await pages[`./Pages/${name}.svelte`]();

        if (page.default.layout === undefined) {
            page.default.layout = Layout;
        }

        return page;
    },
    setup({ el, App, props }) {
        mount(App, {
            target: el,
            props,
        });
    },
});
