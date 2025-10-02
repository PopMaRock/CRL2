<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import Label from "$components/ui/label/label.svelte";
  import * as Select from "$components/ui/select/index.js";
  import Separator from "$components/ui/separator/separator.svelte";
  import SlideToggle from "$components/ui/slide-toggle/slide-toggle.svelte";
  import Slider from "$components/ui/slider/slider.svelte";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
  import { getSdUpscalers, validateSdUrl } from "$lib/controllers/sd";
  import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
  import { BASE_RESOLUTIONS, EngineSd, fixedParams, sdSources } from "$lib/stores/sd.store";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import CiCheck from "~icons/ci/check";
  import CiCloseCircle from "~icons/ci/close-circle";
    import Button from "$components/ui/button/button.svelte";

  let upscalers= $state([]); //array of upscalers
  let disabled = $state(true);
  let resolution = "512x512";
  onMount(async () => {
    if (!$EngineSd) {
      await EngineSd.get($DungeonGameSettingsStore.game.id as string);
    }
    await checkUrl();
  });
  async function checkUrl() {
    if ($EngineSd.source === "webui" || $EngineSd.source === "comfy") {
      const resp = await validateSdUrl();
      DebugLogger.debug("SD Validation", resp);
      EngineSd.update((s: any) => {
        s[s.source].validated = resp;
        return s;
      });
      if (resp) {
        upscalers = (await getSdUpscalers()) ?? [];
        disabled = false;
      } else {
        upscalers = [];
        disabled = true;
      }
    }
    DebugLogger.debug("Upscalers", upscalers);
  }
  function changeResolution(e: Event) {
    const target = e.target as HTMLSelectElement;
    const [width, height] = target.value.split("x").map(Number);
    EngineSd.update((s: any) => {
      s.width = width;
      s.height = height;
      return s;
    });
  }
</script>

<div>
  <SlideToggle
    name="sd-prompt-gen"
    active=""
    title=""
    class="mt-2"
    size="sm"
    options={["on", "off"]}
    {disabled}
    value={$EngineSd.llmPromptGen === true ? "on" : "off"}
    question="LLM Prompt Generation"
    onchange={(value: String) => {
      $EngineSd.llmPromptGen = value === "on";
    }}
  />
</div>
<div class="mb-2">
  <SlideToggle
    name="sd-edit-before-gen"
    active=""
    title=""
    class="mt-2"
    size="sm"
    {disabled}
    options={["on", "off"]}
    value={$EngineSd.editBeforeGen === true ? "on" : "off"}
    question="Edit Before SD Generation"
    onchange={(value: String) => {
      $EngineSd.editBeforeGen = value === "on";
    }}
  />
</div>
<div class="mb-2">
  <SlideToggle
    name="sd-interactive-mode"
    active=""
    title=""
    class="mt-2"
    size="sm"
    {disabled}
    options={["on", "off"]}
    question="Interactive Mode"
    value={$EngineSd.interactiveMode === true ? "on" : "off"}
    onchange={(value: String) => {
      $EngineSd.interactiveMode = value === "on";
    }}
  />
</div>

