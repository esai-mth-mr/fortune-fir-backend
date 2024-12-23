import { Request, Response } from "express";
import paypal from "paypal-rest-sdk";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { AUTH_ERRORS, baseClientUrl } from "../../../constants";
import { isChrismas } from "../../../functions/story";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials in environment variables.");
}

paypal.configure({
    mode: "live", // Use 'live' for production
    client_id: clientId,
    client_secret: clientSecret,
});

const getPayAmount = async () => {
    const isAvailableDate = await isChrismas();
    return isAvailableDate ? 0.99 : 1.99;
};

const createPaymentJson = (paymentData: any, PAY_AMOUNT: number, action: number, round: number) => ({
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: {
        return_url: `${baseClientUrl}/payment/paypal/result?state=${paymentData}`,
        cancel_url: `${baseClientUrl}/payment/paypal/cancel`,
    },
    transactions: [
        {
            item_list: {
                items: [
                    {
                        name: "howlucky2025",
                        sku: "item",
                        price: PAY_AMOUNT.toFixed(2),
                        currency: "USD",
                        quantity: 1,
                    },
                ],
            },
            amount: {
                currency: "USD",
                total: PAY_AMOUNT.toFixed(2),
            },
            description: `Payment for ${action} in round ${round}`,
        },
    ],
});

export const pay = async (req: Request, res: Response) => {
    const { userId, action } = req.body;

    try {
        if (!userId || !["regeneration", "preview"].includes(action)) {
            return res.status(400).json({ message: "Invalid request data" });
        }

        const existingPayment = await Payment.findOne({ user_id: userId, action });
        if (existingPayment) {
            return res.status(400).json({ message: "Payment already exists" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const PAY_AMOUNT = await getPayAmount();
        const round = user.current_status.current_round;
        const payment = {
            user_id: userId,
            provider: "paypal",
            action,
            PAY_AMOUNT,
            round,
        };
        const paymentData = encodeURIComponent(JSON.stringify(payment));

        const create_payment_json = createPaymentJson(paymentData, PAY_AMOUNT, action, round);

        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error(error);
                return res.status(500).send("Error creating payment");
            }

            const approvalUrl = payment?.links?.find(link => link.rel === "approval_url")?.href;
            if (approvalUrl) {
                return res.send({ approvalUrl });
            }

            res.status(400).send("No approval URL found");
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

export const success = async (req: Request, res: Response) => {
    const { payerId, paymentId, userId, state } = req.body;

    if (!payerId || !paymentId) {
        return res.status(400).send("Missing PayerID or PaymentID");
    }

    try {
        paypal.payment.get(paymentId, async (error, payment) => {
            if (error) {
                console.error(error);
                return res.status(500).send("Error retrieving payment details");
            }

            const totalAmount = payment.transactions[0].amount.total;
            const execute_payment_json = {
                payer_id: payerId,
                transactions: [
                    { amount: { currency: "USD", total: totalAmount } },
                ],
            };

            paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send("Error executing payment");
                }

                const userState = JSON.parse(decodeURIComponent(state));

                const user = await User.findById(userId);
                if (!user || userId !== userState.user_id ||
                    user.current_status.current_round !== userState.round ||
                    userState.provider !== "paypal" || userState.PAY_AMOUNT !== 0.99) {
                    return res.status(400).json({ error: true, message: AUTH_ERRORS.rightMethod });
                }

                const existingPayment = await Payment.findOne({
                    user_id: userState.user_id,
                    action: userState.action,
                    round: userState.round,
                });
                if (existingPayment) {
                    return res.status(400).json({ error: true, message: "You already have paid." });
                }

                const newPayment = new Payment({
                    ...userState,
                    unit: "USD",
                    amount: userState.PAY_AMOUNT,
                    created_at: new Date(),
                });
                await newPayment.save();

                res.status(200).json({
                    error: false,
                    message: "Thank you! Payment successfully released.",
                    url: "/payment/paypal/success",
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

export const cancel = (req: Request, res: Response) => {
    res.status(200).json({ error: true, message: "Payment Failed." });
};
