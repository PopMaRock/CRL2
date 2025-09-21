<script lang="ts">
  import { fade } from "svelte/transition";
  import { Button } from "$components/ui/button";
  import CharacterVerticalCarousel from "$components/ui/character/character-vertical-carousel.svelte";
  import { PUBLIC_DEBUG } from "$env/static/public";
  import { llmEmbeddings, llmEvolution, llmGenerateTags, llmSentiment, llmSummarise, llmTokens } from "$lib/controllers/llm";
  import { getTags } from "$lib/transformers/csr/wd-tagger";
  import { toBase64 } from "$lib/utilities/sd-utils";
  import { ucwords } from "$lib/utilities/utils";

  async function testContext() {
    // Run the game sessio
  }
  async function testEmbedding() {
    // This is a placeholder for testing embedding functionality
    const resp = llmEmbeddings("This is a test input for embedding.");
    const result = await resp;
    console.log("Embedding result:", result);
  }
  async function testSentiment() {
    const resp = llmSentiment("I like typescript so much I want to kill myself and take microsoft with me.");
    const result = await resp;
    console.log("Sentiment result:", result);
  }
  async function testSummarise() {
    // This is a placeholder for testing summarisation functionality
    const resp = await llmSummarise(`Instagram
A mix of broad and niche hashtags improves post reach. Placement in the caption or comments affects visibility. Limiting usage to 5–10 targeted tags prevents penalties. Recent changes in Instagram’s algorithm prioritize context, so selecting hashtags that closely match content makes a difference.

TikTok
Trending hashtags drive discovery, but relevance matters. Overusing general hashtags reduces engagement. Hashtags that match content trends increase visibility on the For You page. TikTok’s algorithm favors content that sparks interaction, so hashtags should encourage comments and shares.

X (Twitter)
One or two well-placed hashtags improve engagement. Overuse limits reach. Popular event hashtags increase visibility in live conversations. Using platform-specific trending topics helps posts gain traction."
Keywords: hashtags,seo,instagram,algorithm,tiktok,twitter
Tags: seo,website help,social media
Metadata: no metadata`);
    console.log("Summarisation result:", resp);
  }
  async function testTags() {
    const prompt = `Analyze this content and generate 3-5 categorical tags that capture its semantic meaning only. Tags must be unique and focused on themes, emotions, actions, locations, relationships, or story elements. Content: Former queen of Arendelle, now travels the world mastering her ice powers`;
    const context = `{"character":"Elsa","aspect":"background","amem_type":"character_definition"}\n`;
    const resp = await llmGenerateTags({ prompt });
    console.log("Tags result:", resp);
  }

  async function testEvolution() {
    const newMemory = `Content: A wise and mysterious ice mage with a strong sense of duty, Summary: The ice mage, cloaked in a frosty cape, has spent centuries mastering the ancient arts of cold and manipulation. Their steadfast duty to preserve the balance of nature contrasts sharply with their unyielding sense of responsibility for protecting the innocent from chaos. The mage fears nothing more than the degradation of the natural order, and guards it with the vigilance of a dragon. As the seasons ebb and flow, their wisdom guides all beneath the stars, yet their secrets remain locked in the frozen labyrinth of their mind, waiting for the day when the yin and yang must once again collide within this wondrous dance of balance and consequence. \n Keywords: "["wise","mysterious","mage","with","strong","sense","duty"]",\nTags: "["mysterious","strong","sense","conversation","character"]\\n`;
    const existingMemory = `Content: A wise and mysterious ice mage with a strong sense of duty, Summary: The ice mage, cloaked in a frosty cape, has spent centuries mastering the ancient arts of cold and manipulation. Their steadfast duty to preserve the balance of nature contrasts sharply with their unyielding sense of responsibility for protecting the innocent from chaos. The mage fears nothing more than the degradation of the natural order, and guards it with the vigilance of a dragon. As the seasons ebb and flow, their wisdom guides all beneath the stars, yet their secrets remain locked in the frozen labyrinth of their mind, waiting for the day when the yin and yang must once again collide within this wondrous dance of balance and consequence.\nKeywords: []\nTags: []\n\n"`;
    const resp = await llmEvolution({ newMemory, existingMemory });
    console.log("Evolution result:", resp);
  }
  async function testWdTagger() {
    const imageBase64 = await toBase64("/crl-images/welcome/welcome8.png");
    if (!imageBase64) {
      console.error("Failed to convert image to base64");
      return;
    }
    console.log(`Image Base64:", ${imageBase64.slice(0, 100)} "..."`); // Log first 100 characters for brevity
    //post imageBase64 as a POST param 'image' to /api/transformers/image-classification
    //fetch GET /api/transformers/check-wdtagger
    /*const checkResponse = await fetch("/api/transformers/check-wdtagger");
    if (!checkResponse.ok) {
      console.error("WD Tagger check failed:", checkResponse.statusText);
    }
    return;
    */
    const tags = await getTags(imageBase64);
    console.log("WD Tagger result:", tags);
  }
  async function testTokenCount() {
    const resp = await llmTokens({ text: "Why in dear fuck is this token count so fuckin big???" });
    console.log("Token count result:", resp);
  }
  const data = { user: { name: "Cunty McGee" } };
