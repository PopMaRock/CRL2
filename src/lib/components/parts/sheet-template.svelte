<script lang="ts">
  import * as Sheet from "$lib/components/ui/sheet";
  import { buttonVariants } from "../ui/button";

  interface Props {
    isOpen: boolean;
    position?: "left" | "right" | "top" | "bottom";
    title?: string;
    description?: string;
    preventClose?: boolean;
    onClose?: () => void;
    children: any;
  }
  let {
    isOpen = $bindable(false),
    position = "right",
    title = "Sheet view",
    description = "",
    preventClose = false,
    onClose = () => {},
    children,
  }: Props = $props();
</script>

<Sheet.Root
  bind:open={isOpen}
  onOpenChange={() => {
    if (isOpen) {
      console.log("onClose sheet triggered");
      onClose();
    }
  }}
>
  <Sheet.Content interactOutsideBehavior={preventClose ? "ignore" : "close"} side={position}>
    <Sheet.Header>
      <Sheet.Title>{title}</Sheet.Title>
      <Sheet.Description>{description}</Sheet.Description>
    </Sheet.Header>
    {@render children()}
    <Sheet.Footer>
      <Sheet.Close class={buttonVariants({ variant: "outline" })}>Save changes</Sheet.Close>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>
