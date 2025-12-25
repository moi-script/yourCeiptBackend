import Manual from "../models/Manual.js";



export const createManual = async (req, res, next) => {
        console.log('Req body :: ', req.body);
        const {userId, ...receipts } = req.body;
      try {

        if(!req.body) throw new Error('No receipt object');
    
        console.log("Reciept upload call ::", receipts);
        console.log("User id upload call ::", userId);
    
        const newManualReceipt = new Manual({
          ...receipts,     
          userId: userId 
        });
    
        const savedReceipt = await newManualReceipt.save();
    
        req.saved = savedReceipt;
        next();
      } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ message: "Failed to save receipt" });
      }
}