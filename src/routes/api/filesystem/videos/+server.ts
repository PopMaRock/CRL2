import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path, { join } from "path";
import type { RequestHandler } from "./$types";

// POST: Save video file from a base64 payload
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { mode, id, video, filename, pathOverride } = await request.json();
		const uman = cookies.get("umanId");
		if (!uman) throw new Error("Hamish 'as gone!");
		// Validate payload
		if ((!mode || !id || !filename) && !pathOverride) {
			return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
		}
		if (!video) {
			return new Response(JSON.stringify({ error: "Missing video data" }), { status: 400 });
		}

		// Strip the Data URL header if present (e.g. "data:video/mp4;base64,...")
		const matches = video.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
		if (!matches) {
			return new Response(JSON.stringify({ error: "Invalid video data" }), { status: 400 });
		}
		const videoBuffer = Buffer.from(matches[2], "base64");

		// Define the target directory (create it if necessary)
		let videosDir = "";
		if (pathOverride) {
			videosDir = join(process.cwd(), "data", "users", uman, pathOverride);
		} else {
			videosDir = join(process.cwd(), "data", "users", uman, mode, id, "videos");
		}
		await mkdir(videosDir, { recursive: true });

		// Use mode and id to build the filename (default to .mp4 if not provided)
		const fileName = filename ?? `${mode}-${id}.mp4`;
		const filePath = join(videosDir, fileName);

		const uint8Video = new Uint8Array(videoBuffer.buffer, videoBuffer.byteOffset, videoBuffer.byteLength);
		await writeFile(filePath, uint8Video);

		return new Response(JSON.stringify({ success: true, filePath }), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Failed to save video" }), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	try {
		const uman = cookies.get("umanId");
		if (!uman) throw new Error("Hamish 'as gone!");
		const body = await request.text();
		if (!body) {
			return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400 });
		}
		const { mode, id, filename, imageType } = JSON.parse(body);
		console.log("mode", mode);
		console.log("id", id);
		console.log("filename", filename);
		console.log("imageType", imageType);

		let ext = imageType ?? "mp4";
		const file = filename ?? `${mode}-${id}.${ext}`;
		// Validate payload
		if (!mode || !id) {
			return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
		}

		// Define the target directory (create it if necessary)
		const imagesDir = join(process.cwd(), "data", "users", uman, mode, id, "images");
		await mkdir(imagesDir, { recursive: true });

		// Use mode and id to build the filename
		const filePath = join(imagesDir, file);

		await unlink(filePath);

		return new Response(JSON.stringify({ success: true, filePath }), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Failed to delete video" }), { status: 500 });
	}
};

// GET: Retrieve video(s)
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const { searchParams } = new URL(url);
		const mode = searchParams.get("mode");
		const id = searchParams.get("id");
		const filename = searchParams.get("filename");
		const amount = searchParams.get("amount");
		const pathOverride = searchParams.get("pathOverride");
		const uman = cookies.get("umanId");
		if (!uman) throw new Error("Hamish 'as gone!");

		if ((!mode || !id) && !pathOverride) {
			return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
		}
		if (!filename && !amount) {
			return new Response(JSON.stringify({ error: "Missing filename or amount" }), { status: 400 });
		}

		let videosDir = "";
		if (pathOverride) {
			videosDir = join(process.cwd(), "data", "users", uman, pathOverride);
		} else {
			videosDir = join(process.cwd(), "data", "users", uman, mode ?? "", id ?? "", "images"); //todo: move videos to their own folder
		}

		if (amount === "all") {
			// Return a JSON array of all file names in the folder with their type.
			const files = await readdir(videosDir);
			const fileList = files.map((file) => {
				const ext = path.extname(file).toLowerCase();
				// For videos, mark known video file extensions as video,
				// fallback to generic file if not recognized.
				const videoExt = [".mp4", ".mov", ".avi", ".mkv"];
				const type = videoExt.includes(ext) ? "video" : "file";
				return { filename: file, type };
			});
			return new Response(JSON.stringify(fileList), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		if (filename) {
			// Retrieve a single video file, return its binary data.
			const filePath = join(videosDir, filename);
			const videoBuffer = await readFile(filePath);
			if (!videoBuffer || videoBuffer.length === 0) {
				return new Response(JSON.stringify({ error: "Empty video file" }), { status: 404 });
			}
			// Determine MIME type based on extension (simple check)
			const ext = path.extname(filename).toLowerCase();
			let mimeType = "video/mp4";
			if (ext === ".mov") {
				mimeType = "video/quicktime";
			} else if (ext === ".avi") {
				mimeType = "video/x-msvideo";
			} else if (ext === ".mkv") {
				mimeType = "video/x-matroska";
			}
			//@ts-expect-error
			return new Response(videoBuffer, {
				status: 200,
				headers: { "Content-Type": mimeType }
			});
		}
		return new Response(JSON.stringify({ error: "Invalid request parameters" }), { status: 400 });
	} catch (error) {
		console.error(error);
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return new Response(JSON.stringify({ error: "Video not found" }), { status: 404 });
		}
		return new Response(JSON.stringify({ error: "Failed to load video" }), { status: 500 });
	}
};
