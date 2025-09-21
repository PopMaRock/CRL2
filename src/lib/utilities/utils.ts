import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
	ref?: U | null;
};

//-----------------------------------------------------
/**
 * Capitalizes the first letter of each word in a string.
 * @param str - The string to capitalize.
 * @returns The capitalized string.
 */
export function ucwords(str: any) {
	if (!str || str === null || str === undefined || str === "") return str;
	str = str.toString();
	if (str == null || str === undefined || typeof str !== "string") return str;
	return str.toLowerCase().replace(/(^|\s)\S/g, (firstLetter) => firstLetter.toUpperCase());
}

/**
 * Capitalizes the first letter of a word.
 *
 * @param word - The input word.
 * @returns The word with the first letter capitalized.
 */
export function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Capitalizes the first letter of each sentence in the text.
 *
 * @param text - The input string.
 * @returns The modified string with capitalized first letters.
 */
export function capitalizeFirstLetters(text: string): string {
	const firstLettersRegex = /((?<=[.?!]\s)(\w+)|(^\w+))/g;

	return text.replace(firstLettersRegex, (match) => capitalize(match));
}
// biome-ignore lint/complexity/noBannedTypes: shut it biome
export const quietCatch = (fn: Function, defaultValue: any) => {
	if (typeof fn !== "function") return defaultValue;
	try {
		const result = fn();
		return result;
	} catch (e) {
		// Use direct console instead of DebugLogger to avoid potential recursion
		console.info("quietCatch error:", e);
		return defaultValue;
	}
};
// biome-ignore lint/complexity/noBannedTypes: shut it biome.
export const quietAsyncCatch = async (fn: Function, defaultValue: any) => {
	if (typeof fn !== "function") return defaultValue;
	try {
		const result = await fn();
		return result;
	} catch (e) {
		// Use direct console instead of DebugLogger to avoid potential recursion
		console.info("quietAsyncCatch error:", e);
		return defaultValue;
	}
};

export const addIfPresent = <T>(value: T | null | undefined, key: string): Partial<Record<string, T>> =>
	value === 0 || value === null || value === undefined ? {} : { [key]: value };

/**
 * Calculates a hash code for a string.
 * @param {string} str The string to hash.
 * @param {number} [seed=0] The seed to use for the hash.
 * @returns {number} The hash code.
 */
