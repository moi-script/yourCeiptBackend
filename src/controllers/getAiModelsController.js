import { getAiKey } from "../utils/getKey.js";
import { getFastFreeModel } from "../service/getFreeModels.js";


export async function getAiModels(req, res, next) {
    console.log('Getting ai models');
    try {
        
        req.models = await getFastFreeModel(getAiKey());
        next();
    } catch(err) {
        console.error('Unable to get free models');
        getModels(req, res, next)
    }
}