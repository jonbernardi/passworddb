<script>
    import {createEventDispatcher, onDestroy} from 'svelte';
    import { fade, scale } from 'svelte/transition';

    const dispatch = createEventDispatcher();
    let isOpen = false;
    export let triggerText = 'open';
    export let id = 'modal-' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    export let dismiss = true;
    export let persistent = false;
    export let cancel = true;
    export let title = null;
    export let disabled = false;
    export let size = 'md';
    export let scrollable = false;
    let modal;

    $: width = ((size) => {
        switch(size){
            case "sm":
                return 'lg:max-w-xl md:max-w-md sm:max-w-sm';
            case "md":
                return 'lg:max-w-2xl md:max-w-lg sm:max-w-md';
            case "lg":
                return 'lg:max-w-3xl md:max-w-xl sm:max-w-lg';
            case "xl":
                return 'lg:max-w-4xl md:max-w-2xl sm:max-w-xl';
            default:
                return size;
        }
    })(size);

    $: height = scrollable  ? 'max-height:calc(100vh - 4rem)' : '';

    export function open() {
        if (disabled) return;
        dispatch('open')
        isOpen = true;
        dispatch('opened')
    }

    export function close() {
        dispatch('close')
        isOpen = false;
        dispatch('closed')
    }

    function outsideClick(e){
        if (!persistent) {
            close();
        }
    }

    const handle_keydown = e => {
        if (!dismiss || persistent) return;
        if (e.key === 'Escape') {
            close();
            return;
        }

        if (e.key === 'Tab') {
            // trap focus
            const nodes = modal.querySelectorAll('*');
            const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);

            let index = tabbable.indexOf(document.activeElement);
            if (index === -1 && e.shiftKey) index = 0;

            index += tabbable.length + (e.shiftKey ? -1 : 1);
            index %= tabbable.length;

            tabbable[index].focus();
            e.preventDefault();
        }
    };

    const previously_focused = typeof document !== 'undefined' && document.activeElement;

    if (previously_focused) {
        onDestroy(() => {
            previously_focused.focus();
        });
    }
</script>
<svelte:window on:keydown={handle_keydown}/>
<div class="inline-block">
    <slot name="trigger" open={open}>
        <button type="button" on:click="{open}"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {triggerText}
        </button>
    </slot>

    {#if isOpen}

        <div id="{id}" class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title-{id}" role="dialog"
             aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <!--
                  Background overlay, show/hide based on modal state.

                  Entering: "ease-out duration-300"
                    From: "opacity-0"
                    To: "opacity-100"
                  Leaving: "ease-in duration-200"
                    From: "opacity-100"
                    To: "opacity-0"
                -->
                <div
                    class="fixed inset-0 bg-gray-500/75 transition-opacity"
                    aria-hidden="true"
                    on:click|stopPropagation={outsideClick}
                    transition:fade={{ duration: 200 }}
                ></div>

                <!-- This element is to trick the browser into centering the modal contents. -->
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <!--
                  Modal panel, show/hide based on modal state.

                  Entering: "ease-out duration-300"
                    From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    To: "opacity-100 translate-y-0 sm:scale-100"
                  Leaving: "ease-in duration-200"
                    From: "opacity-100 translate-y-0 sm:scale-100"
                    To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                -->
                <div
                    bind:this={modal}
                    class="{width} inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6 w-full"
                    style="{height}"
                    transition:scale={{ duration: 200, start: 0.95 }}
                >
                        {#if dismiss}
                            <div class="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                                <button on:click="{close}" type="button"
                                        class="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    <span class="sr-only">Close</span>
                                    <!-- Heroicon name: outline/x -->
                                    <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                                         viewBox="0 0 24 24"
                                         stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        {/if}
                        <div>
                            <div class="w-full mt-3 text-center sm:mt-0 sm:text-left">
                                {#if title}
                                    <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-{id}">
                                        {title}
                                    </h3>
                                {/if}
                                <div class="mt-2 text-sm text-gray-500 text-left" class:overflow-y-auto={scrollable}>
                                    <slot/>
                                </div>
                            </div>
                        </div>
                        <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <slot name="actions">
                                <slot name="submit"></slot>
                                <slot name="cancel">
                                    {#if cancel}
                                        <button type="button" on:click={close}
                                                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-xs px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                            Cancel
                                        </button>
                                    {/if}
                                </slot>
                            </slot>
                        </div>
                </div>
            </div>
        </div>
    {/if}
</div>
