import OpenAI from "openai";

const openai = new OpenAI();

export const sendMessage = async (systemPrompt: string, userPrompt: string) => {
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: "gpt-4o",
        });

        return completion.choices[0];
    } catch (error) {
        if (error instanceof OpenAI.APIError) {
            console.log(error.message);
        }
        // For other types of errors
        return {
            error: true,
            message:
                error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};
