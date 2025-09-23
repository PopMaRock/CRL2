<script lang="ts">
	import CharacterImageManage from "$components/settings/character/parts/character-image-manage.svelte";
    import Button from "$components/ui/button/button.svelte";
    import Input from "$components/ui/input/input.svelte";
	import Textarea from "$components/ui/textarea/textarea.svelte";
	import { interactiveSd } from "$lib/controllers/sd";
	import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
	import { generationMode } from "$lib/stores/sd.store";
	import { getTags } from "$lib/transformers/csr/wd-tagger";
	import { toastrPromise } from "$lib/ui/toastr";
	import { DebugLogger } from "$lib/utilities/error-manager";
	import { ensureCharacterImageBase64, getHeadshot, removeBg } from "$lib/utilities/image-utils";
	import CiCheckAll from "~icons/ci/check-all";
	import CiCloseCircle from "~icons/ci/close-circle";
	import EmojioneMonotonePileOfPoo from "~icons/emojione-monotone/pile-of-poo";

	let facePadding = 70;
	let characterFileInput: HTMLInputElement;
	let backgroundFileInput: HTMLInputElement;

	const handleCharacterImageChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = async () => {
				const base64 = reader.result as string;
				// save the raw avatar so that getHeadshot works on it
				$CharacterStore.images.avatar = base64;
				// generate the headshot (which may alter other parts, e.g. images.face)
				await getHeadshot(base64, facePadding);
				// now enforce a ratio of 0.72 and a minimum height of 530 (without stretching)
				const avatarBase64 = $CharacterStore.images.avatar;
				const img = new Image();
				img.src = avatarBase64;
				img.onload = () => {
					const desiredRatio = 0.72;
					let { width: imgWidth, height: imgHeight } = img;
					// If the image is lower than our minimum height, we leave it as is.
					if (imgHeight < 500) return;
					// Ideally, our crop should use the full height of the image
					let targetHeight = imgHeight;
					let targetWidth = targetHeight * desiredRatio;
					// If the calculated width exceeds the image dimensions, adjust using the width.
					if (targetWidth > imgWidth) {
						targetWidth = imgWidth;
						targetHeight = targetWidth / desiredRatio;
					}
					// Ensure that our crop is not below the minimum height.
					if (targetHeight < 500) {
						targetHeight = 500;
						targetWidth = targetHeight * desiredRatio;
						// In case these dimensions are larger than available, fallback to original dimensions.
						if (targetWidth > imgWidth || targetHeight > imgHeight) {
							targetWidth = imgWidth;
							targetHeight = imgHeight;
						}
					}
					// Center-crop calculations.
					const cropX = (imgWidth - targetWidth) / 2;
					const cropY = (imgHeight - targetHeight) / 2;
					const canvas = document.createElement("canvas");
					canvas.width = targetWidth;
					canvas.height = targetHeight;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(img, cropX, cropY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
						$CharacterStore.images.avatar = canvas.toDataURL();
					}
				};
			};
			reader.readAsDataURL(file);
		}
	};
	const handleBackgroundImageChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			const reader = new FileReader();
			reader.onload = () => {
				const base64 = reader.result as string;
				const img = new Image();
				img.src = base64;
				img.onload = () => {
					const desiredRatio = 0.74; // width / height ratio
					const { width, height } = img;
					let cropX = 0;
					let cropY = 0;
					let cropWidth = width;
					let cropHeight = height;

					if (width / height > desiredRatio) {
						// Image is too wide; crop horizontally.
						cropWidth = height * desiredRatio;
						cropX = (width - cropWidth) / 2;
					} else {
						// Image is too tall; crop vertically.
						cropHeight = width / desiredRatio;
						cropY = (height - cropHeight) / 2;
					}

					const canvas = document.createElement("canvas");
					canvas.width = cropWidth;
					canvas.height = cropHeight;
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
						$CharacterStore.images.backgroundAvatar = canvas.toDataURL();
					}
				};
			};
			reader.readAsDataURL(file);
		}
	};
	async function WDtagger(type: string) {
		let image = "";
		if (type === "face") {
			image = $CharacterStore.images.face;
		} else if (type === "avatar") {
			//prefer transparent avatar.
			image = $CharacterStore.images.transparentAvatar || $CharacterStore.images.avatar;
		} else {
			DebugLogger.warn("No image type passed", { toast: true });
			return;
		}
		if (!image) {
			DebugLogger.warn("No image file found", { toast: true });
			return;
		}
		image = await ensureCharacterImageBase64(image, $CharacterStore.charId);
		//TODO: These toast promises are a god damn mess. Refactor this in the year 2035-ish (if reading this in 2035, add 20 years)
		await toastrPromise({
			messages: {
				loading: "Trying to get tags",
				success: (data: any) => {
					const tags = data;
					console.log("WD Tagger result:", tags);
					if (type === "face") {
						$CharacterStore.faceCaption = Array.isArray(tags) ? tags.map((tag) => tag.label).join(", ") : ""; //reset face caption
					} else if (type === "avatar") {
						// prevent duplicate tags (normalize to lowercase and trim)
						const faceTags = $CharacterStore.faceCaption
							.split(",")
							.map((tag) => tag.trim().toLowerCase())
							.filter((tag) => tag.length > 0);
						const bodyTags = $CharacterStore.bodyCaption
							.split(",")
							.map((tag) => tag.trim().toLowerCase())
							.filter((tag) => tag.length > 0);
						const existingTags = bodyTags.concat(faceTags);
						const newTags = Array.isArray(tags)
							? tags
									.map((tag) => tag.label.trim())
									.filter((tag) => tag.length > 0)
									.filter((tag) => !existingTags.includes(tag.toLowerCase()))
							: [];
						// append new tags to existing body caption
						if (newTags.length > 0) {
							$CharacterStore.bodyCaption += ($CharacterStore.bodyCaption ? ", " : "") + newTags.join(", ");
						}
					}
					return "Completed getting tags";
				},
				error: "Failed to get tags",
			},
			promiscuous: getTags(image),
		});
	}
	async function downloadImage(image: string) {
		const a = document.createElement("a");
		a.href = image;
		a.download = "image.png";
		a.click();
	}
	async function generateBackground() {
		//invoke interactiveSD
		let data: string | unknown = await interactiveSd(generationMode.BACKGROUND, "sdxl");
		if (typeof data === "string" && data) {
			// check to see if it has base64 image mime string at the start and if not add it
			if (!data.startsWith("data:image/png;base64,")) {
				data = `data:image/png;base64,${data}`;
			}
			$CharacterStore.images.backgroundAvatar = data as string; //shut it typescript.
		}
	}
