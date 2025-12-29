import express from 'express';
import { addBudgetItem, deleteBudgetItem, getBudgetList, updateBudgetItem } from '../controllers/budgetController.js';

const budget = express.Router();




budget.post('/budget', addBudgetItem, (req, res) => {
    res.status(200).json({message :  "added successfully"});
});

budget.delete('/budget', deleteBudgetItem, (req, res) => {
    res.status(200).json({message :  "Deleted successfully"});
});

budget.post('/get/budget', getBudgetList, (req, res) => {
    res.status(200).json({message :  "Budget List", budgetList : req.itemList});
});


budget.post('/update/budget', updateBudgetItem, (req, res) => {
    res.status(200).json({message :  "Updated List", budgetItem : req.updateItem, budgetName : req.budgetName});
});

export default budget;