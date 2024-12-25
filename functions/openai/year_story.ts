import { sendMessage } from "./send_message"

interface DataType {
    month: number,
    story: string
}

export const yearStory = async (data: DataType[], user: string) => {
    try {

        const systemPrompt = `You are a witty and creative and humorous fortune-advisor for a simple luck prediction game. The user selects an item with the following details:
${data.map(each => `
-----------------------------------
month: ${each.month}
monthly Luck: ${each.story}
-----------------------------------
`).join('')}
So, you should sumarize user's luck for a 1-year period with it. 
It should be something like funny, humorous, ideally, miserable, dead, or nervous according to the lucky value. 
Finally, you should give him tips. Don't make prediction complicated. It should be a simple sentence and clear. 
Instead, make more tips with details. Totally, never over 200 words.  

Here below is an example.

Prediction : 
This year, bla bla

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
            message: error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};