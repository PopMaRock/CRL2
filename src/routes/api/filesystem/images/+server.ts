import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import path, { join } from "path";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { mode, id, image, filename, pathOverride } = await request.json();
    const uman = cookies.get("umanId");
    if(!uman) throw new Error("Hamish 'as gone!");
		// Validate payload
		if ((!mode || !id || !filename) && !pathOverride) {
			return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
		}
		if (!image) {
			return new Response(JSON.stringify({ error: "Missing image data" }), { status: 400 });
		}

		// Strip the Data URL header if present (e.g. "data:image/png;base64,...")
		let base64Data = image;
		if (image.startsWith("data:")) {
			const splitData = image.split(",");
			if (splitData.length !== 2) {
				return new Response(JSON.stringify({ error: "Invalid image data" }), { status: 400 });
			}
			base64Data = splitData[1];
		}
		const imageBuffer = Buffer.from(base64Data, "base64");

		// Define the target directory (create it if necessary)
		let imagesDir = "";
		if (pathOverride) {
			imagesDir = join(process.cwd(), "data", "users", uman, pathOverride);
		} else {
			imagesDir = join(process.cwd(), "data", "users", uman, mode, id, "images");
		}
		await mkdir(imagesDir, { recursive: true });

		// Use mode and id to build the filename
		const fileName = filename ?? `${mode}-${id}.png`;
		const filePath = join(imagesDir, fileName);

		const uint8Image = new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength);
		await writeFile(filePath, uint8Image);

		return new Response(JSON.stringify({ success: true, filePath }), { status: 200 });
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: "Failed to save image" }), { status: 500 });
	}
};
//DELETE IMAGE
export const DELETE: RequestHandler = async ({ request,cookies }) => {
	try {
		const body = await request.text();
		if (!body) {
			return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400 });
		}
    const uman = cookies.get("umanId");
    if(!uman) throw new Error("Hamish 'as gone!");
		const { mode, id, filename, imageType } = JSON.parse(body);
		console.log("mode", mode);
		console.log("id", id);
		console.log("filename", filename);
		console.log("imageType", imageType);

		let ext = imageType ?? "png";
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
		return new Response(JSON.stringify({ error: "Failed to delete image" }), { status: 500 });
	}
};
export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		const { searchParams } = new URL(url);
		const mode = searchParams.get("mode");
		const id = searchParams.get("id");
		const filename = searchParams.get("filename");
		const amount = searchParams.get("amount");
		const pathOverride = searchParams.get("pathOverride");
    const uman = cookies.get("umanId");
    if(!uman) throw new Error("Hamish 'as gone!");

		if ((!mode || !id) && !pathOverride) {
			return new Response(JSON.stringify({ error: "Missing required parameters" }), { status: 400 });
		}
		if (!filename && !amount) {
			return new Response(JSON.stringify({ error: "missing filename" }), { status: 400 });
		}

		let imagesDir = "";
		if (pathOverride) {
			imagesDir = join(process.cwd(), "data", "users", uman, pathOverride);
		} else {
			imagesDir = join(process.cwd(), "data", "users", uman, mode ?? "", id ?? "", "images");
		}

		if (amount === "all") {
			// Return a JSON array of all file names in the folder with their type.
			// Ensure that "readdir" is imported from "fs/promises" at the top of the file.
			const files = await readdir(imagesDir);
			const fileList = files.map((file) => {
				const ext = path.extname(file).toLowerCase();
				let type = "file";
				const imageExt = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
				const videoExt = [".mp4", ".mov", ".avi", ".mkv"];
				if (imageExt.includes(ext)) type = "image";
				else if (videoExt.includes(ext)) type = "video";
				return { filename: file, type };
			});
			return new Response(JSON.stringify(fileList), {
				status: 200,
				headers: { "Content-Type": "application/json" }
			});
		}
		if (filename) {
			// Single file response (as before)
			const filePath = join(imagesDir, filename);
			const image = await readFile(filePath);
			if (!image || image.length === 0) {
				return new Response(JSON.stringify({ error: "Empty image file" }), { status: 404 });
			}
			//@ts-ignore
			return new Response(image, {
				status: 200,
				headers: { "Content-Type": "image/png" }
			});
		}
		return new Response(JSON.stringify({ error: "Invalid request parameters" }), { status: 400 });
	} catch (error) {
		console.error(error);
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return new Response(JSON.stringify({ error: "Image not found" }), { status: 404 });
		}
		return new Response(JSON.stringify({ error: "Failed to load image" }), { status: 500 });
	}
};
