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

  const { userId, ...receipts } = req.body;
  console.log('Receipt list --> ', receipts);
  try {
    if (!req.body) throw new Error('No receipt object');

    let upload;
    const keys = Object.keys(receipts);
    if (keys[0] === '0' && (typeof keys === 'object')) {
      console.log('Multiple files detected');
      console.log('Key index -->', keys);
            
      for (const k of keys) {
        upload = await savedReceipt(userId, receipts[k]);
      }
      req.saved = upload; // just push the latest we dont need anything 
      next();
    } else {

      upload = await savedReceipt(userId, receipts);
      req.saved = upload;
      next();
    }





  } catch (error) {
    console.error("Save Error:", error);
    res.status(500).json({ message: "Failed to save receipt" });
  }
};



export const uploadParseText = async (req, res, next) => {
  const { userId } = req.body;
  try {
    const upload = await savedReceipt(userId, req.body.quickText);
    req.output = req.body.quickText;
    req.saved = upload;
    next();
  } catch (err) {
    console.error('Unable to upload to db');



  }
}



export const deleteReceipt = async (req, res) => {
  const { id } = req.query;
  console.log('Id for delete receipt ::', id);

  try {
    const deletedItem = await Receipt.deleteOne({ _id: id });

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully", deletedItem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}




// export const  uploadReceiptByDescription = async(req, res, next) => {
//   const
// } 