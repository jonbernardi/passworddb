<script>
    import { router } from '@inertiajs/svelte';
    import { Icon, ArrowUp, ArrowDown } from "svelte-hero-icons";

    export let section;
    export let dir;
    export let disabled;

    function submit(){
        if(disabled) return;
        router.post(`/${section.site_id}/section/${section.id}/${dir}`, {
            preserveScroll: true
        })
    }
</script>
<button type="button" on:click={submit} disabled={disabled} class:text-gray-400={disabled} class:text-indigo-700={!disabled} title={`move ${dir}`}>
    {#if dir === 'up'}
        <Icon src="{ArrowUp}" class="w-5 h-5"  />
    {:else}
        <Icon src="{ArrowDown}" class="w-5 h-5"  />
    {/if}
</button>
