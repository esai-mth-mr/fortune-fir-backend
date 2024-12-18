import { sendMessage } from "./send_message";
import { ITransferStoryInput } from "../../interfaces";


export const monthStory = async (data: ITransferStoryInput[], user: string) => {
    try {

        const systemPrompt = `I am developing a simple luck prediction game. In our betting, user selects like below items.
${data.map(each => `
-----------------------------------
item name: ${each.name}
lucky value: ${each.luck}
description: ${each.description}
-----------------------------------
`).join('')}
So, you should predict user's luck for a 1-month period with it. It should be something like funny, humorous, ideally, miserable, dead, or nervous according to the lucky value. Finally, you should give him tips. Here below is one example.
prediction : Wow, you select winner medal and it is very good luck. I am so envy. Lol, you will be a president of your job office or you can win in a betting.
///////////////
tips :
- try betting. you will be a millionaire
- try to invest. you can earn 10 times.
...`;

        const userPrompt = user;

        const response = await sendMessage(systemPrompt, userPrompt);

        return {
            error: false,
            message: response,
        };
    } catch (error) {
        return {
            error: true,
            message:
                error instanceof Error ? error.message : "An unknown error occurred",
        };
    }
};
