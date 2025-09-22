<script lang="ts">
  import { fade } from "svelte/transition";
  import * as Accordion from "$components/ui/accordion/index.js";
  import { Label } from "$components/ui/label";
  import SlideToggle from "$components/ui/slide-toggle/slide-toggle.svelte";
  import Textarea from "$components/ui/textarea/textarea.svelte";
  import TextboxGroup from "$components/ui/textbox-group/textbox-group.svelte";
  import { CharCreatePrompts } from "$lib/constants/prompts/character-creation";
  import { CharacterSettingsStore, CharacterStore } from "$lib/engine/engine-character";
  import { generateCharDetails } from "$lib/engine/engine-llm";
  import { toastrPromise } from "$lib/ui/toastr";
  import CiCircleHelp from "~icons/ci/circle-help";
  import EmojioneMonotonePileOfPoo from "~icons/emojione-monotone/pile-of-poo";
    import Separator from "$components/ui/separator/separator.svelte";
    import { ucwords } from "$lib/utilities/utils";

  //---
  interface Props {
    allowGameImageSelect?: boolean;
  }
  const { allowGameImageSelect: _allowGameImageSelect = false }: Props = $props();

  const loader: any = {
    description: false,
    background: false,
    personality: false,
    traits: false,
    goal: false,
    firstMsg: false,
  };
  //const response = readablestreamStore();
  async function loadFromLlm(action: string) {
    $CharacterSettingsStore.llmResponseSettings.maxTokens = null;
    const mapping: any = {
      description: { prompt: CharCreatePrompts.description, key: "description" },
      background: { prompt: CharCreatePrompts.background, key: "background" },
      strengths: { prompt: CharCreatePrompts.strengths, key: "strengths" },
      flaws: { prompt: CharCreatePrompts.flaws, key: "flaws" },
      goal: { prompt: CharCreatePrompts.goal, key: "goal" },
      firstMsg: { prompt: CharCreatePrompts.firstMsg, key: "firstMsg" },
    };

    const m = mapping[action];
    console.log("loadFromLlm called with action", action, "mapping", m);
    if (m) {
      loader[m.key] = true;
      try {
        const resp = await toastrPromise({
          messages: {
            loading: `Generating ${m.key}...`,
            success: (data: any) => {
              console.log("Generated response for", m.key, ":", data);
              CharacterStore.update((store) => {
                (store as any)[m.key] = data;
                return store;
              });
              return "Generated successfully";
            },
            error: `Failed to get ${m.key} from LLM `,
          },
          promiscuous: generateCharDetails(m.prompt, action),
        });
      } finally {
        loader[m.key] = false;
      }
    }
  }
</script>

