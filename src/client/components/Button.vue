<script setup lang="ts">
import Icon from "./Icon.vue";
import type {ButtonAttributes, ButtonColor} from '../types/components';
import type {IconName} from '../icons';

interface ButtonProps extends /* @vue-ignore */ ButtonAttributes {
    tag?: 'a' | 'button' | 'router-link';
    type?: 'submit' | 'button' | 'reset';
    color?: ButtonColor;
    icon?: IconName;
    disabled?: boolean;
}

withDefaults(defineProps<ButtonProps>(), {
    tag: 'button',
    type: 'button',
    color: 'primary',
    disabled: false,
});

</script>

<template>
    <component
        :is="tag"
        v-bind="tag === 'button' ? {type} : {}"
        :class="{
            'button': true,
            'button--primary': color === 'primary',
            'button--secondary': color === 'secondary',
            'button--danger': color === 'danger',
            'button--success': color === 'success',
            'button--info': color === 'info',
            'button--quiet': color === 'quiet',
            'button--disabled': disabled,
        }"
        :disabled="disabled"
        :aria-disabled="disabled"
    >
        <slot name="icon">
            <template v-if="icon">
                <Icon class="button__icon" :name="icon" />
            </template>
        </slot>
        <span class="button__text"><slot /></span>
    </component>
</template>