<Separator class="hr mb-4" />
<Select.Root type="single" name="source" onValueChange={(e: any) => ($EngineSd.source = e)}>
  <Select.Trigger class="w-full">{$EngineSd.source ?? "Select source..."}</Select.Trigger>
  <Select.Content>
    {#each Object.entries(sdSources) as [key, source]}
      <Select.Item value={key}>{source.toUpperCase()}</Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
{#if $EngineSd.source === "webui" || $EngineSd.source === "comfy"}
  <div class="flex items-center w-full">
    <TextboxGroup
      type="text"
      label={$EngineSd.source === "webui" ? "Webui URL" : "Comfy URL"}
      name="url"
      title={$EngineSd.source === "webui" ? "Webui URL" : "Comfy URL"}
      class="!pl-0 !pt-0 w-full"
      showTitle={false}
      bind:value={$EngineSd[$EngineSd.source].url}
      iconHelp={true}
      helpText={`The URL of the ${$EngineSd.source} server. ${
        $EngineSd.source === "webui" ? "Make sure you add --api flag to your COMMANDLINE_ARGS in Webui's webui-user.sh/.bat file!" : ""
      }`}
    />
    <Button variant="ghost" class="btn rounded" onclick={checkUrl}>
      {#if $EngineSd[$EngineSd.source].validated === true}
        <CiCheck class="w-16 text-green-500" />
      {:else}
        <CiCloseCircle class="w-16 text-destructive" />
      {/if}
    </Button>
  </div>
{/if}
<Separator />
{#if $EngineSd.source === "webui" && upscalers}
  <div class="mt-2">
    <Label for="hrUpscaler" class="label font-bold">Upscaler</Label>
    <Select.Root type="single" name="hrUpscaler">
      <Select.Trigger class="w-[180px]">{$EngineSd.hrUpscaler ?? "Select upscaler..."}</Select.Trigger>
      <Select.Content>
        {#each upscalers as upscaler}
          <Select.Item value={upscaler}>{upscaler}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
{/if}

<div class="dark:variant-filled-surface rounded-md mt-2 p-4 !pt-2">
  <div class="grid grid-cols-3 gap-4">
    <Label class="label h5 pb-2">Upscale/Hires Fixes</Label>
    <Label class="label h5 pb-2">Denoising Strength</Label>
    <Label class="label h5 pb-2">Hires Steps</Label>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <Slider
      title="Hr Scale"
      type="single"
      disabled={disabled}
      bind:value={$EngineSd.hrScale}
      min={fixedParams.hrScaleMin}
      max={fixedParams.hrScaleMax}
      step={fixedParams.hrScaleStep}
    />
    <Slider
      title="Denoising Strength"
      disabled={disabled}
      type="single"
      bind:value={$EngineSd.hrDenoisingStrength}
      max={fixedParams.denoisingStrengthMax}
      step={fixedParams.denoisingStrengthStep}
    />
    <Slider
      title="Hires Steps"
      type="single"
      disabled={disabled}
      bind:value={$EngineSd.hrSecondPassSteps}
      max={fixedParams.hrSecondPassStepsMax}
      step={fixedParams.hrSecondPassStepsStep}
    />
    </div>
    <div class="w-full mt-6">
      <SlideToggle
        name="sd-hiresFix"
        active=""
        title=""
        size="sm"
        options={["on", "off"]}
        onchange={(value: String) => {
          $EngineSd.hiresFix = value === "on";
        }}
        question="Hires Fix"
        disabled={disabled}
        value={$EngineSd.hiresFix ? "on" : "off"}/>
    </div>
</div>
<div class="dark:bg-slate-800 rounded-md mb-5 p-4 !pt-2">
  <Label class="label h5 pb-2 mt-4">Image Resolution</Label>
  <div>
    <Select.Root type="single" name="resolution" onValueChange={(e: any) => changeResolution(e)}>
      <Select.Trigger class="w-full">{$EngineSd.width}x{$EngineSd.height}</Select.Trigger>
      <Select.Content>
        {#each BASE_RESOLUTIONS as [width, height]}
          <Select.Item value={`${width}x${height}`}>{width}x{height}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
</div>

<Separator class="hr mt-2 mb-4" />
<TextboxGroup
  label="Common Positive Prompt"
  name="positivePrompt"
  type="text"
  disabled={disabled}
  bind:value={$EngineSd.positivePrompt}
  placeholder="Enter common positive prompts"
  iconHelp={true}
  helpText="Positive prompts will be attached to the front of the SD prompt"
/>
<TextboxGroup
  label="Common Negative Prompt"
  name="negativePrompt"
  class="mt-4"
  type="text"
  disabled={disabled}
  bind:value={$EngineSd.negativePrompt}
  placeholder="Enter common negative prompts"
  iconHelp={true}
  helpText="Negative prompts will be attached to the front of the SD prompt"
/>
