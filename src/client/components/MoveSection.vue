<script setup lang="ts">

import Icon from "./Icon.vue";
import {ref} from "vue";
import {SectionApi} from "../services/section";

interface MoveSectionProps {
    site_id: number;
    section_id: number;
    dir: 'up' | 'down';
    disabled?: boolean;
}

const props = withDefaults(defineProps<MoveSectionProps>(), {
    disabled: false,
});

const emit = defineEmits<{
    (e: 'section-moved', section_id: number, dir: 'up' | 'down'): void;
}>();

const busy = ref(false);
const api = new SectionApi();

const submit = async () => {
    if(busy.value) return;
    busy.value = true;
    try {
        await api.move(props.site_id, props.section_id, props.dir);
        emit('section-moved', props.section_id, props.dir);
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
                'move--up': dir === 'up',
                'move--down': dir === 'down',
                'move--disabled': disabled
            }"
            :title="`move ${dir}`"
    >
        <Icon :name="dir === 'up' ? 'arrow-up' : 'arrow-down'" />
    </button>
</template>
