<script lang="ts">
  import AppSidebar from "$lib/components/parts/app-sidebar.svelte";
  
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import GameIconsSideswipe from "~icons/game-icons/sideswipe";
  import Home from "./secondary/home.svelte";
  import { Button } from "./ui/button";
    import SheetTemplate from "./parts/sheet-template.svelte";
    import { Label } from "./ui/label";
    import { Input } from "./ui/input";

  let settingsOpen = $state(false);
</script>

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset>
    <header
      class="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear"
    >
      <div class="flex items-center gap-2 px-4">
        <Sidebar.Trigger class="-ml-1 cursor-pointer hover:text-primary" />
        <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        <span class="text-muted-foreground">Space for shit</span>
      </div>
      <div class="flex items-center px-4">
        <Button onclick={() => (settingsOpen = true)} variant="ghost">
          <GameIconsSideswipe class="hover:text-primary cursor-pointer" />
        </Button>
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
        <Home />
      </div>
      <div class="grid auto-rows-min gap-4 md:grid-cols-3">
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
        <div class="bg-muted/50 aspect-video rounded-xl"></div>
      </div>
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

<SheetTemplate bind:isOpen={settingsOpen} preventClose={true}>
  <div class="grid flex-1 auto-rows-min gap-6 px-4">
      <div class="grid gap-3">
        <Label for="name" class="text-right">Name</Label>
        <Input id="name" value="Pedro Duarte" />
      </div>
      <div class="grid gap-3">
        <Label for="username" class="text-right">Username</Label>
        <Input id="username" value="@peduarte" />
      </div>
    </div>
</SheetTemplate>
<!--
<Drawer.Root bind:open={settingsOpen}>
  <Drawer.Content>
    <div class="mx-auto w-full max-w-sm">
      <Drawer.Header>
        <Drawer.Title>Move Goal</Drawer.Title>
        <Drawer.Description>Set your daily activity goal.</Drawer.Description>
      </Drawer.Header>
      <div class="p-4 pb-0">
        <div class="flex items-center justify-center space-x-2">
          <Button variant="outline" size="icon" class="size-8 shrink-0 rounded-full" onclick={() => {}}>minus icon</Button>
          <div class="flex-1 text-center">
            <div class="text-7xl font-bold tracking-tighter">goal</div>
            <div class="text-muted-foreground text-[0.70rem] uppercase">Calories/day</div>
          </div>
          <Button variant="outline" size="icon" class="size-8 shrink-0 rounded-full" onclick={() => {}}>icon</Button>
        </div>
        <div class="mt-3 h-[120px]">
          a
          <div class="h-full w-full">b</div>
        </div>
        <Drawer.Footer>
          <Button>Submit</Button>
          <Drawer.Close class={buttonVariants({ variant: "outline" })}>Cancel</Drawer.Close>
        </Drawer.Footer>
      </div>
    </div></Drawer.Content
  >
</Drawer.Root>
-->