</script>

<div class="bg-muted/20 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
  <div transition:fade={{ duration: 700 }}>
    <!-- TAILWIND HERO -->
    <div class="relative isolate overflow-hidden h-screen">
      <svg class="absolute inset-0 -z-10 w-full [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" aria-hidden="true">
        <defs>
          <pattern id="0787a7c5-978c-4f66-83c7-11c213f99cb7" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
            <path d="M.5 200V.5H200" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" stroke-width="0" fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)" />
      </svg>
      <div class="mx-20 max-w-7xl pr-4 pb-24 pt-10 sm:pb-32 lg:flex lg:pr-4 lg:py-30">
        <div class="mx-auto max-w-2xl lg:mx-0 lg:max-w-2xl lg:flex-shrink-0 lg:pt-8">
          <div class="mt-10 sm:mt-32 lg:mt-16">
            <h2
              class="sm:mx-auto sm:w-10/12 md:w-2/3 font-black text-3xl text-center sm:text-3xl md:text-2xl lg:w-auto lg:text-left xl:text-3xl"
            >
              <span
                class="relative text-transparent bg-clip-text bg-gradient-to-r from-secondary-600 to-secondary-500 dark:from-primary-400 dark:to-primary-900"
              >
                Hey {ucwords(data?.user?.name)}
              </span>
            </h2>
          </div>
          <h1 class="mt-10 text-4xl font-bold tracking-tight sm:text-6xl">CRL: Local Adventures.</h1>
          <p class="mt-6 text-lg leading-8">
            Prepare for a weird session of mystical, cyber mayhem conveyed in text and imagery - if you have Stable Diffusion or an API key
            for online robbers.
          </p>
          <div class="mt-10 flex items-center gap-x-6">
            <Button variant="secondary" class="cursor-pointer text-sm font-semibold">New Game</Button>
            <Button variant="default" href="#" class="cursor-pointer text-sm font-semibold leading-6"
              >Continue <span aria-hidden="true">→</span></Button
            >
          </div>
        </div>
        <div class="max-w-5xl lg:mr-0 lg:mt-0 lg:max-w-none">
          <CharacterVerticalCarousel />
        </div>
      </div>
    </div>
  </div>
</div>
<div class="grid auto-rows-min gap-4 md:grid-cols-3">
  <div class="bg-muted/50 aspect-video rounded-xl p-4 flex flex-col gap-2">
    {#if PUBLIC_DEBUG === "true"}
      <Button class="cursor-pointer" onclick={async () => testEmbedding()}>Test Embedding</Button>
      <Button class="cursor-pointer" onclick={async () => testSentiment()}>Test Sentiment</Button>
      <Button class="cursor-pointer" onclick={async () => testSummarise()}>Test Summarise</Button>
      <Button class="cursor-pointer" onclick={async () => testTags()}>Test Tags</Button>
      <Button class="cursor-pointer" onclick={async () => testTokenCount()}>Test Token Count</Button>
    {/if}
  </div>
  <div class="bg-muted/50 aspect-video rounded-xl p-4 flex flex-col gap-2">
    <Button class="cursor-pointer" onclick={async () => testContext()}>Test Context</Button>
    <Button class="cursor-pointer" onclick={async () => testEvolution()}>Test Evolution</Button>
  </div>
  <div class="bg-muted/50 aspect-video rounded-xl p-4 flex flex-col gap-2">
    <Button class="cursor-pointer" onclick={async () => testWdTagger()}>Test WD Tagger</Button>
  </div>
</div>
