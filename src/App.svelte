<script lang="ts">
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { gState } from "$lib/scripts/commands.svelte";
	import Login from "$lib/components/Login.svelte";
    import Main from "$lib/components/Main.svelte";

	const gs: GlobalState = new gState();
	onMount(() => {
		document.documentElement.classList.add("dark");
	});
</script>

<main class="flex min-h-screen">
	{#if gs.currentPage === "login" || gs.authenticated === false}
		<Login
			{gs}
			_success={() => {
				gs.currentPage = "main";
			}}
		/>
	{:else}
		<Main />
	{/if}
</main>
