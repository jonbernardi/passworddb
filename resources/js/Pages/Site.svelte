<script>
    import { Link } from '@inertiajs/svelte'
    import {Icon, ArrowSmallLeft} from "svelte-hero-icons";
    import EditSite from '@/EditSite.svelte';
    import DeleteSite from '@/DeleteSite.svelte';
    import AddSection from '@/AddSection.svelte';
    import SiteSection from '@/SiteSection.svelte';

    export let site;
</script>
<div class="">
    <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                {site.name}
            </h1>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4 space-x-4">
            <Link href="/"
                         class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-xs text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Icon src="{ArrowSmallLeft}" class="w-5 h-5"/>
                <span class="ml-2">Back</span>
            </Link>
            <DeleteSite site="{site}" />
        </div>
    </div>
    <header>
        {#if site.domain}
            <p class="mt-1 text-sm text-gray-500">
                {site.domain}
            </p>
        {/if}
        {#if site.url}
            <p class="mt-1 text-sm">
                <a href="{site.url}" class="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noindex">{site.url}</a>
            </p>
        {/if}
        {#if site.notes}
            <p class="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
                {site.notes}
            </p>
        {/if}
        <div class="mt-2">
            <EditSite site="{site}" />
        </div>
    </header>

    <div class="mt-4">
        <AddSection site="{site.id}" />
    </div>

    <div class="site-sections">
        {#each site.sections as section, index (section.id)}
            <SiteSection section="{section}" first="{index === 0}" last="{index === site.sections.length - 1}" />
        {/each}
    </div>

</div>
