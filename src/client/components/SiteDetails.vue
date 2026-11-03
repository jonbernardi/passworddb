<script setup lang="ts">

import PageHeading from "./PageHeading.vue";
import {onMounted, ref} from "vue";
import {SiteApi} from "../services/site";
import type {DataItem, Section, SiteDetail, SiteSummary} from "../../shared/types";
import Alert from "./Alert.vue";
import Button from "./Button.vue";
import DeleteSite from "./DeleteSite.vue";
import EditSite from "./EditSite.vue";
import AddSection from "./AddSection.vue";
import SiteSection from "./SiteSection.vue";

const props = defineProps<{id: number}>();

const site = ref<SiteDetail>();
const loading = ref(true);
const error = ref('');
const api = new SiteApi();

onMounted(async () => {
    try {
        site.value = await api.details(props.id);
    } catch {
        error.value = 'Unable to load sites. Please try again.';
    } finally {
        loading.value = false;
    }
});

const siteUpdated = (newValue: SiteSummary) => {
    if (!site.value) {
        return;
    }
    site.value = {...site.value, ...newValue, id: site.value.id};
}

const sectionAdded = (section: Section) => {
    if (!site.value) {
        return;
    }
    site.value.sections.push({...section, data: []});
}

const sectionMoved = (section_id: number, dir: 'up' | 'down') => {
    if (!site.value) {
        return;
    }

    const sections = site.value.sections;
    const index = sections.findIndex(section => section.id === section_id);
    const siblingIndex = index + (dir === 'up' ? -1 : 1);
    if (index === -1 || siblingIndex < 0 || siblingIndex >= sections.length) {
        return;
    }

    [sections[index], sections[siblingIndex]] = [sections[siblingIndex], sections[index]];
};

const sectionUpdated = (section_id: number, section: Section) => {
    if (!site.value) {
        return;
    }
    const sections = site.value.sections;
    const index = sections.findIndex(item => item.id === section_id);
    if (index === -1) {
        return;
    }
    const existing = sections[index];
    sections[index] = {...existing, ...section, id: existing.id, data: existing.data};
};

const sectionDeleted = (section_id: number) => {
    if (!site.value) {
        return;
    }
    site.value.sections = site.value.sections.filter(section => section.id !== section_id);
};

const recordAdded = (section_id: number, record: DataItem) => {
    if (!site.value) {
        return;
    }
    const index = site.value.sections.findIndex(item => item.id === section_id);
    if (index === -1) {
        return;
    }
    site.value.sections[index].data.push(record);
};
const recordUpdated = (section_id: number, data_id: number, record: DataItem) => {
    if (!site.value) {
        return;
    }
    const sindex = site.value.sections.findIndex(item => item.id === section_id);
    if (sindex === -1) {
        return;
    }
    const records = site.value.sections[sindex].data;
    const index = records.findIndex(item => item.id === data_id);
    if (index === -1) {
        return;
    }
    records[index] = {...records[index], ...record, id: data_id};
};
const recordMoved = (section_id: number, data_id: number, dir: 'left'|'right') => {
    if (!site.value) {
        return;
    }
    const sindex = site.value.sections.findIndex(item => item.id === section_id);
    if (sindex === -1) {
        return;
    }
    const records = site.value.sections[sindex].data;
    const index = records.findIndex(item => item.id === data_id);
    if (index === -1) {
        return;
    }
    const siblingIndex = index + (dir === 'left' ? -1 : 1);
    if (siblingIndex < 0 || siblingIndex >= records.length) {
        return;
    }

    [records[index], records[siblingIndex]] = [records[siblingIndex], records[index]];
};

const recordDeleted = (section_id: number, data_id: number) => {
    if (!site.value) {
        return;
    }

    const section_index = site.value.sections.findIndex(item => item.id === section_id);
    if (section_index === -1) {
        return;
    }
    const records = site.value.sections[section_index].data;
    const index = records.findIndex(item => item.id === data_id);
    if (index === -1) {
        return;
    }

    records.splice(index, 1);
}

</script>

<template>
    <div>
        <p v-if="loading">Loading sites…</p>
        <Alert v-else-if="error || !site" type="danger">
            {{ error || "Site not found." }}
            <template #actions>
                <Button color="danger" tag="router-link" to="/">Back to sites</Button>
            </template>
        </Alert>
        <div v-else>
            <page-heading>
                {{ site ? site.name : 'Site Details' }}
                <template #actions>
                    <Button tag="router-link" color="secondary" icon="arrow-left" to="/">
                        Back
                    </Button>
                    <DeleteSite :site_id="site.id" />
                </template>
            </page-heading>
            <header class="site__header">
                <p v-if="site.domain" class="site__header_domain" v-text="site.domain" />
                <p v-if="site.url" class="site__header_url">
                    <a :href="site.url" class="site__header_url_link" target="_blank" rel="noopener noindex" v-text="site.url" />
                </p>
                <p v-if="site.notes" class="site__header_notes" v-text="site.notes" />
                <div class="site_header_actions">
                    <EditSite :site_id="site.id" @updated="siteUpdated" />
                </div>
            </header>
            <div class="site__sections__actions">
                <AddSection :site_id="site.id" @added="sectionAdded" />
            </div>

            <div class="site__sections">
                <SiteSection
                    v-for="(section, index) in site.sections"
                    :key="section.id"
                    :section="section"
                    :first="index === 0"
                    :last="index === site.sections.length - 1"
                    @section-updated="sectionUpdated"
                    @section-deleted="sectionDeleted"
                    @section-moved="sectionMoved"
                    @record-added="recordAdded"
                    @record-updated="recordUpdated"
                    @record-deleted="recordDeleted"
                    @record-moved="recordMoved"
                />
            </div>

        </div>
    </div>
</template>
