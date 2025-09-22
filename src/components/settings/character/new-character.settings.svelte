<script lang="ts">
  import { onMount, tick } from "svelte";
  import CharacterImages from "$components/settings/character/character-image.tab.svelte";
  import CharacterSettings from "$components/settings/character/character-settings.tab.svelte";
  import SettingsSdBase from "$components/settings/sd-base.tab.svelte";
  import SettingsSdCharacter from "$components/settings/sd-character.tab.svelte";
  import DrawerWrapper from "$components/templates/drawer/drawer-wrapper.svelte";
  import * as Tabs from "$components/ui/tabs/index.js";
  import { dbUpdate } from "$lib/controllers/db";
  import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
  import { EngineConversation } from "$lib/engine/engine-conversation";
  import { Gamemode } from "$lib/global";
  import { EngineSd, EngineSdCharacter } from "$lib/stores/sd.store";
  import { toastr } from "$lib/ui/toastr";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import { calculateHash } from "$lib/utilities/utils";
  import LlmSettings from "../llm.tab.svelte";
  import LlmResponseSettings from "../llm-response.tab.svelte";

  interface Props {
    close?: any;
    created?: any;
  }
  const { close: _close, created: _created }: Props = $props();

  let loading = $state(false);
  onMount(async () => {
    DebugLogger.debug("New Character/Cunt");
    // Remove focus from any element to stop wanky default focuses on buttons.
    (document.activeElement as HTMLElement)?.blur();
    Gamemode.set("characters");
  });
  //build game folder and files
  //start game
  let showSdCharacter = $state(false);
  //set showSdCharacter to true if $EngineSd[$EngineSd.source].validated is true
  $effect(() => {
    try {
      //@ts-expect-error
      if ($EngineSd?.[$EngineSd.source]?.validated === true) {
        console.log("SD validated");
        DebugLogger.debug("SD validated");
        showSdCharacter = true;
        return;
      }
    } catch (e) {
      // ignore any transient access errors
    }
    showSdCharacter = false;
  });
  //CREATE CHARACTER
  async function positiveClicked() {
    //basic check on essentials.
    if (
      //!$DungeonGameSettingsStore.game.genre ||
      !$CharacterStore.name ||
      //!$DungeonGameSettingsStore.game.description ||
      !$CharacterStore.description ||
      !$CharacterSettingsStore.llmTextSettings.prompt
    ) {
      DebugLogger.debug("Missing essentials");
      toastr({
        message: "Missing essentials. Re-check form",
        type: "error",
      });
      return;
    }
    //generate a unique id
    const characterId = Math.random().toString(36).slice(2, 11);
    if (!characterId) return DebugLogger.error("Character ID not generated", { toast: true });
    //add to database of characters
    try {
      $CharacterSettingsStore.charId = characterId;
      $CharacterStore.charId = characterId;
      await CharacterSettingsStore.save(); //save settings
      await CharacterStore.save(); //save character
      await tick(); //wait for stores to update
      DebugLogger.debug("Character created", $CharacterStore);
      await dbUpdate({
        db: "CRL",
        collection: "characters",
        id: $CharacterStore.charId,
        data: {
          name: $CharacterStore.name,
          desc: $CharacterStore.description ?? "",
          hidden: false,
          meta: { created: Date.now(), lastPlayed: Date.now() },
        },
      });
      //Push opening into EngineConversation
      const firstMsg = {
        role: "assistant",
        content: $CharacterStore.firstMsg ?? "Hey.",
        meta: { timestamp: Date.now(), hasAudio: false },
        type: "text",
        hash: calculateHash($CharacterStore.firstMsg),
        transacting: false,
      };
      EngineConversation.set([firstMsg]);
      EngineConversation.put(firstMsg);
      //Save SD settings
      if ($CharacterStore.sd) {
        await EngineSd.save($CharacterStore.charId);
        await EngineSdCharacter.save($CharacterStore.charId);
      }
      toastr({
        message: "Character created",
        type: "success",
      });
      if (_created) _created();
    } catch (e) {
      console.error(e);
      toastr({
        message: "Error creating character -- check console",
        type: "error",
      });
      return;
    }
  }
</script>

<DrawerWrapper
  class="overflow-y-auto h-full"
  showSave={true}
  showClose={true}
  title={`New Cunt`}
  onclose={() => {
    if (_close) _close();
  }}
  onsave={async ()=>await positiveClicked}
  saveBtnText={"Add"}
>
  <Tabs.Root value="basic" class="h-full w-full flex flex-col" >
    <Tabs.List class="w-full">
      <Tabs.Trigger value="basic" class="cursor-pointer">Basic</Tabs.Trigger>
      <Tabs.Trigger value="images" class="cursor-pointer">Images</Tabs.Trigger>
      <Tabs.Trigger value="sdbase" class="cursor-pointer">SD Base</Tabs.Trigger>
      {#if showSdCharacter}
        <Tabs.Trigger value="sdcharacter" class="cursor-pointer">SD Character</Tabs.Trigger>
      {/if}
      <Tabs.Trigger value="llmsettings" class="cursor-pointer">LLM Settings</Tabs.Trigger>
      <Tabs.Trigger value="llmresponse" class="cursor-pointer">LLM Response</Tabs.Trigger>
    </Tabs.List>
    <Tabs.Content value="basic"><CharacterSettings /></Tabs.Content>
    <Tabs.Content value="images"><CharacterImages /></Tabs.Content>
    <Tabs.Content value="sdbase"><SettingsSdBase /></Tabs.Content>
    <Tabs.Content value="sdcharacter"><SettingsSdCharacter /></Tabs.Content>
    <Tabs.Content value="llmsettings"><LlmSettings engineSettings={CharacterSettingsStore} /></Tabs.Content>
    <Tabs.Content value="llmresponse"><LlmResponseSettings engineSettings={CharacterSettingsStore} /></Tabs.Content>
  </Tabs.Root>
</DrawerWrapper>
