<script setup lang="ts" generic="T extends string | number | boolean | null | undefined = string">

import {computed, useAttrs, useId, useSlots} from "vue";
import FormInput from "./FormInput.vue";
import FormLabel from "./FormLabel.vue";
import type {FormControlAttributes, FormInputType} from '../types/components';

defineOptions({
    inheritAttrs: false
})

interface FormFieldProps extends /* @vue-ignore */ FormControlAttributes {
    id?: string;
    label?: string;
    help?: string;
    hideLabel?: boolean;
    required?: boolean;
    errors?: string | string[];
    type?: FormInputType;
}

const props = defineProps<FormFieldProps>();
const value = defineModel<T>({required: true});

const uniqueId = useId();
const uid = computed(() => props.id || uniqueId);
const slots = useSlots();
const attrs = useAttrs();
const hasErrors = computed(() => Boolean(props.errors?.length));

function hasLabel(): boolean {
    return !props.hideLabel && Boolean(props.label?.trim() || slots.label);
}

function describedBy(): string | undefined {
    const ids = [
        attrs['aria-describedby'],
        hasErrors.value || slots.errors ? `${uid.value}-errors` : undefined,
        props.help || slots.help ? `${uid.value}-description` : undefined,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
}

</script>

<template>
    <div :class="{'field': true, 'field--invalid': hasErrors}">
        <slot name="label" :uid="uid">
            <template v-if="label">
                <FormLabel
                    :for="uid"
                    :required="required"
                    :hide-label="hideLabel"
                    class="field__label"
                >{{ label }}</FormLabel>
            </template>
        </slot>
        <div :class="{'field__element': true, 'field_element--has-label': hasLabel()}">
            <slot :id="uid" :describedby="describedBy()">
                <FormInput
                    v-bind="$attrs"
                    :id="uid"
                    :type="type"
                    :class="{'field__input': true, 'field__input--invalid': hasErrors}"
                    v-model="value"
                    :required="required"
                    :invalid="hasErrors"
                    :aria-invalid="hasErrors || undefined"
                    :aria-describedby="describedBy()"
                ><slot name="options"></slot></FormInput>
            </slot>
        </div>
        <slot name="errors" :uid="uid" :id="`${uid}-errors`">
            <div v-if="hasErrors" class="field__errors" :id="`${uid}-errors`">
                <template v-if="Array.isArray(errors)">
                    <div
                        v-for="(error, index) in errors"
                        :key="index"
                        class="field__errors__message"
                        v-text="error"
                    />
                </template>
                <template v-else>{{ errors }}</template>
            </div>
        </slot>
        <slot name="help" :id="`${uid}-description`" :uid="uid">
            <template v-if="help">
                <div class="field__help" :id="`${uid}-description`" v-text="help" />
            </template>
        </slot>
    </div>
</template>
