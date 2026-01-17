import { processImages } from "../service/ocr.js";
import { filterItemQuickParser } from "../utils/jsonHandler.js";
import { findImagesWithTavily } from "../utils/jsonHandler.js";
import { handleReceiptFormatPrompts } from "../utils/prompts.js";
import { readTextAi } from "../service/runAi.js";
import { z } from 'zod';
import chalk from "chalk";
const ReceiptSchema = z.object({
    store: z.string().nullable(),
    slogan: z.string().nullable(),
    contact: z.string().nullable(),
    manager: z.string().nullable(),

    address: z.object({
        street: z.string().nullable(),
        city: z.string().nullable(),
        state: z.string().nullable(),
        zip: z.string().nullable()
    }),

    transaction: z.object({
        store_number: z.string().nullable(),
        operator_number: z.string().nullable(),
        terminal_number: z.string().nullable(),
        transaction_number: z.string().nullable()
    }),

    items: z.array(
        z.object({
            description: z.string().nullable(),
            upc: z.string().nullable(),
            type: z.string().nullable(),
            category: z.string().nullable(),
            price: z.number().nullable(),
            quantity: z.number().nullable()
        })
    ),

    subtotal: z.number().nullable(),
    tax_rate: z.number().nullable(),
    tax_amount: z.number().nullable(),
    total: z.number().nullable(),
    payment_method: z.string().nullable(),
    amount_paid: z.number().nullable(),

    metadata: z.object({
        currency: z.string().nullable(),
        datetime: z.string().nullable(),
        notes: z.string().nullable(),
        source_type: z.string().nullable(),
        type: z.string().nullable(),
        image_source: z.string().nullable(),

    })
});



// getting text from ocr using upload local path and azure 
export const getUploadImages = async (req, res, next) => {
    const { img } = req.body;
    const buffer = JSON.parse(img).buffer
    console.log("getUploadImages --> "  + buffer);
    try {
        req.contents = await processImages(buffer, res) || [];
        next();
    } catch (err) {
        console.error("Unable to process image request", err);
        res.status(500).json({ message: "Unable to process request", code: 500 });
    }
}

// sanitize context and produce a list of image urls

let retries = 0;
export const getImageItemUrl = async (req, res, next) => {
    if (!req.contents) res.status(500).json({ message: "No contents from process image" });

    // sanitizing query
    try {
        const imageQuery = await filterItemQuickParser(req.contents, req); // passing req to readTextAi later
        // parsing query to image url


        console.log('Image query ::', imageQuery);
        req.images_url = await findImagesWithTavily(imageQuery);

        if (!req.images_url) throw new Error('Null image url')
        next();
    } catch (err) {
        ++retries;
        if (retries < 3) {
            console.log('Retrying ...');
            getImageItemUrl(req, res, next);
        } else {
            res.status(500).json({ message: "Unable to get image url", code: 500, error: err });
            console.error(err);

        }
    }
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
            req.prompts = handleReceiptFormatPrompts(req.contents, req.images_url);

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
        const { activeModelName } = req.body;
        console.log(chalk.red('Model name ::' + activeModelName));

        // console.log('Prompts ::', req.prompts);
        req.output = await readTextAi(req.prompts, req, activeModelName)();

        console.log(chalk.blue('output --> ' + req.output));

        next();
    } catch (err) {
        console.error('Unable to read prompts', err);
        res.status(500).json({ message: "Failed to read prompts", code: 500 });

    }
}

export const validateFormat = (req, res, next) => {

     function cleanJsonOutput(text) {
    return text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
    }
    const cleanMarkDown = cleanJsonOutput(req.output);
    
    
    // parsing after cleaning
    const result = ReceiptSchema.safeParse(JSON.parse(cleanMarkDown));

    if (!result.success) {
        console.error("Invalid receipt:", result.error.format());
        res.status(500).json({ message: "Format does not match", code: 500 });
    } else {
        console.log("Valid receipt:");
        req.jsonResult = result.data;
        next();
    }
}

// convert text into json
// extract receipt profile image url
// add image url into meta data 

