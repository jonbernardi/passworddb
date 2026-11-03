<script setup lang="ts">
import Modal from "./Modal.vue";
import {ref} from "vue";
import {SiteApi} from "../services/site";
import type {SiteForm, SiteSummary} from "../../shared/types";
import Button from "./Button.vue";
import FormField from "./FormField.vue";
import Alert from "./Alert.vue";
import {FormValidationError} from "../services/base";

const props = defineProps<{site_id: number}>();

const emit = defineEmits<{updated: [site: SiteSummary]}>();

const api = new SiteApi();
const loaded = ref(false);
const busy = ref(false);
const error = ref<string | null>(null);
const errors = ref<Record<string, string[]>>({});
const data = ref<SiteForm>({
    name: '',
    domain: null,
    url: null,
    notes: null,
});
const form = ref<HTMLFormElement | null>(null);
const modal = ref<InstanceType<typeof Modal> | null>(null);

const loadSite = async () => {
    busy.value = true;
    reset();
    try {
        const site = await api.get(props.site_id);
        data.value = {
            name: site.name,
            domain: site.domain,
            url: site.url,
            notes: site.notes,
        };
        loaded.value = true;
    } catch (e) {
        error.value = 'Unable to load site. Please try again.';
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
        domain: null,
        url: null,
        notes: null,
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
        const site = await api.update(props.site_id, data.value);
        emit('updated', site);
        modal.value?.close();
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to update site. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};

</script>

<template>
<Modal
    id="modal-site-edit"
    title="Edit Site"
    ref="modal"
    :busy="busy"
    trigger="Edit Site"
    trigger-color="primary"
    trigger-icon="edit"
    @beforeopen="loadSite"
    @close="reset"
>
    <Alert v-if="error" type="danger">{{ error }}</Alert>
    <div v-if="!loaded">Loading...</div>
    <form v-show="loaded" ref="form" id="form-site-edit" class="form form--site form--site--edit" @submit.prevent="submit">
        <form-field
            :id="`form-site-${site_id}-edit-name`"
            label="Site Name"
            name="name"
            v-model="data.name"
            :errors="errors?.name"
            required
            maxlength="191"
            :disabled="busy"
            autofocus
        />
        <form-field
            :id="`form-site-${site_id}-edit-domain`"
            label="Site Domain"
            name="domain"
            v-model="data.domain"
            :errors="errors?.domain"
            maxlength="191"
            :disabled="busy"
        />
        <form-field
            type="url"
            :id="`form-site-${site_id}-edit-url`"
            label="Site Url"
            name="url"
            v-model="data.url"
            :errors="errors?.url"
            placeholder="https://"
            maxlength="191"
            :disabled="busy"
        />
        <form-field
            type="textarea"
            :id="`form-site-${site_id}-edit-notes`"
            label="Notes"
            name="notes"
            v-model="data.notes"
            :errors="errors?.notes"
            rows="6"
            :disabled="busy"
        />
    </form>

    <template #submit>
        <Button type="submit" :disabled="busy || !loaded" form="form-site-edit">Save</Button>
    </template>
</Modal>
</template>
