<script lang="ts">
  import { onMount } from "svelte";
  import { type Writable } from "svelte/store";
  import * as Accordion from "$components/ui/accordion/index.js";
  import SlideToggle from "$components/ui/slide-toggle/slide-toggle.svelte";
  import Slider from "$components/ui/slider/slider.svelte";
  import Textarea from "$components/ui/textarea/textarea.svelte";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
    import { Label } from "$components/ui/label";
  export let engineSettings: Writable<DungeonGameSettings | CharacterSettings | EngineSettings>;
  let tokens: Uint32Array | undefined;
  onMount(async () => {
    //we need to set up $engineSettings which can be DungeonGame$engineSettings or Character$engineSettings
    //but it needs to operate and push values back to the correct store
  });
  function setUpReasoning() {
    engineSettings.update((settings) => {
      settings.llmTextSettings.reasoning = !settings.llmTextSettings.reasoning;
      if (settings.llmTextSettings.reasoning && !settings.llmResponseSettings.stream) {
        settings.llmResponseSettings.stream = true;
        settings.llmResponseSettings.maxTokens = null;
        settings.llmResponseSettings.customStopStrings = null;
        settings.llmResponseSettings.sequenceBreakers = null;
        settings.llmResponseSettings.cleanUpText = false;
        settings.llmResponseSettings.userNameAsStop = false;
      }
      return settings;
    });
  }
</script>

<div class="text-lg ml-1 mt-5">
  Initial prompt will use {tokens?.length ?? 0} tokens
</div>

<div class="dark:variant-filled-surface pl-2 mt-4 mb-4 rounded-md">
  <TextboxGroup
    label="Limit Context"
    name="limitContext"
    type="number"
    bind:value={$engineSettings.llmTextSettings.limitContext}
    placeholder="4096"
    iconHelp={true}
    helpText="The context length to use. Context will be cut to this length."
  />
</div>
<SlideToggle
  name="reasoning"
  active="variant-filled-primary"
  class="mt-4 mb-4"
  size="sm"
  value={$engineSettings.llmResponseSettings.reasoning ? "on" : "off"}
  options={["on", "off"]}
  question="Reasoning"
  onchange={(value) => {
    $engineSettings.llmResponseSettings.reasoning = value === "on";
    setUpReasoning();
  }}/>
<Label class="label h5 pb-2 mt-4">Temperature ({$engineSettings.llmTextSettings.temperature})</Label>
<Slider type="single" title="Temperature" bind:value={$engineSettings.llmTextSettings.temperature} max={1} step={0.1} />
<div class="grid grid-cols-2 gap-2">
  <Label class="label h5 mt-4">Top P ({$engineSettings.llmTextSettings.p.top})</Label>
  <Label class="label h5 mt-4">Top K ({$engineSettings.llmTextSettings.topK})</Label>
  <Slider title="TopP" type="single" bind:value={$engineSettings.llmTextSettings.p.top} max={1} step={0.05} />
  <Slider title="TopK" type="single" bind:value={$engineSettings.llmTextSettings.topK} max={100} step={1} />
  <Label class="label h5 mt-4">Penalty Presence ({$engineSettings.llmTextSettings.penalty.presence})</Label>
  <Label class="label h5 mt-4">Penalty Frequency ({$engineSettings.llmTextSettings.penalty.frequency})</Label>
  <Slider title="Presence Penalty" type="single" bind:value={$engineSettings.llmTextSettings.penalty.presence} max={2} step={0.1} />
  <Slider title="Frequency Penalty" type="single" bind:value={$engineSettings.llmTextSettings.penalty.frequency} max={2} step={0.1} />