export function calculateHash(str: string, seed = 0) {
	if (typeof str !== "string") {
		return 0;
	}

	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;
	for (let i = 0, ch: number; i < str.length; i++) {
		ch = str.charCodeAt(i);
		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
export function promptReplace(prompt: string): string {
	return prompt
		.replace("\n\n", "\n")
		.replace(/(?<=\w)\.\.(?:\s|$)/g, ".")
		.trimEnd();
}
/**
 * Converts first person text to second person.
 *
 * @param text - The input string.
 * @returns The modified string in second person.
 */
export function firstToSecondPerson(text: string): string {
	let t = ` ${text}`;
	t = standardizePunctuation(t);
	for (const pair of firstToSecondMappings) {
		const variations = mappingVariationPairs(pair);
		for (const variation of variations) {
			t = replaceOutsideQuotes(t, variation[0], variation[1]);
		}
	}

	return capitalizeFirstLetters(t.trim());
}
/**
 * Generates variations of a mapping pair for text replacement.
 *
 * @param mapping - The input mapping pair.
 * @returns An array of mapping variations.
 */
export function mappingVariationPairs(mapping: [string, string]): [string, string][] {
	const mappingList: [string, string][] = [];
	mappingList.push([` ${mapping[0]} `, ` ${mapping[1]} `]);
	mappingList.push([` ${capitalize(mapping[0])} `, ` ${capitalize(mapping[1])} `]);

	if (mapping[0] === "you") {
		mapping.splice(0, mapping.length, "you", "me");
	}
	mappingList.push([` ${mapping[0]},`, ` ${mapping[1]},`]);
	mappingList.push([` ${mapping[0]}\\?`, ` ${mapping[1]}\\?`]);
	mappingList.push([` ${mapping[0]}\\!`, ` ${mapping[1]}\\!`]);
	mappingList.push([` ${mapping[0]}\\.`, ` ${mapping[1]}.`]);

	return mappingList;
}
/**
 * Replaces occurrences of a word outside of quotes with another word.
 *
 * @param text - The input string.
 * @param currentWord - The word to be replaced.
 * @param replWord - The word to replace with.
 * @returns The modified string with the word replaced.
 */
export function replaceOutsideQuotes(text: string, currentWord: string, replWord: string): string {
	return standardizePunctuation(text).replace(new RegExp(`${currentWord}(?=([^"]*"[^"]*")*[^"]*$)`, "g"), replWord);
}
/**
 * Standardizes punctuation in the text.
 *
 * @param text - The input string.
 * @returns The modified string with standardized punctuation.
 */
export function standardizePunctuation(text: string): string {
	return text.replace(/’/g, "'").replace(/`/g, "'").replace(/“/g, '"').replace(/”/g, '"');
}
export function resultReplace(result: string): string {
	//convert emojis to html emojis
	//https://www.npmjs.com/package/@lobehub/fluent-emoji
	let resp = result
		.replace(/[\s\S]*<\/think>/, "")
		.replace(/^.*<\|start_header_id\|>assistant<\|end_header_id\|>/, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&ldquo;/g, '"')
		.replace(/&rdquo;/g, '"')
		.replace(/<\|[^|]+\|>.*?<\|[^|]+\|>/gs, "") // remove tags and everything between them
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&cent;/g, "¢")
		.replace(/&pound;/g, "£")
		.replace(/&yen;/g, "¥")
		.replace(/&euro;/g, "€")
		.replace(/&copy;/g, "")
		.replace(/&reg;/g, "")
		.replace(/&trade;/g, "")
		.replace(/&times;/g, "x")
		.replace(/&divide;/g, "/")
		.replace(/&ndash;/g, "-")
		.replace(/&mdash;/g, "-")
		.replace(/&hellip;/g, "...")
		.replace(/&amp;/g, "&")
		.replace(/<\/?[^>]+(>|$)/g, "") //remove HTML tags
		//remove remaining >
		.replace(">", "")
		.replace(/,{2,}/g, ",") // replace 2 or more commas with 1 comma
		.replace(/\n{3,}/g, "\n\n") // replace 3 or more newlines with 2 newlines
		//.replace("(?<=\\w)\\.\\.(?:\\s|$)", ".")
		.replace(/#{1,3}\s*Response:/g, "")
		.trim();

	// There are times where the LLM does not close a *; we toggle the state for markdown emphasis and close it if necessary.
	let isAsteriskOpen = false;
	for (let i = 0; i < resp.length; i++) {
		if (resp[i] === "*") {
			isAsteriskOpen = !isAsteriskOpen;
		}
	}
	if (isAsteriskOpen) {
		resp = `${resp.trimEnd()}*`;
	}
	//remove full stop or comma from the end when it's preceded by an asterisk
	resp = resp.replace(/\*(\s*)[.,]/g, "*$1");

	return resp;
}
// Mappings for first to second person conversion
const firstToSecondMappings: [string, string][] = [
	["I'm", "you're"],
	["Im", "you're"],
	["Ive", "you've"],
	["I am", "you are"],
	["was I", "were you"],
	["am I", "are you"],
	["wasn't I", "weren't you"],
	["I", "you"],
	["I'd", "you'd"],
	["i", "you"],
	["I've", "you've"],
	["I was", "you were"],
	["my", "your"],
	["we", "you"],
	["we're", "you're"],
	["mine", "yours"],
	["me", "you"],
	["us", "you"],
	["our", "your"],
	["I'll", "you'll"],
	["myself", "yourself"]
];