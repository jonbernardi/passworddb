<script>
    import { Icon, PencilSquare } from "svelte-hero-icons";
    import {useForm} from "@inertiajs/svelte";
    import Modal from "./Modal.svelte";
    import FormField from "./FormField.svelte";
    import RecordForm from "@/RecordForm.svelte";

    export let section;
    export let record;

    let modal;
    let form = useForm({
        name: record.name,
        records: [...record.data],
    });

    $: valid = (($form) => {
        if($form.name === '') return false;
        if($form.records.length === 0) return false;
        if($form.records.map(record => {
            if(record.name == '') return false;
        }).includes(false)) return false;

        return true;
    })($form);

    function submit() {
        if(!valid || $form.processing) return;
        $form.patch(`/${section.site_id}/section/${record.section_id}/data/${record.id}`, {preserveScroll: true, onSuccess: modal.close});
    }
</script>
<button type="button" on:click={modal.open} class="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500">
    <!-- Heroicon name: outline/pencil-alt -->
    <Icon src="{PencilSquare}" class="w-5 h-5 text-gray-400" />
    <span class="ml-3">Edit</span>
</button>

<form method="post" on:submit|preventDefault={submit}>
    <Modal title="Update Record" size="xl" bind:this={modal} on:closed={() => $form.reset()}>
        <div slot="trigger"></div>
        <div slot="submit">
            <button type="submit"
                    disabled={$form.processing || !valid}
                    class="{valid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400'} w-full inline-flex justify-center rounded-md border border-transparent shadow-xs px-4 py-2  text-base font-medium text-white  focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                Save
            </button>
        </div>
        <FormField
            id="{`site-${section.site_id}-${record.section_id}-${record.id}-name`}"
            label="Heading"
            form="{$form}"
            field="name"
            bind:value={$form.name}
            required
            maxlength="191"
            disabled={$form.processing}
        />
        <div class="mt-4">
            <RecordForm section="{section}" record_id="{record.id}" form="{form}" />
        </div>
    </Modal>
</form>
