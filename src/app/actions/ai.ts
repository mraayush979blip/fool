'use server';

import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function getAIResponse(messages: { role: 'user' | 'assistant', content: string }[]) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are 'Levelone AI', a futuristic coding and learning assistant for the 'Levelone' platform. Your tone should be strategic, slightly cyberpunk/hacker-like, but helpful and encouraging. Use technical metaphors. Keep responses concise and structured with markdown. If asked about technical tasks, provide clean code snippets."
                },
                ...messages.map(msg => ({
                    role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                    content: msg.content
                }))
            ],
            model: "llama-3.3-70b-versatile",
        });

        return {
            success: true,
            text: completion.choices[0]?.message?.content || ""
        };
    } catch (error: any) {
        console.error('Groq Server Error:', error);
        return {
            success: false,
            error: error?.message || "Failed to reach AI core"
        };
    }
}
