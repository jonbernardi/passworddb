<script>
    import {Icon, Check, XMark} from "svelte-hero-icons";

    export let record;
</script>
<dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"
    class:whitespace-nowrap={record.type === 'text'}
    class:whitespace-pre-line={['textarea','html','markdown'].includes(record.type)}
    class:whitespace-pre={record.type === 'code'}
>
    {#if record.value !== null}
        {#if record.type === 'boolean'}
            {#if record.value}
                <Icon src="{Check}" class="w-5 h-5 text-green-400"/>
            {:else}
                <Icon src="{XMark}" class="w-5 h-5 text-red-400"/>
            {/if}
        {:else if record.type === 'html'}
            {@html record.value}
        {:else if record.type === 'markdown'}
            {record.value}
        {:else}
            {record.value}
        {/if}
    {/if}
</dd>
