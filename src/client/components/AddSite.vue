<script setup lang="ts">

import Modal from "./Modal.vue";
import Button from "./Button.vue";
import {ref} from "vue";
import FormField from "./FormField.vue";
import Alert from "./Alert.vue";
import {SiteApi} from "../services/site";
import type {SiteForm} from "../../shared/types";
import {useRouter} from "vue-router";
import {FormValidationError} from "../services/base";

const router = useRouter();
const busy = ref(false);
const form = ref<SiteForm>({
    name: '',
    domain: null,
    url: null,
    notes: null,
});
const error = ref('');
const errors = ref<Record<string, string[]>>({});
const api = new SiteApi();

const submit = async () => {
    if(busy.value){
        return;
    }
    busy.value = true;
    error.value = '';
    errors.value = {};
    try {
        const site = await api.add(form.value);
        router.push({name: 'site', params: { id: site.id }})
    } catch (cause) {
        if (cause instanceof FormValidationError) {
            error.value = cause.message;
            errors.value = cause.fields;
        } else {
            error.value = 'Unable to add site. Please try again.';
        }
    } finally {
        busy.value = false;
    }
};
</script>

<template>
<modal
    id="modal-site-add"
    title="Add Site"
    :busy="busy"
    trigger="Add site"
    trigger-icon="plus"
>
    <form id="form-site-add" class="form form--site form--site--add" @submit.prevent="submit" >
        <Alert v-if="error" type="danger">{{ error }}</Alert>
        <form-field
            id="form-site-add-name"
            label="Site Name"
            name="name"
            v-model="form.name"
            :errors="errors?.name"
            required
            maxlength="191"
            autofocus
        />
        <form-field
            id="form-site-add-domain"
            label="Site Domain"
            name="domain"
            v-model="form.domain"
            :errors="errors?.domain"
            maxlength="191"
        />
        <form-field
            id="form-site-add-url"
            label="Site URL"
            type="url"
            name="url"
            v-model="form.url"
            :errors="errors?.url"
            maxlength="191"
        />
        <form-field
            id="form-site-add-notes"
            label="Notes"
            type="textarea"
            name="notes"
            v-model="form.notes"
            :errors="errors?.notes"
            rows="6"
        />
    </form>
    <template #submit>
        <Button type="submit" form="form-site-add">Save</Button>
    </template>
</modal>
</template>
