import fs from "fs/promises";
import path from "path";
import type { RequestHandler } from "@sveltejs/kit";
import { resp } from "$lib/utilities/apiHelper";

export const GET: RequestHandler = async () => {
	//call transformers pipeline for image classification - we expect to receive an error so catch it but ignore it
	try {
		if (!(await isRepoCached("SmilingWolf/wd-convnext-tagger-v3"))) {
			await downloadRepo("SmilingWolf/wd-convnext-tagger-v3");
		}
		return resp({ message: "wd-convnext-tagger-v3 is cached and ready to use." }, 200);
	} catch (error: any) {
		return resp({ error: `Failed to check or download wd-convnext-tagger-v3: ${error.message}` }, 500);
	}
};
async function isRepoCached(repoId: string): Promise<boolean> {
	const cacheDir = path.join(process.cwd(), "static", "_models_cache");
	const [owner, repo] = repoId.split("/");
	const repoCacheDir = path.join(cacheDir, owner.toLowerCase(), repo.toLowerCase());
	try {
		await fs.access(repoCacheDir); // Checks if the directory exists and is accessible
		return true;
	} catch {
		return false;
	}
}
async function downloadRepo(repoId: string): Promise<void> {
	const cacheDir = path.join(process.cwd(), "static", "_models_cache");

	// Ensure base cache directory exists
	if (!(await fs.stat(cacheDir).catch(() => false))) {
		await fs.mkdir(cacheDir, { recursive: true });
	}

	// Step 1: Fetch repo metadata from HF API (public, no token needed)
	const apiUrl = `https://huggingface.co/api/models/${repoId}`;
	const response = await fetch(apiUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch repo metadata for ${repoId}: ${response.statusText}`);
	}
	const metadata = await response.json();

	const commitHash = metadata.sha; // Last commit SHA (used for download URLs only)
	const files = metadata.siblings.map((s: { rfilename: string }) => s.rfilename); // List of files

	if (!commitHash || files.length === 0) {
		throw new Error(`No files or commit hash found for repo ${repoId}`);
	}

	// Step 2: Prepare custom cache subdirectory structure (lowercase owner/repo)
	const [owner, repo] = repoId.split("/");
	const repoCacheDir = path.join(cacheDir, owner.toLowerCase(), repo.toLowerCase());
	await fs.mkdir(repoCacheDir, { recursive: true });

	// Step 3: Download each file, skipping .safetensors and .msgpack
	for (const filename of files) {
		if (filename.toLowerCase().endsWith(".safetensors") || filename.toLowerCase().endsWith(".msgpack")) {
			console.log(`Skipping ${filename} (excluded file type)`);
			continue;
		}

		const downloadUrl = `https://huggingface.co/${repoId}/resolve/${commitHash}/${filename}`;
		const filePath = path.join(repoCacheDir, filename);

		// Ensure subdirectories exist for the file
		await fs.mkdir(path.dirname(filePath), { recursive: true });

		try {
			const fileResponse = await fetch(downloadUrl);
			if (!fileResponse.ok) {
				console.warn(`Failed to download ${filename}: ${fileResponse.statusText}. Skipping.`);
				continue;
			}
			const buffer = await fileResponse.arrayBuffer();
			await fs.writeFile(filePath, Buffer.from(buffer));
			console.log(`Downloaded ${filename} to ${filePath}`);
		} catch (error: any) {
			console.warn(`Error downloading ${filename}: ${error.message}. Skipping.`);
			//kick that shit up the chain.
			throw new Error(`Failed to download ${filename} from ${downloadUrl}: ${error.message}`);
		}
	}

	console.log(`All eligible files for ${repoId} downloaded to ${repoCacheDir}`);
}
