export const tagsSchema = {
	title: "TagGenerator",
	description: "Array of tags focused on themes, emotions, actions, locations, relationships, story elements.",
	required: ["tags"],
	type: "array",
	properties: {
		tags: {
			type: "string",
			description: "A tag relevant to the content and context."
		}
	}
};
export const evolutionSchema = {
	title: "MemoryAnalysis",
	type: "object",
	required: ["shouldEvolve", "evolutionReason"],
	properties: {
		shouldEvolve: {
			type: "boolean",
			description: "Whether the existing memory should be updated based on new information."
		},
		updatedContent: {
			type: "string",
			description: "If shouldEvolve is true - Generate concise updated content for existing memory content"
		},
		updatedSummary: {
			type: "string",
			description: "If shouldEvolve is true - Generate a concise updated summary for existing memory"
		},
		updatedKeywords: {
			type: "array",
			description: "If shouldEvolve is true - Generate 3-5 new keywords for existing memory"
		},
		evolutionReason: {
			type: "string",
			description: "Explanation of why the existing memory was, or was not updated"
		}
	}
};

export const imagePromptSchema = {
    title: "ImagePrompt",
    description: "Schema for generating stable diffusion image prompts to convey the current situation.",
    type: "object",
    required: ["prompt", "style", "aspectRatio"],
    properties: {
        prompt: {
            type: "string",
            description: "The main prompt for the image generation."
        },
        style: {
            type: "string",
            description: "The artistic style of the image (e.g., 'realistic', 'cartoon', 'abstract')."
        },
        aspectRatio: {
            type: "string",
            description: "The aspect ratio of the image (e.g., '16:9', '4:3')."
        }
    }
}
