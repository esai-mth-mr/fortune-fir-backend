import { sendMessage } from "./send_message"

export const storyText = async (prompt: string) => {
    try {

        const systemPrompt = `You just need detect AI description.
        
           Analyze the given text for unnatural patterns, inconsistencies in tone, and lack of personal experience. 
           Look for overuse of formal language, repetitive structures, or unnatural phrasing typical of AI-generated content. 
           Evaluate the depth of insight in complex topics, checking for superficial understanding or vague responses. 
           Examine the coherence of ideas, emotional expression, and subjective content. 
           Assess how well the text maintains context and flow, with attention to abrupt transitions or redundancy. 
           Compare the originality and creativity of the text, identifying signs of AI’s reliance on trained data without genuine, novel input.
           Give me only percent. No need any description.`;

        const userPrompt = prompt;

        const response = await sendMessage(systemPrompt, userPrompt);
        return {
            error: false,
            message: response
        }
    } catch (error) {
        return {
            error: true,
            message: error instanceof Error ? error.message : "An unknown error occurred",
        }
    }
}