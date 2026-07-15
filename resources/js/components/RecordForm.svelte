<script>
    import FormField from "./FormField.svelte";
    import FormSwitch from "@/FormSwitch.svelte";
    import {Icon, Trash, ArrowDown, ArrowUp, Plus} from "svelte-hero-icons";

    export let form;
    export let section;
    export let record_id = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    $: prefix = `site-${section.site_id}-${section.id}-${record_id}`;
    let type = 'text';

    function addRow() {
        let value = '';
        if (type === 'boolean') {
            value = false;
        }
        $form.records = [...$form.records, {
            type: type,
            name: '',
            value: value
        }];
        type = 'text';
    }

    function removeRow(index){
        $form.records = [...$form.records.slice(0, index), ...$form.records.slice(index + 1)];
    }

    function move(index, up = false)
    {
        const temp = $form.records[index];
        if(up){
            $form.records[index] = $form.records[index - 1];
            $form.records[index - 1] = temp;
        } else {
            $form.records[index] = $form.records[index + 1];
            $form.records[index + 1] = temp;
        }
        $form.records = $form.records;
    }

</script>
<div class="grid grid-cols-1 gap-4">
    {#each $form.records as record, index}
        <div class="flex flex-col-reverse sm:flex-row justify-between items-start">
            <div
                class="grow w-full sm:shrink grid grid-cols-1 gap-4 {record.type !== 'textarea' ? 'lg:grid-cols-2' : ''}"
            >
                <FormField
                    id="{`${prefix}-${index}-name`}"
                    label="Name"
                    form="{$form}"
                    field="name"
                    bind:value={record.name}
                    required
                    maxlength="191"
                    disabled={$form.processing}
                />
                {#if record.type === 'textarea'}
                    <FormField
                        type="textarea"
                        rows="5"
                        id="{`${prefix}-${index}-value`}"
                        label="Value"
                        form="{$form}"
                        field="value"
                        bind:value={record.value}
                        disabled={$form.processing}
                    />
                {:else if record.type === 'boolean'}
                    <FormField
                        id="{`${prefix}-${index}-value`}"
                        label="Value"
                        form="{$form}"
                        field="value"
                        bind:value={record.value}
                        disabled={$form.processing}
                    >
                        <FormSwitch id="{`${prefix}-${index}-value`}" bind:value={record.value}/>
                    </FormField>
                {:else}
                    <FormField
                        id="{`${prefix}-${index}-value`}"
                        label="Value"
                        form="{$form}"
                        field="value"
                        bind:value={record.value}
                        disabled={$form.processing}
                    />
                {/if}
            </div>
            <div class="grow-0 shrink-0 sm:ml-4 pt-8">
                <button type="button"
                        on:click={() => move(index, true)}
                        class:text-indigo-600="{index > 0}"
                        class:text-gray-400="{index === 0}"
                        disabled="{index === 0}"
                >
                    <Icon src="{ArrowUp}" class="w-5 h-5"/>
                </button>
                <button type="button"
                        on:click={() => move(index, false)}
                        class:text-indigo-600="{index < $form.records.length - 1}"
                        class:text-gray-400="{index >= $form.records.length - 1}"
                        disabled="{index >= $form.records.length - 1}"
                >
                    <Icon src="{ArrowDown}" class="w-5 h-5"/>
                </button>
                <button type="button"
                        class="text-red-700"
                        title="Remove Row"
                        on:click={() => removeRow(index)}
                >
                    <Icon src="{Trash}" class="w-5 h-5"/>
                </button>
            </div>
        </div>
    {/each}

    <div class="flex justify-end">
        <div class="mt-4 inline-flex justify-start items-stretch">

            <select bind:value="{type}"
                    class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-hidden focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-l-md">
                <option value="text">Text Input</option>
                <option value="textarea">Textarea</option>
                <option value="boolean">Boolean</option>
            </select>
            <button type="button" on:click={addRow}
                    class="inline-flex items-center whitespace-nowrap px-4 py-2 border border-transparent rounded-r-md shadow-xs text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Icon src="{Plus}" class="w-5 h-5"/>
                <span class="ml-2 hidden sm:inline">Add Row</span>
            </button>
        </div>
    </div>
</div>
