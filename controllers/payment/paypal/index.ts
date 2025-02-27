import { Request, Response } from "express";
import paypal from "paypal-rest-sdk";
import Payment from "../../../models/Payment";
import User from '../../../models/User';
import { AUTH_ERRORS, baseClientUrl, clientId, clientSecret, EMAIL_MSGS, PAY_AMOUNT, PAYPAL_MODE } from "../../../constants";
import { contactEmail } from "../../../functions/email";

if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials in environment variables.");
}

paypal.configure({
    mode: PAYPAL_MODE, //Use 'live' for production
    client_id: clientId,
    client_secret: clientSecret
});

interface paymentRequestBody {
    userId: string;
    action: string;
}


export const pay = async (req: Request<{}, {}, paymentRequestBody>, res: Response) => {

    const { userId, action } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    let currentRound = user.current_status.current_round;

    const isPayment = await Payment.findOne({ user_id: userId, action, round: currentRound });

    if (isPayment) {
        user.current_status.current_round += 1;
        user.current_status.round_status = "progress";
        await user.save();
        currentRound += 1;
    }

    try {
        //Check out user is vaild or not

        if (action !== "regeneration" && action !== "preview") return res.status(404).json({ message: "invalid action" });
        // const isAvailableDate = await isChrismas();

        const payment = { user_id: userId, provider: "paypal", action, PAY_AMOUNT, round: currentRound }; //potential error will happen
        const paymentData = encodeURIComponent(JSON.stringify(payment));
        //create payPal payment JSON

        const create_payment_json: paypal.Payment = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: `${baseClientUrl}/payment/paypal/result?state=${paymentData}`,
                cancel_url: `${baseClientUrl}/payment/cancel`
            },
            transactions: [
                {
                    item_list: {
                        items: [
                            {
                                name: "howlucky2025", // Ensure `action` is defined
                                sku: 'item', // Uncomment and provide a valid SKU if required
                                price: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : '4.99', // Ensure `amount` is valid
                                currency: 'USD',
                                quantity: 1
                            }
                        ]
                    },
                    amount: {
                        currency: 'USD',
                        total: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : '4.99' // Ensure `amount` is valid
                    },
                    description: action && currentRound
                        ? `payment for ${action} in round ${currentRound}`
                        : 'action or round is not defined.' // Ensure `action` and `round` are defined
                }
            ]
        }

        //create paypal payment
        paypal.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                console.error(error);
                return res.status(500).send("error creating payment");
            }
            // Redirect user to approval URL
            const approvalUrl = payment?.links?.find((link: any) => link.rel === 'approval_url')?.href;
            if (approvalUrl) {
                return res.send({ approvalUrl });
            }
            res.status(400).send('no approval URL found');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Interval Server Error');
    }
}

export const success = async (req: Request, res: Response) => {
    const { payerId, paymentId, userId, state } = req.body;
    // const {paymentId} = req.body;
    // const {userId} = req.body;
    // const {state} = req.body;

    if (!payerId || !paymentId) {
        return res.status(400).send('Missing PayerID or PaymentID');
    }

    // Fetch the payment details
    paypal.payment.get(paymentId, (error: any, payment: any) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error retrieving payment details');
        }
        // Extract the amount from the payment object
        const totalAmount = payment.transactions[0].amount.total;
        // Proceed to execute the payment with the retrieved amount
        const execute_payment_json = {
            payer_id: payerId as string,
            transactions: [
                {
                    amount: {
                        currency: 'USD',
                        total: totalAmount, // Use the amount retrieved from the payment object
                    },
                },
            ],
        };

        // Execute the payment
        paypal.payment.execute(paymentId, execute_payment_json, async (error: any, payment: any) => {
            if (error) {
                switch (error.response.name) {
                    case 'INSUFFICIENT_FUNDS':
                        return res.status(400).send('Payment failed: Insufficient funds in PayPal account');
                    case 'PAYMENT_DECLINED':
                        return res.status(400).send('Payment failed: Payment was declined');
                    case 'INVALID_PAYMENT_METHOD':
                        return res.status(400).send('Payment failed: Invalid payment method');
                    case 'PAYMENT_TIMEOUT':
                        return res.status(408).send('Payment failed: Payment timeout');
                    case 'CURRENCY_NOT_SUPPORTED':
                        return res.status(400).send('Payment failed: Currency not supported');
                    case 'TRANSACTION_NOT_FOUND':
                        return res.status(404).send('Payment failed: Transaction not found');
                    default:
                        return res.status(500).send('Payment execution failed: Unknown error');
                }
            }
            const stateString = req.query.state as string;
            if (!stateString) {
                const user_state = JSON.parse(state);
                const user = await User.findById(userId);

                if (!user) {
                    return res.status(404).json({ error: true, message: AUTH_ERRORS.accountNotFound });
                }

                if (!user.accountStatus) {
                    return res.status(403).json({ error: true, action: "verify", message: AUTH_ERRORS.activateAccountRequired });
                }

                if (userId !== user_state.user_id) {
                    return res.status(400).json({ error: true, message: AUTH_ERRORS.rightMethod });
                }

                if (user.current_status.current_round !== user_state?.round) {
                    return res.status(400).json({ error: true, message: AUTH_ERRORS.rightMethod });
                }

                if (user_state?.provider !== "paypal" || user_state?.PAY_AMOUNT !== PAY_AMOUNT) {
                    return res.status(400).json({ error: true, message: AUTH_ERRORS.rightMethod });
                }

                try {
                    const payment = new Payment({ ...user_state, amount: user_state?.PAY_AMOUNT, unit: "USD", created_at: new Date() });
                    await payment.save();
                    const content = `
                            <p>From: ${userId}</p>
                            <p>=======================================================================</p>
                            <p>Message: Customer paid $${user_state?.PAY_AMOUNT}</p>
                            `;

                    await contactEmail(
                        "",
                        EMAIL_MSGS.paymentSubject,
                        content
                    );

                    return res.status(200).json({ error: false, message: "Thank you! Payment successfully released.", url: "/payment/paypal/success" });
                } catch (error: any) {
                    console.log(error._message ?? "Unknown Error")
                    return res.status(500).json({ error: true, message: "Unexpected Error!, Please try again." });
                }

            }

        });
    })
}
//cancel route
export const cancel = (req: Request, res: Response) => {
    return res.status(200).json({ error: true, message: "Payment Failed." });
}