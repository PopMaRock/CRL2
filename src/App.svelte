<script lang="ts">
	import { onMount } from "svelte";
	import Login from "$lib/components/Login.svelte";
	import Main from "$lib/components/Main.svelte";
	import { gState } from "$lib/scripts/commands.svelte";

	const gs: GlobalState = new gState();
	onMount(async () => {
		document.documentElement.classList.add("dark");
		await gs.get_os(); //get OS on app start
		console.log("OS:", gs.os);
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
