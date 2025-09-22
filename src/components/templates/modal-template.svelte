<script lang="ts">
  import { cn } from "$lib/utilities/utils";
  import CiChevronLeft from "~icons/ci/chevron-left";
  import CiCloseMd from "~icons/ci/close-md";

  interface Props {
    class?: string;
    stage?: number;
    showBackButton?: boolean;
    showFooterButtons?: boolean;
    showPositiveBtn?: boolean;
    showNegativeBtn?: boolean;
    positiveBtn?: string;
    negativeBtn?: string;
    title?: string;
    back?: () => void;
    close?: () => void;
    positiveClick?: () => void;
    children?: () => any;
    footer?: () => any;
  }
  const {
    class: _class = "",
    stage: _stage = 1,
    showBackButton: _showBackButton = true,
    showFooterButtons: _showFooterButtons = true,
    showPositiveBtn: _showPositiveBtn = true,
    showNegativeBtn: _showNegativeBtn = false,
    positiveBtn: _positiveBtn = "Create",
    negativeBtn: _negativeBtn = "Cancel",
    title: _title = "",
    back: _back = () => {},
    close: _close = () => {},
    positiveClick: _positiveClick = () => {},
    children = () => {},
    footer = () => {},
  }: Props = $props();
  //--
  // Base Classes
  const cHeader = "flex items-center border-b dark:border-gray-700 text-bold text-2xl";
</script>

<div class={cn(`${_class}`, `w-model dark:bg-surface-600 bg-white flex flex-col rounded-md ring-4 p-4 shadow-xl space-y-4`)}>
  <header class={cHeader}>
    {#if _stage > 1 && _showBackButton}
      <button
        type="button"
        class="items-center hover:animate-ping"
        title="Back to previous page"
        onclick={() => {
          _back();
        }}
      >
        <CiChevronLeft class="h-5 w-5" />
      </button>
    {/if}
    {_title ?? "(title missing)"}
    <button
      onclick={() => {
        _close();
      }}
      class="btn ml-auto rounded-lg p-2.5 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:focus:ring-gray-700"
    >
      <CiCloseMd class="h-5 w-5" />
    </button>
  </header>
  <article class="flex-grow overflow-y-auto focus:border-0">
    {@render children()}
  </article>
  <footer class="modal-footer">
    {#if _showFooterButtons}
      <div class="flex justify-end space-x-2">
        {#if footer()}
          {@render footer()}
          {#if _showNegativeBtn}
            <button class="btn" onclick={() => _close()}>{_negativeBtn}</button>
          {/if}
          {#if _showPositiveBtn}
            <button class="btn variant-filled-primary" onclick={() => _positiveClick()}>{_positiveBtn}</button>
          {/if}
        {/if}
      </div>
    {/if}
  </footer>
</div>