</script>

<div class="pt-4">
	<div class="grid grid-cols-3 gap-4 p-4">
		<CharacterImageManage bind:imageSrc={$CharacterStore.images.avatar}>
			<div>
				<Button variant="link" class="text-slate-400 text-sm font-semibold" onclick={() => characterFileInput.click()}>Upload a image</Button>
			</div>
			{#if $CharacterStore?.images?.avatar}
				<div>
					<Button variant="link" class="text-slate-400 text-sm font-semibold" onclick={() => downloadImage($CharacterStore.images.avatar)}>Download</Button>
				</div>
			{/if}
			<Button variant="link" class="text-slate-400 text-sm font-semibold" onclick={async () => await removeBg($CharacterStore.images.avatar, "avatar")}
				>Remove background</Button
			>
		</CharacterImageManage>
		<CharacterImageManage imageSrc={$CharacterStore.images.face}>
			<div>
				<Input
					type="number"
					name="padding"
					class="input"
					max="100"
					min="0"
					step="1"
					title="This is face padding. Increase it and press (Re)Generate to expand crop."
					bind:value={facePadding}
				/>
			</div>
			<div>
				<Button class="text-xs font-semibold" onclick={async () => getHeadshot($CharacterStore.images.avatar, facePadding)}
					>(Re)Generate</Button
				>
			</div>
			{#if $CharacterStore.images.face}
				<div>
					<Button class="text-sm font-semibold" onclick={() => downloadImage($CharacterStore.images.face)}>Download</Button>
				</div>
			{/if}
		</CharacterImageManage>
		<CharacterImageManage imageSrc={$CharacterStore.images.backgroundAvatar}>
			<div><Button size="sm" variant="link" class="text-slate-400 text-xs font-semibold" onclick={() => backgroundFileInput.click()}>Upload a background image</Button></div>
			{#if $CharacterSettingsStore.sd}
				<div><Button variant="link" class="text-slate-400 text-xs font-semibold" onclick={async () => generateBackground()}>Generate</Button></div>
			{/if}

			<!--<span class="text-sm">Generate background image</span>-->
		</CharacterImageManage>
	</div>
	<div class="flex items-center gap-2">
		<span class={$CharacterStore?.images?.transparentAvatar ? "text-green-500" : "text-red-500"}>
			{#if $CharacterStore?.images?.transparentAvatar}
				<CiCheckAll class="w-8" />
			{:else}
				<CiCloseCircle class="w-8" />
			{/if}
		</span>
		<span>Transparent avatar</span>
	</div>
	<input type="file" accept="image/*" bind:this={characterFileInput} onchange={handleCharacterImageChange} class="hidden" />
	<input type="file" accept="image/*" bind:this={backgroundFileInput} onchange={handleBackgroundImageChange} class="hidden" />
	<Textarea
		name="characterFaceCaption"
		label={`${$CharacterStore?.name || "Cunt"}'s Face Caption`}
		title=""
		bind:value={$CharacterStore.faceCaption}
		showActionButton={true}
		actionButtonTitle="See if WDTagger will list keywords for you."
		actionButtonIcon={EmojioneMonotonePileOfPoo}
		on:action={async () => WDtagger("face")}
		placeholder="Enter description keywords to describe face. Like: freckles,droopy eyes,brown hair,ginger beard,blue eyes. If using Flux image gen then write in natural language instead."
	/>
	<Textarea
		name="characterBodyCaption"
		label={`${$CharacterStore?.name || "Cunt"}'s Body Caption`}
		title=""
		showActionButton={true}
		actionButtonTitle="See if WDTagger will list keywords for you."
		actionButtonIcon={EmojioneMonotonePileOfPoo}
		on:action={async () => WDtagger("avatar")}
		bind:value={$CharacterStore.bodyCaption}
		placeholder="Enter descriptive keywords to describe body like: man boobs,beer belly,weak arms,anime t-shirt,jeans. If using Flux image gen then write in natural language instead."
	/>
</div>
