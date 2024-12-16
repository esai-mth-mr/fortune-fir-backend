import { Request, Response } from 'express';
import Asset from '../../../models/Asset';

export const init = async (req: Request, res: Response) => {
    try {
        const count = await Asset.countDocuments();
        const random = Math.floor(Math.random() * count);

        const assets = await Asset.find()
            .skip(random)
            .limit(12);
        console.log(assets)
        return res.status(200).json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}