import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are a general support AI. You are helping a user with any questions or issues they may have.\n
The user can ask you anything and you will do your best to help them.\n
Important: Output will be only plain text. Markdown syntax highlight forbidden.
`;



export async function POST(req: Request) {
    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
    const data = await req.json();


    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system", content: systemPrompt
            },
            ...data,
        ],
        model: "gpt-4o-mini",
        stream: true
    });

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            try {
                for await (const chunk of completion) {
                    let content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        const text = encoder.encode(content);
                        controller.enqueue(text);
                    }
                }
            } catch (e) {
                console.error(e);
                controller.error(e);
            } finally {
                controller.close();
            }
        }
    });

    return new NextResponse(stream);
};