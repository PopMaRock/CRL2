<script lang="ts">
	import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
	import { useSidebar } from "$components/ui/sidebar/context.svelte.js";
	import * as Sidebar from "$components/ui/sidebar/index.js";
	import CiArrowRightMd from "~icons/ci/arrow-right-md";
	import CiFolder from "~icons/ci/folder";
	import CiMoreHorizontal from "~icons/ci/more-horizontal";
	import CiTrashFull from "~icons/ci/trash-full";

	let {
		experiences,
	}: {
		experiences: {
			name: string;
			url: string;
			// This should be `Component` after @lucide/svelte updates types
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon: any;
		}[];
	} = $props();

	const sidebar = useSidebar();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Jump back in...</Sidebar.GroupLabel>
	<Sidebar.Menu class="gap--6">
		{#each experiences as item (item.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							<item.icon />
							<span>{item.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuAction showOnHover {...props}>
								<CiMoreHorizontal class="m-1" />
								<span class="sr-only">More</span>
							</Sidebar.MenuAction>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-48 rounded-lg"
						side={sidebar.isMobile ? "bottom" : "right"}
						align={sidebar.isMobile ? "end" : "start"}
					>
						<DropdownMenu.Item>
							<CiFolder class="text-muted-foreground" />
							<span>View Project</span>
						</DropdownMenu.Item>
						<DropdownMenu.Item>
							<CiArrowRightMd class="text-muted-foreground" />
							<span>Share Project</span>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<CiTrashFull class="text-muted-foreground" />
							<span>Delete Project</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		{/each}
		<Sidebar.MenuItem>
			<Sidebar.MenuButton class="text-sidebar-foreground/70 mt-2">
				<CiMoreHorizontal class="text-sidebar-foreground/70" />
				<span>More</span>
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Group>
