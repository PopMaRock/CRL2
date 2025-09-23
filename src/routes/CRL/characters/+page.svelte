<script lang="ts">
  import CharacterMultiColumn from "$components/layouts/parts/character-multi-column.svelte";
  import ImportCharacter from "$components/settings/character/import-character.settings.svelte";
  import NewCharacter from "$components/settings/character/new-character.settings.svelte";
  import Drawer from "$components/templates/drawer/drawer.svelte";
  import Button from "$components/ui/button/button.svelte";
  import { dbDelete, dbGet } from "$lib/controllers/db";
  import { fsDelete } from "$lib/controllers/fs";
  import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
  import { toastr } from "$lib/ui/toastr";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import { formatTimeAgo } from "$lib/utilities/utils";
  import CiAddPlus from "~icons/ci/add-plus";
  import CiCloudDownload from "~icons/ci/cloud-download";

  let characters: any[] = $state([]);
  let importCharacterIsOpen = $state(false);
  let newCharacterIsOpen = $state(false);

  async function createOwnCharacter() {
    try {
      CharacterStore.reset(); // reset character store before we proceed.
      await CharacterSettingsStore.reset(); // reset before we proceed.
    } catch (e) {
      DebugLogger.error("Error resetting character stores before creating new character", e);
    } finally {
      console.log("Opening new character drawer", $CharacterStore);
      newCharacterIsOpen = true;
    }
  }
  async function importCharacter() {
    try {
      CharacterStore.reset(); // reset character store before we proceed to import
      await CharacterSettingsStore.reset(); // reset before we proceed to import
    } catch (e) {
      DebugLogger.error("Error resetting character stores before import", e);
    } finally {
      importCharacterIsOpen = true;
    }
  }
  async function deleteCharacter(id: string) {
    if (!id) {
      throw new Error("No character ID provided");
    }
    DebugLogger.info("Delete character", id);
    try {
      const remove = await dbDelete({
        db: "CRL",
        collection: "characters",
        id,
      });
      if (!remove || remove?.error) {
        throw new Error("Failed to delete character");
      }
      //delete file system files.
      const bigDIt = await fsDelete({ mode: "characters", id });

      if (!bigDIt) {
        throw new Error("Failed to delete character files");
      }
      //show success toast
      toastr({ message: "Character deleted successfully", type: "success" });
    } catch (error: any) {
      toastr({ message: error.message || "Error deleting character", type: "error" });
      console.error("Error deleting character:", error);
      throw error;
    }
    //delete from games variable
    characters = characters.filter((character) => character.id !== id);
  }

  async function getRecentlyPlayed() {
    const data = await dbGet({ db: "CRL", collection: "characters" });
    if (!data || data?.error) return [];

    // Convert the object to an array of game objects
    const dataArray = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
    //sort by game.meta.lastPlayed DESC
    dataArray.sort((a, b) => {
      const dateA = new Date(a?.meta?.lastPlayed).getTime();
      const dateB = new Date(b?.meta?.lastPlayed).getTime();
      return dateB - dateA;
    });
    const recentlyPlayed = dataArray.map((char: any) => ({
      id: char.id,
      name: char.name,
      desc:
        char.desc && char.desc.trim() !== ""
          ? char.desc
          : "This is a filler description that only exists as an example of what things look like.",
      hidden: char?.hidden ?? false,
      lastPlayed: formatTimeAgo(char?.meta?.lastPlayed),
    }));
    DebugLogger.debug("Recent messages", recentlyPlayed);
    characters = recentlyPlayed;
  }
  async function hideToggle(e: any) {
    DebugLogger.debug("Hide toggle", e);
    const id = e.detail.id;
    const char = characters.find((char) => char.id === id);
    console.log(char);
    if (!char) return;
    char.hidden = !char.hidden;
    try {
      //FIXME: MOVE THIS TO DB CONTROLLER
      const response = await fetch("/api/data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          db: "CRL",
          collection: "characters",
          id,
          data: { hidden: char.hidden },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to hide/unhide game: ${result.toString()}`);
      }
      toastr({ message: `${char.name} ${char.hidden ? "hidden" : "unhidden"}`, type: "success" });
      //update characters
      characters = characters.map((c) => (c.id === id ? char : c));
    } catch (error) {
      DebugLogger.error("Error hiding/unhiding game:", error, { toast: true });
    }
  }
</script>

<div class="mx-16">
  <div class="flex items-center justify-between mt-10">
    <h1 class="text-4xl font-bold md:text-6xl">CHARACTERS</h1>
    <div class="md:flex sm:gap-x-2 items-center">
      <Button class="inline-flex items-center leading-6" onclick={createOwnCharacter}
        ><span class="sm:hidden xl:block">Create</span> <CiAddPlus class="w-5 ml-1" /></Button
      >
      <Button class="inline-flex items-center leading-6" onclick={importCharacter}>
        <span class="sm:hidden xl:block">Import</span>
        <CiCloudDownload class="w-5 ml-1" />
      </Button>
    </div>
  </div>
  <div class="mt-5 w-full">
    {#await getRecentlyPlayed()}
      Loading....
    {:then}
      <CharacterMultiColumn delete={(charId: string) => deleteCharacter(charId)} {characters} {hideToggle} />
    {/await}
  </div>
</div>
<Drawer
  dismissible={false}
  class="!w-[50em] min-h-[100em]"
  title="Create a new cunt"
  description=""
  bind:isOpen={newCharacterIsOpen}
  nestedTitle=""
  nestedDismissible={false}
>
  <NewCharacter
    close={() => (newCharacterIsOpen = false)}
    created={async () => {
      newCharacterIsOpen = false;
      await getRecentlyPlayed();
    }}
  />
  <!-- 	bind:nestedIsOpen={showAddCommodity} {#snippet nested()} ... {/snippet}-->
</Drawer>
<Drawer
  dismissible={false}
  title="Import Cunt"
  description=""
  bind:isOpen={importCharacterIsOpen}
  nestedTitle=""
  nestedDismissible={false}
>
  <ImportCharacter
    close={() => (importCharacterIsOpen = false)}
    created={async () => {
      importCharacterIsOpen = false;
      await getRecentlyPlayed();
    }}
  />
  <!-- 	bind:nestedIsOpen={showAddCommodity} {#snippet nested()}
  ... {/snippet}-->
</Drawer>
