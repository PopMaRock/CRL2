export let CharCreatePrompts = {
	description: `You are a creative writer tasked with providing a short, concise description to summarize {{char}}. It must be 50 words, or less. It should captures the essence of {{char}} as a summary—including hints about their personality, style, or background. For example, if given the name 'Elara', you might write: 'Elara is a resourceful and enigmatic wanderer whose quiet determination hides a tumultuous past.' 

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{personality_w_title}}
{{traits_w_title}}
{{user_w_title}}

Now, please provide a description for {{char}}.`,
	background: `You are a creative writer tasked with inventing a backstory for {{char}} using only the provided context. Please write a backstory. It must be 50 words, or less. The backstory should focus on who {{char}} is, what they do, and how they know {{user}}. Use the following context:

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{description_w_title}}
{{personality_w_title}}
{{traits_w_title}}
{{user_w_title}}
Now, please provide the backstory.`,
	strengths: `Analyze this content and generate 5-7 tags to define the character's personality strengths. Tags must be unique and deterministic. Using the following information:

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{description_w_title}}
{{background_w_title}}
{{traits_w_title}}
{{user_w_title}}
For example: ["Optimistic", "scatterbrained", "dramatic", "adaptable", "passionate", "adventurous"]`,
	flaws: `Analyze this content and generate 5-7 tags to define character's personality flaws. Tags must be unique and deterministic. Using the following information:

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{description_w_title}}
{{background_w_title}}
{{personality_w_title}}
{{user_w_title}}
For example: ["Exceptionally unlucky", "clumsy", "total idiot", "bad liar"]`,
	goal: `You are a creative writer tasked with generating a concise, short, and deterministic life/world goal for {{char}} based on the provided context. The goal should clearly encapsulate the {{char}}'s ambitions and overarching objective. Use the following information:

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{description_w_title}}
{{background_w_title}}
{{personality_w_title}}
{{traits_w_title}}
{{user_w_title}}
Please provide the goal for {{char}} in one short sentence or phrase. For example: 'To create the most successful adventuring agency in all of Scotland! (And pay off her debt)'.`,
	firstMsg: `You are a creative writer tasked with generating the very first message that a character sends to a user to initiate a conversation. Using the following context:

{{char_w_title}}
{{age_w_title}}
{{gender_w_title}}
{{description_w_title}}
{{background_w_title}}
{{personality_w_title}}
{{traits_w_title}}
{{goal_w_title}}
{{user_w_title}}
Please craft a concise and intriguing first message that reflects the character's personality and objectives. The message should be short and invite the user to respond, either by asking a question or presenting an intriguing statement.`
};
