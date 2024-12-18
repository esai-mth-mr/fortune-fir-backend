import OpenAI from "openai";

// Initialize OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Replace with your actual API key
});

export const sendMessage = async (systemPrompt: string, userPrompt: string) => {
    try {

        console.log("--------key from env --------- ", process.env.OPENAI_API_KEY)

        const completion = await openai.chat.completions.create({
            model: "gpt-4", // Correct model name
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });
        return completion.choices[0].message; // Accessing the message content
    } catch (error: any) {

        console.log("-------error----------", error)
        if (error.status) {
            // OpenAI API-specific error
            console.error("OpenAI API Error:", error.status, error.body);
            return `OpenAI API Error: ${error.body.error.message}`;
        } else {
            // Generic error
            console.error("Error:", error.message);
            return error.message || "An unknown error occurred";
        }
    }
};