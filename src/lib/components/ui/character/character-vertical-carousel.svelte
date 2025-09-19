<script lang="ts">
  import { onMount } from 'svelte';
  import CharacterCard from './character-card.svelte';

  let slider1: HTMLDivElement;
  let slider2: HTMLDivElement;
  let isHovered1 = $state(false);
  let isHovered2 = $state(false);
  const os = "linux";

  onMount(() => {
    const cloneItems = (slider: HTMLDivElement) => {
      const items = Array.from(slider.children);
      for (const item of items) {
        const clone = (item as HTMLElement).cloneNode(true);
        slider.appendChild(clone);
      }
    };

    cloneItems(slider1);
    cloneItems(slider2);
  });
</script>

<div class="outer-container flex justify-center items-center relative -mt-[10vh] -mb-[10vh] pr-20 hidden lg:block">
  <div class={`slider-container h-full w-[calc(50%-5px)] transform rotate-[10deg] relative ${os === "linux"? "top-[-3em]":''}`}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class={`slider flex flex-col ${os === "linux"? "":"animate-scroll"}`} bind:this={slider1} onmouseenter={() => isHovered1 = true} onmouseleave={() => isHovered1 = false} style="animation-play-state: {isHovered1 ? 'paused' : 'running'};">
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
    </div>
  </div>
  <!-- FIXME: Bug - slider ends prematurely (not infinite). Don't have time to care just now. and is completely fucked on linux due to webgtk being a pile of crap -->
  <div class={`slider-container h-full w-[calc(50%-5px)] transform rotate-[10deg] relative ${os === "linux"? "right-[-19em] top-[-120em]" : ""}`}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class={`slider reverse flex flex-col ${os==="linux"? "": "animate-scroll-reverse"}`} bind:this={slider2} onmouseenter={() => isHovered2 = true} onmouseleave={() => isHovered2 = false} style="animation-play-state: {isHovered2 ? 'paused' : 'running'};">
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
      <div class="slider-item mb-4"><CharacterCard character={null} /></div>
    </div>
  </div>
</div>

<style>
  .outer-container {
    width: 70vh;
     height: 120vh;
  }

  .slider-container {
    width: 17vh;
  }

  @keyframes scroll {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(-50%);
    }
  }

  @keyframes scroll-reverse {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(0);
    }
  }

  .animate-scroll {
    animation: scroll 40s linear infinite;
  }

  .animate-scroll-reverse {
    animation: scroll-reverse 40s linear infinite;
  }
</style>