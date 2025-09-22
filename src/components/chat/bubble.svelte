<script lang="ts">
  import * as Avatar from "$components/ui/avatar/index.js";
  import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
  import { CharacterStore } from "$lib/engine/engine-character";
  import CiMoreHorizontal from "~icons/ci/more-horizontal";

  interface Props {
    item: any;
    isUser: boolean;
    generateImage?: (generationMode: number) => void;
    showImage?: (image: string, source?: string) => void;
  }
  const { item, isUser, generateImage = () => {}, showImage = () => {} }: Props = $props();

  const imgSrc = `/api/filesystem/images?id=${$CharacterStore.hash}&mode=characters&filename=${$CharacterStore.images.face}`;
  const lightBoxAvatar = `/api/filesystem/images?id=${$CharacterStore.hash}&mode=characters&filename=${$CharacterStore.images.avatar}`;

  const timing = new Date(item?.meta?.timestamp ?? Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
</script>

{#if isUser}
  <div class="grid grid-cols-[auto_1fr] gap-2">
    <Avatar.Root>
      <Avatar.Image src="https://i.pravatar.cc/?img=48" />
      <Avatar.Fallback>V</Avatar.Fallback>
    </Avatar.Root>
    <div class="card p-4 variant-soft rounded-tl-none space-y-2 variant-soft-secondary">
      <header class="flex justify-between items-center">
        <p class="font-bold">Vince</p>
        <div class="ml-auto flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger><CiMoreHorizontal /></DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Item>Delete</DropdownMenu.Item>
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </header>
      <p><slot></slot></p>
    </div>
  </div>
{:else}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="grid grid-cols-[1fr_auto] gap-2">
    <div class="card p-4 rounded-tr-none space-y-2 variant-soft-primary">
      <header class="flex items-center">
        <p class="font-bold">{$CharacterStore.name}</p>
        <div class="ml-auto flex items-center gap-2">
          <small class="opacity-50">{timing}</small>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger><CiMoreHorizontal /></DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Item onclick={() => generateImage(99)}>Gen: Image</DropdownMenu.Item>
                <DropdownMenu.Item>Gen: Narration</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>Ex.from History</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="text-error-700">Delete</DropdownMenu.Item>
              </DropdownMenu.Group>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </header>
      <p><slot></slot></p>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="cursor-pointer" onclick={() => showImage(imgSrc)}>
      <Avatar.Root>
        <Avatar.Image src={imgSrc} />
        <Avatar.Fallback>V</Avatar.Fallback>
      </Avatar.Root>
    </div>
  </div>
{/if}
