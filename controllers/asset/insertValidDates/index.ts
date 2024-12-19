import { Request, Response } from 'express';
import User from '../../../models/User';
import mongoose from 'mongoose';
import ValidDates from '../../../models/ValidDates';
import Log from '../../../models/Log';

export const insertValidDates = async (req: Request, res: Response) => {
    const { userId, new_date } = req.body;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }


    if (!new_date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Find the existing ValidDates document or create a new one
        let validDates = await ValidDates.findOne().session(session);
        if (!validDates) {
            validDates = new ValidDates({
                available_dates: [new_date], // Initialize with the new date
            });
        } else {
            // Add the new date to the available_dates array if it doesn't already exist
            if (!validDates.available_dates.includes(new_date)) {
                validDates.available_dates.push(new_date);
            } else {
                return res.status(400).json({ message: 'Date already exists in available_dates' });
            }
        }

        // Save the updated ValidDates document
        await validDates.save({ session });

        // Log the action
        const log = new Log({
            userId: userId,
            activity: 'insertValidDates',
            success: true,
        });
        await log.save({ session });

        await session.commitTransaction();
        return res.status(200).json({ message: 'Valid date inserted' });
    } catch (err) {
        await session.abortTransaction();
        console.log(err);
        return res.status(500).json({ message: 'Error inserting valid date' });
    } finally {
        session.endSession();
    }
};