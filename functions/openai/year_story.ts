import { sendMessage } from "./send_message"

interface dataType {
    month: number,
    story: string
}

export const yearStory = async (data: dataType[], user: string) => {
    try {

        const systemPrompt = `I am developing a simple luck prediction game. Here there are monthly luck for every month.
${data.map(each => `
-----------------------------------
month: ${each.month}
monthly Luck: ${each.story}
-----------------------------------
`).join('')}
So, you should predict user's luck for a 1-year period with it. It should be something like funny, humorous, ideally, miserable, dead, or nervous according to the lucky value. Finally, you should give him tips. Here below is one example.
prediction : Congratulations, you’re riding on a golden wave for the year! This winner medal doesn’t mess around—it’s like having a cheat code for life. Over the next 12 months, opportunities will pop up like ads on a free app, but way more useful. You’ll ace challenges, impress bosses, charm strangers, and probably win that random raffle you forgot you entered. Expect small wins, big smiles, and the occasional “How did I get this lucky?” moment. Just don’t spend all year waiting for miracles—luck loves action!.
///////////////
tips :
- Set bold goals: Now’s the time to dream big; fortune favors the brave.
- Invest wisely: Whether it’s money, time, or effort, every seed you plant could bloom into a jackpot.
- Make connections: Your charisma is at an all-time high—networking could open unexpected doors.
- Say yes to opportunities: New projects, trips, or even hobbies might lead to surprising rewards.
- Stay humble: With luck on your side, it’s easy to get cocky—but staying grounded will win you fans for life.
...`;;

        const userPrompt = user;

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