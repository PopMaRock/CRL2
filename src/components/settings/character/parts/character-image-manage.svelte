<script lang="ts">
  import { CharacterStore } from "$lib/engine/engine-character";

  const { imageSrc=$bindable(), children } = $props();
</script>

<div class="snap-x snap-mandatory scroll-smooth flex w-full rounded-lg overflow-hidden relative group">
  <!-- svelte-ignore a11y_missing_attribute -->
  <img
    class="snap-end object-cover w-full h-[25vh] flex-shrink-0 transition-opacity duration-200 group-hover:opacity-0"
    src={imageSrc.endsWith(".png") ? `/api/filesystem/images?id=${$CharacterStore.charId}&mode=characters&filename=${imageSrc}` : imageSrc}
    loading="lazy"
  />
  <div
    class="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-90 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
  >
    <div class="whitespace-pre-wrap">
      {@render children()}
    </div>
  </div>
</div>
