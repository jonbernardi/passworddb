<script setup lang="ts">
import type {InputHTMLAttributes} from 'vue';

defineOptions({
    inheritAttrs: false
})
interface FormSwitchProps extends /* @vue-ignore */ Omit<InputHTMLAttributes, 'type' | 'value' | 'checked'> {
    label?: string;
}

defineProps<FormSwitchProps>();

const value = defineModel<boolean>({required: true});

</script>

<template>
    <label :class="{
        'form-switch': true,
        'form-switch--checked': !!value,
        'form-switch--unchecked': !value,
    }">
        <span v-if="label" class="sr-only form-switch__label" v-text="label" />
        <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
        <span aria-hidden="true" class="form-switch__icon"></span>
        <input type="checkbox" class="form_switch__checkbox" value="1" v-model="value" v-bind="$attrs" />
    </label>
</template>
