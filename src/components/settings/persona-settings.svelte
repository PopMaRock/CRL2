<script lang="ts">
  import { onMount, tick } from "svelte";
  import DrawerWrapper from "$components/templates/drawer/drawer-wrapper.svelte";
  import * as Avatar from "$components/ui/avatar";
  import Textarea from "$components/ui/textarea/textarea.svelte";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
  import { EnginePersonaStore } from "$lib/engine/engine-persona";
  import { DebugLogger } from "$lib/utilities/error-manager";
    import { preventDefault } from "svelte/legacy";
    import Button from "$components/ui/button/button.svelte";

  interface Props {
    disabled?: boolean;
    loading?: boolean;
    close?: any;
  }
  let { close: _close = () => {}, disabled: _disabled = $bindable(false), loading: _loading = $bindable(false) }: Props = $props();
  //------------------------------------------------------------------
  let personaFileInput: HTMLInputElement;
  onMount(async () => {
    await EnginePersonaStore.get(); //should get the data from the database
  });

  async function savePersona() {
    if (!$EnginePersonaStore.persona) {
      return DebugLogger.warn("Add your name if you want to save a persona", { toast: true });
    }
    await EnginePersonaStore.setAndPersist();
    await tick();
    _close();
  }
  const handlePersonaImageChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target || !target?.files) return DebugLogger.error("No image found changing persona", { toast: true });
    const file = target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        //need to pass base64 data to uploadBase64Image()
        const base64 = e.target.result as string;
        await EnginePersonaStore.uploadBase64Image(base64);
      };
      reader.readAsDataURL(file);
    }
  };
</script>

<DrawerWrapper
  class="overflow-x-hidden h-full"
  showSave={true}
  showClose={true}
  bind:loading={_loading}
  bind:disabled={_disabled}
  title={`Import Cunt`}
  onclose={async () => {
    await tick();
    await savePersona();
    if (_close) _close();
  }}
  onsave={savePersona}
  saveBtnText={"Save"}
>
  <input type="file" accept="image/*" bind:this={personaFileInput} onchange={handlePersonaImageChange} class="hidden" />
  <Button variant="ghost" class="!p-0 mb-2 flex rounded-full" title="User" onclick={(e:any) => { preventDefault(e); personaFileInput.click();}}>
    <Avatar.Root class="h-12 w-12 rounded-full">
      <Avatar.Image
        src={$EnginePersonaStore.personaImage
          ? `/api/filesystem/images?filename=${$EnginePersonaStore.personaImage}&pathOverride=/`
          : "https://images.unsplash.com/photo-1617296538902-887900d9b592?ixid=M3w0Njc5ODF8MHwxfGFsbHx8fHx8fHx8fDE2ODc5NzExMDB8&ixlib=rb-4.0.3&w=128&h=128&auto=format&fit=crop"}
        alt=""
      />
      <Avatar.Fallback>CN</Avatar.Fallback>
    </Avatar.Root>
  </Button>
  <TextboxGroup name="persona" label="Persona" type="text" bind:value={$EnginePersonaStore.persona} />
  <Textarea
    name="personaDesc"
    label="Persona Description"
    title="Enter a description for your persona"
    class="input"
    bind:value={$EnginePersonaStore.personaDesc}
    placeHolder={"Example: {{user}} is a 25 year old Scottish male goth maniac with a twitch and short temper"}
  />
</DrawerWrapper>
