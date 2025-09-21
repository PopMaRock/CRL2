import { readFile } from "fs/promises";
import { join } from "path";
import { resp } from "../../../../lib/utilities/apiHelper";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	try {
		const { searchParams } = new URL(url);
		const fileuri = searchParams.get("fileuri");
		//if fileuri doesn't end with .json or is empty, return error
		if (!fileuri?.endsWith(".json") || fileuri?.length < 6) {
			return resp({ error: "Invalid fileuri" }, 400);
		}
		const filePath = join(fileuri);
		const mJson = await readFile(filePath);
		if (!mJson || mJson.length === 0) {
			return new Response(JSON.stringify({ error: "Empty JSON file" }), { status: 404 });
		}
		//@ts-expect-error
		return new Response(mJson, { status: 200, headers: { "Content-Type": "application/json" } });
	} catch (error) {
		console.error(error);
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return new Response(JSON.stringify({ error: "JSON not found" }), { status: 404 });
		}
		return new Response(JSON.stringify({ error: "Failed to load json" }), { status: 500 });
	}
};
