import Budget from "../models/Budget.js";


// const budgetScheme = new mongoose.Schema({
//     userId : {
//         type : String,
//         required : true
//     },
//     category : {
//         type : String,
//         required : true
//     },
//     budgetName : {
//         type : String,
//         required : true
//     },
//     budgetAmount : {
//         type : String,
//         required : true
//     },
//     color : {
//         type : String,
//         required : true
//     },
// })

export const addBudgetItem = async (req, res, next) => {
    try {
        const { budgetList } = req.body;
        if (budgetList.length > 1) {
            for (let i = 0; i < budgetList.length; i++) {
                const obj = budgetList[i];
                console.log('Object ::', obj);
                try {
                    const addItem = await Budget.insertMany({
                        userId: obj.userId, category: obj.category,
                        budgetName: obj.name, budgetAmount:
                            obj.budget, color: obj.color, spent: null
                    });
                } catch (err) {
                    console.error('Unable to add buget', err);
                }
            }
            req.added = budgetList;
            next();
        }

    } catch (err) {
        const { userId, category, budgetName, budgetAmount, color } = req.body;
        console.log("user id :", userId);
        try {
            const addItem = await Budget.insertOne({ userId, category, budgetName, budgetAmount, color, spent: null });
            req.added = addItem;
            next();
        } catch (err) {
            console.error('Unable to add buget');
        }
    }
}

export const getBudgetList = async (req, res, next) => {
    const { userId } = req.body;
    // console.log("user id :", userId);

    try {
        const getItem = await Budget.find({ userId });
        // console.log("getItem -> ", getItem);
        req.itemList = getItem;
        next();
    } catch (err) {
        console.error('Unable to add buget', err);
    }
}


export const updateBudgetItem = async (req, res, next) => {
    console.log('Trigger update item');
    
    const { userId, category, budgetName, budget_id, budgetAmount, color } = req.body;

    console.log('User id ::', userId);
    console.log('Budger id ::', budget_id);

    try {
        const updateItem = await Budget.findByIdAndUpdate(budget_id, {
            $set: {
                category: category,
                budgetName: budgetName,
                budgetAmount: budgetAmount,
                color: color,
            }
        }, { new: true, runValidators: true }).select("budgetName");

        req.updated = updateItem;
        req.budgetName = budgetName;
        next();
    } catch (err) {
        console.error('Unable to add buget');
    }

}

export const deleteBudgetItem = async (req, res, next) => {
    const { userId, budget_id } = req.body;

    console.log('User id ::', userId);
    console.log('Budger id ::', budget_id);

    try {
        const addItem = await Budget.deleteOne({ userId, _id: budget_id });
        req.added = addItem;
        next();
    } catch (err) {
        console.error('Unable to add buget');
    }
}





