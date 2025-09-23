<script lang="ts">
  import AppSidebar from "$components/layouts/sidebar/app-sidebar.svelte";
    import EngineRightBar from "$components/settings/engine-right-bar.svelte";
  import SheetTemplate from "$components/templates/sheet-template.svelte";
  import { Button } from "$components/ui/button";
  import { Input } from "$components/ui/input";
  import { Label } from "$components/ui/label";
  import { Separator } from "$components/ui/separator/index.js";
  import * as Sidebar from "$components/ui/sidebar/index.js";
  import CiSettings from '~icons/ci/settings';

  let settingsOpen = $state(false);
  interface Props {
    children?: import("svelte").Snippet;
  }
  let { children }: Props = $props();
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
        <Button onclick={() => (settingsOpen = true)} variant="link" class="text-foreground hover:text-primary hover:animate-spin">
          <CiSettings class="" />
        </Button>
      </div>
    </header>
    <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
      {@render children?.()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>

<SheetTemplate bind:isOpen={settingsOpen} preventClose={true} showSave={false}>
  <div class="px-4">
   <EngineRightBar/>
  </div>
</SheetTemplate>
