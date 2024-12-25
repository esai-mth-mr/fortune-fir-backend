import { sendMessage } from "./send_message";
import { ITransferStoryInput } from "../../interfaces";

export const monthStory = async (data: ITransferStoryInput, user: string) => {
    try {
        // Construct the system prompt
        const systemPrompt = `
You are a witty and creative fortune-teller for a simple luck prediction game. The user selects an item with the following details:

-----------------------------------
Item Name: ${data.name}
Lucky Value: ${data.luck}
Description: ${data.description}
-----------------------------------
    
Based on the information provided, predict the user's luck for the next month.
Make it funny, lively, and humorous, or even miserably dramatic, nervous, or hilariously grim depending on the lucky value.
Keep it engaging and entertaining. Finally, give the user some tips to match the prediction.
Here are example output.

Prediction:
Congrats, you’re basically a walking good luck charm this month! Everything you touch might as well turn to gold—or at least something shiny.
That impossible professor? Yep, you’re getting an A. And don’t be shocked if you stumble across a $100 bill out of nowhere.
But watch out—this kind of luck attracts jealous stares and maybe even some "blessings" from pigeons above.

Tips:
1. Buy a Lottery Ticket: But remember, only one—don’t push your luck.
2. Ace Your Exams: Channel your energy into nailing those tests.
3. Avoid Overthinking: When you're this lucky, just roll with it.
4. Stay Humble: Nobody likes a lucky show-off.
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
