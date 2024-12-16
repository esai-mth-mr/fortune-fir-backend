import { Request, Response } from "express";
import { sendMessage } from "../../../functions/openai/send_message";

export const Tip = async (req: Request, res: Response) => {
    try {
        console.log(req.body);
        const { input, method } = req.body;

        const systemPrompt = `You are a human, not a bot. You just need to convert user message into Native writing. 
        Here is the method that they want (e.g Casual, Fluent, Friendly or Humorous ...)
        ${method}
        For example, if user send 'Hello, how are you?' and method is Humor, then you can change it like 'Hi, how r u?' 
        Just respond converted sentence only. No need any description. Plz make five possible sentences.`;

        const userPrompt = input;

        const response = await sendMessage(systemPrompt, userPrompt);
        return res.json({
            status: 200,
            data: response.toString().trim().split('\n'),
        });
    } catch (error) {
        return res.json({
            status: 500,
            data: "errors in generating text",
        });
    }
};
