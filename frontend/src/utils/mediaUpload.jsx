import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://uchateamhtbcerpkcyrl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjaGF0ZWFtaHRiY2VycGtjeXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjk4MTAsImV4cCI6MjA2Njg0NTgxMH0.Ao-9DrfiyNeKobBMbxX_XlDQtxZbNSqjrIZO_ErPvEY");

export default function mediaUpload(file) {
    const promise = new Promise((resolve, reject) => {
        if (file == null) {
            reject("No file selected");
            return;
        }
        
        const timeStamp = new Date().getTime();
        const newFileName = timeStamp + file.name;

        supabase.storage
            .from("images")
            .upload(newFileName, file, {
                cacheControl: "3600",
                upsert: false,
            })
            .then((result) => {
                if (result.error) {
                    console.error("Upload error:", result.error);
                    reject("File Upload Failed: " + result.error.message);
                    return;
                }
                
                const url = supabase.storage
                    .from("images")
                    .getPublicUrl(newFileName).data.publicUrl;
                resolve(url);
            })
            .catch((error) => {
                console.error("Upload error:", error);
                reject("File Upload Failed: " + error.message);
            });
    });

    return promise;
}
