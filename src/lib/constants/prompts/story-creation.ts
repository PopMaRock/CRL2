export const storyCreationPrompt = `Invent a brief story summary containing interesting things that may have happened since the stated Opening.
        You should include the next primary plot, goal and antagonist in the story.

        User's name: {{persona.name}}
        User's description: {{persona.description}}
        Genre: {{game.genre}}

        {{opening}}
        {{plotEssentials}}
        {{authorsNotes}}

        You should write in the second person, for example "You find yourself..."
        You should respond in a paragraph. Do not create lists or structured formatting.
        Write a maximum of 100 words.`;

export const storyCreationOpening = `Write a brief opening to a new role playing adventure which revolves around the user.

        User's name: {{persona.name}}
        User's description: {{persona.description}}
        Genre: {{game.genre}}

        You should write in the second person i.e. "You are {{persona.name}} a...."`;