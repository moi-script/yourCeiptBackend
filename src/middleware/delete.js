import { deleteReceipt } from "../controllers/receiptController.js"
import { deleteManualReceipt } from "../controllers/manualController.js"

export const  deleteReceiptsMiddleware =  async(req, res) => {
   deleteReceipt(req, res);
}