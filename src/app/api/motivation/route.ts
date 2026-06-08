import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;

        // Fallback message if API key is missing
        if (!apiKey) {
            return NextResponse.json({ message: "Tu yahan quit karne nahi aaya tha. Uth, aur kaam khatam kar! Losers quit, winners struggle." });
        }

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: [
                    {
                        role: "system",
                        content: "You are an aggressive, brutal, but ultimately motivational coach. Your job is to motivate a student who has missed their deadline and had their access revoked. Give them a short, extremely harsh, no-excuses reality check in 'Hinglish' (a mix of Hindi and English). Make them angry enough to prove you wrong and get the work done. No pleasantries. Just raw, savage motivation. Max 2-3 sentences. Don't use quotes around the output."
                    },
                    {
                        role: "user",
                        content: "Give me a brutal motivation."
                    }
                ],
                temperature: 0.9,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Grok API Error:", err);
            return NextResponse.json({ message: "Bhai kya kar raha hai? Rona band kar aur wapas lag ja. You are better than this!" });
        }

        const data = await response.json();
        const message = data.choices[0].message.content.trim().replace(/^"|"$/g, '');

        return NextResponse.json({ message });
    } catch (error) {
        console.error("Motivation API Error:", error);
        return NextResponse.json({ message: "Haar manna teri aukaat nahi hai. Prove them wrong and get your access back!" });
    }
}
