<script lang="ts">
	import * as Avatar from "$components/ui/avatar/index.js";
	import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
	import LightSwitch from "$components/ui/light-switch/light-switch.svelte";
	import * as Sidebar from "$components/ui/sidebar/index.js";
	import { useSidebar } from "$components/ui/sidebar/index.js";
	import CiLogOut from "~icons/ci/log-out";
	import { toggleMode } from "mode-watcher";
	import StreamlinePlumpColorPorkMeat from '~icons/streamline-plump-color/pork-meat';
	let { user }: { user: { name: string; class: string; avatar: string } } = $props();
	const sidebar = useSidebar();
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatar} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.class}</span>
						</div>
						<!--<ChevronsUpDownIcon class="ml-auto size-4" />--> Icon
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? "bottom" : "right"}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.avatar} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.class}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item class="cursor-pointer">
						<StreamlinePlumpColorPorkMeat/>
						Give money and/or hugs</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<!--<DropdownMenu.Group>
					<DropdownMenu.Item>
						<CiWavyCheck />
						Account
					</DropdownMenu.Item>
				</DropdownMenu.Group>-->
				<DropdownMenu.Item class="cursor-pointer" onclick={() => toggleMode()}>
					<LightSwitch />
				</DropdownMenu.Item >
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="cursor-pointer">
					<CiLogOut />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
