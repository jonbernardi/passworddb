<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import { useRouteQuery } from '@vueuse/router'
import {filter, type MatchRange} from 'fuzzy-tools';
import type {SiteSummary, SortedSite} from "../../shared/types";
import {SiteApi} from "../services/site";
import PageHeading from "./PageHeading.vue";
import FormInput from "./FormInput.vue";
import AddSite from "./AddSite.vue";
import Button from "./Button.vue";
import Alert from "./Alert.vue";

const sites = ref<SiteSummary[]>([]);
const search = useRouteQuery('s', '');
const error = ref('');
const loading = ref(true);
const api = new SiteApi();

onMounted(async () => {
    try {
        sites.value = await api.list();
    } catch {
        error.value = 'Unable to load sites. Please try again.';
    } finally {
        loading.value = false;
    }
});

function sortByName(items: SiteSummary[]): SiteSummary[] {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function sortByScore(items: SortedSite[]): SortedSite[] {
    return [...items].sort((a, b) => (a.score === b.score) ? a.name.localeCompare(b.name) :  a.score - b.score);
}

function escapeHtml(text: string): string {
    return text.replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function highlightText(text: string, ranges: MatchRange[] = []): string {
    let html = '';
    let offset = 0;
    for (const {begin, end} of ranges) {
        html += escapeHtml(text.slice(offset, begin));
        html += `<em class="highlight">${escapeHtml(text.slice(begin, end + 1))}</em>`;
        offset = end + 1;
    }
    return html + escapeHtml(text.slice(offset));
}

const records = computed(() => {
    if(search.value === '') {
        return sortByName(sites.value).map(item => ({
            ...item,
            name: escapeHtml(item.name),
            domain: item.domain === null ? null : escapeHtml(item.domain),
        }));
    }
    return sortByScore(filter(search.value, sites.value, {
        extract: ['name', 'domain'],
        withRanges: true,
        itemWrapper: (item, m): SortedSite => {
            let name = m.matches?.name?.score || 0;
            let domain = m.matches?.domain?.score || 0;
            let score = Math.max(name * 1.5, domain);
            return {
                ...item,
                score: score,
                name: highlightText(item.name, m.matches?.name?.ranges),
                domain: item.domain === null ? null : highlightText(item.domain, m.matches?.domain?.ranges),
            };
        }
    }));
})

</script>

<template>
    <div class="site-list">
        <page-heading>
            Sites
            <template #actions>
                <add-site/>
            </template>
        </page-heading>

        <p v-if="loading" role="status">Loading sites…</p>
        <alert v-else-if="error" type="danger" v-text="error"/>
        <div v-else-if="sites.length">
            <form method="get" class="site-list__search" @submit.prevent="() => {}">
                <form-input type="search" v-model="search" name="s" placeholder="filter sites" :full="false" size="50" autocomplete="off" />
            </form>
            <div v-if="records.length" class="table-responsive">
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
                    <tr v-for="site in records" :key="site.id">
                        <td>
                            <Button class="button--small" tag="router-link" :to="`/${site.id}`">
                                Details
                            </Button>
                        </td>
                        <td>
                            <div class="font-bold" v-html="site.name"/>
                            <div v-if="site.domain" class="truncate" v-html="site.domain"/>
                            <div v-if="site.url" class="truncate">
                                <a :href="site.url" target="_blank" rel="noopener noindex" v-text="site.url"/>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            <p v-else class="empty-state">No sites match the current search.</p>
        </div>
        <p v-else class="empty-state">No sites found.</p>
    </div>
</template>
