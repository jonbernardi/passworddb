<script setup lang="ts">

import Modal from "./Modal.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import FormField from "./FormField.vue";
import Alert from "./Alert.vue";
import type {Section, SectionInput} from "../../shared/types";
import {SectionApi} from "../services/section";
import {FormValidationError} from "../services/base";

const props = defineProps<{site_id: number}>();

const emit = defineEmits<{added: [section: Section]}>();

const busy = ref(false);
const data = ref<SectionInput>({
    name: '',
});
const error = ref('');
const errors = ref<Record<string, string[]>>({});
const modal = ref<InstanceType<typeof Modal>>();
const form = ref<HTMLFormElement | null>(null);
const api = new SectionApi();

const reset = () => {
    form.value?.reset();
    data.value = {
        name: '',
    };
    error.value = '';
    errors.value = {};
}

const submit = async () => {
    if(busy.value){
        return;
    }
    busy.value = true;
    error.value = '';
    errors.value = {};
    try {
        const section = await api.add(props.site_id, data.value);
        emit('added', section);
        modal.value?.close();
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to add section. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};
</script>

<template>
    <modal
        ref="modal"
        id="modal-section-add"
        title="Add Section"
        :busy="busy"
        trigger="Add section"
        trigger-icon="plus"
        trigger-color="success"
        @beforeopen="reset"
        @close="reset"
    >
        <form id="form-section-add" class="form form--section form--section--add" ref="form" @submit.prevent="submit" >
            <Alert v-if="error" type="danger">{{ error }}</Alert>
            <form-field
                id="form-section-add-name"
                label="Section Name"
                name="name"
                v-model="data.name"
                :errors="errors?.name"
                required
                maxlength="191"
                autofocus
            />
        </form>
        <template #submit>
            <Button type="submit" form="form-section-add">Save</Button>
        </template>
    </modal>
</template>
