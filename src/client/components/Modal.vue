<script setup lang="ts">
import {useTemplateRef, computed, h, watch, nextTick} from 'vue'
import type {DialogHTMLAttributes, FunctionalComponent} from 'vue'
import Button from "./Button.vue";
import type {ButtonColor} from '../types/components';
import type {IconName} from '../icons';

defineOptions({
    inheritAttrs: false
})

const emit = defineEmits<{
    open: [event: ToggleEvent];
    close: [event: Event];
    cancel: [event: Event];
    toggle: [event: ToggleEvent];
    beforetoggle: [event: ToggleEvent];
    beforeopen: [event: ToggleEvent];
    beforeclose: [event: ToggleEvent];
}>();
const isOpen = defineModel<boolean>({default: false});

interface ModalProps extends /* @vue-ignore */ DialogHTMLAttributes {
    id: string;
    title?: string;
    scrollable?: boolean;
    dismiss?: boolean;
    persistent?: boolean;
    cancel?: boolean;
    cancelText?: string;
    disabled?: boolean;
    trigger?: string;
    triggerColor?: ButtonColor;
    triggerIcon?: IconName;
    size?: 'sm' | 'md' | 'lg' | 'xl' | string;
    busy?: boolean;
    hideTrigger?: boolean;
}

const props = withDefaults(defineProps<ModalProps>(), {
    scrollable: true,
    dismiss: true,
    persistent: false,
    cancel: true,
    cancelText: 'Cancel',
    disabled: false,
    trigger: 'Open',
    triggerColor: 'primary',
    triggerIcon: undefined,
    size: 'md',
    busy: false,
    hideTrigger: false,
});

const DialogOuter: FunctionalComponent = (_, {slots}) => {
    const children = slots.default?.();
    return props.hideTrigger ? children : h('div', {class: 'dialog__outer'}, children);
};

const width = computed((): string => {
    switch(props.size){
        case "sm":
            return 'dialog--sm';
        case "md":
            return 'dialog--md';
        case "lg":
            return 'dialog--lg';
        case "xl":
            return 'dialog--xl';
        default:
            return props.size;
    }
});

const dialog = useTemplateRef<HTMLDialogElement>('modal');

const open = () => {
    if (props.disabled) {
        return;
    }
    dialog.value?.showModal();
};

const close = () => {
    dialog.value?.close();
};

const handleCancel = (event: Event) => {
    if (props.busy) {
        event.preventDefault();
    }
    emit('cancel', event);
};

defineExpose({open, close, dialog});

watch([isOpen, dialog], ([shouldOpen, element]) => {
    if (!element || element.open === shouldOpen) {
        return;
    }
    if (shouldOpen) {
        open();
    } else {
        close();
    }
}, {flush: 'post'});

const toggle = async (event: ToggleEvent) => {
    isOpen.value = dialog.value?.open ?? event.newState === 'open';
    emit('toggle', event);
    if (event.newState === 'open') {
        emit('open', event);
        await nextTick();
        const element = dialog.value;
        // focus the first form element if necessary
        if (element?.open && !element.querySelector('[autofocus]')) {
            const control = Array.from(element.querySelectorAll<HTMLElement>(
                'form :is(input, select, textarea, a[href], summary, [tabindex], [contenteditable]):not(:disabled):not([aria-disabled="true"])',
            )).find(control => !control.matches(
                    'button, [role="button"], input:is([type="hidden"], [type="button"], [type="submit"], [type="reset"], [type="image"])',
                ) && (control.tabIndex >= 0
                    || (control.isContentEditable && !control.hasAttribute('tabindex')))
                && control.getClientRects().length > 0
                && getComputedStyle(control).visibility !== 'hidden'
                && !control.closest('[inert]'));
            control?.focus();
        }
    }
}

const beforeToggle = (event: ToggleEvent) => {
    emit('beforetoggle', event);
    if (event.newState === 'open') {
        emit('beforeopen', event);
    } else {
        emit('beforeclose', event);
    }
}

</script>

<template>
    <DialogOuter>
        <slot v-if="!hideTrigger" name="trigger" :open="open" :disabled="disabled">
            <Button type="button" @click="open" :color="triggerColor" :icon="triggerIcon" class="dialog__trigger" :disabled="disabled || busy">{{ trigger }}</Button>
        </slot>

        <dialog
            ref="modal"
            :id="id"
            :class="{
                'dialog': true,
                'dialog--scrollable': scrollable,
                'dialog--dismissable': dismiss,
                'dialog--disabled': disabled,
                'dialog--busy': busy,
                [width]: true,
            }"
            :aria-labelledby="title ? `modal-title-${id}` : undefined"
            :aria-busy="busy"
            :closedby="busy || persistent ? 'none' : 'any'"
            @cancel="handleCancel"
            @close="$emit('close', $event)"
            @toggle="toggle"
            @beforetoggle="beforeToggle"
            v-bind="$attrs"
        >
            <div class="dialog__wrapper">
                <template v-if="dismiss">
                    <div class="dialog__close">
                        <button class="dialog__close__button" @click="close" type="button" :disabled="busy">
                            <span class="sr-only">Close</span>
                            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </template>

                <div class="dialog__body">
                    <slot name="title" :id="id">
                        <template v-if="title">
                            <h3 class="dialog__title" :id="`modal-title-${id}`" v-text="title"/>
                        </template>
                    </slot>
                    <div class="dialog__content">
                        <slot/>
                    </div>
                </div>
                <div class="dialog__actions">
                    <slot name="actions">
                        <slot name="cancel" :close="close" :busy="busy">
                            <template v-if="cancel">
                                <Button type="button" color="quiet" @click="close" class="dialog__action__cancel" :disabled="busy" v-text="cancelText" />
                            </template>
                        </slot>
                        <slot name="submit" :close="close" :busy="busy"></slot>
                    </slot>
                </div>
            </div>
        </dialog>
    </DialogOuter>
</template>
