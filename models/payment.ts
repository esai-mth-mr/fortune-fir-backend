import mongoose, { Document, Schema } from "mongoose";
import { IPayment } from "../interfaces";

const paymentSchema: Schema<IPayment> = new Schema({
 
    user_id: {type: String, required: true},
    provider: {
        type: String,
        enum: ['stripe', 'paypal', 'crypt'],
        default: 'stripe',
        required: true
    },
    action: {type:String, enum: [], required: true},
    amount: {type: Number, required: true},
    unit: {type: String, required: true},   
    round: {type: Number, required: true},
    created_at: {type: Date, required: true},
    updated_at: {type: Date},
}, { timestamps: true });

const User = mongoose.model < IPayment > ('User', paymentSchema);

export default User;