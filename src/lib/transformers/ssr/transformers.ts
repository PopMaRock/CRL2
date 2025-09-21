import fs from "fs";
import path from "path";
import { env, type PipelineType, pipeline, RawImage } from "@huggingface/transformers";
import { DebugLogger } from "$lib/utilities/error-manager";

configureTransformers();

function configureTransformers(): void {
	// Limit the number of threads to 1 to avoid issues on Android
	if (env.backends.onnx?.wasm) {
		env.backends.onnx.wasm.numThreads = 4;
		// Use WASM from a local folder to avoid CDN connections
		env.backends.onnx.wasm.wasmPaths = path.join(`${process.cwd()}/static`, "dist") + path.sep;
	}
}

interface Task {
	defaultModel: string;
	pipeline: any | null;
	quantized: boolean;
	dType?: string; // Data type for quantization, e.g., "q4f16"
	currentModel?: string;
	modelFilename?: string;
	device?: string; // Device to run the model on, e.g., "cpu" or "webgpu"
}

// For CUDA - Requires Cudnn9 to be installed on system!
const tasks: Record<string, Task> = {
	"text-classification": {
		defaultModel: "fyaronskiy/ModernBERT-large-english-go-emotions",
		pipeline: null,
		quantized: true,
		modelFilename: "model_quantized",
		device: "cpu"
	},
	"object-detection": {
		defaultModel: "aleksyglvnw/detr-face-detection",
		pipeline: null,
		quantized: true,
		device: "cpu"
	},
	"image-segmentation": {
		defaultModel: "briaai/RMBG-1.4",
		pipeline: null,
		quantized: true
	},
	"image-classification": {
		defaultModel: "SmilingWolf/wd-convnext-tagger-v3", 
		pipeline: null,
		quantized: false
	},
	"feature-extraction": {
		defaultModel: "sauravpanda/gte-small-onnx", //gte produces 384d vectors. Better than 768 but need way to compress.
		pipeline: null,
		quantized: true,
		modelFilename: "model_quantized",
		device: "cpu"
	},
	"text-generation": {
		defaultModel: "HuggingFaceTB/SmolLM3-3B-ONNX", //SmolLM3 Exceptional bullshit generator as of 25-07-2025
		pipeline: null,
		quantized: true,
		dType: "q4f16"
	},
	"automatic-speech-recognition": {
		defaultModel: "Xenova/whisper-small",
		pipeline: null,
		quantized: true
	},
	"text-to-speech": {
		defaultModel: "Xenova/speecht5_tts",
		pipeline: null,
		quantized: false
	},
	summarization: {
		defaultModel: "Xenova/long-t5-tglobal-base-16384-book-summary",
		pipeline: null,
		quantized: true
	}
};

/**
 * Gets a RawImage object from a base64-encoded image.
 * @param {string} image Base64-encoded image
 * @returns {Promise<RawImage | null>} Object representing the image
 */
async function getRawImage(image: string): Promise<RawImage | null> {
	try {
		const base64Data = image.startsWith("data:") ? image.split(",")[1] : image;
		const buffer = Buffer.from(base64Data, "base64");
		const byteArray = new Uint8Array(buffer);
		const blob = new Blob([byteArray]);
		return await RawImage.fromBlob(blob);
	} catch (error) {
		console.error("Error in getRawImage:", error);
		return null;
	}
}

/**
 * Gets the model to use for a given transformers.js task.
 * @param {string} task The task to get the model for
 * @returns {string} The model to use for the given task
 */
function getModelForTask(task: string): string {
	const defaultModel = tasks[task]?.defaultModel ?? "";
	
	return defaultModel;
}

async function checkCacheDir(): Promise<void> {
	const newCacheDir = path.join(`${process.cwd()}/static`, "_models_cache");
	if (!fs.existsSync(newCacheDir)) {
		fs.mkdirSync(newCacheDir, { recursive: true });
	}
}

async function getPipeline(task: PipelineType, forceModel = ""): Promise<any> {
	await checkCacheDir();
	const taskConfig = tasks[task];
	if (taskConfig?.pipeline && (forceModel === "" || taskConfig.currentModel === forceModel)) {
		return taskConfig.pipeline;
	}

	if (taskConfig?.pipeline) {
		DebugLogger.debug("Disposing transformers.js pipeline for task", task, "with model", taskConfig.currentModel);
		await taskConfig.pipeline.dispose();
	}

	const cacheDir = path.join(`${process.cwd()}/static`, "_models_cache");
	const model = forceModel || getModelForTask(task);
	DebugLogger.debug("Initializing transformers.js pipeline for task", task, "with model", model);

	const options: any = {
		cache_dir: cacheDir,
		local_files_only: false,
		trust_remote_code: true
	};
	if (taskConfig?.modelFilename) {
		options.model_file_name = taskConfig.modelFilename;
	}
	if (taskConfig?.quantized) {
		options.quantized = true;
		if (taskConfig.dType) {
			options.dType = taskConfig.dType; // Set data type for quantization
		}
	}
	if (taskConfig?.device) {
		options.device = taskConfig.device; // Set device for model execution
	} else {
		options.device = ["gpu", "cpu"] // Default to GPU if available, otherwise CPU
	}

	const instance = await pipeline(task, model, options);
	if (taskConfig) {
		taskConfig.pipeline = instance;
		taskConfig.currentModel = model;
	}
	return instance;
}

export default {
	getPipeline,
	getRawImage
};
