<script setup lang="ts">
import type {HTMLAttributes} from "vue";

type AlertType = 'default' | 'info' | 'warning' | 'danger' | 'success';

interface AlertProps extends /* @vue-ignore */ HTMLAttributes {
    type?: AlertType;
}

withDefaults(defineProps<AlertProps>(), {
    type: 'default',
});

</script>

<template>
    <div :class="{
        'alert': true,
        'alert--default': type === 'default',
        'alert--info': type === 'info',
        'alert--warning': type === 'warning',
        'alert--danger': type === 'danger',
        'alert--success': type === 'success',
    }" role="alert">
        <slot></slot>
        <div v-if="$slots.actions" class="alert__actions"><slot name="actions"></slot></div>
    </div>
</template>
