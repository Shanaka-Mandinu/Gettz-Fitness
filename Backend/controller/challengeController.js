import mongoose from "mongoose";
import User from "../model/user.js";
import Admin from "../model/admin.js";
import Challenge from "../model/challenge.js";
import UserChallenge from "../model/userChallenge.js";
import { createNotificationForUser } from "./notificatinController.js";

export async function viewChallenges(req, res) {
  try {
    // if (!req.user) {
    //   return res.status(403).json({ message: "Please login to view challenges" });
    // }

    // if (req.user.role !== "member" && req.user.role !== "admin") {
    //   return res.status(403).json({ message: "Login as a member to view challenges" });
    // }

    const challenges = await Challenge.find();

    const counts = await UserChallenge.aggregate([
      { $group: { _id: "$CID", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const data = challenges.map((ch) => ({
      ...ch.toObject(),
      participantCount: countMap[ch._id.toString()] || 0,
    }));

    res.json(data);
  } catch (err) {
    console.error("viewChallenges error:", err);
    res.status(500).json({ message: "Challenge not found!" });
  }
}

export function createChallenge(req, res){

     if(req.user == null){
        res.status(403).json({
            message: "Please login to create challenge"
        });
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "Login as an admin to create challenge"
        });
        return;
    }

    const challenge = new Challenge(
       {
            ...req.body,
            admin_id: req.user.id
       }
    )

    challenge.save().then(
        () => {res.json({
            message : "Challenge Saved Successfully!"
        })
        }
    ).catch((err) => {
        console.error("create Challenge error:", err);
        res.status(500).json({
            message: "Challenge Not Saved"
        });
    });
}

export function deleteChallenge(req, res){

     if(req.user == null){
        res.status(403).json({
            message: "Please login to delete challenge"
        });
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "Login as an admin to delete challenge"
        });
        return;
    }

    Challenge.findOneAndDelete({challengeID : req.params.id}).then(
        () => {
            res.json({
                message : "Challenge Deleted Successfully!"
            })
        }).catch(
            (err) => {
                console.log(err)
                res.status(500).json({
                    message : "Challenge not found! " + req.params.id
                })
            }
        )

}

export function updateChallenge(req, res){

     if(req.user == null){
        res.status(403).json({
            message: "Please login to update challenge"
        });
        return;
    }

    if(req.user.role != "admin"){
        res.status(403).json({
            message: "Login as an admin to update challenge"
        });
        return;
    }

    Challenge.findOneAndUpdate({challengeID : req.params.id}, req.body).then(
        (challenge) => {
            res.json({
                message : "Product Updated Successfully!",
                challenge
            })
        }
    ).catch(
        (err) => {
            console.log(err)
            res.status(500).json({
                message : "Product not updated!"
            })
        }
    )

}

export async function joinChallenge(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const userData= await User.findById(req.user._id);
    
    if (userData.role !== "member"){
        return res.status(403).json(
            { 
                message: "Members only" 
            }
        );
    }

    const challengeIdStr = req.params.id; 
    const challenge = await Challenge.findOne({ challengeID: challengeIdStr });
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    const userId =
      typeof req.user._id === "string"
        ? new mongoose.Types.ObjectId(req.user._id)
        : req.user._id;

    const exists = await UserChallenge.findOne({ CID: challenge._id, user_id: userId });
    if (exists) {
      return res.status(409).json({ message: "You already joined this challenge" });
    }

    // stop joining after end date
    if (challenge.endDate && new Date(challenge.endDate) < new Date()) {
      return res.status(400).json({ message: "This challenge has ended" });
    }

    await new UserChallenge({ CID: challenge._id, user_id: userId, completed: false }).save();

    return res.status(201).json({
      message: "Joined successfully. Awaiting completion by trainer.",
      challengeID: challenge.challengeID
    });
  } catch (e) {
    console.error("joinChallenge error:", e);
    return res.status(500).json({ message: "Internal server error", error: e.message });
  }
}

export async function myJoinedChallenges(req, res) {
  try {
    // if (!req.user) {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }

    const userId = typeof req.user._id === "string"
      ? new mongoose.Types.ObjectId(req.user._id)
      : req.user._id;

    const rows = await UserChallenge.find({ user_id: userId }).populate("CID");

    const counts = await UserChallenge.aggregate([
      { $group: { _id: "$CID", count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach((c) => {
      countMap[c._id.toString()] = c.count;
    });

    const joinedChallenges = rows
      .filter(r => r.CID)
      .map(r => {
        const ch = r.CID.toObject();
        return {
          ...ch,
          participantCount: countMap[ch._id.toString()] || 0,
          joinedAt: r.createdAt,
          completed: r.completed, // include completion status
          userChallengeId: r._id, 
        };
      });

    return res.json({ joined: joinedChallenges });
  } catch (e) {
    console.error("myJoinedChallenges error:", e);
    return res.status(500).json({
      message: "Internal server error",
      error: e.message
    });
  }
}

export async function completeUserChallenge(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "trainer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only trainers or admins can complete challenges for users" });
    }

    const userChallengeId = req.params.id;
    const userChallenge = await UserChallenge.findById(userChallengeId).populate("CID");
    if (!userChallenge) return res.status(404).json({ message: "UserChallenge not found" });
    if (userChallenge.completed) return res.status(400).json({ message: "Already completed" });

    // Mark as completed
    userChallenge.completed = true;
    await userChallenge.save();

    const challenge = userChallenge.CID;
    const userId = userChallenge.user_id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { point: challenge.points } },
      { new: true }
    );

    const mockReq = {
      body: {
        title: `Earned ${challenge.points} Points!`,
        body: `You earned points for completing the "${challenge.title}" challenge!`,
        type: "promotional",
        userId: userId.toString()
      },
      user: req.user 
    };

    // Create a simple mock response won't interfere with the main response
    const mockRes = {
      status: () => mockRes,
      json: () => {} // Do nothing with the response
    };

    createNotificationForUser(mockReq, mockRes).catch(err => {
      console.error("Notification creation failed:", err);
    });

    return res.status(200).json({
      message: "Challenge marked as completed and points awarded.",
      awarded: challenge.points,
      totalPoints: updatedUser?.point ?? undefined,
      userChallengeId: userChallenge._id
    });
  } catch (e) {
    console.error("completeUserChallenge error:", e);
    return res.status(500).json({ message: "Internal server error", error: e.message });
  }
}

export async function getAllUserChallengeParticipations(req, res) {
  try {
    if (!req.user || (req.user.role !== "trainer" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const participations = await UserChallenge.find()
      .populate("CID")
      .populate("user_id");

    const result = participations.map((p) => ({
      _id: p._id,
      userChallengeId: p._id,
      challengeID: p.CID?.challengeID,
      title: p.CID?.title,
      points: p.CID?.points,
      userID: p.user_id?._id,
      userName: p.user_id ? `${p.user_id.firstName} ${p.user_id.lastName}` : "",
      completed: p.completed,
    }));

    res.json(result);
  } catch (e) {
    console.error("getAllUserChallengeParticipations error:", e);
    res.status(500).json({ message: "Internal server error", error: e.message });
  }
}

export async function filterChallenges(req, res){

  try{
    const {completed} = req.query

    const query = {}

    if (completed && completed !== "all"){
      
      if (completed == "pending"){
        query.completed = false
      } else {
        query.completed = true
      }

    }

    const challenges = await UserChallenge.find(query)
    res.json(challenges)

  }catch(err){
    console.log("Error of filter challenges :- ",err)
    res.status(500).json({
      message : "Error of fltering challenges"
    })
  }

}