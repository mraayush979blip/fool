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

    const models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "mixtral-8x7b-32768",
        "llama3-8b-8192"
    ];

    const groq = new Groq({ apiKey });
    let lastError: any = null;

    for (const model of models) {
        try {
            console.log(`[AI Server Action] Attempting with model: ${model}...`);
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
                model: model,
            });

            console.log(`[AI Server Action] ✓ Response received successfully from ${model}`);
            return {
                success: true,
                text: completion.choices[0]?.message?.content || ""
            };
        } catch (error: any) {
            console.warn(`[AI Server Action] ⚠ Model ${model} failed:`, error?.message || 'Unknown error');
            lastError = error;
            // Continue to next model
        }
    }

    // If we get here, all models failed
    console.error('[AI Server Action] ❌ All models failed. Last error:', {
        message: lastError?.message,
        status: lastError?.status,
        code: lastError?.code,
        type: lastError?.constructor?.name
    });

    // Enhanced error message with diagnostic info
    let errorMessage = lastError?.message || "AI_CORE_REACH_FAILURE";

    if (lastError?.status === 429 || lastError?.message?.includes('429')) {
        errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
    } else if (lastError?.status === 401 || lastError?.message?.includes('unauthorized')) {
        errorMessage = "Invalid API key. Please check your GROQ_API_KEY configuration.";
    } else if (lastError?.message?.includes('fetch')) {
        errorMessage = "Network error: Unable to reach Groq API. Please check your internet connection.";
    }

    return {
        success: false,
        error: errorMessage
    };
}
