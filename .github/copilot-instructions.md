# CRL2 Copilot Instructions

## Architecture Overview
CRL2 is a SvelteKit-based AI role-playing system with modular engines for characters (engine-character.ts), conversations (engine-conversation.ts), LLMs (engine-llm.ts), and dungeons (engine-dungeon.ts). Data flows from user interactions (e.g., chat.layout.svelte) through engines to APIs, using vector-based ContextManager for memory (e.g., findSimilarContexts in +server.ts). Stores (stores/) manage state (e.g., sd.store.ts for SD configs), controllers (controllers/) handle logic (e.g., sd.ts for image generation), and utilities (utilities/) provide helpers like apiHelper.ts (resp wrapper) and error-manager.ts (DebugLogger).

## Key Patterns and Conventions
- **Imports**: Use $lib alias (e.g., import { DebugLogger } from "$lib/utilities/error-manager"); avoid direct paths.
- **State Management**: Prefer Svelte stores (e.g., EngineSd in sd.store.ts); reset before operations (e.g., CharacterStore.reset() in +page.svelte).
- **Error Handling**: Use DebugLogger for logging (e.g., DebugLogger.debug("ComfyUI Generate Request:", body) in +server.ts); wrap APIs with resp() for { success, data, error } responses.
- **API Structure**: Endpoints return consistent objects; use dbAssist for SQLite CRUD (e.g., dbAssist.select(db, table) in +server.ts).
- **AI Integration**: Build LLM messages with roles; use structured prompts (e.g., llmEvolution in llm.ts). For SD, replace tags in workflows (e.g., comfyReplaceTags in sd.store.ts).
- **File Handling**: Store images in data/users/{userId}/{mode}/{id}/images/; use fsDelete for cleanup (e.g., in +page.svelte delete function).

## Workflows and Integrations
- **Development**: Run `npm run dev` (Vite/SvelteKit); build with `npm run build`. Debug via VS Code terminal and logs (e.g., console.log("Got some mother-fuckin vectors") in +server.ts).
- **LLM Providers**: LMStudio via LMStudioClient (e.g., client.llm.model().respond() in +server.ts); supports streaming.
- **SD Sources**: ComfyUI/WebUI via callSdApi in sd.ts; workflows in comfyui-workflows/.
- **External APIs**: Fetch with credentials: "include" (e.g., in _api.ts). Use Hugging Face transformers for embeddings/tokenization (transformers.ts, +server.ts).

## Examples
- Character Creation: Reset stores in +page.svelte before NewCharacter drawer.
- Image Generation: Use interactiveSd in sd.ts with generationMode.CHARACTER_MULTIMODAL.
- Context Retrieval: Query ContextManager.findSimilarContexts for memories in +server.ts.
