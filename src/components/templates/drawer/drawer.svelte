<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button, buttonVariants } from "$components/ui/button";
	import * as Drawer from "$components/ui/drawer";
	import { cn } from "$lib/utilities/utils";

	interface Props {
		isOpen: boolean;
		dismissible?: boolean;
		activeSnapPoint?: number | null;
		title?: string;
		description?: string;
		trigger?: any;
		showHeader?: boolean;
		showFooter?: boolean;
		minHeight?: string;
		class?: string;
		onClose?: () => void;
		children?: any;
		nested?: Snippet;
		nestedTitle?: string;
		nestedIsOpen?: boolean;
		nestedDismissible?: boolean;
	}
	let {
		isOpen = $bindable(false),
		dismissible = true,
		showFooter = false,
		showHeader = false,
		activeSnapPoint = $bindable(null),
		title = "Title",
		description = "Description",
		trigger = () => {},
		minHeight = "",
		class: className = "",
		children = () => {},
		nested,
		nestedTitle = "Nested Title",
		nestedIsOpen = $bindable(false),
		nestedDismissible = true,
		onClose = () => {},
	}: Props = $props();
</script>

<Drawer.Root
	bind:open={isOpen}
	bind:activeSnapPoint
	onOpenChange={() => {
		!isOpen ? onClose() : null;
	}}
	{dismissible}
>
	<Drawer.Trigger>
		{@render trigger()}
	</Drawer.Trigger>
	<Drawer.Content class={`max-h-5/6 ${minHeight} 2xl:min-h-1/6 mb-10`}>
		<div class="overflow-y-auto">
			<div class={cn("px-10 md:px-20 w-full xl:w-[80em] 2xl:w-[80em] 3xl:w-[80em] 4xl:w-[80em] mx-auto", className)}>
				{#if showHeader}
					<Drawer.Header>
						<Drawer.Title>{title}</Drawer.Title>
						<Drawer.Description>{description}</Drawer.Description>
					</Drawer.Header>
				{/if}
				<div class="px-4 flex-grow">
					{@render children()}
				</div>
				{#if nested}
					<Drawer.NestedRoot bind:open={nestedIsOpen} dismissible={nestedDismissible}>
						<Drawer.Portal>
							<Drawer.Overlay class="fixed inset-0 bg-black/40" />
							<Drawer.Content
								class="bg-accent flex flex-col rounded-t-[10px] h-full mt-24 max-h-4/6 fixed bottom-0 left-0 right-0"
							>
								<div class="p-4 rounded-t-[10px] flex-1">
									<div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8">
										<!-- Drag Handle -->
									</div>
									<div class="max-w-md mx-auto">
										{@render nested?.()}
									</div>
								</div></Drawer.Content
							>
						</Drawer.Portal>
					</Drawer.NestedRoot>
				{/if}
				{#if showFooter}
					<Drawer.Footer class="pb-20">
						<Button>Submit</Button>
						<Drawer.Close class={buttonVariants({ variant: "outline" })}>Cancel</Drawer.Close>
					</Drawer.Footer>
				{/if}
			</div>
		</div>
	</Drawer.Content>
</Drawer.Root>
