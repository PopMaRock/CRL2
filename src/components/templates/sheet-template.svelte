<script lang="ts">
  import * as Sheet from "$components/ui/sheet";
    import { cn } from "$lib/utilities/utils";
  import { buttonVariants } from "../ui/button";

  interface Props {
    isOpen: boolean;
    position?: "left" | "right" | "top" | "bottom";
    title?: string;
    description?: string;
    preventClose?: boolean;
    showSave?: boolean;
    class?: string;
    onClose?: () => void;
    children: any;
  }
  let {
    isOpen:_isOpen = $bindable(false),
    position:_position = "right",
    title:_title = "Sheet view",
    description:_description = "",
    preventClose:_preventClose = false,
    showSave:_showSave = true,
    onClose:_onClose = () => {},
    class:_class = "",
    children,
  }: Props = $props();
</script>

<Sheet.Root
  bind:open={_isOpen}
  onOpenChange={() => {
    if (_isOpen) {
      console.log("onClose sheet triggered");
      _onClose();
    }
  }}
>
  <Sheet.Content interactOutsideBehavior={_preventClose ? "ignore" : "close"} side={_position} class={cn(_class,"")}>
    <Sheet.Header>
      <Sheet.Title>{_title}</Sheet.Title>
      <Sheet.Description>{_description}</Sheet.Description>
    </Sheet.Header>
    {@render children()}
    <Sheet.Footer>
      {#if _showSave}
      <Sheet.Close class={`${buttonVariants({ variant: "outline" })}`}>Save changes</Sheet.Close>
      {/if}
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
