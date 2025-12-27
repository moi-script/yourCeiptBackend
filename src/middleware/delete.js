import { deleteReceipt } from "../controllers/receiptController.js"
import { deleteManualReceipt } from "../controllers/manualController.js"

export const  deleteReceiptsMiddleware =  async(req, res) => {
   const { type } = req.query;

   console.log('Type from query ::', type);

   (type === 'smart') ? deleteReceipt(req, res) : deleteManualReceipt(req, res)
}