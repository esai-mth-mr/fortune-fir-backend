import { Request, Response } from "express";
import Asset from "../../../models/Asset";
const fs = require('fs');
const path = require('path');


export const AssetData = async (req: Request, res: Response) => {

    try {
        const __dirname = path.resolve();
        // Read data from JSON file
        const filePath = path.join(__dirname, 'data.json'); // Path to your JSON file
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(rawData);
        // Add extra data to each document
        const documents = jsonData.map((item: any) => ({
            ...item,
            timestamp: new Date(),
            source: 'file_upload'
        }));

        // Insert documents into MongoDB
        const result = await Asset.insertMany(documents);

        res.send(" documents inserted successfully");
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).send('Error inserting data');
    }
}