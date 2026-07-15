<script>
    export let value = false;
    export let field = null;
    export let form = null;
    export let label = null;

    function clearError() {
        if (field && form && typeof form.clearErrors === 'function') {
            form.clearErrors(field);
        }
    }

    let props = {...$$restProps};
    if (props.hasOwnProperty('class')) {
        delete props.class;
    }
    $: hasErrors = !!(field && form && form.errors && form.errors[field]);
    $: classes = hasErrors ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-hidden focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500 border-gray-300';
</script>

<!-- Enabled: "bg-indigo-600", Not Enabled: "bg-gray-200" -->
<label class:bg-indigo-600={!!value} class:bg-gray-200={!value}
       class="bg-gray-200 relative inline-flex shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
    {#if label}<span class="sr-only">{label}</span>{/if}
    <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
    <span aria-hidden="true" class:translate-x-5={!!value} class:translate-x-0={!value}
          class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
    <input type="checkbox" class="hidden" data-field="{field}" value="1" bind:checked={value} on:change={clearError} {...props}/>
</label>
