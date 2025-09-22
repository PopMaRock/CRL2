<script lang="ts">
  import { onMount } from "svelte";
  import { type Writable, writable } from "svelte/store";
  import TextBlock from "$components/chat/blocks/text-block.svelte";
  import { Button } from "$components/ui/button";
  import { CharacterSettingsStore } from "$lib/engine/engine-character";
  import { EngineConversation } from "$lib/engine/engine-conversation";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import CiChevronDownDuo from "~icons/ci/chevron-down-duo";
  //import { useBackgroundMusic } from "../Dungeon/Chat/useAudio"; // Import the function
  import InteractionBox from "../chat/interaction-box.svelte";
  import TypingIndicator from "../chat/typing-indicator.svelte";

  //import DynaBackground from "$components/Dungeon/DynaBackground.svelte";

  interface Props {
    response: Writable<{ loading: boolean; text: string }>;
    errorMessage: string;
    sendMessage: (message: string, actionOption: string) => void;
    removeConversationEntry: (hash: number) => void;
    removeMedia: (hash: number) => void;
    abortLLM: (hash: number) => void;
    generateImage: (generationMode: number, hash?: number) => void;
    stopMediaTransacting: (hash: number, url: string) => void;
  }
  let {
    response: _response,
    errorMessage: _errorMessage = $bindable(""),
    sendMessage = () => {},
    removeConversationEntry = () => {},
    removeMedia = () => {},
    abortLLM = () => {},
    generateImage = () => {},
    stopMediaTransacting = () => {},
  } = $props() as Props;
  const inView = writable(true);

  let scrollEndDiv: HTMLDivElement;
  const scrollToBottom = () => {
    const container = document.getElementById("scroll-end-div");
    container?.scrollIntoView({ behavior: "smooth" });
  };

  let actionOption = "do";
  let message = "";

  //const { setUrl: setBackgroundMusicUrl } = useBackgroundMusic() // Destructure the setUrl function

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        inView.set(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    if (scrollEndDiv) {
      observer.observe(scrollEndDiv);
    }

    return () => {
      if (scrollEndDiv) {
        observer.unobserve(scrollEndDiv);
      }
    };
  });
  function dispatchMessage(message: string, actionOption = "do") {
    if (message.length < 1) {
      _errorMessage = "Please enter a message.";
      return;
    }
    _errorMessage = "";
    DebugLogger.debug("actionOption ", actionOption);
    sendMessage(message, actionOption);
  }
  let input = "";

  const advance = () => {
    message = "empty";
    actionOption = "continue";
    dispatchMessage(message, actionOption);
  };
  // Call scrollToBottom after each update to push scroll to the bottom
  /*afterUpdate(() => {
    if ($response.loading && $CharacterSettingsStore.llmResponseSettings.stream) {
      scrollToBottom();
    }
  });*/
</script>

<div id="quest-narrative-container" class="mx-auto flex h-[100dvh] w-full max-w-6xl flex-grow flex-col overflow-hidden px-4 pb-6 pt-10">
  <!--MAIN CONTAINER-->
  <!--///-->
  <div class="absolute bottom-0 left-[-15vh] right-0 top-0 -z-20">
    <!--<DynaBackground
      layers={{
        background: ["/dynabackground/background/mountain.png"],
        middleground: [],
        foreground: ["/dynabackground/foreground/mist.png"],
  }}
    />-->
  </div>
  <div class="flex h-full overflow-hidden">
    <div class="absolute bottom-0 left-0 right-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
      <div class="variant-gradient-primary-secondary h-full w-full bg-gradient-to-br opacity-10" />
    </div>

    <!-- Content below only -->
    <!-- QuestNarrativeContainer -->
    <div class="relative w-full">
      <main id="narrative-container" class="flex h-full w-10/12 flex-col-reverse justify-end overflow-auto scroll-smooth">
        <div class="flex w-full flex-col gap-8 overflow-auto pb-[30vh]">
          <!-- Messages -->
          {#if $EngineConversation.length > 0}
            {#each $EngineConversation as item, index}
              <!--{#if item.type === "image"}
                <ImageBlock
                  blockId={index}
                  {item}
                  imageUrl={`/api/filesystem/images?id=${$CharacterStore.id}&mode=characters&filename=${splitImageMessage(item.content).image}`}
                  on:remove={async () => await removeEntry(item.hash)}
                />
              {:else}-->
              <TextBlock
                blockId={index}
                {item}
                remove={() => removeConversationEntry(item.hash)}
                removeMedia={() => removeMedia(item.hash)}
                abortLLMTransacting={() => abortLLM(item.hash)}
                generateImage={(e: any) => {
                  generateImage(e.generationMode, item.hash);
                }}
                stopMediaTransacting={() => {
                  stopMediaTransacting(item.hash, item?.additionalMedia?.url ?? "");
                }}
              />
              <!--{/if}-->
            {/each}
            {#if $_response.loading && $CharacterSettingsStore.llmTextSettings.reasoning}
              {#await new Promise((res) => setTimeout(res, 400)) then _}
                {#if $_response.text == ""}
                  <TypingIndicator />
                {:else}
                  <TextBlock blockId={-1} reasoning={true} item={$_response.text} animationComplete={scrollToBottom} />
                {/if}
              {/await}
            {/if}
            {#if $_response.loading && $CharacterSettingsStore.llmResponseSettings.stream && !$CharacterSettingsStore.llmTextSettings.reasoning}
              {#await new Promise((res) => setTimeout(res, 400)) then _}
                {#if $_response.text == ""}
                  <TypingIndicator />
                {:else}
                  <TextBlock blockId={-1} item={$_response.text} animationComplete={scrollToBottom} />
                {/if}
              {/await}
            {/if}
          {/if}
          <!-- {#if $loadState.image}
            <ImageLoadingBlock />
          {/if}-->
          <!-- SCROLLPISH -->
          <div class="w-full" id="anchor">
            <div bind:this={scrollEndDiv} id="scroll-end-div" class="h-[1px] w-full" />
          </div>
          {#if !$inView}
            <Button onclick={scrollToBottom} variant="outline" class="absolute bottom-4 right-4 z-50 aspect-square rounded-full !p-2">
              <CiChevronDownDuo class="w-16" />
            </Button>
          {/if}
          <!-- /SCROLLPISH -->
          <!-- End QuestNarrativeContainer -->
        </div>
        <!-- End Messages -->
      </main>
    </div>
  </div>
  <div class="relative mb-2 h-36 flex w-10/12 flex-col items-end justify-center gap-2 pt-1">
    <InteractionBox
      advance={() => {
        advance();
      }}
      generateImage={(generationMode: number) => {
        generateImage(generationMode);
      }}
      sendMessage={(message: string, selectedOption: string) => {
        dispatchMessage(message, selectedOption);
      }}
      simpleInput={true}
      {input}
    />
  </div>
</div>
