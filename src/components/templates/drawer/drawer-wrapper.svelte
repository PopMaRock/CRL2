<script lang="ts">
	import { Button } from "$components/ui/button";
	import CiCloseCircle from "~icons/ci/close-circle";
	import CiCloseMd from "~icons/ci/close-md";
	import CiCloudUpload from "~icons/ci/cloud-upload";
	import SvgSpinnersTadpole from '~icons/svg-spinners/tadpole';

	interface Props {
		showSave?: boolean;
		showClose?: boolean;
		title?: string;
		form?: HTMLFormElement | null;
		style?: string;
		class?: string;
		onclose?: any;
		onsave?: any;
		children?: any;
		saveBtnText?: string;
		disabled?:boolean;
		loading?:boolean;
	}
	let {
		showSave = false,
		showClose = true,
		title = "",
		form = $bindable(null),
		style = "",
		class: classes = "",
		saveBtnText = "Save",
		onclose,
		onsave,
		disabled=$bindable(false),
		loading=$bindable(false),
		children,
	}: Props = $props();
</script>

<div class={classes ?? `overflow-hidden h-full flex flex-col`} {style}>
    <!-- Modal content -->
    <div class="flex flex-col h-full relative rounded-r-md card">
        <!-- Modal header -->
        <div class="flex items-center justify-between p-2 !pt-0 rounded-t md:px-6 flex-shrink-0">
            <div class="text-xl font-semibold">{title}</div>

            <Button
                type="button"
                size="icon"
                variant="link"
                onclick={onclose}
                data-modal-toggle="kanban-card-modal"
                class="btn ml-auto text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm p-2.5"
            >
                <CiCloseMd class="w-5 h-5" />
            </Button>
        </div>
        <!-- Modal body -->
        <div class="flex-grow p-4 md:p-6 !pt-0 overflow-y-auto">
            <div class="mt-1">
                <form bind:this={form}>
                    {@render children()}
                </form>
            </div>
            {#if loading}
            Hud on. Working...
            {:else}
            &nbsp;
            {/if}
        </div>
        <!-- Modal footer -->
        <div class="grid grid-flow-col grid-rows-2 gap-2 p-4 border-t border-gray-200 rounded-b sm:grid-rows-1 md:p-6 dark:border-gray-600 flex-shrink-0 mt-auto">
            {#if showClose}
                <Button
                    variant="outline"
                    onclick={onclose}
                    type="button"
                    class="inline-flex items-center justify-center btn"
                >
                    <CiCloseCircle class="w-5 h-5 mr-1" />
                    Close
                </Button>
            {/if}
            {#if showSave}
                <Button
                    variant="default"
                    onclick={onsave}
                    type="button"
                    disabled={disabled || loading}
                    class="inline-flex items-center justify-center !py-[1.4em] text-center btn"
                >
                    {#if loading}
                        <SvgSpinnersTadpole class="w-5 h-5 ml-2 animate-spin" />
                        {:else}
                        <CiCloudUpload class="w-5 h-5 mr-1" />
                    {/if}
                    {saveBtnText}
                </Button>
            {/if}
        </div>
    </div>
</div>