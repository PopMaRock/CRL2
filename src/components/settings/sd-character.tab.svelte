<script lang="ts">
  import { onMount } from "svelte";
  import Textarea from "$components/ui//textarea/textarea.svelte";
  import Label from "$components/ui/label/label.svelte";
  import * as Select from "$components/ui/select/index.js";
  import Separator from "$components/ui/separator/separator.svelte";
  import { Slider } from "$components/ui/slider";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
  import { getSdModels, getSdSamplers, getSdSchedulers, getSdWorkflows } from "$lib/controllers/sd";
  import { DungeonGameSettingsStore } from "$lib/engine/engine-dungeon";
  import { EngineSd, EngineSdCharacter, fixedParams } from "$lib/stores/sd.store";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import CiCircleHelp from "~icons/ci/circle-help";

  let models: string[] = $state([]); //array of models
  let samplers: string[] = $state([]); //array of samplers
  let schedulers: string[] = $state([]); //array of schedulers
  let workflows: string[] = $state([]); //array of workflows
  let disabled = $state(true);
  onMount(async () => {
    if (!$EngineSdCharacter) {
      await EngineSdCharacter.get($DungeonGameSettingsStore.game.id as string);
    }
    if ($EngineSdCharacter && $EngineSd?.source) {
      //@ts-expect-error
      if ($EngineSd?.[$EngineSd.source]?.validated) {
        models = (await getSdModels()) ?? [];
        samplers = (await getSdSamplers()) ?? [];
        schedulers = (await getSdSchedulers()) ?? [];
        if ($EngineSd.source === "comfy") {
          workflows = (await getSdWorkflows()) ?? [];
        }
      }
    }
  });
  disabled = !($EngineSd.webui.validated || $EngineSd.comfy.validated);

  function updateSetting(e: any, type: string) {
    if (type === "model") {
      $EngineSdCharacter.model = e;
      //if $EngineSdCharacter.model toLowerCase contains "flux" then .modelType = flux
      if ($EngineSdCharacter.model.toLowerCase().includes("flux")) {
        DebugLogger.debug("flux model");
        $EngineSdCharacter.modelType = "flux";
        $EngineSdCharacter.scale = 1.5;
      }
      //if $EngineSdCharacter.model toLowerCase contains "sd1.5" then .modelType = sd1.5
      else if ($EngineSdCharacter.model.toLowerCase().includes("sd1.5")) {
        DebugLogger.debug("sd1.5 model");
        $EngineSdCharacter.modelType = "sd1.5";
      } else if ($EngineSdCharacter.model.toLowerCase().includes("pony")) {
        DebugLogger.debug("pony model");
        $EngineSdCharacter.modelType = "pony";
      } else {
        DebugLogger.debug("sdxl model");
        $EngineSdCharacter.modelType = "sdxl"; //default to sdxl
      }
    }
    if (type === "sampler") {
      $EngineSdCharacter.sampler = e;
    }
    if (type === "scheduler") {
      $EngineSdCharacter.scheduler = e;
    }
  }
</script>

