<script>
    import { Icon, PlusSmall } from "svelte-hero-icons";
    import {useForm} from "@inertiajs/svelte";
    import Modal from "./Modal.svelte";
    import FormField from "./FormField.svelte";
    import RecordForm from "@/RecordForm.svelte";

    export let section;
    export let record_id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);

    let modal;
    let form = useForm({
        name: '',
        records: [{name:'',value:'',type:'text'}],
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
        $form.post(`/${section.site_id}/section/${section.id}/data`, {preserveScroll: true, onSuccess: modal.close});
    }
</script>

<form method="post" on:submit|preventDefault={submit}>
    <Modal title="Add Record" size="xl" bind:this={modal} on:closed={() => $form.reset()}>
        <div let:open={open} slot="trigger">
            <button on:click={open} type="button" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Icon src="{PlusSmall}" class="w-5 h-5" />
                <span class="ml-2 hidden sm:inline">Add <span class="hidden md:inline">Record</span></span>
            </button>
        </div>
        <div slot="submit">
            <button type="submit"
                    disabled={$form.processing || !valid}
                    class="{valid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-400'} w-full inline-flex justify-center rounded-md border border-transparent shadow-xs px-4 py-2  text-base font-medium text-white  focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                Save
            </button>
        </div>
        <FormField
            id="{`site-${section.site_id}-${section.id}-${record_id}-name`}"
            label="Heading"
            form="{$form}"
            field="name"
            bind:value={$form.name}
            required
            maxlength="191"
            disabled={$form.processing}
        />
        <div class="mt-4">
            <RecordForm section="{section}" record_id="{record_id}" form="{form}" />
        </div>
    </Modal>
</form>
