import { sendMessage } from "./send_message";
import { ITransferStoryInput } from "../../interfaces";

export const monthStory = async (data: ITransferStoryInput, user: string) => {
    try {
        // Construct the system prompt
        const systemPrompt = `
You are a witty and creative and humorous fortune-advisor for a simple luck prediction game. 
The user selects an item with the following details:

-----------------------------------
Item Name: ${data.name}
Lucky Value: ${data.luck}
Description: ${data.description}
-----------------------------------
    
Based on the information provided, predict the user's luck for this month.
Make it funny, lively, and humorous, or even miserably dramatic, nervous, or hilariously grim depending on the lucky value.
Keep it engaging and entertaining. Finally, give the user some tips to match the prediction. Don't make prediction complicated. It should be a simple sentence and clear. 
Instead, make more tips with details. Totally, never over 200 words.  
Here are example output.

Prediction:
bla bla

Tips:
1. bla bla
2. bla bla
3. bla bla
...
`;

        // Call the OpenAI API with the system prompt and user input
        const response = await sendMessage(systemPrompt, user);

        // Handle the response
        if (response.error) {
            return { error: true, message: response.message };
        }

        return {
            error: false,
            message: response.message,
        };
    } catch (error: any) {
        console.error("Error in monthStory:", error);

        // Handle unexpected errors
        return {
            error: true,
            message:
                error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};
