<script setup lang="ts">
import Modal from "./Modal.vue";
import {ref} from "vue";
import Button from "./Button.vue";
import {useRouter} from "vue-router";
import Alert from "./Alert.vue";
import {SiteApi} from "../services/site";


const props = defineProps<{site_id: number}>();

const router = useRouter();
const busy = ref(false);
const error = ref("");
const api = new SiteApi();

const submit = async () => {
    try {
        busy.value = true;
        error.value = '';
        await api.delete(props.site_id);
        router.push({name: "sites"});
    } catch (e) {
        error.value = 'An error occurred while deleting the site.';
        busy.value = false;
    }
};

</script>

<template>
    <Modal
        id="delete-site-modal"
        title="Delete site"
        size="sm"
        trigger="Delete site"
        trigger-icon="trash"
        triggerColor="danger"
        :busy="busy"
        @beforeopen="error = ''"
    >
        <form id="form-site-delete" @submit.prevent="submit">
            <p>
                Are you sure you want to delete this site?<br>
                All data for this site will be lost.<br>
                This action cannot be undone.
            </p>
            <alert v-if="error" type="danger" v-text="error" />
        </form>

        <template #submit>
            <Button type="submit" form="form-site-delete" color="danger" :disabled="busy">
                Delete
            </Button>
        </template>
    </Modal>
</template>
