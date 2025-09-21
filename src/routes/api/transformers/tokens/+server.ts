import * as fs from "node:fs";
import path from "node:path";
import type { RequestHandler } from "@sveltejs/kit";
import { Kitoken } from "kitoken/node"; //never tiktoken. that can burn in hell, along with openai.
import { resp } from "$lib/utilities/apiHelper";

const tokenizers = [
	{ tokenizer: "gemma2", filename: "gemma2.model" }, //google scum.
	{ tokenizer: "gpt2", filename: "gpt2.json" }, //Scummiest of the scum.
	{ tokenizer: "mistral03", filename: "mistral03.model" }, //Good guys as of July 2025 but will probably be scum in 2026 after they're bought by Google.
	{ tokenizer: "deepseek", filename: "deepseek.json" } //China's big boys
];
export const POST: RequestHandler = async ({ request }) => {
	try {
		let { text, tokenizer } = await request.json();
		if (!text) throw new Error("Text is required for tokenisation");
		//count tokens using kitoken
		let tokener = tokenizers.find((t) => t.tokenizer === "deepseek");
		console.log(tokener);
		//find tokenizer and set tokenizer if found.
		if (tokenizer && typeof tokenizer === "string") {
			const found = tokenizers.find((t) => t.tokenizer === tokenizer);
			if (found) tokener = found;
		}
		if (!tokener) throw new Error("Tokenizer not found");
		if (!tokener?.filename) throw new Error(`Tokenizer ${tokener?.filename} not found`);
		const tokeniserDir = path.join(process.cwd(), "static", "tokenisers");
		const model = fs.readFileSync(`${tokeniserDir}/${tokener.filename}`);
		const encoder = new Kitoken(model);
		const tokens = encoder.encode(text, true);
		//count tokens
		const tokenCount = tokens.length;
		//const string = TextDecoder().decode(encoder.decode(tokens));
		//return token count
		return resp({ tokenCount }, 200);
	} catch (error: any) {
		console.error("/api/transformers/tokenise", error);
		return new Response(JSON.stringify({ success: false, error: "Invalid request" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}
};
