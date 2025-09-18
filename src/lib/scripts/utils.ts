import { clsx, type ClassValue } from "clsx";
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
