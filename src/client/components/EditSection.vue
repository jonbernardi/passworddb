<script setup lang="ts">

import Modal from "./Modal.vue";
import FormField from "./FormField.vue";
import Alert from "./Alert.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import type {SectionInput, Section} from "../../shared/types";
import {SectionApi} from "../services/section";
import {FormValidationError} from "../services/base";

const props = defineProps<{
    section_id: number;
}>();

const emit = defineEmits<{
    (event: 'section-updated', section: Section): void;
}>()

const api = new SectionApi();
const loaded = ref(false);
const busy = ref(false);
const error = ref<string | null>(null);
const errors = ref<Record<string, string[]>>({});
const data = ref<SectionInput>({
    name: '',
});
const form = ref<HTMLFormElement | null>(null);
const modal = ref<InstanceType<typeof Modal> | null>(null);


const load = async () => {
    busy.value = true;
    reset();
    try {
        const section = await api.get(props.section_id);
        data.value = {
            name: section.name,
        };
        loaded.value = true;
    } catch (e) {
        error.value = 'Unable to load section. Please try again.';
    } finally {
        busy.value = false;
    }

};

const reset = () => {
    loaded.value = false;
    error.value = null;
    errors.value = {};
    form.value?.reset();
    data.value = {
        name: '',
    };
};

const submit = async () => {
    if (!loaded.value || busy.value) {
        return;
    }
    busy.value = true;
    error.value = '';
    errors.value = {};
    try{
        const section = await api.update(props.section_id, data.value);
        emit('section-updated', section);
        modal.value?.close();
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to update section. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};

</script>

<template>
    <modal
        ref="modal"
        :id="`modal-section-${section_id}-edit`"
        title="Update Section"
        :busy="busy"
        trigger="Edit section"
        trigger-icon="edit"
        trigger-color="primary"
        @beforeopen="load"
        @close="reset"
    >
        <alert v-if="error" type="danger" v-text="error" />
        <div v-if="!loaded">Loading...</div>
        <form v-show="loaded" :id="`form-section-${section_id}-edit`" class="form form--section form--section--edit" ref="form" @submit.prevent="submit" >
            <form-field
                :id="`form-section-${section_id}-edit-name`"
                label="Section Name"
                name="name"
                v-model="data.name"
                :errors="errors?.name"
                required
                maxlength="191"
                :disabled="busy"
                autofocus
            />
        </form>
        <template #submit>
            <Button type="submit" :form="`form-section-${section_id}-edit`" :disabled="busy || !loaded">Save</Button>
        </template>
    </modal>
</template>
