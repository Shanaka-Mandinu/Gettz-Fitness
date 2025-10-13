import mongoose from 'mongoose';
import './admin.js'
import generateID from "../utils/idGenerator.js";

const notificationSchema = new mongoose.Schema(
{

    notificationID: {
      type: String, 
      required: true, 
      unique: true,
      default : function () {
      return "NID" + generateID()
      }
    },

    title: { 
      type: String, 
      required: true 
    },

    body: { 
      type: String, 
      required: true 
    },

    type: { 
      type: String, 
      required: true, 
      default: 'promotional' 
    },

    status: { 
      type: String, 
      default: 'queued' 
    },

    deliveryTo: { 
      type: String, 
      default: 'all' 
    },
    sentDate: { 
      type: Date 
    },
    createdBy: { 
      type: String,
      required: true
    }
},
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;