import MaintenanceLog from "../model/maintenanceLogs.js";
import Equipment from "../model/equipment.js";
import mongoose from "mongoose";

//get all maintenance logs
export const getAllMaintenanceLogs= async (req, res)=>{
    let maintenanceLogs;
    //checking
    try{
        maintenanceLogs= await MaintenanceLog.find();
        if(!maintenanceLogs){
            //not found
            return res.status(404).json({message:"Maintenance logs not found"});
        }
        //display
        return res.status(200).json({ message: "Found", logs: maintenanceLogs });
    }catch(err){
        console.log(err);
        return res.status(500).json({message:"Server error",error: err.message});
    }
};

//insert maintenance log
export const addMaintenanceLog = async (req, res) => {

    try {
        const { M_Eq_name, M_description, M_logType, M_date, Eq_ID } = req.body || {};

        // Basic validation
        if (!M_Eq_name || !M_description || !M_logType || !M_date || !Eq_ID) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        let equipmentId = Eq_ID;
        const isObjectId = mongoose.Types.ObjectId.isValid(String(Eq_ID));
        if (!isObjectId) {
            // Treat as Eq_code
            const code = Number(Eq_ID);
            if (!Number.isFinite(code)) {
                return res.status(400).json({ message: "Eq_ID must be an equipment _id or Eq_code" });
            }
            const eq = await Equipment.findOne({ Eq_code: code }).select("_id Eq_name");
            if (!eq) {
                return res.status(404).json({ message: "Equipment not found for provided Eq_code" });
            }
            equipmentId = eq._id;
        }

        // Create and save log
        const maintenanceLog = await MaintenanceLog.create({
            M_Eq_name,
            M_description,
            M_logType,
            M_date,
            Eq_ID: equipmentId,
        });

        return res.status(201).json({ message: "Maintenance log added successfully", maintenanceLog });
    } catch (err) {
        console.error("addMaintenanceLog error:", err);
        return res.status(500).json({ message: "Server error", error: err?.message || String(err) });
    }
};

