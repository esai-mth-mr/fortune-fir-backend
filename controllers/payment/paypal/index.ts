import { Request, Response } from "express";
import paypal from "paypal-rest-sdk";
import Payment from "../../../models/Payment";
import User from "../../../models/User";
import { AUTH_ERRORS, baseClientUrl, PAY_AMOUNT } from "../../../constants";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials in environment variables.");
}

paypal.configure({
    mode: "sandbox", //Use 'live' for production
    client_id: clientId,
    client_secret: clientSecret,
});

interface paymentRequestBody {
    userId: string;
    action: string;
}

export const pay = async (
    req: Request<{}, {}, paymentRequestBody>,
    res: Response
) => {
    const { userId, action } = req.body;
    const isPayment = await Payment.findOne({ user_id: userId, action });
    if (isPayment)
        return res.status(400).json({ message: "Payment already exist" });

    try {
        //Check out user is vaild or not
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (action !== "regeneration" && action !== "preview")
            return res.status(404).json({ message: "invalid action" });
        const round = user.current_status.current_round;
        const payment = {
            user_id: userId,
            provider: "paypal",
            action,
            PAY_AMOUNT,
            round,
        }; //potential error will happen
        const paymentData = encodeURIComponent(JSON.stringify(payment));
        //create payPal payment JSON

        const create_payment_json: paypal.Payment = {
            intent: "sale",
            payer: {
                payment_method: "paypal",
            },
            redirect_urls: {
                return_url: `${baseClientUrl}/payment/paypal/result?state=${paymentData}`,
                cancel_url: `${baseClientUrl}/payment/paypal/cancel`,
            },
            transactions: [
                {
                    item_list: {
                        items: [
                            {
                                name: "howlucky2025", // Ensure `action` is defined
                                sku: "item", // Uncomment and provide a valid SKU if required
                                price: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : "0.99", // Ensure `amount` is valid
                                currency: "USD",
                                quantity: 1,
                            },
                        ],
                    },
                    amount: {
                        currency: "USD",
                        total: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : "0.99", // Ensure `amount` is valid
                    },
                    description:
                        action && round
                            ? `payment for ${action} in round ${round}`
                            : "action or round is not defined.", // Ensure `action` and `round` are defined
                },
            ],
        };

        //create paypal payment
        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error(error);
                return res.status(500).send("error creating payment");
            }
            // Redirect user to approval URL
            const approvalUrl = payment?.links?.find(
                (link: any) => link.rel === "approval_url"
            )?.href;
            if (approvalUrl) {
                return res.send({ approvalUrl });
            }
            res.status(400).send("no approval URL found");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Interval Server Error");
    }
};

export const success = async (req: Request, res: Response) => {
    const { payerId, paymentId, userId, state } = req.body;

    if (!payerId || !paymentId) {
        return res.status(400).send("Missing PayerID or PaymentID");
    }

    // Fetch the payment details
    paypal.payment.get(paymentId, async (error: any, payment: any) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Error retrieving payment details");
        }
        // Extract the amount from the payment object
        const totalAmount = payment.transactions[0].amount.total;

        // Proceed to execute the payment with the retrieved amount
        const execute_payment_json = {
            payer_id: payerId as string,
            transactions: [
                {
                    amount: {
                        currency: "USD",
                        total: totalAmount, // Use the amount retrieved from the payment object
                    },
                },
            ],
        };

        // Execute the payment
        paypal.payment.execute(
            paymentId,
            execute_payment_json,
            async (error: any, payment: any) => {

                if (error) {
                    switch (error.response.name) {
                        case "INSUFFICIENT_FUNDS":
                            return res
                                .status(400)
                                .send("Payment failed: Insufficient funds in PayPal account");
                        case "PAYMENT_DECLINED":
                            return res
                                .status(400)
                                .send("Payment failed: Payment was declined");
                        case "INVALID_PAYMENT_METHOD":
                            return res
                                .status(400)
                                .send("Payment failed: Invalid payment method");
                        case "PAYMENT_TIMEOUT":
                            return res.status(408).send("Payment failed: Payment timeout");
                        case "CURRENCY_NOT_SUPPORTED":
                            return res
                                .status(400)
                                .send("Payment failed: Currency not supported");
                        case "TRANSACTION_NOT_FOUND":
                            return res
                                .status(404)
                                .send("Payment failed: Transaction not found");
                        default:
                            return res
                                .status(500)
                                .send("Payment execution failed: Unknown error");
                    }
                }

                const stateString = req.query.state as string;
                if (!stateString) {
                    const user_state = JSON.parse(state);
                    const user = await User.findById(userId);

                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: true, message: AUTH_ERRORS.accountNotFound });
                    }

                    if (!user.accountStatus) {
                        return res.status(403).json({
                            error: true,
                            action: "verify",
                            message: AUTH_ERRORS.activateAccountRequired,
                        });
                    }

                    if (userId !== user_state.user_id) {

                        return res
                            .status(400)
                            .json({ error: true, message: AUTH_ERRORS.rightMethod });
                    }

                    if (user.current_status.current_round !== user_state?.round) {

                        return res
                            .status(400)
                            .json({ error: true, message: AUTH_ERRORS.rightMethod });
                    }

                    if (user_state?.provider !== "paypal" || user_state?.PAY_AMOUNT !== 0.99) {
                        return res
                            .status(400)
                            .json({ error: true, message: AUTH_ERRORS.rightMethod });
                    }
                    const payHistory = await Payment.findOne({
                        user_id: user_state.user_id,
                        action: user_state.action,
                        round: user_state.round,
                    });
                    if (payHistory) {
                        return res.status(400).json({
                            error: true,
                            message: "You already have paid.",
                        });
                    }
                    try {
                        const payment = new Payment({
                            ...user_state,
                            unit: "USD",
                            amount: userId.PAY_AMOUNT,
                            created_at: new Date(),
                            timeStamp: new Date()
                        });
                        await payment.save();

                        return res.status(200).json({
                            error: false,
                            message: "Thank you! Payment successfully released.",
                            url: "/payment/paypal/success",
                        });

                    } catch (error) {
                        console.log("------error--------", error);
                        return res.status(500).json({
                            error: true,
                            message: "Error occured.",
                        });
                    }
                }


            }
        );
    });
};
//cancel route
export const cancel = (req: Request, res: Response) => {
    return res.status(200).json({ error: true, message: "Payment Failed." });
};
