<script>
    import {filter} from 'fuzzy-tools';
    import FormInput from "@/FormInput.svelte";
    import { Link } from '@inertiajs/svelte'
    import AddSite from "../components/AddSite.svelte";

    export let records = [];

    let url = new URLSearchParams(window.location.search);
    let search = url.get('s') || '';

    function sortByName(items) {
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }

    function sortByScore(items) {
        return [...items].sort((a, b) => a.score - b.score);
    }

    $: sites = (() => {
        let url = new URL(window.location.href);
        if (search === '') {
            if ((url.searchParams.get('s') || '') !== search) {
                url.searchParams.delete('s');
                window.history.replaceState({search}, '', url);
            }
            return sortByName(records);
        }
        if ((url.searchParams.get('s') || '') !== search) {
            url.searchParams.set('s', search)
            window.history.replaceState({search}, '', url);
        }

        return sortByScore(filter(search, records, {
            extract: ['name', 'domain'],
            withWrapper: '<em class="font-bold text-yellow-500">{?}</em>',
            itemWrapper: (item, m) => {
                let name = m.matches?.name?.score || 0;
                let domain = m.matches?.domain?.score || 0;
                let score = Math.max(name * 1.5, domain);
                return {
                    ...item,
                    score: score,
                    name: m.matches?.name?.wrapped || item.name,
                    domain: m.matches?.domain?.wrapped || item.domain
                };
            }
        }));
    })();

    function refresh(){

    }
</script>

<div>
    <div class="md:flex md:items-center md:justify-between">
        <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Sites
            </h1>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
            <AddSite on:added={refresh} />
        </div>
    </div>
    <form method="get" class="my-6" on:submit|preventDefault={() => {}}>
        <FormInput type="search" bind:value={search} name="s" placeholder="filter sites" full={false} size="50"/>
    </form>
    {#if sites.length === 0}
        <div>No sites match the current search.</div>
    {:else}
        <div class="table-responsive">
        <table class="table table-striped">
            <colgroup>
                <col width="110">
                <col>
            </colgroup>
            <thead>
            <tr>
                <th scope="col">Action</th>
                <th scope="col">Site</th>
            </tr>
            </thead>
            <tbody>
            {#each sites as site}
                <tr>
                    <td>
                        <Link href="{`/${site.id}`}" title="Details"
                                     class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-xs text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Details
                        </Link>
                    </td>
                    <td>
                        <div class="font-bold">{@html site.name}</div>
                        {#if site.domain}
                            <div class="truncate">{@html site.domain}</div>
                        {/if}
                        {#if site.url}
                            <div class="truncate"><a class="text-indigo-600 hover:text-indigo-500" href={site.url}
                                                      target="_blank"
                                                      rel="noopener noindex">{site.url}</a></div>
                        {/if}
                    </td>

                </tr>
            {/each}
            </tbody>
        </table>
        </div>
    {/if}
</div>
