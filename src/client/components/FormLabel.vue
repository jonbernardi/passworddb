<script setup lang="ts">
import type {LabelHTMLAttributes} from 'vue';

interface FormLabelProps extends /* @vue-ignore */ LabelHTMLAttributes {
    required?: boolean;
    hideLabel?: boolean;
}

withDefaults(defineProps<FormLabelProps>(), {
    required: false,
    hideLabel: false,
});
</script>

<template>
    <label :class="{'label': true, 'sr-only': hideLabel, 'label--required': required}"><slot></slot></label>
</template>
