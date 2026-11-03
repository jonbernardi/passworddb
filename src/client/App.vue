<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
import IconSprite from "./components/IconSprite.vue";
</script>
<template>
    <AppHeader />
    <main class="app-main container">
        <RouterView />
    </main>
    <IconSprite />
</template>
