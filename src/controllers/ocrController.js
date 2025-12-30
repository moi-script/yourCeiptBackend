import { processImages } from "../service/ocr.js";
import { filterItemQuickParser } from "../utils/jsonHandler.js";
import { findImagesWithTavily } from "../utils/jsonHandler.js";
import { hanldeReceiptFormatPrompts } from "../utils/prompts.js";
import { readTextAi } from "../service/runAi.js";
import chalk from "chalk";


// getting text from ocr using upload local path and azure 
export const getUploadImages = async (req, res, next) => {

    try {
        req.contents = await processImages() || [];
        next();
    } catch (err) {
        console.error("Unable to process image request", err);
        res.status(500).json({ message: "Unable to process request", code: 500 });
    }
}

// sanitize context and produce a list of image urls
export const getImageItemUrl = async (req, res, next) => {
    if (!req.contents) res.status(500).json({ message: "No contents from process image" });

    // sanitizing query
    const imageQuery = await filterItemQuickParser(req.contents, req); // passing req to readTextAi later
    // parsing query to image url
    console.log('Image query ::', imageQuery);
    req.images_url = await findImagesWithTavily(imageQuery) || [];
    next();
}


// combined into specific receipt format prompts to be more accurate
export const generatingSanitizePrompts = (req, res, next) => {

    try {
        // req.contens -> array 
        // req.images_url -> array
        // console.log('req.contents.length ->', req.contents.length);
        // console.log('req.images_url.length ->', req.contents.length);

        if (req.contents.length > 0 && req.images_url?.length > 0) {
            console.log('true');
            req.prompts = hanldeReceiptFormatPrompts(req.contents, req.images_url);
            
            next();

        }
        // ocrText, format, image_source
    } catch (err) {
        console.error('Unable to sanizite prompts');
    }
}


// convert all into valid json object
export const producingJsonOutput = async (req, res, next) => {
    try {
        console.log('Prompts ::', req.prompts);
        req.output = await readTextAi(req.prompts, req)();

        console.log(chalk.blue('output --> ' + req.output));

        next();
    } catch (err) {
        console.error('Unable to read prompts');
        res.status(500).json({ message: "Failed to read prompts", code: 500 });

    }
}


// convert text into json
// extract receipt profile image url
// add image url into meta data 

