<script>
    import {useForm} from '@inertiajs/svelte'
    import {Icon, PlusSmall} from "svelte-hero-icons";
    import Modal from "./Modal.svelte";
    import FormField from "./FormField.svelte";

    let modal;
    let form = useForm({
        name: '',
        domain: '',
        url: '',
        notes: '',
    });

    function submit() {
        $form.post('/', {onSuccess: modal.close});
    }
</script>
<form method="post" on:submit|preventDefault={submit}>
    <Modal title="Add Site" bind:this={modal} on:closed={() => $form.reset()}>
        <div let:open={open} slot="trigger">
            <button dusk="add-site" on:click={open} type="button"
                    class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Icon src="{PlusSmall}" class="w-5 h-5"/>
                <span class="ml-2">Add site</span>
            </button>
        </div>
        <div slot="submit">
            <button dusk="add-site-save" type="submit"
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-xs px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                Save
            </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <FormField
                label="Name"
                id="site-add-name"
                form="{$form}"
                field="name"
                bind:value={$form.name}
                required
                maxlength="191"
            />
            <FormField
                label="Domain"
                id="site-add-domain"
                form="{$form}"
                field="domain"
                bind:value={$form.domain}
                maxlength="191"
            />
            <FormField
                type="url"
                label="Url"
                id="site-add-url"
                form="{$form}"
                field="url"
                bind:value={$form.url}
                maxlength="191"
                placeholder="https://"
            />
            <FormField
                type="textarea"
                label="Notes"
                id="site-add-notes"
                form="{$form}"
                field="notes"
                bind:value={$form.notes}
                rows="6"
            />
        </div>
    </Modal>
</form>
