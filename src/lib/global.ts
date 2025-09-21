import { type Writable, writable } from "svelte/store";

export const Gamemode: Writable<"dungeons" | "characters" | "engine"> = writable("engine");
export const loadState = writable({
	image: false,
	llm: false,
	audio: false,
	video: false,
	system: false,
	http: false
});
