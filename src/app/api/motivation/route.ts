import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET() {
    try {
        const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

        // Fallback message if API key is missing
        if (!apiKey) {
            return NextResponse.json({ message: "Tu yahan quit karne nahi aaya tha. Uth, aur kaam khatam kar! Losers quit, winners struggle." });
        }

        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an aggressive, brutal, but ultimately motivational coach. Your job is to motivate a student who has missed their deadline and had their access revoked. Give them a short, extremely harsh, no-excuses reality check in 'Hinglish' (a mix of Hindi and English). DO NOT give them respect. Strictly use 'tu' instead of 'tum' or 'aap', and 'tera' instead of 'tumhara' or 'aapka'. Be highly disrespectful to challenge their ego. Make them angry enough to prove you wrong and get the work done. No pleasantries. Just raw, savage motivation. Max 2-3 sentences. Don't use quotes around the output."
                },
                {
                    role: "user",
                    content: "Give me a brutal motivation."
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.9,
            max_tokens: 150
        });

        const message = completion.choices[0]?.message?.content?.trim().replace(/^"|"$/g, '') || "Bhai kya kar raha hai? Rona band kar aur wapas lag ja. You are better than this!";

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Motivation API Error:", error);
        return NextResponse.json({ message: "Haar manna teri aukaat nahi hai. Prove them wrong and get your access back!" });
    }
}
