<script>
    import { router } from '@inertiajs/svelte';
    import { Icon, ArrowLeft, ArrowRight } from "svelte-hero-icons";

    export let section;
    export let record;
    export let dir;
    export let disabled;

    function submit(){
        if(disabled) return;
        router.post(`/${section.site_id}/section/${section.id}/data/${record.id}/${dir}`, {
            preserveScroll: true
        })
    }
</script>
<button type="button" on:click={submit} disabled={disabled} class:text-gray-400={disabled} class:text-indigo-700={!disabled} title={`move ${dir}`}>
    {#if dir === 'left'}
        <Icon src="{ArrowLeft}" class="w-5 h-5"  />
    {:else}
        <Icon src="{ArrowRight}" class="w-5 h-5"  />
    {/if}
</button>
