<script>
    export let type = 'text';
    export let value = null;
    export let field = null;
    export let form = null;
    export let full = true;

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
{#if type === 'textarea'}
    <textarea bind:value data-field="{field}" class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}"
              class:w-full={full}
              on:input={clearError}
              {...props}></textarea>
{:else if type === 'email'}
    <input type="email" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'password'}
    <input type="password" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'number'}
    <input type="number" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'search'}
    <input type="search" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'tel'}
    <input type="tel" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'url'}
    <input type="url" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'date'}
    <input type="date" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'datetime-local'}
    <input type="datetime-local" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'month'}
    <input type="month" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'week'}
    <input type="week" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else if type === 'time'}
    <input type="time" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{:else}
    <input type="text" bind:value data-field="{field}"
           class="shadow-xs block sm:text-sm rounded-md max-w-full {classes} {$$props.class || ''}" class:w-full={full}
           on:input={clearError}
           {...props}>
{/if}
