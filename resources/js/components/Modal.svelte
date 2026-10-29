<script>
    import {createEventDispatcher, tick} from 'svelte';

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

    let pointerStartedOnBackdrop = false;

    export async function open() {
        if (disabled || isOpen) return;
        dispatch('open');
        isOpen = true;
        await tick();
        if (!isOpen || !modal?.isConnected) return;
        modal.showModal();
        dispatch('opened');
    }

    export function close() {
        if (!isOpen) return;
        dispatch('close');
        modal.close();
        isOpen = false;
        dispatch('closed');
    }

    function handleClose() {
        // Also handle a dialog closed directly through the native API.
        if (modal.open || !isOpen) return;
        dispatch('close');
        isOpen = false;
        dispatch('closed');
    }

    function handleCancel(event) {
        event.preventDefault();
        if (dismiss && !persistent) close();
    }

    function isBackdrop(event) {
        if (event.target !== modal) return false;
        const rect = modal.getBoundingClientRect();
        return event.clientX < rect.left || event.clientX > rect.right
            || event.clientY < rect.top || event.clientY > rect.bottom;
    }

    function outsideClick(event) {
        if (pointerStartedOnBackdrop && isBackdrop(event) && !persistent) {
            event.stopPropagation();
            close();
        }
        pointerStartedOnBackdrop = false;
    }

</script>
<div class="inline-block">
    <slot name="trigger" open={open}>
        <button type="button" on:click="{open}"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            {triggerText}
        </button>
    </slot>

    <dialog
        bind:this={modal}
        {id}
        aria-labelledby={title ? `modal-title-${id}` : undefined}
        class="{width} m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-lg bg-white p-0 text-left shadow-xl backdrop:bg-gray-500/75"
        on:cancel={handleCancel}
        on:close={handleClose}
        on:pointerdown={(event) => pointerStartedOnBackdrop = isBackdrop(event)}
        on:click={outsideClick}
    >
        {#if isOpen}
            <div class="relative px-4 pt-5 pb-4 sm:p-6" class:flex={scrollable} class:flex-col={scrollable}
                 style={scrollable ? 'max-height:calc(100dvh - 2rem)' : undefined}>
                {#if dismiss}
                    <div class="absolute top-0 right-0 pt-4 pr-4">
                        <button on:click={close} type="button"
                                class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span class="sr-only">Close</span>
                            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                {/if}
                <div class="mt-3 min-h-0 w-full text-center sm:mt-0 sm:text-left"
                     class:flex={scrollable} class:flex-col={scrollable}>
                    {#if title}
                        <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-{id}">
                            {title}
                        </h3>
                    {/if}
                    <div class="mt-2 text-left text-sm text-gray-500" class:overflow-y-auto={scrollable}>
                        <slot/>
                    </div>
                </div>
                <div class="mt-5 shrink-0 sm:mt-4 sm:flex sm:flex-row-reverse">
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
        {/if}
    </dialog>
</div>
