import { Request, Response } from 'express';
import Asset from '../../../models/Asset';
import { generateUniqueRandomIntArray } from '../../../functions/story';

export const init = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Get the total count of assets
        const count: number = await Asset.countDocuments();

        // If there are fewer than or equal to 12 assets, return all assets
        if (count <= 12) {
            const assets = await Asset.find();
            return res.status(200).json(assets);
        }

        // Generate 12 unique random indices within the range of available assets
        const indicesArray: number[] = generateUniqueRandomIntArray(12, 0, count - 1);

        console.log(indicesArray)
        // Fetch assets using random indices (with skip and limit)
        const assets = await Asset.aggregate([
            {
                $facet: {
                    randomAssets: indicesArray.map(index => ({
                        $skip: index,
                    })),
                },
            },
        ]);

        console.log(assets)

        return res.status(200).json(assets);
    } catch (err) {
        console.error('Error fetching assets:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};