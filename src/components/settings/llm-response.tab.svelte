<script lang="ts">
  import { type Writable, writable } from "svelte/store";
  import SlideToggle from "$components/ui/slide-toggle/slide-toggle.svelte";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
  export let engineSettings: Writable<DungeonGameSettings | CharacterSettings | EngineSettings> = writable(
    {} as DungeonGameSettings | CharacterSettings,
  );
</script>

<div>
  <SlideToggle
    name="streaming"
    active="variant-filled-primary"
    class="mt-4"
    size="sm"
    value={$engineSettings.llmResponseSettings.stream ? "on" : "off"}
    options={["on", "off"]}
    question="Streaming response"
    onchange={(value) => {
      $engineSettings.llmResponseSettings.stream = value === "on";
      if (!$engineSettings.llmResponseSettings.stream) {
        $engineSettings.llmResponseSettings.showThinking = false;
      }
    }}
  />
</div>
<div>
  <SlideToggle
    name="showThinking"
    active="variant-filled-primary"
    class="mt-4"
    size="sm"
    value={$engineSettings.llmResponseSettings.showThinking ? "on" : "off"}
    options={["on", "off"]}
    question="Show thinking"
    onchange={(value) => {
      $engineSettings.llmResponseSettings.showThinking = value === "on";
      if ($engineSettings.llmResponseSettings.showThinking && !$engineSettings.llmResponseSettings.stream) {
        $engineSettings.llmResponseSettings.stream = true;
      }
    }}
  />
</div>
{#if !$engineSettings.llmTextSettings.reasoning}
  <!-- Don't really need to cleanup when using reasoning -->
  <div>
    <SlideToggle
      name="sd"
      active="variant-filled-primary"
      class="mt-4"
      size="sm"
      value={$engineSettings.llmResponseSettings.cleanText ? 'on' : 'off'}
      options={["on", "off"]}
      question="Text Cleanup"
      onchange={(value) => ($engineSettings.llmResponseSettings.cleanText = value === "on")}/>
  </div>
  <div>
    <!-- This will fuck things up as the LLM stops while repeating the user's name in it's self-prompting.-->
    <SlideToggle
      name="sd"
      active="variant-filled-primary"
      class="mt-4 mb-8"
      size="sm"
      options={["on", "off"]}
      question="User name as stop"
      value={$engineSettings.llmResponseSettings.userNameAsStop ? 'on' : 'off'}
      onchange={(value) => ($engineSettings.llmResponseSettings.userNameAsStop = value === "on")}/>
  </div>
{/if}
<TextboxGroup
  label="Limit Response Max Tokens"
  name="limitResponseMaxTokens"
  type="number"
  class=""
  bind:value={$engineSettings.llmResponseSettings.maxTokens}
  placeholder="100"
  iconHelp={true}
  helpText={`${$engineSettings.llmTextSettings.reasoning ? "THIS WILL LIMIT THE MODALS ABILITY TO REASON" : ""} Maximum amount of returned tokens`}
/>
<TextboxGroup
  label="Limit Response Max Words"
  name="limitResponseMaxWords"
  type="number"
  class="mt-2"
  bind:value={$engineSettings.llmResponseSettings.wordCount}
  placeholder="200"
  iconHelp={true}
  helpText={`${$engineSettings.llmTextSettings.reasoning ? "This is safe to change on reasoning." : "LLMs like to ignore this."} Maximum amount of returned tokens`}
/>
<TextboxGroup
  label="Sequence Breakers"
  name="sequenceBreakers"
  type="text"
  bind:value={$engineSettings.llmResponseSettings.sequenceBreakers}
  placeholder={'[".", "!", "?"]'}
  iconHelp={true}
  class="mt-2"
  helpText="Things the AI should break on"
/>
<TextboxGroup
  label="Custom stop strings"
  name="customStopStrings"
  type="text"
  class="mt-2"
  bind:value={$engineSettings.llmResponseSettings.customStopStrings}
  placeholder={'["jim", "bob", "dave"]'}
  iconHelp={true}
  helpText={`${$engineSettings.llmTextSettings.reasoning ? "THIS WILL PRODUCE BAD RESULTS WHEN USING REASONING MODELS" : ""} Custom stop strings in JSON format array`}
/>
