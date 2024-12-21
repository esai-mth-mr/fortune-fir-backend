import { Request, Response } from "express";
import paypal from "paypal-rest-sdk";
import Payment from "../../../models/Payment";
import User from '../../../models/User';
import { IPayment, IUser } from "../../../interfaces";
import { PAY_AMOUNT } from "../../../constants";

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials in environment variables.");
}

paypal.configure({
    mode: 'sandbox', //Use 'live' for production
    client_id: clientId,
    client_secret: clientSecret
});

interface paymentRequestBody {
    user_id: string;
    action: string;
}


export const pay = async (req: Request<{}, {}, paymentRequestBody>, res: Response) => {


    const { user_id, action } = req.body;
    try {
        //Check out user is vaild or not
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (action !== "regenration" && action !== "preview") return res.status(404).json({ message: "invalid action" });
        const round = user.current_status.current_round;
        const payment = { user_id, provider: "paypal", action, PAY_AMOUNT, round };
        const paymentData = encodeURIComponent(JSON.stringify(payment));
        //create payPal payment JSON
        const create_payment_json: paypal.Payment = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: `http://localhost:3000/payment/paypal/success?state=${paymentData}`,
                cancel_url: 'http://localhost:3000/payment/paypal/cancel'
            },
            transactions: [
                {
                    item_list: {
                        items: [
                            {
                                name: "howlucky2025", // Ensure `action` is defined
                                sku: 'item', // Uncomment and provide a valid SKU if required
                                price: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : '0.99', // Ensure `amount` is valid
                                currency: 'USD',
                                quantity: 1
                            }
                        ]
                    },
                    amount: {
                        currency: 'USD',
                        total: PAY_AMOUNT ? PAY_AMOUNT.toFixed(2) : '0.99' // Ensure `amount` is valid
                    },
                    description: action && round
                        ? `payment for ${action} in round ${round}`
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
                return res.redirect(approvalUrl);
            }
            res.status(400).send('no approval URL found');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Interval Server Error');
    }
}


export const success = async (req: Request, res: Response) => {
    const payerId = req.query.PayerID as string;
    const paymentId = req.query.paymentId as string;

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
        paypal.payment.execute(paymentId, execute_payment_json, (error: any, payment: any) => {
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
                const state = JSON.parse(stateString);
                const payment = new Payment({ ...state, created_at: new Date() });
                payment.save();
            }
            res.send('Payment successful');
        });
    });
}

//cancel route
export const cancel = (req: Request, res: Response) => {
    res.send('payment cancelled');
}