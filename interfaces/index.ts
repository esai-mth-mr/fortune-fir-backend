export interface ILog extends Document {
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

export interface IAsset extends Document {
    index: number;
    url: string;
    name: string;
    description: Text;
    luck: string;
}

export interface IStory extends Document {
    round: number;
    user_id: string;
    stories: ISection[];
    total_story: Text;
    total_point: number;
}

export interface ISection extends Document {
    month: number;
    story: Text;
    point: number;
    asset: number[],
    tip: Text;
}

export interface IAvailable extends Document {
    available_dates: Date[];
}