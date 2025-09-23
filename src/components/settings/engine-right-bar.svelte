<script lang="ts">
  import { onDestroy } from "svelte";
  import LlmSettings from "$components/settings/llm.tab.svelte";
  import SettingsSd from "$components/settings/sd-base.tab.svelte";
  import * as Tabs from "$components/ui/tabs/index.js";
  import { engineSettings } from "$lib/stores/engine";
  import LlmResponse from "./llm-response.tab.svelte";
  import ModelProvider from "./model-provider.tab.svelte";

  //variable to manage open/close sidebar
  async function saveSettings() {
    await engineSettings.save();
  }
  onDestroy(() => {
    // Save settings when the component is destroyed
    saveSettings();
    console.log("SidebarRightGame destroyed, settings saved.");
  });
</script>

<Tabs.Root value="connection" class="w-full">
  <Tabs.List>
    <Tabs.Trigger value="connection">Connection</Tabs.Trigger>
    <Tabs.Trigger value="sd-base">SD Base</Tabs.Trigger>
    <Tabs.Trigger value="llm-settings">LLM Settings</Tabs.Trigger>
    <Tabs.Trigger value="llm-response">LLM Response</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="connection"><ModelProvider /></Tabs.Content>
  <Tabs.Content value="sd-base"><SettingsSd /></Tabs.Content>
  <Tabs.Content value="llm-settings"><LlmSettings {engineSettings} /></Tabs.Content>
  <Tabs.Content value="llm-response"><LlmResponse {engineSettings} /></Tabs.Content>
</Tabs.Root>
