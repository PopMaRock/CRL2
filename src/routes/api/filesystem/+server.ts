import { readdir } from "fs/promises";
import { join } from "path";
import { DebugLogger } from "$lib/utilities/error-manager";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const path = url.searchParams.get("path");
	const fileType = url.searchParams.get("type") ?? "image";
	if (!path) {
		return new Response(JSON.stringify({ error: "Invalid path" }), { status: 400 });
	}
	try {
		const fullPath = join(process.cwd(), path);
		const files = await readdir(fullPath);
		if (fileType === "image") {
			const imageFiles = files.filter((file) => /\.(png|jpg|jpeg|gif|bmp|svg)$/i.test(file));
			return new Response(JSON.stringify({ images: imageFiles }), { status: 200 });
		}
		if (fileType === "json") {
			const jsonFiles = files.filter((file) => /\.(json)$/i.test(file));
			DebugLogger.debug(jsonFiles);
			return new Response(JSON.stringify(jsonFiles), { status: 200 });
		}
		return new Response(JSON.stringify({ error: "Invalid file type" }), { status: 400 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Error reading directory" }), { status: 500 });
	}
};
