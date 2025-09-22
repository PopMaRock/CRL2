<script lang="ts">
    import { fade } from "svelte/transition";
    import { goto } from "$app/navigation";
    import * as DropdownMenu from "$components/ui/dropdown-menu/index.js";
    import { DebugLogger } from "$lib/utilities/error-manager";
    import CiMoreVertical from "~icons/ci/more-vertical";

    interface Props {
        index: number;
        char: any;
        delete: (e: any) => void;
        hideToggle: (charId: number) => void;
    }
    const { index: _index, char: _char, delete: _delete = () => {}, hideToggle: _hideToggle = () => {} }: Props = $props();

    let pishAndPoop: any[] = [];
    let updating = false;
    $effect(() => {
        console.log("Character Card Rendered", _char);
        if (!updating && pishAndPoop.length > 0) {
            DebugLogger.debug(pishAndPoop);
            updating = true;
            pishAndPoop = [];
            updating = false;
        }
    });
</script>

<div class="block card snap-start h-[40vh] overflow-hidden relative">
    <div class=" inset-0 bg-gradient-to-br variant-gradient-primary-secondary opacity-10 pointer-events-none"></div>
    <header
        class="h-full relative w-full"
        style="background-image: url({`/api/filesystem/images?id=${_char.id}&mode=characters&filename=backgroundAvatar.png`}); background-size: cover; background-position: center; height: 100%;"
    >
        <!-- Gradient Overlay for Header -->
        <div class="absolute inset-0 bg-gradient-to-br variant-gradient-primary-secondary opacity-30 pointer-events-none"></div>

        <div
            class="absolute top-0 left-0 p-2 pl-4 text-white w-full bg-gradient-to-b from-black/30 via-black/30 to-transparent flex items-center justify-between"
        >
            <div>
                <span class="font-bold text-xs"><!-- holder for creator name --></span>
                <span class="font-bold text-xs">{_char?.lastPlayed} ago</span>
            </div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger><CiMoreVertical class="w-5 h-5" /></DropdownMenu.Trigger>
                <DropdownMenu.Content>
                    <DropdownMenu.Group>
                        <DropdownMenu.Item onclick={() => _hideToggle(_char.id)}>{_char.hidden ? "Unhide" : "Hide"}</DropdownMenu.Item>
                        <DropdownMenu.Item onclick={() => DebugLogger.debug("not yet implemented", { toast: true })}
                            >Export</DropdownMenu.Item
                        >
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item class="text-destructive" onclick={() => _delete(_char.id)}>Delete</DropdownMenu.Item>
                    </DropdownMenu.Group>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
        <div id="CharacterCard">
            <button class="card top-[2rem]" onclick={() => goto(`/CRL/characters/converse/${_char.id}`)}>
                <div class="wrapper">
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
                        transition:fade={{ duration: 1300 }}
                        class="cover-image"
                    />
                    <h3 class="title h3" style="text-shadow: 4px 4px 6px rgba(0, 0, 0, 0.5)">{_char.name ?? "Dave The Gypsy"}</h3>
                </div>

                <img
                    src={`/api/filesystem/images?id=${_char.id}&mode=characters&filename=transparentAvatar.png`}
                    class="character"
                    alt={_char.name}
                />
            </button>
        </div>
    </header>
</div>
