<script lang="ts">
  import { cn } from "$lib/utilities/utils";
  import CiCircleHelp from "~icons/ci/circle-help";
  import { Input } from "../input";
  import Label from "../label/label.svelte";

  interface Props {
    id?: string;
    name?: string;
    label?: string;
    title?: string;
    value?: any;
    type?: string;
    iconHelp?: boolean;
    helpText?: string;
    showTitle?: boolean;
    disabled?: boolean;
    placeholder?: string;
    class?: string;
    change?: (value: string) => void;
  }
  let {
    id: _id = "",
    name: _name = "",
    label: _label = "",
    title: _title = "",
    value: _value = $bindable(""),
    type: _type = "text",
    iconHelp: _iconHelp = false,
    helpText: _helpText = "",
    showTitle: _showTitle = true,
    disabled: _disabled = false,
    placeholder: _placeholder = "",
    class: _class = "",
    change = (value: string) => {},
  }: Props = $props();

  function typeAction(node: { type: any }) {
    node.type = _type;
  }
  function onInput(e: Event) {
    const target = e.target as HTMLInputElement;
    change(target.value);
  }
</script>

<div class={cn(_class, "formInputBox")}>
  {#if _showTitle}
    <Label class="label font-bold mb-1.5" title={_title}>{_label}</Label>
  {/if}
  <div class={`max-w-full rounded-md input-group input-group-divider flex items-center `}>
    <Input
      id={_id}
      name={_name}
      class="flex-grow rounded-r-none w-4/5"
      bind:value={_value}
      disabled={_disabled}
      placeholder={_placeholder}
      oninput={onInput}
    />
    {#if _iconHelp}
      <span title={_helpText}
        ><CiCircleHelp
          class="rounded-l-none ml-auto border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground shadow-xs flex h-9 min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-grow text-center w-1/5 min-w-fit"
        /></span
      >
    {/if}
  </div>
</div>
