import Inquiry from "../model/inquiry.js";
import { sendInquiryReplyNotification } from "../utils/mailer.js";
import Notification from "../model/notification.js";
import UserNotification from "../model/userNotification.js";
import User from "../model/user.js";

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
export async function replyInquiry(req, res) {
  const { inquiry_id } = req.params;
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ message: "Reply message required" });
  }

  try {
    const inquiry = await Inquiry.findOne({ inquiry_id });
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // Add admin reply to inquiry
    inquiry.inquiry_response.push({
      message,
      responder: "admin",
      date: new Date()
    });
    
    const savedInquiry = await inquiry.save();

    // Create notification for the user
    let notification = null;
    let userNotification = null;
    
    if (inquiry.userId) {
      // Get admin name for notification
      const adminName = req.user?.firstName && req.user?.lastName
        ? req.user.firstName + ' ' + req.user.lastName
        : req.user?.name || req.user?.username || 'Admin';

      // Create notification
      notification = new Notification({
        title: "Inquiry Reply Received",
        body: `Admin has replied to your inquiry #${inquiry_id}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
        type: "inquiry_reply",
        status: "sent",
        deliveryTo: inquiry.email,
        sentDate: new Date(),
        createdBy: adminName
      });

      await notification.save();

      // Create user notification
      userNotification = new UserNotification({
        NIC: notification._id,
        user_id: inquiry.userId,
        isRead: false
      });

      await userNotification.save();

      // Emit real-time notification to user
      if (req.io) {
        req.io.emit('inquiryReply', {
          userId: inquiry.userId.toString(),
          inquiryId: inquiry_id,
          message: message,
          notification: {
            id: notification._id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            createdAt: notification.sentDate
          }
        });
      }
    }

    // Send email notification to user
    try {
      await sendInquiryReplyNotification(inquiry.email, savedInquiry, message);
      console.log(`Email notification sent to ${inquiry.email} for inquiry ${inquiry_id}`);
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: "Reply added and notification sent", 
      inquiry: savedInquiry,
      notification: notification ? {
        id: notification._id,
        title: notification.title,
        body: notification.body
      } : null
    });

  } catch (err) {
    console.error("Error in replyInquiry:", err);
    res.status(500).json({ message: "Error replying", error: err.message });
  }
}

// User replies to inquiry
export function userReplyInquiry(req, res) {
  const { inquiry_id } = req.params;
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ message: "Reply message required" });
  }

  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  Inquiry.findOne({ inquiry_id })
    .then((inquiry) => {
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      
      // Check if the user owns this inquiry
      if (inquiry.userId && inquiry.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only reply to your own inquiries" });
      }
      
      inquiry.inquiry_response.push({
        message,
        responder: "user",
        date: new Date()
      });
      return inquiry.save();
    })
    .then((inquiry) => {
      if (inquiry) {
        res.json({ message: "Reply added successfully", inquiry });
      }
    })
    .catch((err) => {
      res.status(500).json({ message: "Error adding reply", error: err.message });
    });
}

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

// Generate inquiry report with filters
export async function generateInquiryReport(req, res) {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      reportType = 'custom', // 'custom', 'weekly', 'monthly'
      format = 'json' // 'json', 'pdf'
    } = req.body;

    let query = {};
    let dateRange = {};

    // Handle date filtering based on report type
    if (reportType === 'weekly') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateRange = {
        inquiry_date: {
          $gte: weekAgo,
          $lte: now
        }
      };
    } else if (reportType === 'monthly') {
      const now = new Date();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateRange = {
        inquiry_date: {
          $gte: monthAgo,
          $lte: now
        }
      };
    } else if (startDate && endDate) {
      dateRange = {
        inquiry_date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Build query
    if (Object.keys(dateRange).length > 0) {
      query = { ...query, ...dateRange };
    }

    if (status && status !== 'all') {
      query.inquiry_status = status;
    }

    // Fetch inquiries
    const inquiries = await Inquiry.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ inquiry_date: -1 });

    // Generate report statistics
    const totalInquiries = inquiries.length;
    const statusCounts = {
      Open: inquiries.filter(i => i.inquiry_status === 'Open').length,
      'In Progress': inquiries.filter(i => i.inquiry_status === 'In Progress').length,
      Resolved: inquiries.filter(i => i.inquiry_status === 'Resolved').length,
      Closed: inquiries.filter(i => i.inquiry_status === 'Closed').length
    };

    const typeCounts = {
      General: inquiries.filter(i => i.inquiry_type === 'General').length,
      Technical: inquiries.filter(i => i.inquiry_type === 'Technical').length,
      Billing: inquiries.filter(i => i.inquiry_type === 'Billing').length,
      Feedback: inquiries.filter(i => i.inquiry_type === 'Feedback').length,
      Other: inquiries.filter(i => i.inquiry_type === 'Other').length
    };

    const resolvedInquiries = inquiries.filter(i => i.inquiry_status === 'Resolved').length;
    const avgResponseTime = calculateAvgResponseTime(inquiries);

    // Generate report ID
    const reportId = `IR-${Date.now()}`;
    const generatedAt = new Date();

    const reportData = {
      reportId,
      generatedAt,
      reportType,
      filters: {
        startDate: reportType === 'custom' ? startDate : null,
        endDate: reportType === 'custom' ? endDate : null,
        status,
        dateRange: reportType === 'weekly' ? 'Last 7 days' : 
                   reportType === 'monthly' ? 'Last 30 days' : 
                   'Custom range'
      },
      summary: {
        totalInquiries,
        statusCounts,
        typeCounts,
        resolvedInquiries,
        resolutionRate: totalInquiries > 0 ? ((resolvedInquiries / totalInquiries) * 100).toFixed(1) : 0,
        avgResponseTime
      },
      inquiries: inquiries.map(inquiry => ({
        inquiry_id: inquiry.inquiry_id,
        inquiry_type: inquiry.inquiry_type,
        inquiry_message: inquiry.inquiry_message,
        inquiry_date: inquiry.inquiry_date,
        email: inquiry.email,
        inquiry_status: inquiry.inquiry_status,
        response_count: inquiry.inquiry_response ? inquiry.inquiry_response.length : 0,
        user_name: inquiry.userId ? `${inquiry.userId.firstName || ''} ${inquiry.userId.lastName || ''}`.trim() : 'N/A'
      }))
    };

    if (format === 'pdf') {
      // For PDF generation, we'll return the data and let frontend handle PDF creation
      res.json({
        success: true,
        message: 'Report data generated successfully',
        data: reportData
      });
    } else {
      res.json({
        success: true,
        message: 'Report generated successfully',
        data: reportData
      });
    }

  } catch (error) {
    console.error('Error generating inquiry report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
}

// Helper function to calculate average response time
function calculateAvgResponseTime(inquiries) {
  const inquiriesWithResponses = inquiries.filter(i => 
    i.inquiry_response && i.inquiry_response.length > 0
  );

  if (inquiriesWithResponses.length === 0) return 0;

  let totalResponseTime = 0;
  let responseCount = 0;

  inquiriesWithResponses.forEach(inquiry => {
    const firstResponse = inquiry.inquiry_response.find(resp => resp.responder === 'admin');
    if (firstResponse) {
      const responseTime = new Date(firstResponse.date) - new Date(inquiry.inquiry_date);
      totalResponseTime += responseTime;
      responseCount++;
    }
  });

  if (responseCount === 0) return 0;

  const avgMs = totalResponseTime / responseCount;
  const avgHours = avgMs / (1000 * 60 * 60);
  
  if (avgHours < 24) {
    return `${avgHours.toFixed(1)} hours`;
  } else {
    const avgDays = avgHours / 24;
    return `${avgDays.toFixed(1)} days`;
  }
}