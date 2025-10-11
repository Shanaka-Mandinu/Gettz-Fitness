import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Trainer from "../model/trainer.js";
import loggingController from "./loggingController.js";

dotenv.config();

export async  function registerTrainer(req,res){
    if(req.user == null){
        res.status(403).json({
            message: "Please login as admin to create a new user"
        });
        return;
    }
    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to create a new trainer account "
        });
        return;
    }
    const hashedPassword = bcrypt.hashSync(req.body.password,10);
    console.log(hashedPassword);
    const trainer = new Trainer({
        name:req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        password: hashedPassword,
        profilePicture: req.body.profilePicture,
        role: req.body.role || 'trainer',
        certifications: req.body.certifications || [],
        experienceYears: Number(req.body.experienceYears) || 0,
        specialization: req.body.specialization || "General Fitness",
        rating: Number(req.body.rating) || 0,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        isDisabled: req.body.isDisabled !== undefined ? req.body.isDisabled : false,
    });
    try{
        await trainer.save();
        res.status(201).json({
            message: "Trainer registered successfully",
        });
    }catch(err){
        res.status(500).json({
            message: "Error registering trainer",
            error: err.message
        });
    }

}
export function getAllTrainers(req,res){
    Trainer.find().then(
        (trainers) => {
            res.json(trainers);
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error retrieving trainers",
                error: err.message
            });
        }
    );
}
export function loginTrainer(req, res) {
    req.body.role = 'trainer';  
    return loggingController(req, res);
}
export function updateTrainer(req, res) {
    if(req.user == null){
        res.status(403).json({
            message: "Please login as admin to update a trainer"
        });
        return;
    }
    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to update a trainer"
        });

    Trainer.findOneAndUpdate({ 
        trainerIdt: req.params.id },
        req.body).then(
        (trainer) => {
            if (!trainer) {
                return res.status(404).json({ 
                    message: 'Trainer not found' });
            }else{
                res.status(200).json({
                    message: "Trainer updated successfully",
                    trainer: trainer
                });
            }  
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error updating trainer",
                error: err.message
            });
        }
    );
}
}
export function deleteTrainer(req, res) {
    if(req.user == null){
        res.status(403).json({
            message: "Please login as admin to delete a trainer"
        });
        return;
    }
    if(req.user.role != "admin"){
        res.status(403).json({
            message: "You are not authorized to delete a trainer"
        });
        return;
    }
    Trainer.findOneAndDelete({ trainerId: req.params.id }).then(
        (trainer) => {
            if (!trainer) {
                return res.status(404).json({ 
                    message: 'Trainer not found' });
            }
            res.status(200).json({
                message: "Trainer deleted successfully"
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error deleting trainer",
                error: err.message
            });
        }
    );
}
export function getTrainerById(req,res){
    Trainer.findOne({ trainerId: req.params.id }).then(
        (trainer) => {
            if (!trainer) {
                return res.status(404).json({ 
                    message: 'Trainer not found' });
            }
            res.status(200).json({
                trainer: trainer
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error retrieving trainer",
                error: err.message
            });
        }
    );
}

// Get trainer profile (for logged-in trainer)
export function getTrainerProfile(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    if (req.user.role !== 'trainer') {
        return res.status(403).json({
            message: "Access denied. Trainer role required."
        });
    }

    Trainer.findOne({ email: req.user.email }).then(
        (trainer) => {
            if (!trainer) {
                return res.status(404).json({ 
                    message: 'Trainer profile not found' });
            }
            res.status(200).json({
                message: "Profile retrieved successfully",
                trainer: trainer
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error retrieving trainer profile",
                error: err.message
            });
        }
    );
}

// Update trainer profile (for logged-in trainer)
export function updateTrainerProfile(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    if (req.user.role !== 'trainer') {
        return res.status(403).json({
            message: "Access denied. Trainer role required."
        });
    }

    const updateData = {
        ...req.body,
        updatedAt: new Date()
    };

    Trainer.findOneAndUpdate(
        { email: req.user.email },
        updateData,
        { new: true, runValidators: true }
    ).then(
        (trainer) => {
            if (!trainer) {
                return res.status(404).json({ 
                    message: 'Trainer profile not found' });
            }
            res.status(200).json({
                message: "Profile updated successfully",
                trainer: trainer
            });
        }
    ).catch(
        (err) => {
            res.status(500).json({
                message: "Error updating trainer profile",
                error: err.message
            });
        }
    );
}

// Get trainer statistics
export function getTrainerStats(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    if (req.user.role !== 'trainer') {
        return res.status(403).json({
            message: "Access denied. Trainer role required."
        });
    }

    // For now, return mock data. In a real app, you'd query actual data
    const stats = {
        totalClients: 0,
        activeClients: 0,
        totalSessions: 0,
        rating: 4.5
    };

    res.status(200).json({
        message: "Stats retrieved successfully",
        stats: stats
    });
}

