<script lang="ts">
  import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
  import { restartGame } from "$lib/ui/interaction-box-menu";
  import { DebugLogger } from "$lib/utilities/error-manager";
  import CiImage from "~icons/ci/image";
  import CiMenuDuoMd from "~icons/ci/menu-duo-md";

  interface Props {
    generateImage?: (generationMode: number) => void;
  }
  const { generateImage = () => {} } = $props() as Props;
  let textMenu: any;
  let imageMenu: any;

  async function testFunc() {
    const result = await fetch("/api/transformers/sentiment", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `The villagers look at each other nervously but seem unconcerned by your sudden joke, probably thinking it's just another quirk from a townie coming back home after years away.

Your eyes scan the crowd as you continue speaking normally. "I'm not sure what kind of adventures await me here in Willow Creek," you say with a chuckle, trying to make light conversation while keeping an eye out for any suspicious individuals lurking about.

You notice Reginald Thorne walking towards your direction from across the square. His eyes narrow as he takes in your presence and his pace quickens, curiosity burning within him at seeing you so soon after rumors of The Golden Chalice's existence began circulating once more.`,
      }),
    });
    const data = await result.json();
    DebugLogger.debug(data);
  }
  async function genImage(item: number) {
    if (!item) return;
    imageMenu = null;
    console.log("Generating image", item);
    generateImage(item);
    //await interactiveSd(modalStore, item, $EngineSdCharacter?.modelType??'sdxl', 0);
  }
</script>

<div class="flex space-x-1 mr-2">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger><CiImage class="group-hover:text-warning-500" /></DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.Label>Image generation</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => genImage(100)}>Open gallery</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => genImage(0)}>Gen: Character</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => genImage(2)}>Gen: Whole Story</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => genImage(4)}>Gen: Last Message</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => genImage(3)}>Gen: Raw Last</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => genImage(7)}>Gen: Background</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
  <!-- END MAGIC GENERATION OPTIONS BOX-->
  <!-- TEST BUUTTON -->
  <DropdownMenu.Root>
    <DropdownMenu.Trigger><CiMenuDuoMd /></DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.Label>Test menu</DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={() => testFunc()}>Test Fetch</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => {}}>Regenerate Last</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => {}}>Exit Game</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => restartGame}>Restart Game</DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
