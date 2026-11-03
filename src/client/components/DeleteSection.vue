<script setup lang="ts">

import Modal from "./Modal.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import {SectionApi} from "../services/section";
import Alert from "./Alert.vue";

const props = defineProps<{
    section_id: number;
}>();

const emit = defineEmits<{
    (e: 'section-deleted', section_id: number): void;
}>();

const busy = ref(false);
const error = ref("");
const api = new SectionApi();
const modal = ref<InstanceType<typeof Modal> | null>(null);

const submit = async () => {
    if (busy.value) {
        return;
    }
    busy.value = true;
    error.value = '';
    try {
        await api.delete(props.section_id);
        emit('section-deleted', props.section_id);
        modal.value?.close();
    } catch (e) {
        error.value = 'An error occurred while deleting the site.';
        busy.value = false;
    }
};

</script>

<template>
    <Modal
        ref="modal"
        :id="`modal-section-${section_id}-delete`"
        title="Delete Section"
        trigger="Delete section"
        trigger-icon="trash"
        trigger-color="danger"
    >
        <form :id="`form-section-${section_id}-delete`" @submit.prevent="submit">
            <p class="text-sm text-gray-500">
                Are you sure you want to delete this section?<br>
                All data in this section will be deleted.<br>
                This action cannot be undone.
            </p>
            <alert v-if="error" type="danger" v-text="error"/>
        </form>

        <template #submit>
            <Button type="submit" color="danger" :form="`form-section-${section_id}-delete`" :disabled="busy">Delete</Button>
        </template>
    </Modal>
</template>
