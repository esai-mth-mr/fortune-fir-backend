import { Request, Response } from "express";
import paypal from "paypal-rest-sdk";
import {Document} from 'mongoose';
import Payment from "../../../models/payment";

paypal.configure({
    mode: 'sandbox', //Use 'live' for production
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
})

interface paymentRequestBody{   
    user_id: string;
    provider: string;
    amount: number;
    action: string;
    round: number;
}

interface paymentDocument extends Document {
    user_id: string;
    provider: string;
    action: string;
    amount: number;
    unit: string;
    round: number;
    created_at: Date;
    updated_at: Date;
}

export const pay = async (req: Request<{}, {}, paymentRequestBody>, res:Response) => {
    const {user_id, action, amount, round, provider} = req.body;

    try{
        //create and save payment
        const payment: paymentDocument = new Payment({
            user_id,
            provider,
            action,
            amount,
            round,
        });
        await payment.save();

        //create payPal payment JSON
        const create_payment_json: paypal.Payment = {
            intent: 'game',
            payer: {
                payment_method: 'paypal'
            },
            redirect_urls: {
                return_url: 'http://localhost:3000/payment/paypal/success',
                cancel_url: 'http://localhost:3000/payment/paypal/cancel'
            },
            transactions: [ {item_list: {items: [
                    {
                        name: action,
                        //sku: 'item',
                        price: amount.toString(),
                        currency: 'USD',
                        quantity: 1
                    },
                ]
                },
                amount: {
                    currency: 'USD',
                    total: amount.toString()
                },
                description: `payment for ${action} round ${round}`
            }]
        }


        //create paypal payment
        paypal.payment.create(create_payment_json, (error:any, payment:any) => {
            if(error) {
                console.error(error);
                return res.status(500).send("error creating payment");
            }
            // Redirect user to approval URL
            const approvalUrl = payment?.links?.find((link:any) => link.rel === 'approval_url')?.href;
            if (approvalUrl) {
            return res.redirect(approvalUrl);
            }    
            res.status(400).send('no approval URL found');    
        });
    } catch(err) {
        console.error(err);
        res.status(500).send('Interval Server Error');
    }
}


export const success = async (req: Request, res: Response) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    if(!payerId || !paymentId) {
        return res.status(400).send('Missing PayerID or PaymentID');
    }

    // Fetch the payment details
  paypal.payment.get(paymentId, (error:any, payment:any) => {
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
    paypal.payment.execute(paymentId, execute_payment_json, (error:any, payment:any) => {
      if (error) {
        console.error(error.response);
        return res.status(500).send('Payment execution failed');
      }

      res.send('Payment successful');
    });
  });
}

//cancel route
export const cancel = (req: Request, res: Response) => {
    res.send('payment cancelled');
}