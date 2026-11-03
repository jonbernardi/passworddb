<script setup lang="ts">

import type {Field} from "../../shared/types";
import Icon from "./Icon.vue";
import {onBeforeUnmount, ref, watch} from "vue";

const props = defineProps<{
    record: Field
}>()

const status = ref<'idle' | 'copied' | 'error'>('idle');
const copying = ref(false);
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

const resetFeedback = () => {
    clearTimeout(feedbackTimer);
    status.value = 'idle';
};

const copy = async () => {
    const value = props.record.value;
    if (typeof value !== 'string' || value === '' || copying.value) {
        return;
    }
    resetFeedback();
    copying.value = true;
    try {
        await navigator.clipboard.writeText(value);
        status.value = 'copied';
    } catch {
        status.value = 'error';
    } finally {
        copying.value = false;
        feedbackTimer = setTimeout(resetFeedback, 2000);
    }
};

watch(() => props.record.value, resetFeedback);
onBeforeUnmount(resetFeedback);
</script>

<template>
    <div
        :class="{
            'value': true,
            'value--text': record.type === 'text',
            'value--boolean': record.type === 'boolean',
            'value--textarea': record.type === 'textarea',
        }"
    >
        <template v-if="record.type === 'boolean'">
            <Icon
                :name="record.value ? 'check' : 'close'"
                :class="{'value--boolean__true': record.value, 'value--boolean__false': !record.value}"
            />
        </template>
        <template v-else>
            <span class="value__text">{{ record.value }}</span>
            <button
                v-if="record.value !== null && record.value !== ''"
                type="button"
                class="value__copy"
                :class="{'value__copy--copied': status === 'copied', 'value__copy--error': status === 'error'}"
                :aria-label="`Copy ${record.name}`"
                :title="status === 'copied' ? 'Copied!' : status === 'error' ? 'Unable to copy. Try again.' : 'Copy value'"
                :disabled="copying"
                @click="copy"
            >
                <Icon :name="status === 'copied' ? 'check' : 'copy'" />
            </button>
            <span class="sr-only" role="status">{{ status === 'copied' ? 'Copied to clipboard.' : status === 'error' ? 'Unable to copy to clipboard. Please try again.' : '' }}</span>
        </template>
    </div>
</template>