{#if _allowGameImageSelect}
  <!-- thing for the thing -->
{/if}
  <span class="leading-none text-sm"
    >Use these boxes to form a reason for your cunt to exist. These will be injected into the prompt however, you can ultimately
    change the prompt in LLMSettings. Follow this, don't follow this. Who cares.</span
  >
  <Separator class="mt-2"/>
  <TextboxGroup
    type="text"
    label="The Cunt's Name"
    name="characterName"
    class="mb-4 mt-4"
    title="Enter the name of the character"
    value={$CharacterStore?.name}
    change={(e)=>($CharacterStore.name = ucwords(e))}
    iconHelp={true}
    helpText="Keep it simple. 'Titty McGee of the South Side of Your Father's Arse Crack' is probably not a suitable name."
  />
  {#if $CharacterStore?.name}
    <div transition:fade>
      <Textarea
        name="characterDescription"
        label={`Description of ${$CharacterStore.name || "The Cunt"}.`}
        title=""
        class="!pb-0 !mb-0"
        bind:value={$CharacterStore.description}
        placeholder="Enter a description of your character. I know you really, really want to put visual descriptions in here to the point it hurts, but don't. They're on the next page."
        allowResize={true}
        on:action={async () => loadFromLlm("description")}
        loading={loader.description}
        showActionButton={true}
        actionButtonTitle="Get your slop machine to generate a random description"
        actionButtonIcon={EmojioneMonotonePileOfPoo}
      />
      <Textarea
        name="characterBackground"
        label={`Back story of ${$CharacterStore.name || "The Cunt"}.`}
        title=""
        class="!pb-0 !mb-0"
        value={$CharacterStore?.background}
        on:blur={(event) => ($CharacterStore.background = event?.detail)}
        placeholder="Enter a background of your character. Who they are, what they do, how they know the &#123;&#123;user&#125;&#125;"
        on:action={async () => loadFromLlm("background")}
        loading={loader.background}
        showActionButton={true}
        actionButtonTitle="Get your shit chruner to generate a random background"
        actionButtonIcon={EmojioneMonotonePileOfPoo}
      />
      <div class="grid grid-cols-2 gap-2">
        <Textarea
          name="characterStrengths"
          label={`Strengths of ${$CharacterStore.name || "The Cunt"}.`}
          title=""
          class="!pb-0 !mb-0"
          value={$CharacterStore.strengths?.join(", ")}
          on:blur={(event) => {
            const value = event?.detail;
            $CharacterStore.strengths = value
              .split(",")
              //@ts-ignore
              .map((trait) => trait.trim())
              //@ts-ignore
              .filter((trait) => trait.length > 0);
            console.log($CharacterStore.strengths);
          }}
          on:action={async () => loadFromLlm("strengths")}
          loading={loader.strengths}
          showActionButton={true}
          actionButtonTitle="Get your skitter producer to generate a random personality strengths"
          actionButtonIcon={EmojioneMonotonePileOfPoo}
          placeholder="Optimistic, scatterbrained, dramatic, adaptable, passionate, adventurous, eager, careless, foolhardy, expressive, awkward, unpredictable, emotionally impulsive"
        />
        <Textarea
          name="characterTraits"
          label={`Flaws of ${$CharacterStore.name || "The Cunt"}.`}
          title=""
          class="!pb-0 !mb-0"
          value={$CharacterStore.flaws?.join(", ")}
          on:blur={(event) => {
            const value = event?.detail;
            $CharacterStore.flaws = value
              .split(",")
              //@ts-ignore
              .map((trait) => trait.trim())
              //@ts-ignore
              .filter((trait) => trait.length > 0);
            console.log($CharacterStore.flaws);
          }}
          on:action={async () => loadFromLlm("flaws")}
          loading={loader.flaws}
          showActionButton={true}
          actionButtonTitle="Get your 'AI' to give you some dog shit character flaws"
          actionButtonIcon={EmojioneMonotonePileOfPoo}
          placeholder="Exceptionally unlucky, clumsy, total idiot, quick to panic, bad liar, oddly resilient, bad at magic"
        />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <TextboxGroup
          type="text"
          class="!mb-0 !pb-0"
          label={`${$CharacterStore.name || "The Cunt"}'s Gender.`}
          name="characterGender"
          title="Enter the gender of the character"
          bind:value={$CharacterStore.gender}
          iconHelp={true}
          helpText="Be creative. No one is watching! ...so long as you turned off all the telemetry....."
        />
        <TextboxGroup
          type="number"
          label={`${$CharacterStore.name || "The Cunt"}'s Age.`}
          name="characterAge"
          class="!mb-0 !pb-0"
          title="Enter the age of the character"
          bind:value={$CharacterStore.age}
          iconHelp={true}
          helpText="Age is just a number...that you should put in here."
        />
      </div>
      <Textarea
        name="characterGoal"
        label={`${$CharacterStore.name || "The Cunt"}'s Goal.`}
        title=""
        value={$CharacterStore.goals?.join("\n#")}
        on:action={async () => loadFromLlm("goal")}
        on:blur={(event) => {
          const value = event?.detail;
          $CharacterStore.goals = value
            .split("#")
            //@ts-ignore
            .map((goal) => goal.trim())
            //@ts-ignore
            .filter((goal) => goal.length > 0);
          console.log($CharacterStore.goals);
        }}
        loading={loader.goal}
        showActionButton={true}
        actionButtonTitle="Get your LLM to generate a random goal. Seperate by # if you want multiple goals."
        actionButtonIcon={EmojioneMonotonePileOfPoo}
        placeholder="Enter goal of the character. Preferably without a bunch of fluff like: To create the most successful adventuring agency in all of Scotland! (And pay off her debt)"
      />
      <Textarea
        name="characterFirstMsg"
        label={`${$CharacterStore.name || "The Cunt"}'s First Message.`}
        title=""
        bind:value={$CharacterStore.firstMsg}
        on:action={async () => loadFromLlm("firstMsg")}
        loading={loader.firstMsg}
        showActionButton={true}
        actionButtonTitle="Get your horse shit producer to generate a random first message"
        actionButtonIcon={EmojioneMonotonePileOfPoo}
        placeholder="Enter first message from character in Converse mode (ignored in Dungeon)"
      />
    </div>
  {/if}
  <Separator class="hr mt-4" />

  <div>
    <SlideToggle
      name="sd"
      class="mt-4"
      options={["enabled", "disabled"]}
      value={$CharacterStore?.sd ? "enabled" : "disabled"}
      onchange={(e) => ($CharacterStore.sd = e === "enabled")}
      question="Image generation"
      size="sm"/>
  </div>
  <div>
    <SlideToggle
      name="vo"
      class="mt-4"
      size="sm"
      options={["enabled", "disabled"]}
      question="Voice-over"
      value={$CharacterStore?.vo ? "enabled" : "disabled"}
      onchange={(e) => ($CharacterStore.vo = e === "enabled")}/>
  </div>
  <Separator class="mt-4" />
  <!--<div>
 <SlideToggle
    name="convertToUkEnglish"
    active="variant-filled-primary"
    class="mt-4"
    size="sm"
    bind:checked={$DungeonGameSettingsStore.llmTextSettings.convertToUkEnglish}
    >Translate to Traditional English is {$DungeonGameSettingsStore
      .llmTextSettings.convertToUkEnglish
      ? "on"
      : "off"}</SlideToggle
>
</div>-->
  <Accordion.Root type="single">
    <Accordion.Item value="item-1">
      <Accordion.Trigger>Advanced</Accordion.Trigger>
      <Accordion.Content>
          <SlideToggle
            name="memoryBank"
            active="variant-filled-primary"
            class="mt-4"
            size="sm"
            options={["on", "off"]}
            value={$CharacterSettingsStore.llmTextSettings.memoryBank ? "on" : "off"}
            onchange={(e) => ($CharacterSettingsStore.llmTextSettings.memoryBank = e === "on")}
            question="A-MEM Context"
          />
          <SlideToggle
            name="convertToUkEnglish"
            active="variant-filled-primary"
            class="mt-4"
            size="sm"
            options={["start", "middle"]}
            question="Truncate history from..."
            value={$CharacterSettingsStore.llmTextSettings.historyTruncate}
            onchange={(e: any) => ($CharacterSettingsStore.llmTextSettings.historyTruncate = e)}
          />
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
