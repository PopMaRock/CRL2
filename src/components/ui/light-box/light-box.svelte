<script lang="ts">
	import * as Dialog from "$components/ui/dialog/index.js";

	const cImage = "max-w-[90%] max-h-[90%] rounded-container-token overflow-hidden shadow-xl";
	interface Props {
		image: string;
		source: string;
		isOpen: boolean;
		onClose: () => void;
	}
	let { image, source, isOpen=$bindable(false), onClose }:Props = $props();
	function actionOnClose() {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root bind:open={isOpen} onOpenChange={actionOnClose}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{source}</Dialog.Title>
			<Dialog.Description>
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					src={image}
					class="{cImage} max-h-screen max-w-screen"
					alt="Example"
					title="Source: {source}"
					onclick={()=>{isOpen = false}}
				/>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
