<script setup lang="ts">

import Button from "./Button.vue";
import Modal from "./Modal.vue";
import FormField from "./FormField.vue";
import RecordForm from "./RecordForm.vue";
import type {DataInput, DataItem} from "../../shared/types";
import {ref} from "vue";
import {DataApi} from "../services/data";
import Alert from "./Alert.vue";
import {FormValidationError} from "../services/base";

const props = defineProps<{
    section_id: number,
    data_id: number,
}>()
const emit = defineEmits<{
    (event: 'record-updated', section_id: number, data_id: number, record: DataItem): void
}>()

const api = new DataApi();
const loaded = ref(false);
const busy = ref(false);
const error = ref('');
const errors = ref<Record<string, string[]>>({});
const modal = ref<InstanceType<typeof Modal>>();
const form = ref<InstanceType<typeof HTMLFormElement>>();
const data = ref<DataInput>({
    name: '',
    data: []
})

const load = async () => {
    if (busy.value) {
        return;
    }
    busy.value = true;
    reset();
    try{
        const record = await api.get(props.data_id);
        data.value = {
            name: record.name,
            data: record.data
        };
        loaded.value = true;
    } catch (e) {
        error.value = 'Failed to load record.';
    } finally {
        busy.value = false;
    }
};
const reset = () => {
    loaded.value = false;
    error.value = '';
    errors.value = {};
    form.value?.reset();
    data.value = {
        name: '',
        data: []
    };
};
const submit = async () => {
    if (busy.value || !loaded.value || data.value.data.length === 0) {
        return;
    }
    errors.value = {};
    error.value = '';
    busy.value = true;
    try {
        const record = await api.update(props.data_id, data.value);
        emit('record-updated', props.section_id, props.data_id, record);
        modal.value?.close();
        reset();
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to update record. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};
</script>

<template>
    <modal
        ref="modal"
        :id="`modal-record-${section_id}-edit-${data_id}`"
        title="Update Record"
        size="xl"
        trigger="Edit"
        trigger-color="primary"
        trigger-icon="edit"
        :busy="busy"
        @close="reset"
        @beforeopen="load"
    >
        <alert v-if="error" type="danger" v-text="error" />
        <div v-if="!loaded">Loading...</div>
        <form v-else ref="form" :id="`form-record-${section_id}-edit-${data_id}`" class="form form--record form--record--edit" @submit.prevent="submit">
            <form-field
                :id="`form-record-${section_id}-edit-${data_id}-name`"
                label="Heading"
                name="name"
                v-model="data.name"
                :errors="errors.name"
                required
                maxlength="191"
                :disabled="busy"
                autofocus
            />
            <div class="record__items">
                <RecordForm :prefix="`form-record-${section_id}-edit-${data_id}-`" v-model="data.data" :errors="errors" :disabled="busy" />
            </div>
        </form>

        <template #submit>
            <Button type="submit" :disabled="busy || !loaded || data.data.length === 0" :form="`form-record-${section_id}-edit-${data_id}`">
                Save
            </Button>
        </template>

    </modal>
</template>
