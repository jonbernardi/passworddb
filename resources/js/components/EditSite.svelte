<script>
    import {Icon, PencilSquare} from "svelte-hero-icons";
    import {useForm} from '@inertiajs/svelte'
    import Modal from "./Modal.svelte";
    import FormField from "./FormField.svelte";

    export let site;

    let modal;
    let form = useForm({
        name: site.name,
        domain: site.domain,
        url: site.url,
        notes: site.notes,
    });

    function submit() {
        $form.patch(`/${site.id}`, {preserveScroll: true, onSuccess: modal.close});
    }
</script>
<form method="post" on:submit|preventDefault={submit}>
    <Modal title="Update Site" bind:this={modal} on:open={() => $form.reset()} on:closed={() => $form.reset()}>
        <div let:open={open} slot="trigger">
            <button on:click={open} type="button"
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Icon src="{PencilSquare}" class="w-5 h-5"/>
                <span class="ml-2">Edit Site</span>
            </button>
        </div>
        <div slot="submit">
            <button type="submit"
                    disabled={$form.processing}
                    class="w-full inline-flex justify-center rounded-md border border-transparent shadow-xs px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm">
                Save
            </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
            <FormField
                id="{`site-${site.id}-name`}"
                label="Name"
                form="{$form}"
                field="name"
                bind:value={$form.name}
                required
                maxlength="191"
                disabled={$form.processing}
            />
            <FormField
                label="Domain"
                id="{`site-${site.id}-domain`}"
                form="{$form}"
                field="domain"
                bind:value={$form.domain}
                maxlength="191"
                disabled={$form.processing}
            />
            <FormField
                id="{`site-${site.id}-url`}"
                type="url"
                label="Url"
                form="{$form}"
                field="url"
                bind:value={$form.url}
                maxlength="191"
                placeholder="https://"
                disabled={$form.processing}
            />
            <FormField
                id="{`site-${site.id}-notes`}"
                type="textarea"
                label="Notes"
                form="{$form}"
                field="notes"
                bind:value={$form.notes}
                rows="6"
                disabled={$form.processing}
            />
        </div>
    </Modal>
</form>
