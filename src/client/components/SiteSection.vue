<script setup lang="ts">
import type {DataItem, Section, SectionDetail} from "../../shared/types";
import MoveSection from "./MoveSection.vue";
import EditSection from "./EditSection.vue";
import DeleteSection from "./DeleteSection.vue";
import AddRecord from "./AddRecord.vue";
import DataGroup from "./DataGroup.vue";

interface SiteSectionProps {
    section: SectionDetail;
    first?: boolean;
    last?: boolean;
}

const props = withDefaults(defineProps<SiteSectionProps>(), {
    first: true,
    last: true,
});

const emit = defineEmits<{
    (event: 'section-updated', section_id: number, section: Section): void;
    (event: 'section-deleted', section_id: number): void;
    (event: 'section-moved', section_id: number, dir: 'up' | 'down'): void;
    (event: 'record-added', section_id: number, record: DataItem): void;
    (event: 'record-updated', section_id: number, data_id: number, record: DataItem): void;
    (event: 'record-deleted', section_id: number, data_id: number): void;
    (event: 'record-moved', section_id: number, data_id: number, dir: 'left' | 'right'): void;
}>();

const sectionMoved = (section_id: number, dir: 'up' | 'down') => {
    emit('section-moved', section_id, dir);
};
const recordAdded = (section_id: number, record: DataItem) => {
    emit('record-added', section_id, record);
};
const recordUpdated = (section_id: number, data_id: number, record: DataItem) => {
    emit('record-updated', section_id, data_id, record);
};
const recordDeleted = (section_id: number, data_id: number) => {
    emit('record-deleted', section_id, data_id);
};
const recordMoved = (section_id: number, data_id: number, dir: 'left' | 'right') => {
    emit('record-moved', section_id, data_id, dir);
};
</script>

<template>
    <div class="section">
        <div class="section__header">
            <h2 class="section__title" :title="section.name" v-text="section.name" />
            <div class="section__actions">

                <div v-if="!first || !last" class="section__move">
                    <MoveSection :site_id="section.site_id" :section_id="section.id" dir="up" :disabled="first" @section-moved="sectionMoved" />
                    <MoveSection :site_id="section.site_id" :section_id="section.id" dir="down" :disabled="last" @section-moved="sectionMoved" />
                </div>

                <EditSection :section_id="section.id" @section-updated="emit('section-updated', section.id, $event)" />
                <DeleteSection :section_id="section.id" @section-deleted="emit('section-deleted', $event)" />
                <AddRecord :section_id="section.id" @record-added="recordAdded" />
            </div>
        </div>

        <div class="section__records">
            <DataGroup
                v-for="(item, index) in section.data"
                :key="item.id"
                class="section__record"
                :section_id="section.id"
                :item="item"
                :first="index === 0"
                :last="index === section.data.length - 1"
                @record-updated="recordUpdated"
                @record-deleted="recordDeleted"
                @record-moved="recordMoved"
            />
        </div>
    </div>
</template>
