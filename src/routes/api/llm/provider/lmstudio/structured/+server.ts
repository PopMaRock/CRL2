import { LMStudioClient } from "@lmstudio/sdk";
import type { RequestHandler } from "./$types";
//sveltekit post endpoint
export const POST: RequestHandler = async ({ request }:any) => {
    const {messages, schema, settings} = await request.json();
    //push system message into front of messages if not present
    if (!messages.some((msg: { role: string }) => msg.role === "system")) {
        messages.unshift({
            role: "system",
            content:`You are a JSON generator. Only output valid JSON. NO explanations, NO markdown, NO extra text, NO additional fields. Strictly follow the JSON schema provided by the user./no_think`
        });
    }
    const client = new LMStudioClient();
    const model = await client.llm.model();
    const result = await model.respond(messages, {
        structured: {
            type: "json",
            jsonSchema: schema,
        },
        ...settings
    });

    const content = JSON.parse(result.content);
    console.info(content);
    return new Response(JSON.stringify(content), { status: 200 });
};