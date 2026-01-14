import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid messages format'
            }, { status: 400 });
        }

        // Enhanced logging for debugging
        console.log('[AI API Route] Received request with', messages.length, 'messages');

        const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

        if (!apiKey) {
            console.error('[AI API Route] ❌ CRITICAL: GROQ_API_KEY is not defined in environment variables.');
            return NextResponse.json({
                success: false,
                error: "API_KEY_MISSING: Please configure the GROQ_API_KEY in your deployment settings."
            }, { status: 500 });
        }

        console.log('[AI API Route] ✓ API Key found, initializing Groq client...');

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
                console.log(`[AI API Route] Attempting with model: ${model}...`);
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are 'Levelone AI', a futuristic coding and learning assistant for the 'Levelone' platform. Your tone should be strategic, slightly cyberpunk/hacker-like, but helpful and encouraging. Use technical metaphors. Keep responses concise and structured with markdown. If asked about technical tasks, provide clean code snippets."
                        },
                        ...messages.map((msg: { role: string, content: string }) => ({
                            role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                            content: msg.content
                        }))
                    ],
                    model: model,
                });

                console.log(`[AI API Route] ✓ Response received successfully from ${model}`);
                return NextResponse.json({
                    success: true,
                    text: completion.choices[0]?.message?.content || ""
                });
            } catch (error: any) {
                console.warn(`[AI API Route] ⚠ Model ${model} failed:`, error?.message || 'Unknown error');
                lastError = error;
                // Continue to next model
            }
        }

        // If we get here, all models failed
        console.error('[AI API Route] ❌ All models failed. Last error:', {
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

        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });

    } catch (error: any) {
        console.error('[AI API Route] ❌ Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
