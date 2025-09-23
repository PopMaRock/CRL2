<script lang="ts">
  import { onMount, tick } from "svelte";
  import { get, writable, type Writable } from "svelte/store";
  import { Button } from "$components/ui/button";
  import SlideToggle from "$components/ui/slide-toggle/slide-toggle.svelte";
  import { llmGetModels, llmTestConnection } from "$lib/controllers/llm";
  import { CharacterSettingsStore } from "$lib/engine/engine-character";
  import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
  import { Gamemode } from "$lib/global";
  import { engineSettings } from "$lib/stores/engine";
  import { toastr } from "$lib/ui/toastr";
  import CiCircleHelp from "~icons/ci/circle-help";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import * as Select from "$components/ui/select/index.js";
    import Separator from "$components/ui/separator/separator.svelte";

  let mode = $state("game");
  let store: Writable<EngineSettings | DungeonGameSettings | CharacterSettings> = writable();
  let storeInitialized = $state(false);
  onMount(async () => {
    mode = get(Gamemode);
    if (mode === "game") {
      store = DungeonGameSettingsStore;
    } else if (mode === "character") {
      store = CharacterSettingsStore;
    } else {
      store = engineSettings;
    }
    await tick();
    if ($store) storeInitialized = true;
  });
  async function testLlmConnection(llm: string) {
    try {
      await llmTestConnection(llm);
      toastr({
        message: `Connection to ${llm} successful`,
        type: "success",
      });
    } catch (error: any) {
      console.error("Failed to connect to LLM.", error);
      toastr({
        message: `Connection to ${llm} failed: ${error}`,
        type: "error",
      });
    }
  }
  async function getModels() {
    console.log("trying to get models...");
    try {
      const result = await llmGetModels($store.llmActive);

      if (Array.isArray(result) && result.length > 0) {
        //should get an array of models so extract the modelKey and displayName return an array of value,label
        const models = result.map((model: any) => ({
          value: model.modelKey,
          label: model.displayName,
        }));
        DebugLogger.debug("Fetched models:", models);
        console.log("fetched models:", models);
        return models;
      }
      //upchuck error
      throw new Error("invalid response format");
    } catch (error: any) {
      console.error("Failed to get models.", error);
      toastr({
        message: `Failed to get models: ${error}`,
        type: "error",
      });
      throw error;
    }
  }
</script>

{#if storeInitialized}
  Provider:
  <div class="flex items-center gap-2 mt-2">
    <div class="flex-1 min-w-0">
      <Select.Root type="single" value={$store.llmActive} onValueChange={(value) => ($store.llmActive = value)}>
        <Select.Trigger class="w-full min-w-0">
          {$store.llmActive === "lmstudio" ? "LMStudio (Local)" : $store.llmActive === "deepseek" ? "DeepSeek" : "CRL Llama.cpp"}
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="lmstudio">LMStudio (Local)</Select.Item>
          <Select.Item value="deepseek">DeepSeek</Select.Item>
          <Select.Item value="internal" disabled>CRL Llama.cpp</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>
    <div class="flex-shrink-0">
      <Button onclick={async () => testLlmConnection($store.llmActive)}>Test</Button>
    </div>
  </div>
  {#if $store.llmActive === "lmstudio"}
    <div class="mt-4">
      <label for="LLMmodel">Model:</label>
      {#await getModels()}
        <p>Loading models...</p>
      {:then models}
        {#if models && models.length > 0}
          <Select.Root type="single" onValueChange={(value) => ($store.llmTextSettings.model = value)} value={$store.llmTextSettings.model}>
            <Select.Trigger class="w-full">{$store.llmTextSettings.model ?? "Select a model..."}</Select.Trigger>
            <Select.Content>
              {#each models as model}
                <Select.Item value={model.value}>{model.label}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        {:else}
          <p>No models found</p>
        {/if}
      {:catch error}
        <p class="text-red-500">Error loading models: {error.message}</p>
      {/await}
    </div>
    <Separator class="my-4"/>
    <div
      class="flex items-center"
      title="If you have limit VRAM, you can unload text models before running ComfyUI.&#013;This causes slight delay on your next message."
    >
      <SlideToggle
        name="unload-llm-model"
        active="variant-filled-primary"
        class="mt-2 mr-2"
        size="sm"
        question="Unload LLM Model before comfyUI"
        options={["on", "off"]}
        value={$store.llmTextSettings.unloadModelBeforeSd == true ? "on" : "off"}
        onchange={(value) => ($store.llmTextSettings.unloadModelBeforeSd = value === "on")}
      />
      <CiCircleHelp class="mt-2" />
    </div>
  {/if}
  {#if $store.llmActive === "deepseek"}
    No working yet...on todo list. Not sorry.
    <div class="mt-4">
      <label for="LLMapiKey">API Key:</label>
      <input type="text" name="LLMapiKey" class="input" />
    </div>
  {/if}
{/if}
