<template>
    <div class="page-heading">
        <div class="page-heading__content">
            <h1 class="page-heading__title">
                <slot></slot>
            </h1>
        </div>
        <div v-if="$slots.actions" class="page-heading__actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>
