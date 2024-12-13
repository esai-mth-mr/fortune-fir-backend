export interface ILog {
    userId: string;
    time: Date;
    activity: string;
    success: boolean;
    reason?: string;
}

export interface IUser extends Document {
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