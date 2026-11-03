<script setup lang="ts">
import {icons} from '../icons';
</script>

<template>
    <svg
        class="icon-sprite"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <symbol v-for="(path, name) in icons" :id="`icon-${name}`" viewBox="0 0 24 24">
                <path
                    :d="path"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </symbol>
        </defs>
    </svg>
</template>