</div>
<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>AI Prompt</Accordion.Trigger>
    <Accordion.Content>
      <Textarea
        name="prompt"
        title="AI Prompt"
        label="AI Prompt"
        additionalClasses="!text-xs textarea-add min-h-40 w-full"
        allowResize={true}
        on:blur={(value) => {
          $engineSettings.llmTextSettings.prompt = value?.detail.trim();
        }}
        value={$engineSettings?.llmTextSettings?.prompt ?? ""}
        placeholder="e.g. You are an AI Conversation Jedi. You will embody the role of jesus."
      />
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
<!--
To edit the stupid settings below, use the config.yaml - I haven't implemented the config.yaml properly so best of luck with that.
suppose you can also uncomment this and it might still work but tbh, these settings were pissing me off as they look nasty
@deprecated
<span class="text-xs">The below settings are mostly nonsense that some LLM systems will use. LMStudio and Deepseek will ignore them.</span>
<Accordion class="border-1 variant-filled-surface rounded-md mt-5 mb-5">
    <AccordionItem closed>
    <svelte:fragment slot="summary">Other Penalty</svelte:fragment>
    <svelte:fragment slot="content">
      <div class="grid grid-cols-2 gap-4">
        <RangeSlider
          title="Repetition Pen"
          label="Repetition Pen"
          name="repPen"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.penalty.repPen}
          max={2}
          step={0.01}
        />
        <RangeSlider
          title="Repetition Penalty Range"
          label="Repetition Penalty Range"
          name="repetitionPenaltyRange"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.penalty.repetitionPenaltyRange}
          max={1}
          step={0.1}
        />
        <RangeSlider
          title="encoderRepetitionPenalty"
          label="Encoder Repetition Penalty"
          name="encoderRepetitionPenalty"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.penalty.encoderRepetitionPenalty}
          max={2}
          step={0.1}
        />
      </div>
    </svelte:fragment>
  </AccordionItem>
      <AccordionItem closed>
    <svelte:fragment slot="summary">DRY Penalty</svelte:fragment>
    <svelte:fragment slot="content">
    <div class="grid grid-cols-4 gap-4">
      <RangeSlider
        title="Allowed Length"
        name="allowedLength"
        label="Allowed Length"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.DRY.allowedLength}
        min={1}
        max={10}
        step={1}
      />
      <RangeSlider
        title="Multiplier"
        name="multiplier"
        label="Multiplier"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.DRY.multiplier}
        min={0}
        max={5}
        step={0.1}
      />
      <RangeSlider
        title="Base"
        name="base"
        label="Base"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.DRY.base}
        min={0}
        max={10}
        step={0.05}
      />
      <RangeSlider
        title="Penalty Last N"
        name="penaltyLastN"
        label="Penalty Last N"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.DRY.penaltyLastN}
        min={0}
        max={20}
        step={1}
      />
    </div>
    </svelte:fragment>
  </AccordionItem>
    <AccordionItem closed>
    <svelte:fragment slot="summary">Smoothing</svelte:fragment>
    <svelte:fragment slot="content">
      <div class="grid grid-cols-2 gap-4">
        <RangeSlider
          title="Smoothing"
          name="smoothingFactor"
          label="Smoothing Factor"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.smoothing.smoothingFactor}
          max={1}
          step={0.1}
        />
        <RangeSlider
          title="Smoothing Temperature"
          name="smoothingCurve"
          label="Smoothing Curve"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.smoothing.smoothingCurve}
          max={1}
          step={0.1}
        />
      </div>
    </svelte:fragment>
  </AccordionItem>
    <AccordionItem closed>
    <svelte:fragment slot="summary">Beam</svelte:fragment>
    <svelte:fragment slot="content">
      <div class="grid grid-cols-2 gap-4">
        <RangeSlider
          title="Number of Beams"
          name="numBeams"
          label="Number of Beams"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.beam.numBeams}
          min={1}
          max={10}
          step={1}
        />
        <RangeSlider
          title="Length Penalty"
          name="lengthPenalty"
          label="Length Penalty"
          bind:value={$DungeonGame$engineSettings.llmTextSettings.beam.lengthPenalty}
          min={0}
          max={5}
          step={0.1}
        />
      </div>
      <div class="mt-4">
        <SlideToggle
          label="Early Stopping"
          name="earlyStopping"
          bind:checked={$DungeonGame$engineSettings.llmTextSettings.beam.earlyStopping}
        >Early Stopping {$DungeonGame$engineSettings.llmTextSettings.beam.earlyStopping ? "On" : "Off"}</SlideToggle>
      </div>
    </svelte:fragment>
  </AccordionItem>
  <AccordionItem closed>
    <svelte:fragment slot="summary">Micro Stat</svelte:fragment>
    <svelte:fragment slot="content">
    <div class="grid grid-cols-2 gap-4">
      <RangeSlider
        title="Mode"
        name="mode"
        label="Mode"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.microStat.mode}
        min={0}
        max={1}
        step={1}
      />
      <RangeSlider
        title="Tau"
        name="tau"
        label="Tau"
        bind:value={$DungeonGame$engineSettings.llmTextSettings.microStat.tau}
        min={0}
        max={10}
        step={1}
      />
    </div>
    <RangeSlider
      title="Eta"
      name="eta"
      label="Eta"
      bind:value={$DungeonGame$engineSettings.llmTextSettings.microStat.eta}
      min={0}
      max={1}
      step={0.1}
    />
    </svelte:fragment>
  </AccordionItem>
</Accordion>-->
