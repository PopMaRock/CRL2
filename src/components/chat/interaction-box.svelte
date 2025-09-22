<script lang="ts">
  import { onMount } from "svelte";
  import Textarea from "$components/base/form-elements/textarea.svelte";
  import { Button } from "$components/ui/button";
  import * as ToggleGroup from "$components/ui/toggle-group/index.js";
  import { loadState } from "$lib/global";
  import CiPaperPlane from "~icons/ci/paper-plane";
  import LucideSmilePlus from "~icons/lucide/smile-plus";
  import InteractionBoxMenus from "./interaction-box-menu.svelte";

  interface Props {
    input?: string;
    simpleInput: boolean;
    advance: () => void;
    sendMessage: (message: string, selectedOption: string) => void;
    generateImage: (generationMode: number) => void;
  }
  let {
    input: _input = "",
    simpleInput: _simpleInput = false,
    advance,
    sendMessage,
    generateImage,
  } = $props() as Props;

  let inputRef: HTMLTextAreaElement = $state() as any;
  let actionOption = $state("do");

  const handleFormSubmit = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef?.focus();
    if (_input.trim().length < 1) {
      advance(); //this is the equivilent of a "continue" button
    }
    sendMessage(_input.trim(), actionOption);
    _input = ""; //clear input.
  };
  const handleKeyDown = (e: CustomEvent) => {
    const event = e.detail as KeyboardEvent;
    if (event.key === "Enter" && !event.shiftKey) {
      handleFormSubmit(event);
    }
  };
  function adjustHeight() {
    if (inputRef) {
      inputRef.style.height = "70px";
      inputRef.style.height = `${inputRef.scrollHeight}px`;
    }
  }
  $effect(() => adjustHeight());
  onMount(() => {
    adjustHeight();
  });
</script>

<form class="flex w-full gap-2" onsubmit={handleFormSubmit}>
  <div class="relative">
    <div class="absolute top-[-1rem] left-[2rem] right-0 !z-20 flex justify-between items-center px-2">
      {#if !_simpleInput}
        <ToggleGroup.Root size="lg" type="single">
          {#each [{ value: "do", label: "Do" }, { value: "say", label: "Say" }, { value: "see", label: "See" }, { value: "story", label: "Story" }] as option}
            <ToggleGroup.Item
              value={option.value}
              aria-label={`Toggle ${option.label.toLowerCase()}`}
              class="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {option.label}
            </ToggleGroup.Item>
          {/each}
        </ToggleGroup.Root>
      {/if}
    </div>
    <div class="absolute top-[0.7rem] right-[-56rem] !z-20">
      <InteractionBoxMenus on:generateImage={(e: any) => generateImage(e.generationMode)} />
    </div>
    <!-- Spacer to offset the absolutely positioned controls -->
    <div class="pt-8"></div>
  </div>
  <div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token dark:bg-surface-500">
    <button class="input-group-shim">
      {#if _simpleInput}<LucideSmilePlus />{/if}</button
    >

    <Textarea
      spellcheck={true}
      class="focus:ring-2 focus:ring-blue-500 w-full pl-2 pr-6"
      transparentBg={true}
      showLabel={false}
      bind:value={_input}
      placeholder="Type your message here. Send an empty message to continue."
      bind:textareaElement={inputRef}
      onkeydown={handleKeyDown}
      disabled={$loadState.image || $loadState.llm}
    ></Textarea>
    <div class="flex justify-center items-center" style="border-left-width: 0px;">
      {#if $loadState.image || $loadState.llm}
        <!--<ProgressRadial width="w-12" value={undefined} />-->
      {:else}
        <!-- we need a w-12 padder as the hiding of the progressRadial is causing a layout shift-->
        <div class="w-12"></div>
      {/if}
      <Button type="submit" disabled={$loadState.image || $loadState.llm} class="absolute">
        <CiPaperPlane class="w-24" />
      </Button>
    </div>
  </div>
</form>
