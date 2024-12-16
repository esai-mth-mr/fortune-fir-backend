import { Request, Response } from 'express';
// import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import Payment from "../../../models/payment";


let price_ids: {  
    [action: string]: string; // Define the shape of the price_ids object  
  }  

let metadata: {
    [key:string]: string;
}

  interface PaymentSessionRequestBody {  
    action: string; // Ensures action must be one of the keys from PriceIds    
    successUrl: string;  
    cancelUrl: string;  
    user_id: string,
    provider: string,  
    amount: number,
    unit: string,
    round: number,
    } 
// Create your price_ids object using environment variables  
// const price_ids: PriceIds = {  
//     action1: process.env. || '', // Retrieve from .env, with fallback  
//     action2: process.env.PRICE_ID_ACTION2 || '',  
//     // Add more actions as required  
//   }; 

export const sessionInitiate = async (req: Request<{}, {}, PaymentSessionRequestBody>, res: Response) => {
    console.log(req.body);
    const {
        //clientReferenceId,
        user_id,
        provider,  
        amount,
        unit,
        action, 
        round,
        successUrl,
        cancelUrl,
      } = req.body;
  
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  
      let session;
  
      try {
        price_ids = JSON.parse(process.env.STRIPE_PRICE_IDS || "{}");

        const price = price_ids[action] || undefined; // Use undefined if price isn't found  

        // Check if the price is valid before proceeding  
        if (!price) {  
          return res.status(400).send({ error: 'Invalid action provided, no price found.' });  
        } 
        // const price = price_ids[action] || null;
        session = await stripe.checkout.sessions.create({
            //client_reference_id: clientReferenceId,  
            //customer_email: customerEmail,  
            payment_method_types: ['card'], 
            metadata:{
                action: action,
                user_id: user_id,
                provider: provider,
                amount: amount,
                unit: unit,
                round: round,
            }, 
            line_items: [{  
                price: price,  
                quantity: 1,  
            }],  
            success_url: successUrl,  
            cancel_url: cancelUrl,
        });
      } catch (error) {
        res.status(500).send({ error });
      }
  
      return res.status(200).send(session);
    }

export const sessionComplete = async (req: Request, res: Response) => {

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    let event;
    

    try {
        const signature = req.headers['stripe-signature'];
        if (!signature || typeof signature !== 'string') {  
            return res.status(400).send('Webhook Error: Missing or invalid Stripe signature.');  
          }  
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error}`); //error = === error.message
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
          // complete your customer's order
          // e.g. save the purchased product into your database
          // take the clientReferenceId to map your customer to a 
          if(session.metadata) {
            const payment = new Payment({
              user_id: session.metadata.user_id,  // Provide fallback value if necessary  
              provider: session.metadata.provider,  
              action: session.metadata.action,  
              amount: session.metadata.amount,  
              unit: session.metadata.unit,  
              round: session.metadata.round,  
            });
            await payment.save();
          }
        } catch (error) {
          return res.status(404).send({ error, session });
        }
      }
      return res.status(200).send({ received: true });
}
    