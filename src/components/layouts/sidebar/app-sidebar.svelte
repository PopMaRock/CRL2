<script lang="ts" module>
	import CiMap from "~icons/ci/map";
	import GameIconsDramaMasks from "~icons/game-icons/drama-masks";
	import GameIconsSeaDragon from "~icons/game-icons/sea-dragon";
	import GameIconsSpottedBug from "~icons/game-icons/spotted-bug";
	import GameIconsTiedScroll from "~icons/game-icons/tied-scroll";
	import GameIconsWorld from "~icons/game-icons/world";

	// This is sample data.
	const data = {
		user: {
			name: "Vince",
			class: "Warrior of Light",
			avatar: "",
		},
		navMain: [
			{
				title: "Dungeons",
				url: "",
				icon: GameIconsSeaDragon,
				isActive: true,
				items: [],
			},
			{
				title: "Chat",
				url: "/CRL/characters",
				icon: GameIconsDramaMasks,
				items: [],
			},
			{
				title: "Worlds",
				url: "",
				icon: GameIconsWorld,
				items: [],
			},
			{
				title: "Lore",
				url: "",
				icon: GameIconsTiedScroll,
				items: [],
			},
			{
				title: "Report bug",
				url: "",
				icon: GameIconsSpottedBug,
				items: [],
			},
		],
		experiences: [
			{
				name: "Cyberpunk David",
				url: "",
				icon: CiMap,
			},
			{
				name: "Coding agent",
				url: "",
				icon: CiMap,
			},
			{
				name: "Pipebomb expert",
				url: "",
				icon: CiMap,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavExperiences from "./nav-experiences.svelte";
	import NavUser from "./nav-user.svelte";
	import * as Sidebar from "$components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";
    import { goto } from "$app/navigation";

	let { ref = $bindable(null), collapsible = "icon", ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="flex items-center mt-2 cursor-pointer" onclick={() => goto("/CRL")}>
					<div class="text-sidebar-primary-foreground flex items-center w-10">
						<img src="/crl-images/icon_logo.png" class="align-center w-12" alt="Logo. Clicking it will tack ya hame" />
					</div>
					<div class="flex-1 text-left text-sm leading-tight truncate mt-1">
						<span class="truncate font-medium">&nbsp; &nbsp;CRL</span><br />
						<span class="truncate text-sm">&nbsp; &nbsp;Local Adventures</span>
					</div>
				</div>
				<!-- icon -->
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
		<NavExperiences experiences={data.experiences} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
