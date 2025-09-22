<script lang="ts">
    import Label from "$components/ui/label/label.svelte";
    import * as RadioGroup from "$components/ui/radio-group";
    import Separator from "$components/ui/separator/separator.svelte";
    import { cn } from "$lib/utilities/utils";
    import CiCircleHelp from "~icons/ci/circle-help";

    interface Props {
        name: string;
        value?: string;
        question?: string;
        options: string[]; // = ['yes', 'no'];
        tooltip?: string | null;
        title?: string;
        errorOnNo?: boolean;
        required?: boolean;
        width?: string;
        onchange?: (value: string) => void;
        [key: string]: any;
    }
    let {
        name,
        value = "",
        question = "",
        options,
        tooltip = null,
        title = "",
        errorOnNo = false,
        required = false,
        width = "w-full",
        onchange = () => {},
        ...rest
    }: Props = $props();

    function changed(e: any) {
        //if (e === value) return;
        value = e;
        if (value) onchange(value);
    }
</script>

<div class={`grid grid-cols-6 gap-4 items-center ${rest.class}`}>
    <!--hidden field to manage forms -->
    <input type="hidden" {name} {value} />
    {#if question}
        <div class="col-span-4 flex items-center gap-2">
            {#if tooltip}
                <span title={tooltip} class="cursor-pointer">
                    <CiCircleHelp class="w-5 text-gray-400" />
                </span>
            {/if}
            <Label class="flex-grow">
                {#if !value && errorOnNo}
                    <span class="text-red-500 text-sm">Required.</span>
                {/if}
                {question}
            </Label>
        </div>
    {/if}
    <div class="col-span-2">
        <RadioGroup.Root
            bind:value
            {name}
            id={name}
            onValueChange={changed}
            class={cn("flex flex-row w-full overflow-hidden rounded-md border border-muted bg-muted/30", width)}
        >
            {#each options as option, i}
                <Label
                    for={`${name}-${option}`}
                    class="flex-1 group relative cursor-pointer py-2 text-center text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-white flex items-center justify-center"
                >
                    <div class="absolute inset-0 bg-primary/0 transition-all"></div>
                    <RadioGroup.Item value={option} id={`${name}-${option}`} class="sr-only" aria-label={`${name}-${option}`} />
                    <span class="relative transition-all duration-200">{option}</span>
                    {#if i < options.length - 1}
                        <Separator orientation="vertical" class="absolute right-0 top-0 bottom-0 h-full" />
                    {/if}
                </Label>
            {/each}
        </RadioGroup.Root>
    </div>
</div>
