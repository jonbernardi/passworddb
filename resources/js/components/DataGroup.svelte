<script>
    import RecordValue from "@/RecordValue.svelte";
    import DeleteRecord from "@/DeleteRecord.svelte";
    import EditRecord from "@/EditRecord.svelte";
    import MoveRecord from "@/MoveRecord.svelte";

    export let section;
    export let item;
    export let first;
    export let last;
</script>

<div class="m-4 border bg-white shadow-sm overflow-hidden sm:rounded-lg w-full md:w-auto md:min-w-[18rem] max-w-full">
    <div class="px-4 py-4 sm:px-6 bg-gray-100 flex justify-between items-center">
        <h3 class="text-lg leading-6 font-medium text-gray-900 truncate" title="{item.name}">
            {item.name}
        </h3>
        {#if !first || !last}
        <div class="flex justify-end items-center">
            <MoveRecord section="{section}" record={item} dir="left" disabled="{first}" />
            <MoveRecord section="{section}" record={item} dir="right" disabled="{last}" />
        </div>
        {/if}
    </div>
    <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl class="sm:divide-y sm:divide-gray-200 overflow-x-auto">
        {#each item.data as record}
            <div class="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt class="text-sm font-medium text-gray-500 truncate" title="{record.name}">{record.name}</dt>
                <RecordValue record="{record}" />
            </div>
        {/each}
        </dl>
    </div>
    <div class="border-t -mt-px flex divide-x divide-gray-200">
        <div class="w-0 flex-1 flex">
            <EditRecord section="{section}" record="{item}" />
        </div>
        <div class="-ml-px w-0 flex-1 flex">
            <DeleteRecord site="{section.site_id}" record="{item}" />
        </div>
    </div>
</div>
