<script lang="ts">
	import type { ComponentProps } from "svelte";
	import { Button } from "$components/ui/button/index.js";
	import { cn } from "$lib/utilities/utils";
	import CiBarLeft from "~icons/ci/bar-left";
	import { useSidebar } from "./context.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: ComponentProps<typeof Button> & {
		onclick?: (e: MouseEvent) => void;
	} = $props();

	const sidebar = useSidebar();
</script>

<Button
	data-sidebar="trigger"
	data-slot="sidebar-trigger"
	variant="ghost"
	size="icon"
	class={cn("size-7", className)}
	type="button"
	title="Toggle Sidebar"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	{...restProps}
>
	<CiBarLeft />
	<span class="sr-only">Toggle Sidebar</span>
</Button>
