<script setup lang="ts">

import type {DataItem} from "../../shared/types";
import MoveRecord from "./MoveRecord.vue";
import RecordValue from "./RecordValue.vue";
import DeleteRecord from "./DeleteRecord.vue";
import EditRecord from "./EditRecord.vue";

const props = withDefaults(defineProps<{
    section_id: number;
    item: DataItem;
    first?: boolean;
    last?: boolean;
}>(), {
    first: false,
    last: false,
});

const emit = defineEmits<{
    (event: 'record-updated', section_id: number, data_id: number, record: DataItem): void;
    (event: 'record-deleted', section_id: number, data_id: number): void;
    (event: 'record-moved', section_id: number, data_id: number, dir: 'left' | 'right'): void;
}>();

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
    <div class="data">
        <div class="data__header">
            <h3 class="data_title" :title="item.name" v-text="item.name" />
            <div v-if="!first || !last" class="data__move">
                <MoveRecord :section_id="section_id" :data_id="item.id" dir="left" :disabled="first" @record-moved="recordMoved" />
                <MoveRecord :section_id="section_id" :data_id="item.id" dir="right" :disabled="last" @record-moved="recordMoved" />
            </div>
        </div>
        <div class="data__body">
            <table class="data__records">
                <tr v-for="(record, index) in item.data" :key="`item-${section_id}.${item.id}.${index}`" class="data_record record">
                    <th class="record__title" :title="record.name" v-text="record.name" />
                    <td class="record__value">
                        <RecordValue :record="record" />
                    </td>
                </tr>
            </table>
        </div>
        <div class="data__actions">
            <EditRecord class="data__action" :section_id="section_id" :data_id="item.id" @record-updated="recordUpdated" />
            <DeleteRecord class="data__action" :section_id="section_id" :data_id="item.id" @record-deleted="recordDeleted" />
        </div>
    </div>

</template>
