<script lang="ts">
  import CharacterCard from "$components/layouts/elements/character-card.svelte";

  interface Props {
    characters: any[];
    showHidden?: boolean;
    delete: (e: any) => void;
    hideToggle: (charId: number) => void;
  }
  let {
    characters: _characters,
    showHidden: _showHidden = false,
    delete: _delete = () => {},
    hideToggle: _hideToggle = () => {},
  }: Props = $props();
</script>

{#if _characters.length === 0}
  <div class="text-center">
    <p>No characters found</p>
  </div>
{:else}
  <h1 class="text-xl font-bold mb-8 pt-4">Recently played</h1>
  <div class="grid grid-cols-1 xs:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
    {#each _characters as char, index}
      {#if !char.hidden || _showHidden}
        <CharacterCard delete={(charId: number) => _delete(charId)} {char} {index} hideToggle={(charId) => _hideToggle(charId)} />
      {/if}
    {/each}
  </div>
  <div class="mt-8">
    <button class="btn variant-filled-primary" onclick={() => (_showHidden = !_showHidden)}>
      {_showHidden ? "Hide" : "Show"} some characters
    </button>
  </div>
{/if}