{#if $EngineSd.source === "comfy"}
  <div class="dark:variant-filled-surface rounded-md mt-2 mb-5 p-4 !pt-2">
    <Label class="label h5 pb-2 mt-4">Workflow</Label>
    <div class="grid grid-cols-[1fr_auto] items-center">
      <Select.Root type="single" name="source" onValueChange={(e) => ($EngineSdCharacter.comfy.imageWf = e)}>
        <Select.Trigger class="w-full">{$EngineSdCharacter.comfy.imageWf ?? "Select workflow..."}</Select.Trigger>
        <Select.Content>
          {#each workflows as wf}
            <Select.Item value={wf}>{wf}</Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
      <span
        title="If using your own workflow, mind add in the template tags &#123;&#123;inputImage&#125;&#125;, &#123;&#123;positivePrompt&#125;&#125; and &#123;&#123;negativePrompt&#125;&#125; tags otherwise this is all pointless."
      >
        <CiCircleHelp class="h-5 w-5" />
      </span>
    </div>
  </div>
{/if}
<div class="dark:bg-slate-900 rounded-md mt-2 mb-5 p-4 !pt-2">
  <Label class="label h5 pb-2 mt-4">Model</Label>
  <div>
    <Select.Root type="single" name="source" onValueChange={(e) => updateSetting(e, "model")}>
      <Select.Trigger class="w-full">{$EngineSdCharacter.model ?? "Select model..."}</Select.Trigger>
      <Select.Content>
        {#each models as model}
          <Select.Item value={model}>{model}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>

  <!-- add Rangesliders for scale, steps and a textboxgroup for seed (number) -->
  <div class="grid grid-cols-2 gap-4 pt-4">
    <div>
      <Label class="label h5 pb-2">CFG Scale {$EngineSdCharacter.scale ?? "NA"}</Label>
      <Slider
        type="single"
        min={fixedParams.scaleMin}
        max={$EngineSdCharacter.modelType === "flux" ? 3.5 : fixedParams.scaleMax}
        step={fixedParams.scaleStep}
        bind:value={$EngineSdCharacter.scale}
        {disabled}
      />
    </div>
    <div>
      <Label class="label h5 pb-2">Steps {$EngineSdCharacter.steps ?? "NA"}</Label>
      <Slider
        type="single"
        min={fixedParams.stepsMin}
        max={fixedParams.stepsMax}
        step={fixedParams.stepsStep}
        bind:value={$EngineSdCharacter.steps}
        {disabled}
      />
    </div>
  </div>
      <TextboxGroup
      label="Seed"
      name="seed"
      type="number"
      class="mt-2"
      {disabled}
      bind:value={$EngineSdCharacter.seed}
      placeholder="Enter seed"
      iconHelp={true}
      helpText="Seed for the model"
    />
  <div class="grid grid-cols-2 gap-4">
    <div>
      <Label class="label h5 pb-2 mt-4">Sampler</Label>
      <div>
        <Select.Root type="single" name="source" onValueChange={(e) => updateSetting(e, "sampler")}>
          <Select.Trigger class="w-full">{$EngineSdCharacter.sampler ?? "Select sampler..."}</Select.Trigger>
          <Select.Content>
            {#each samplers as sampler}
              <Select.Item value={sampler}>{sampler}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
    <div>
      <Label class="label h5 pb-2 mt-4">Scheduler</Label>
      <div>
        <Select.Root type="single" name="source" onValueChange={(e) => updateSetting(e, "scheduler")}>
          <Select.Trigger class="w-full">{$EngineSdCharacter.scheduler ?? "Select scheduler..."}</Select.Trigger>
          <Select.Content>
            {#each schedulers as scheduler}
              <Select.Item value={scheduler}>{scheduler}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>
</div>
<!--
<div class="dark:variant-filled-surface rounded-md mt-2 mb-5 p-4 !pt-2">
  <label class="label h5 pb-2">Options</label>
  {#if $EngineSd.source === "comfy"}
    <div class="text-xs text-gray-500 pb-4">
      These options will only work if you have installed the required ComfyUI
      custom nodes (open the workflow in comfy) and kept the groupings. If
      you've never run the workflows, expect slow response on first run as comfy
      downloads required models.
    </div>
  {/if}
  <div>
    <div class="grid grid-cols-2 gap-4">
      <SlideToggle
        name="sd-pulid"
        active="variant-filled-primary"
        title=""
        size="sm"
        {disabled}
        bind:checked={$EngineSdCharacter.pulid}>Pulid (Face Ref)</SlideToggle
      >
      <SlideToggle
        name="sd-instantId"
        active="variant-filled-primary"
        title=""
        size="sm"
        {disabled}
        bind:checked={$EngineSdCharacter.instantId}>Instant ID</SlideToggle
      >
      <SlideToggle
        name="sd-reference"
        active="variant-filled-primary"
        title=""
        size="sm"
        {disabled}
        bind:checked={$EngineSdCharacter.reference}>Reference</SlideToggle
      >
      <SlideToggle
        name="sd-roop"
        active="variant-filled-primary"
        title=""
        size="sm"
        {disabled}
        bind:checked={$EngineSdCharacter.roop}>Reactor (Face swap)</SlideToggle
      >
      <SlideToggle
        name="sd-freeU"
        active="variant-filled-primary"
        title=""
        size="sm"
        {disabled}
        bind:checked={$EngineSdCharacter.freeU}
        >Free U (SDXL/IL only)</SlideToggle
      >
    </div>
  </div>
</div>-->

<Separator class="hr mt-2 mb-4" />
<div class="grid grid-cols-2 gap-4">
  <Textarea
    label="Positive Prompt"
    name="positivePrompt"
    type="text"
    {disabled}
    bind:value={$EngineSdCharacter.positivePrompt}
    placeholder="Enter positive prompts"
    iconHelp={true}
    helpText="Positive prompts will be attached to the front of the SD prompt"
  />
  <Textarea
    label="Negative Prompt"
    name="negativePrompt"
    type="text"
    {disabled}
    bind:value={$EngineSdCharacter.negativePrompt}
    placeholder="Enter negative prompts"
    iconHelp={true}
    helpText="Negative prompts will be attached to the front of the SD prompt"
  />
</div>
{#if $EngineSdCharacter.modelType === "pony"}
  <Textarea
    label="Pony Addition Prompt"
    name="ponyAdd"
    type="text"
    {disabled}
    bind:value={$EngineSdCharacter.ponyAdd}
    placeholder="Enter pony tags prompts"
    iconHelp={true}
    helpText="Pony additions will be added to the front of the prompt."
  />
{/if}
