import ora from "ora";
import Receipt from "../models/Receipt.js";


const savedReceipt = async (userId, receipts) => {

  const newReceipt = new Receipt({
    ...receipts,
    userId: userId
  });

  const saved = await newReceipt.save();
  return saved
}

export const createReceipt = async (req, res, next) => {

  // console.log('Req body :: ', req.body);
  const { userId, ...receipts } = req.body;
  try {
    // const receiptJson = req.body;    
    // const authenticatedUserId = req.userId;

    if (!req.body) throw new Error('No receipt object');

    // console.log("Reciept upload call ::", receipts);
    // console.log("User id upload call ::", userId);

    const upload = await savedReceipt(userId, receipts);

    req.saved = upload;
    next();
  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Failed to save receipt" });
  }
};



export const uploadParseText = async (req, res, next) => {
  const {userId} = req.body;
  // console.log('Checking upload input ::', req.body.quickText);
  try {
    const upload = await savedReceipt(userId, req.body.quickText);
    req.output = req.body.quickText;
    req.saved = upload;
    next();
  } catch(err) {
    console.error('Unable to upload to db');

    

  }
}






// export const  uploadReceiptByDescription = async(req, res, next) => {
//   const
// } 