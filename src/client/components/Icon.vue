<script setup lang="ts">
import type {SVGAttributes} from 'vue';
import type {IconName} from '../icons';

interface IconProps extends /* @vue-ignore */ SVGAttributes {
    name: IconName;
}

const props = defineProps<IconProps>();
</script>

<template>
    <svg class="icon" aria-hidden="true">
        <use :href="`#icon-${props.name}`" />
    </svg>
</template>
