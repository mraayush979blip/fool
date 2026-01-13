'use server';

import Groq from 'groq-sdk';

export async function getAIResponse(messages: { role: 'user' | 'assistant', content: string }[]) {
    // Enhanced logging for debugging
    console.log('[AI Server Action] Received request with', messages.length, 'messages');

    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        console.error('[AI Server Action] ❌ CRITICAL: GROQ_API_KEY is not defined in environment variables.');
        console.error('[AI Server Action] Check your .env.local file contains: GROQ_API_KEY=your_key_here');
        return {
            success: false,
            error: "API_KEY_MISSING: Please configure the GROQ_API_KEY in your deployment settings."
        };
    }

    console.log('[AI Server Action] ✓ API Key found, initializing Groq client...');

    try {
        const groq = new Groq({ apiKey });

        console.log('[AI Server Action] Sending request to Groq API...');
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

        console.log('[AI Server Action] ✓ Response received successfully');
        return {
            success: true,
            text: completion.choices[0]?.message?.content || ""
        };
    } catch (error: any) {
        console.error('[AI Server Action] ❌ Error occurred:', {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            type: error?.constructor?.name
        });

        // Enhanced error message with diagnostic info
        let errorMessage = error?.message || "AI_CORE_REACH_FAILURE";

        if (error?.status === 429 || error?.message?.includes('429')) {
            errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        } else if (error?.status === 401 || error?.message?.includes('unauthorized')) {
            errorMessage = "Invalid API key. Please check your GROQ_API_KEY configuration.";
        } else if (error?.message?.includes('fetch')) {
            errorMessage = "Network error: Unable to reach Groq API. Please check your internet connection.";
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}
