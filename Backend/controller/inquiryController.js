// Get inquiries for current user (by userId or email)
export function getUserInquiries(req, res) {
  const userId = req.user?._id;
  const email = req.user?.email;
  Inquiry.find({
    $or: [
      { userId },
      { email }
    ]
  })
    .then((inquiries) => {
      res.json(inquiries);
    })
    .catch((err) => {
      res.status(500).json({ message: "Error fetching user inquiries", error: err.message });
    });
}

// Admin replies to inquiry
export function replyInquiry(req, res) {
  const { inquiry_id } = req.params;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: "Reply message required" });
  }
  Inquiry.findOne({ inquiry_id })
    .then((inquiry) => {
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      inquiry.inquiry_response.push({
        message,
        responder: "admin",
        date: new Date()
      });
      return inquiry.save();
    })
    .then((inquiry) => {
      if (inquiry) {
        res.json({ message: "Reply added", inquiry });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error replying", error: err.message });
    });
}
import Inquiry from "../model/inquiry.js";


export function createInquiry(req, res) {
  if (req.user == null) {
    return res.status(400).json({ message: "Logging First" });
  }
  // Attach userId and email from req.user
  const inquiry = new Inquiry({
    ...req.body,
    userId: req.user?._id,
    email: req.user?.email
  });
  inquiry
    .save()
    .then(() => {
      res.status(201).json({ message: "Successfully created!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Unsuccessful!", error: err.message });
    });
}




export function getAllInquiry(req, res) {
  Inquiry.find()
    .then((Inquiry) => {
      res.json(Inquiry);
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error Getting Inquiries",
        error: err.message,
      });
    });
}
export function updateInquiry(req, res) {
  if (req.user == null) {
    return res.status(400).json({
      message: "Need to login first",
    });
  }

  Inquiry.findOneAndUpdate(
    {
      inquiry_id: req.params.inquiry_id,
    },
    req.body
  )
    .then((inqury) => {
      if (inqury == null) {
        return res.status(404).json({
          message: "Inquiry not found",
        });
      } else {
        res.json({
          message: "Successfully updated",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        message: error,
      });
    });
}


export function deleteInquiry(req, res) {
  if (req.user == null) {
    res.status(403).json({
      message: "You need logging first to delete a inquiry",
    });
    return;
  }
  if (!req.user.role == "supporter") {
    res.status(403).json({
      message: "You are not allowed to delete a inquiry",
    });
    return;
  }
  Inquiry.findOneAndDelete({
    inquiry_id: req.params.inquiry_id,
  })
    .then((inquiry) => {
      if (inquiry == null) {
        res.status(404).json({
          message: "Inquiry session not found",
        });
      } else {
        res.json({
          message: "Inquiry deleted successfully",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        message: "Error deleting Inquiry",
        error: err.message,
      });
    });
}


export async function getInquiryById(req, res) {
  let inquiry_id = req.params.inquiry_id;
  // Only cast to number if it's a valid number
  if (!isNaN(inquiry_id)) {
    inquiry_id = Number(inquiry_id);
  }
  const inquiry = await Inquiry.findOne({ inquiry_id });

  if (inquiry == null) {
    res.status(404).json({
      message: "Inquiry Not Found",
    });
    return;
  }
  res.json({
    inquiry: inquiry,
  });
}
