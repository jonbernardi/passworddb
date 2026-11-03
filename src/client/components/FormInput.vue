<script setup lang="ts" generic="T extends string | number | boolean | null | undefined = string">
import {computed} from 'vue';
import FormSwitch from "./FormSwitch.vue";
import type {FormControlAttributes, FormInputType} from '../types/components';

const model = defineModel<T, string, T, string | number | boolean>({required: true});

const textModel = computed<string | number>({
    get: () => typeof model.value === 'string' || typeof model.value === 'number' ? model.value : '',
    set: value => { model.value = value; },
});

const checkedModel = computed<boolean>({
    get: () => Boolean(model.value),
    set: value => { model.value = value; },
});

interface FormInputProps extends /* @vue-ignore */ FormControlAttributes {
    type?: FormInputType;
    full?: boolean;
    invalid?: boolean;
}

const {type = 'text', full = true, invalid = false} = defineProps<FormInputProps>();

const classes = computed(() => {
    return `form-input form-input--${type}`;
});
</script>

<template>
    <textarea v-if="type === 'textarea'" v-model="textModel" :class="{[classes]: true, 'form-input--invalid': invalid, 'form-input--full': full}"></textarea>
    <select v-else-if="type === 'select'" v-model="textModel" :class="{[classes]: true, 'form-input--invalid': invalid, 'form-input--full': full}"><slot></slot></select>
    <form-switch v-else-if="type === 'switch'" v-model="checkedModel" :class="{[classes]: true, 'form-input--invalid': invalid, 'form-input--full': full}" />
    <input v-else-if="type === 'checkbox'" type="checkbox" v-model="checkedModel" :class="{[classes]: true, 'form-input--invalid': invalid, 'form-input--full': full}" />
    <input v-else v-model="textModel" :type="type" :class="{[classes]: true, 'form-input--invalid': invalid, 'form-input--full': full}" />
</template>
