<script setup lang="ts">

import Modal from "./Modal.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import {DataApi} from "../services/data";

const props = defineProps<{section_id: number, data_id: number}>();
const emit = defineEmits<{(e: 'record-deleted', section_id: number, data_id: number): void}>()

const busy = ref(false);
const modal = ref<InstanceType<typeof Modal>>();
const error = ref("");
const api = new DataApi();
const submit = async () => {
    busy.value = true;
    error.value = '';
    try {
        await api.delete(props.data_id);
        modal.value?.close();
        emit('record-deleted', props.section_id, props.data_id);
    } catch (e) {
        console.error(e);
        error.value = "Failed to delete record. Please try again later.";
    } finally {
        busy.value = false;
    }
}
</script>

<template>
    <modal
        :id="`modal-record-delete-${data_id}`"
        size="sm"
        ref="modal"
        title="Delete Record"
        trigger="Delete"
        trigger-color="danger"
        trigger-icon="trash"
    >
        <form :id="`form-record-delete-${data_id}`" @submit.prevent="submit">
        <p class="text-sm text-gray-500">
            Are you sure you want to delete this record?<br>
            All data in this record will be deleted.<br>
            This action cannot be undone.
        </p>
        </form>

        <template #submit>
            <Button type="submit" color="danger" :form="`form-record-delete-${data_id}`">
                Delete
            </Button>
        </template>
    </modal>

</template>
