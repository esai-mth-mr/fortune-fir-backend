import { sendMessage } from "./send_message"

interface DataType {
    month: number,
    story: string
}

export const yearStory = async (data: DataType[], user: string) => {
    try {

        const systemPrompt = `You are a witty and creative fortune-teller for a simple luck prediction game. The user selects an item with the following details:
${data.map(each => `
-----------------------------------
month: ${each.month}
monthly Luck: ${each.story}
-----------------------------------
`).join('')}
So, you should sumarize user's luck for a 1-year period with it. 
It should be something like funny, humorous, ideally, miserable, dead, or nervous according to the lucky value. 
Finally, you should give him tips. 
Here below is one example.

Prediction : 
This year, luck will be your quirky sidekick, bringing a mix of dazzling highs and laughable mishaps. 
The first half kicks off with extreme good fortune—expect surprise wins, academic triumphs, and maybe even a little romance. 
Midyear, your luck mellows into steady blessings, perfect for planning your future and making meaningful connections. 
But as autumn rolls in, chaos takes the wheel, throwing in comically inconvenient moments like missed buses and spilled coffee. 
Don’t worry—these hiccups are the kind that build character, not catastrophe. Ride the highs, roll with the lows, and keep a sense of humor; this is your year to shine and laugh along the way!

Tips :
1. First Half (Extreme Luck): Take bold risks and start new ventures—you’re on a winning streak!
2. Midyear (Stable Luck): Focus on building your goals and nurturing relationships; it’s your time for growth.
3. Autumn (Chaotic Luck): Stay adaptable and keep backup plans for the small misfortunes; laugh off the rest.
4. Throughout: Journal your wins and mishaps—you’ll want to revisit this rollercoaster year with a grin!
...`;;

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