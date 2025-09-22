<script lang="ts">
    import { writable } from "svelte/store";
    import { fade } from "svelte/transition";
    import Button from "$components/ui/button/button.svelte";
    import { CharacterStore } from "$lib/engine/engine-character";
    import { cn } from "$lib/utilities/utils";
    import CiArrowsReload01 from "~icons/ci/arrows-reload-01";
    import CiCloseCircle from "~icons/ci/close-circle";
    import CiTrashEmpty from "~icons/ci/trash-empty";

    interface Props {
        item: Conversation;
        blockId: number;
        generateImage: (generationMode: number) => void;
        stopMediaTransacting: () => void;
        regenerate?: () => void;
        deleteMedia?: () => void;
    }
    const { item, blockId, generateImage = () => {}, deleteMedia=()=>{}, stopMediaTransacting, regenerate = () => {} } = $props() as Props;
    const imgSrc = $derived(`/api/filesystem/images?hash=${$CharacterStore.hash}&mode=characters&filename=${item?.additionalMedia?.url}`);
    const isHover = writable(false);
    let modal: any;
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    onmouseenter={() => {
        isHover.set(true);
    }}
    onmouseleave={() => {
        isHover.set(false);
    }}
>
    <div id={`inlineImageBlock${blockId}`} class={cn("w-full overflow-hidden", $isHover && "bg-sky-300/10")}>
        {#if item?.additionalMedia?.transacting}
            <!-- loading so push same size with a radial progress spinner horizontal and veritcally center -->
            <div
                class="w-[89%] h-96 overflow-hidden relative rounded-xl mr-10 pr-4 bg-gradient-to-br variant-gradient-primary-secondary opacity-60 transition-all duration-300 hover:bg-transparent hover:opacity-95 cursor-pointer"
            >
                <div class="top-0 left-0 w-full h-full flex items-center justify-center relative">
                    <div class="w-12 h-12 rounded-full relative">
                        <!-- FIXME: add progress bar -->
                        <Button
                            type="button"
                            title="Delete message"
                            class="absolute inset-0 flex items-center justify-center !z-20"
                            onclick={(e: any) => {
                                e.stopPropogation();
                                stopMediaTransacting();
                            }}
                        >
                            <CiCloseCircle class="w-20 text-error-600 hover:text-error-600" />
                        </Button>
                    </div>
                </div>
            </div>
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                class="w-[89%] h-96 overflow-hidden relative rounded-xl mr-10 pr-4 bg-gradient-to-br variant-gradient-primary-secondary opacity-60 transition-all duration-300 hover:bg-transparent hover:opacity-95 cursor-pointer"
                onclick={(e: any) => {
                    e.stopPropagation();
                    //raise model //FIXME
                }}
            >
                <!-- svelte-ignore a11y_img_redundant_alt -->
                <img src={imgSrc} alt="Image" class="top-0 left-0 w-full h-full object-cover" style="object-position: center 30%;" />
            </div>
            {#if $isHover}
                <div
                    transition:fade
                    class="relative top-0 right-0 m-2 z-20 flex items-center space-x-2 text-surface-400 p-2 bg-black bg-opacity-50 rounded-lg"
                    style="backdrop-filter: blur(2px);"
                >
                    <button
                        type="button"
                        title="Regenerate"
                        class="p-1 hover:text-secondary-600"
                        onclick={(e: any) => {
                            e.stopPropogation();
                            regenerate();
                        }}
                    >
                        <CiArrowsReload01 class="w-20" />
                    </button>
                    <button
                        type="button"
                        title="Delete message"
                        class="p-1 hover:text-error-600"
                        onclick={(e: any) => {
                            e.stopPropagation();
                            deleteMedia();
                        }}
                    >
                        <CiTrashEmpty class="w-20" />
                    </button>
                </div>
            {/if}
        {/if}
    </div>
</div>
