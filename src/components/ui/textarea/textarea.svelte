<script lang="ts">
  import { type Component, createEventDispatcher } from "svelte";
  import type { SVGAttributes } from "svelte/elements";
  import { cn } from "$lib/utilities/utils";
  export let id = "";
  export let name = "";
  export let label = "";
  export let title = "";
  export let placeholder = "";
  export let value: string;
  export let heightClass = "min-h-24";
  export let showLabel = true;
  export let spellcheck = true;
  export let allowResize = false;
  export let showActionButton = false;
  export let loading = false;
  export let actionButtonTitle = "";
  export let actionButtonIcon: Component<SVGAttributes<SVGSVGElement>> | null = null;
  export let textareaElement: HTMLTextAreaElement | null = null;
  export let transparentBg = false;
  export let additionalClasses = "";

  const dispatch = createEventDispatcher();
  function keydown(e: KeyboardEvent) {
    dispatch("keydown", e);
  }
  function onValueChange(e: Event) {
    dispatch("change", value);
  }
  function onBlur() {
    dispatch("blur", value);
  }
</script>

<div class={cn("relative", $$props.class, "formTextAreaBox")}>
  {#if showLabel}
    <label for={name} class="label pl-2 pt-2 font-bold" {title}>{label}</label>
  {/if}
  {#if showActionButton}
    <button
      type="button"
      class={cn("hover:text-yellow-800 hover:font-bold absolute top-0 right-0 m-2", loading ? "animate-ping" : "")}
      title={actionButtonTitle}
      on:click={() => dispatch("action")}
    >
      {#if actionButtonIcon}
        <svelte:component this={actionButtonIcon} class="w-4 h-4" />
      {:else}
        Action
      {/if}
    </button>
  {/if}
  <slot></slot>
  <textarea
    id={id ?? name}
    {name}
    {spellcheck}
    class={cn(
      `${heightClass} w-full leading-5 ${allowResize ? "!resize-y" : ""} border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 field-sizing-content shadow-xs flex min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`,
      additionalClasses,
    )}
    bind:value
    {placeholder}
    on:blur={onBlur}
    on:input={onValueChange}
    on:keydown={keydown}
    bind:this={textareaElement}
  ></textarea>
</div>
