import { sendMessage } from "./send_message";
import { ITransferStoryInput } from "../../interfaces";

export const monthStory = async (data: ITransferStoryInput[], user: string) => {
    try {
        // Construct the system prompt
        const systemPrompt = `
I am developing a simple luck prediction game. In our betting, the user selects items like below:
${data.map((each) => `
-----------------------------------
Item Name: ${each.name}
Lucky Value: ${each.luck}
Description: ${each.description}
-----------------------------------`
        ).join("")}
    
Based on these information, you should predict the user's luck for a 1-month period. 
No need any description. Make it funny, humorous or even miserable, nervous, or dead according to the lucky value. 
It is important to make it lively and humorously. Finally, provide the user with tips. 
Here are example output.

Prediction:
Congratulations, you're practically a human horseshoe this month! Everything you touch might just turn into gold—or at least gold-plated. 
That professor who never gives A's? Guess who's getting one! Oh, and don't be surprised if you accidentally trip over a $100 bill. 
Be careful, though—this kind of luck makes you a magnet for jealous glances and random pigeons dropping... blessings.
//////////
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
