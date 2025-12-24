import Receipt from "../models/Receipt.js";

export const createReceipt = async (req, res, next) => {

    console.log('Req body :: ', req.body);
    const {userId, ...receipts } = req.body;
  try {
    // const receiptJson = req.body;    
    // const authenticatedUserId = req.userId;
    
    if(!req.body) throw new Error('No receipt object');

    console.log("Reciept upload call ::", receipts);
    console.log("User id upload call ::", userId);

    const newReceipt = new Receipt({
      ...receipts,     
      userId: userId 
    });

    const savedReceipt = await newReceipt.save();

    req.saved = savedReceipt;
    next();
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Failed to save receipt" });
  }
};