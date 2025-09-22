<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { get, writable } from "svelte/store";
import Bubble from "$components/chat/bubble.svelte";
import TypingIndicator from "$components/chat/typing-indicator.svelte";
import { EngineConversation } from "$lib/engine/engine-conversation";
import BlockContainer from "../block-container.svelte";
import InlineImageBlock from "./inline-image-block.svelte";

interface Props {
	item: Conversation;
	blockId: number;
	reasoning?: boolean;
	remove?: () => void;
	removeMedia?: () => void;
	abortLLMTransacting?: () => void;
	generateImage?: (generationMode: number) => void;
	stopMediaTransacting?: () => void;
}
const {
	item,
	blockId,
	reasoning,
	remove = () => {},
	removeMedia = () => {},
	abortLLMTransacting = () => {},
	generateImage = () => {},
	stopMediaTransacting = () => {}
}: Props = $props();
//export let isLast = false;

let isEditing = $state(false);
let inputValue = $state("");
let content = $state("");

const isHover = writable(false);
// Get the initial content
// Get the initial content if item is not a string
$effect(() => {
	if (typeof item !== "string") {
		const conversation = get(EngineConversation)[blockId];
		if (conversation && conversation.content !== undefined) {
			content = conversation.content;
		}
	} else {
		content = item;
	}
});
// Function to save the changes
function saveChanges() {
	EngineConversation.update((conversations) => {
		const index = conversations.findIndex((conv) => conv.hash === item.hash);
		if (index !== -1) {
			conversations[index].content = inputValue;
		}
		return conversations;
	});
	isEditing = false;
}

// Function to handle click outside
function handleClickOutside(event: any) {
	if (isEditing && !event.target.closest(".editable")) {
		saveChanges();
	}
}
// Add event listener for clicks outside
onMount(() => {
	document.addEventListener("click", handleClickOutside);
});
// Remove event listener on destroy
onDestroy(() => {
	document.removeEventListener("click", handleClickOutside);
});
// Function to adjust the height of the textarea
function adjustTextareaHeight(textarea: any) {
	textarea.style.height = "auto";
	textarea.style.height = `${textarea.scrollHeight}px`;
}
// Function to enable editing
function enableEditing() {
	isEditing = true;
	inputValue = content;
	if (typeof item === "string" || item?.transacting) {
		return;
	}
	setTimeout(() => {
		const textarea = document.querySelector(`#textarea-${blockId}`);
		if (textarea) {
			adjustTextareaHeight(textarea);
			//textarea.focus() -- doesn't exist on textarea
		}
	}, 0);
}
function formatText(text: string) {
	text = text.replace(/"([^"]+)"/g, '<span class="font-semibold dark:text-surface-200">$1</span>');
	// wrap all * this is text * in <span class="font-semibold">this is text</span>
	text = `<span class="subpixel-antialiased">${text}</span>`;
	//replace text in double quotes with <span class="font-semibold">text</span>
	return text.replace(/\*([^*]+)\*/g, '<span class="font-normal italic dark:text-surface-200">$1</span><br/>');
}
</script>

<BlockContainer>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onmouseenter={() => {
      if (typeof item !== "string") isHover.set(true);
    }}
    onmouseleave={() => {
      if (typeof item !== "string") isHover.set(false);
    }}
  >
    <Bubble
      isUser={item?.role === "user"}
      {item}
      on:remove={() => {
        if (typeof item !== "string") {
          if (!item.transacting) {
            remove();
          } else {
            abortLLMTransacting(); //abort transacting
          }
        }
      }}
      on:generateImage={(e) => {
        if (typeof item !== "string") {
          generateImage(e.detail.generationMode);
        }
      }}
    >
      <!-- FIXME this will fuck up if the user tries to edit the "thinking" while LLM is processing. Need global loading states.-->
      {#if isEditing}
        <textarea
          id={`textarea-${blockId}`}
          bind:value={inputValue}
          class="editable"
          style="height: auto;"
          oninput={(e) => adjustTextareaHeight(e.target)}
        ></textarea>
        <button onclick={saveChanges}>Save</button>
      {:else}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <span class="editable" onclick={enableEditing}>
          {#if typeof item !== "string" && item.transacting}
            Typing <TypingIndicator />
          {:else}
            <p>{@html formatText(content)}</p>
            {#if typeof item !== "string" && item.additionalMedia?.type === "image"}
              <InlineImageBlock
                {item}
                {blockId}
                generateImage={(e: any) => generateImage(e.generationMode)}
                removeMedia={() => removeMedia()}
                stopMediaTransacting={() => stopMediaTransacting()}
              />
            {/if}
          {/if}
        </span>
      {/if}
    </Bubble>
  </div></BlockContainer
>
