import ora from "ora";
import Receipt from "../models/Receipt.js";


const savedReceipt = async (userId, receipts) => {
  console.log('Receipt from saving ::', receipts);
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

export const getMonthlyTrend = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming you have auth middleware
    const year = req.query.year || new Date().getFullYear();

    // Fetch all receipts for the user in the specified year
    const receipts = await Receipt.find({
      userId,
      'metadata.datetime': {
        $regex: `^${year}` // Matches dates starting with the year
      }
    });

    // Initialize months array
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const monthlyData = monthNames.map((month, idx) => ({
      month,
      monthIndex: idx,
      income: 0,
      expense: 0
    }));

    // Aggregate receipts by month and type
    receipts.forEach(receipt => {
      // Parse the datetime from metadata
      const dateStr = receipt.metadata?.datetime;
      if (!dateStr) return;

      // Extract month (assuming datetime format like "2024-01-15" or ISO format)
      let monthIndex;
      try {
        const date = new Date(dateStr);
        monthIndex = date.getMonth(); // 0-11
      } catch (error) {
        console.error('Error parsing date:', dateStr);
        return;
      }

      // Parse total amount
      const total = parseFloat(receipt.total?.replace(/[^0-9.-]+/g, '') || 0);
      
      if (isNaN(total) || total === 0) return;

      // Determine if it's income or expense based on metadata.type
      // You'll need to set this field when creating receipts
      const type = receipt.metadata?.type?.toLowerCase();
      
      if (type === 'income') {
        monthlyData[monthIndex].income += total;
      } else {
        // Default to expense if type is not specified or is 'expense'
        monthlyData[monthIndex].expense += total;
      }
    });

    // Filter out months with no data (optional)
    const filteredData = monthlyData.filter(data => 
      data.income > 0 || data.expense > 0
    );

    res.json({
      success: true,
      year,
      data: filteredData.length > 0 ? filteredData : monthlyData.slice(0, 4) // Return at least first 4 months
    });

  } catch (error) {
    console.error('Error calculating monthly trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate monthly trend',
      error: error.message
    });
  }
};