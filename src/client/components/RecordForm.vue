<script setup lang="ts">

import Icon from "./Icon.vue";
import Button from "./Button.vue";
import FormField from "./FormField.vue";
import Alert from "./Alert.vue";
import type {Field} from "../../shared/types";
import {ref, shallowRef, watch} from "vue";

const records = defineModel<Field[]>({required: true});

const props = withDefaults(defineProps<{
    prefix: string;
    disabled?: boolean;
    errors?: Record<string, string[]>;
}>(), {disabled: false, errors: () => ({})});

type RowErrors = Partial<Record<'name' | 'value' | 'type' | 'row', string[]>>;
const rowErrors = shallowRef(new WeakMap<Field, RowErrors>());

// Associate response indices with row objects once, so errors follow rows when moved.
watch(() => props.errors, (errors) => {
    const mapped = new WeakMap<Field, RowErrors>();
    records.value.forEach((record, index) => {
        const path = `data.${index}`;
        mapped.set(record, {
            name: errors[`${path}.name`],
            value: errors[`${path}.value`],
            type: errors[`${path}.type`],
            row: errors[path],
        });
    });
    rowErrors.value = mapped;
}, {immediate: true});

const fieldErrors = (record: Field): RowErrors => rowErrors.value.get(record) ?? {};

const type = ref<Field['type']>('text');

const addRow = () => {
    if (props.disabled) {
        return;
    }
    if (type.value === 'boolean') {
        records.value.push({name: '', type: 'boolean', value: false});
    } else {
        records.value.push({name: '', type: type.value, value: null});
    }
};

const move = (index: number, direction: 'up' | 'down') => {
    const siblingIndex = index + (direction === 'up' ? -1 : 1);
    if (props.disabled || index < 0 || index >= records.value.length
        || siblingIndex < 0 || siblingIndex >= records.value.length) {
        return;
    }
    [records.value[index], records.value[siblingIndex]] = [records.value[siblingIndex], records.value[index]];
};
const removeRow = (index: number) => {
    if (props.disabled) {
        return;
    }
    records.value.splice(index, 1);
};

</script>

<template>
    <div class="records">
        <Alert v-if="errors.data?.length" type="danger">
            <div v-for="message in errors.data" :key="message">{{ message }}</div>
        </Alert>
        <div v-for="(record, index) in records" :key="`${prefix}-item-${index}`" class="record">
            <div class="record__fields">
                <Alert v-if="fieldErrors(record).row || fieldErrors(record).type" type="danger">
                    <div v-for="message in [...(fieldErrors(record).row ?? []), ...(fieldErrors(record).type ?? [])]" :key="message">{{ message }}</div>
                </Alert>
                <form-field
                    :id="`${prefix}-${index}-name`"
                    label="Name"
                    v-model="record.name"
                    :errors="fieldErrors(record).name"
                    required
                    maxlength="191"
                    :disabled="disabled"
                />
                <form-field
                    v-if="record.type === 'textarea'"
                    type="textarea"
                    rows="5"
                    :id="`${prefix}-${index}-value`"
                    label="Value"
                    v-model="record.value"
                    :errors="fieldErrors(record).value"
                    :disabled="disabled"
                />
                <form-field
                    v-else-if="record.type === 'boolean'"
                    type="switch"
                    :id="`${prefix}-${index}-value`"
                    label="Value"
                    v-model="record.value"
                    :errors="fieldErrors(record).value"
                    :disabled="disabled"
                />
                <form-field
                    v-else
                    :id="`${prefix}-${index}-value`"
                    label="Value"
                    v-model="record.value"
                    :errors="fieldErrors(record).value"
                    :disabled="disabled"
                />
            </div>
            <div class="record__actions">
                <button type="button"
                    @click="() => move(index, 'up')"
                    :disabled="disabled || index === 0"
                >
                    <Icon name="arrow-up" />
                </button>
                <button type="button"
                        @click="() => move(index, 'down')"
                        :disabled="disabled || index >= records.length - 1"
                >
                    <Icon name="arrow-down" />
                </button>
                <button type="button"
                        class="text-red-700"
                        title="Remove Row"
                        :disabled="disabled"
                        @click="() => removeRow(index)"
                >
                    <Icon name="trash" />
                </button>
            </div>
        </div>

        <div class="records_add">
            <form-field type="select" label="Field Type" hide-label v-model="type" :disabled="disabled">
                <template #options>
                    <option value="text">Text Input</option>
                    <option value="textarea">Textarea</option>
                    <option value="boolean">Boolean</option>
                </template>
            </form-field>
            <Button type="button" color="success" @click="addRow" icon="plus" :disabled="disabled">Add row</Button>
        </div>
    </div>

</template>
