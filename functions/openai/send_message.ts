import OpenAI from "openai";

// Initialize OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Ensure the API key is set in the environment variables
});

export const sendMessage = async (systemPrompt: string, userPrompt: string) => {
    try {
        // Send a request to OpenAI API for chat completion
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", // Correct model name
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        // Extract and return the response message
        return {
            error: false,
            message: response.choices[0]?.message?.content || "No response content",
        };
    } catch (error: any) {
        console.error("Error communicating with OpenAI API:", error);

        // Handle OpenAI API-specific errors
        if (error.status && error.error?.message) {
            return {
                error: true,
                message: "Something went wrong. Please try again later",
            };
        }

        // Handle generic errors
        return {
            error: true,
            message: error.message || "An unknown error occurred",
        };
    }
};