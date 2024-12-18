import mongoose, { Document, Schema } from 'mongoose';  
export interface ILog {
    userId: string;
    time: Date;
    activity: string;
    success: boolean;
    reason?: string;
}

export interface IUser  {
    name: string;
    email: string;
    password: string;
    gender: string;
    dob: Date;
    current_status: {
        current_round: number;
        round_status: string;
    }
    job: string;
    accountStatus: boolean
}

export interface IAsset  {
    index: number;
    url: string;
    name: string;
    description: Text;
    luck: string;
}

export interface IStory  {
    round: number;
    user_id: string;
    stories: ISection[];
    total_story: Text;
    total_point: number;
}

export interface ISection {
    month: number;
    story: Text;
    point: number;
    asset: number[],
    tip: Text;
}

export interface IPayment {
 //   user_id:string;
    user_id: mongoose.Types.ObjectId;
    provider: string;
    action: string;
    amount: number;
    unit: string;
    round: number;
    created_at: Date;
    updated_at: Date;
}