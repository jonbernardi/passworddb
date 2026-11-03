<script setup lang="ts">

import Modal from "./Modal.vue";
import FormField from "./FormField.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import type {DataInput, DataItem} from "../../shared/types";
import {FormValidationError} from "../services/base";
import {DataApi} from "../services/data";
import RecordForm from "./RecordForm.vue";
import Alert from "./Alert.vue";

const props = defineProps<{
    section_id: number;
}>();
const emit = defineEmits<{
    (event: 'record-added', section_id: number, record: DataItem): void
}>()

const api = new DataApi();
const busy = ref(false);
const error = ref('');
const errors = ref<Record<string, string[]>>({});
const form = ref<HTMLFormElement>();
const modal = ref<InstanceType<typeof Modal>>();
const data = ref<DataInput>({
    name: '',
    data: [{name: '', type: 'text', value: null}]
})

const reset = () => {
    error.value = '';
    errors.value = {};
    form.value?.reset();
    data.value = {
        name: '',
        data: [{name: '', type: 'text', value: null}]
    }
}

const submit = async () => {
    if (busy.value || data.value.data.length === 0) {
        return;
    }
    errors.value = {};
    error.value = '';
    busy.value = true;
    try {
        const record = await api.add(props.section_id, data.value);
        emit('record-added', props.section_id, record);
        modal.value?.close();
        reset();
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to add record. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};

</script>

<template>
    <modal
        ref="modal"
        :id="`modal-record-${section_id}-add`"
        title="Add Record"
        size="xl"
        trigger="Add Record"
        trigger-color="success"
        trigger-icon="plus"
        :busy="busy"
        @close="reset"
        @beforeopen="reset"
    >

        <form ref="form" class="form form--record form--record--add" :id="`form-record-${section_id}-add`" @submit.prevent="submit">
            <Alert v-if="error" type="danger">{{ error }}</Alert>
            <form-field
                :id="`form-record-${section_id}-add-name`"
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
                <RecordForm :prefix="`form-record-${section_id}-add-`" v-model="data.data" :errors="errors" :disabled="busy" />
            </div>
        </form>

        <template #submit>
            <Button type="submit" :disabled="busy || data.data.length === 0" :form="`form-record-${section_id}-add`">
                Save
            </Button>
        </template>

    </modal>
</template>
