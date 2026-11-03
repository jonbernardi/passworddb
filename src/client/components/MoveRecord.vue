<script setup lang="ts">

import Icon from "./Icon.vue";
import {DataApi} from "../services/data";
import {ref} from "vue";

interface MoveRecordProps {
    section_id: number;
    data_id: number;
    dir: 'left' | 'right';
    disabled?: boolean;
}

const props = withDefaults(defineProps<MoveRecordProps>(), {
    disabled: false,
});
const emit = defineEmits<{
    (e: 'record-moved', section_id: number, data_id: number, dir: 'left' | 'right'): void;
}>();

const api = new DataApi();
const busy = ref(false);

const submit = async () => {
    if(busy.value) return;
    busy.value = true;
    try {
        await api.move(props.section_id, props.data_id, props.dir);
        emit('record-moved', props.section_id, props.data_id, props.dir);
    } catch (e) {

    } finally {
        busy.value = false;
    }
};
</script>

<template>
    <button type="button" @click="submit" :disabled="disabled || busy"
            :class="{
                'move move--section': true,
                'move--up': dir === 'left',
                'move--down': dir === 'right',
                'move--disabled': disabled
            }"
            :title="`move ${dir}`"
    >
        <Icon :name="dir === 'left' ? 'arrow-left' : 'arrow-right'" />
    </button>
</template>
