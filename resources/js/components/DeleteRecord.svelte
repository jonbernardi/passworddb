<script>
    import { router } from '@inertiajs/svelte'
    import { Icon, Trash, ExclamationTriangle } from "svelte-hero-icons";
    import Modal from "@/Modal.svelte";

    export let site;
    export let record;
    let modal;

    function open(){
        modal.open();
    }

    function submit(){
        router.delete(`/${site}/section/${record.section_id}/data/${record.id}`, {
            preserveScroll: true
        })
    }
</script>

<button on:click={open} type="button" class="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500">
    <!-- Heroicon name: outline/trash -->
    <Icon src="{Trash}" class="w-5 h-5 text-gray-400" />
    <span class="ml-3">Delete</span>
</button>

<Modal size="sm" bind:this={modal} dismiss="{false}">
    <div slot="trigger"></div>
    <div slot="submit">
        <button type="button"
                on:click={submit}
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-xs px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
        >
            Delete
        </button>
    </div>

    <div class="sm:flex sm:items-start">
        <div class="mx-auto shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <!-- Heroicon name: outline/exclamation -->
            <Icon src="{ExclamationTriangle}" class="h-6 w-6 text-red-600" />
        </div>
        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Delete Record
            </h3>
            <div class="mt-2">
                <p class="text-sm text-gray-500">
                    Are you sure you want to delete this record?<br>
                    All data in this record will be deleted.<br>
                    This action cannot be undone.
                </p>
            </div>
        </div>
    </div>
</Modal>
