<script lang="ts">
import "../app.css";
import { ModeWatcher } from "mode-watcher";
import { fade } from "svelte/transition";
import { navigating } from "$app/stores";
import { Toaster } from "$components/ui/sonner/";
import type { LayoutData } from "./$types";

interface Props {
	data: LayoutData|any;
	children?: import("svelte").Snippet;
}
let { data, children }: Props = $props();
console.log("Layout data:", data);
</script>
<ModeWatcher />
<Toaster position="bottom-right" richColors />
 {#key data.url}
      <div
        in:fade={{ duration: 300, delay: 300 }}
        out:fade={{ duration: 300 }}
      >
        {#if $navigating}
          <!-- LOOK HERE -->
          <div class="m-8">
            <h1 class="text-3xl text-center text-cText">L O A D I N G...</h1>
          </div>
        {:else}
          {@render children?.()}
        {/if}
      </div>
    {/key}

