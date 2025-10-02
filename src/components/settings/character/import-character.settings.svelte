<script lang="ts">
    import { onMount } from "svelte";
    import DrawerWrapper from "$components/templates/drawer/drawer-wrapper.svelte";
    import { FileDropZone } from "$components/ui/file-drop-zone";
    import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
    import { Gamemode } from "$lib/global";
    import { importFile, importURL } from "$lib/ui/import-character";
    import { DebugLogger } from "$lib/utilities/error-manager";

    interface Props {
        close?: any;
        created?: any;
    }
    let loading = $state(false);
    let disabled = $state(false);
    const { close: _close, created: _created }: Props = $props();
    let daUrl = $state("");
    let daFile: File | undefined = $state();
    //--------------------------------------------------------------------------------
    onMount(async () => {
        DebugLogger.debug("Import Cunt");
        // Remove focus from any element to stop wanky default focuses on buttons.
        (document.activeElement as HTMLElement)?.blur();
        Gamemode.set("characters");
    });
    async function importProcessing() {
        try {
            loading = true;
            let charData: any;
            if (daUrl && daUrl.length > 0) {
                const match = daUrl.match(/^https:\/\/www\.characterhub\.org\/characters\/([^\/\s]+)\/([^\/\s]+)\/?$/i);
                if (!match) {
                    return DebugLogger.warn(
                        "Invalid URL format. Use https://www.characterhub.org/characters/<username>/<slug>",
                        { toast: true }
                    );
                }
                try {
                    charData = await importURL(daUrl);
                } catch (err) {
                    DebugLogger.error(err, { toast: true });
                    return;
                }
            } else if (daFile) {
                try {
                    charData = await importFile(daFile);
                } catch (err) {
                    DebugLogger.error(err, { toast: true });
                    return;
                }
            } else {
                return DebugLogger.warn("Please provide a valid URL or upload a file to import.", { toast: true });
            }
            if (!charData) {
                return DebugLogger.warn("No character data extracted.", { toast: true });
            }
            _created();
        } catch (error) {
            DebugLogger.error(error, { toast: true });
        } finally {
            loading = false;
        }
    }
    function updateFile(e: any) {
        if (e.length === 0 || e.length > 1) return;
        daUrl = "";
        daFile = e[0];
        console.log("File updated:", daFile?.name);
        console.log(daFile);
        DebugLogger.debug(daFile);
    }
    function updateUrl(e: any) {
        if (daFile) daFile = undefined;
    }
</script>

<DrawerWrapper
    class="overflow-x-hidden h-full"
    showSave={true}
    showClose={true}
    bind:loading
    bind:disabled
    title={`Import Cunt`}
    onclose={() => {
        if (_close) _close();
    }}
    onsave={importProcessing}
    saveBtnText={"Add"}
>
    <span class="h5 font-semibold text-md">Complete <span class="text-destructive">one</span> then press the button.</span>
    <TextboxGroup
        label="Import URL"
        name="daUrl"
        type="text"
        class="mt-4"
        bind:value={daUrl}
        change={updateUrl}
        placeholder="https://www.characterhub.org/characters/<username>/<slug>"
        iconHelp={true}
        helpText={`Enter characterhub.org url`}
    />
    <br />
    <div class="pb-8">
        <FileDropZone
            id="files"
            name="files"
            class="rounded-md min-h-36"
            maxFiles={1}
            fileCount={0}
            maxFileSize={1024000}
            accept="image/*"
            onFileRejected={(e) => {
                DebugLogger.warn("File rejected:", e, { toast: true });
            }}
            ondrop={(e) => {
                //@ts-ignore - Shut. The. Fuck. Up. TS
                e.currentTarget.focus();
            }}
            onUpload={async (e) => updateFile(e)}
        >
            {#if daFile}
                <span class="text-slate-500 font-bold text-lg">{daFile.name}</span>
            {:else}
                {"Upload a file that contains your cunt."}
            {/if}
        </FileDropZone>
    </div>
</DrawerWrapper>
