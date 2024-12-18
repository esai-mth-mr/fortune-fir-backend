import { Request, Response } from 'express';
import Asset from '../../../models/Asset';

export const init = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.body;

    try {
        //Get the current counts of Asset
        const count: number = await Asset.countDocuments();

        //if there are fewer than or equal to 12 assets, then return all data
        if (count <= 12) {
            const assets = await Asset.find();
            return res.status(200).json(assets);
        }

        //Generate unique randon assets indices
        const randomIndicies: Set<number> = new Set();
        while (randomIndicies.size < 12) {
            const randomIndex = Math.floor(Math.random() * count);
            randomIndicies.add(randomIndex);
        }

        //Conver the set to an array
        const indicesArray: number[] = Array.from(randomIndicies);

        // Create an array to hold the fetched assets  
        const assets: any[] = [];

        //Fetch the data
        for (const index of indicesArray) {
            const asset = await Asset.find().skip(index).limit(1);
            assets.push(asset[0]);
        }

        return res.status(200).json(assets);
    }
    catch (err) {
        console.error('Error fetching assets:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}