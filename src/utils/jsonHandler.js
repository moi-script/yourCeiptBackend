import { readTextAi } from "../service/runAi.js";
import { getTravilyKey } from "./getKey.js";

export function jsonToObjOutput(data) {
  if (data.length > 1 && typeof data === 'object') {
   return data.map(obj => {
      const jsonMatch = obj.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    })
  }
  if(typeof data === 'string' ){
    console.log('Data ::', data);
  const jsonMatch = data.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null

  }
  const jsonMatch = data.pop().match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null

}

export const processItems = (data) => {
    data.forEach(({items}, i) => {
        console.log('Index -- ' + i, ' items :: ', items);
    })
}
  
export async function aiPrompt(scribe, tesseract = "") {

  try {

    const imageSource = await findImagesWithTavily(scribe + tesseract);
    console.log('Image source :: ', imageSource.images);

    const format = {
        "store": null,
        "slogan": null,
        "contact": null,
        "manager": null,
        "address": {
            "street": null,
            "city": null,
            "state": null,
            "zip": null
        },
        "transaction": {
            "store_number": null,
            "operator_number": null,
            "terminal_number": null,
            "transaction_number": null
        },
        "items": [
            {
                "description": null,
                "upc": null,
                "type": null,
                "price": null,
                "quantity": null
            }
        ],
        "subtotal": null,
        "tax_rate": null,
        "tax_amount": null,
        "total": null,
        "payment_method": null,
        "amount_paid": null,

        "metadata": {
            "currency": null,
            "datetime": null,
            "notes": null,
            "source_type": null,
            "image_source" : null
        }
    }
    return `
    You are a financial extraction assistant.  
    Your task is to analyze user-provided data (image receipts, text expense inputs, or files such as PDF/CSV/DOCX) and convert them into a structured JSON object following the exact schema below.

        Always follow these rules:
        1. Think step-by-step before outputting.
        2. Identify the input type: IMAGE, TEXT, or DOCUMENT FILE.
        3. Detect currency, date, time, and language automatically.
        4. Extract expenses strictly based on what the user provides. Do not guess.
        5. If data is missing, return null for that field.
        6. For items, extract as many as appear in the input.
        7. Never change the schema. Never add new keys.
        8. Enclose the entire JSON output in underscores (_) at the start and end.
        9. Only output the JSON wrapped in underscores (_), do not include any extra text.
        This is the JSON format you must output:
        10. You must avoid creativity. You must avoid assumptions. Be literal and extraction-only.
        11. Only extract items that clearly exist in the input. Do not infer or guess items.
        12. JSon should be json(object)
        ${JSON.stringify(format)}

        Input 1 -> ${scribe}
        Input 2 -> ${tesseract}

            "image_source": insert a any single url from this source ${imageSource.images} to this image_source 
             "metadata": {
            "currency": null,
            "datetime": null,
            "notes": null,
            "image_source": null
        } of meta data 


        if encounter simple sentence, saved that kind of into json form and when other is not existed
        set them into null property

        if possible translate them all into english

        Requirements:
        1. Enclose the entire JSON output in underscores (_) at the start and end.
        2. Fill all "price" fields with the correct currency symbol based on the country:
           - USA
           - EUR
           - UK 
           - JPY
           - GBP
           - PHP
           - Others -> automatically convert it analyzing their currency to ISO 4217
        3. Ensure all fields in the format template are respected.
        4. Only output the JSON wrapped in underscores (_), do not include any extra text.
        
        Extraction Rules:

        - Currency: Detect automatically (e.g., PHP, USD, EUR).
        - Datetime: Extract exact format from receipt or text if found.
        - If input is a plain text budget list, set source_type = "text".
        - If input is an image or file, set source_type appropriately.
        - If total is not provided, compute if possible (sum items + tax).
        - Prices must use numeric values only (no currency symbols).
        - Return JSON only, no explanations.
    `;

  } catch(err) {
    console.error(err);
  }



}

export function filterItemsAiPrompt (input){
   const imageSearchPrompt = `You are an intelligent data extraction assistant. Your task is to analyze the input text (receipt or invoice) and structure it into the specified JSON format.

        ### INSTRUCTIONS (METADATA):
        You must generate a generic, high-quality search query for an image of the main purchase. Follow this logic:
        1. **Identify the "Main" Item:** Look at the items list. Select the item that is most likely the primary product (usually the first item or the most expensive one).
        2. **Clean the Text:** Remove brand codes, UPCs, quantities (e.g., "2x", "1 pc"), and technical specs (e.g., "v2.0", "#8842"). Keep only the descriptive product name.
        3. **Format for Image Search:** Combine the [Clean Product Name] + "product photo white background".
           - *Example 1 (Electronics):* Input "1. Wireless Mouse (UPC: 774)", Output -> "Wireless Mouse product photo white background"
           - *Example 2 (Food):* Input "2x Lrg Pepperoni Pizza", Output -> "Pepperoni Pizza product photo white background"
           - *Example 3 (Clothing):* Input "Men's Blue Denim Jeans - Size 32", Output -> "Men's Blue Denim Jeans product photo white background"
           - You must return a single sentence of that is relevance to the details of items
          `

    return imageSearchPrompt + input;
}
export async function filterItemQuickParser(input) {
    const result = await readTextAi(filterItemsAiPrompt(input))();
    return result;
}
export const findImagesWithTavily = async (input) => {

  const apiKey = `${getTravilyKey()}`;

  const queryForImage = await filterItemQuickParser(input)
  console.log('Query for image ---> ', queryForImage);

   const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: queryForImage, 
      include_images: true,       
      search_depth: "basic", 
      max_results: 5
    })
  });

  const data = await response.json();
  
  // console.log(data.images); 
  return data;
};

export async function quickPrompt(textInput) {

  const imageSource = await findImagesWithTavily(textInput);

  console.log('Image source :: ', imageSource.images);
    const format = {
        "store": null,
        "slogan": null,
        "contact": null,
        "manager": null,
        "address": {
            "street": null,
            "city": null,
            "state": null,
            "zip": null
        },
        "transaction": {
            "store_number": null,
            "operator_number": null,
            "terminal_number": null,
            "transaction_number": null
        },
        "items": [
            {
                "description": null,
                "upc": null,
                "type": null,
                "price": null,
                "quantity": null
            }
        ],
        "subtotal": null,
        "tax_rate": null,
        "tax_amount": null,
        "total": null,
        "payment_method": null,
        "amount_paid": null,

        "metadata": {
            "currency": null,
            "datetime": null,
            "notes": null,
            "source_type": null,
            "image_source" : null
        }
    }

    return `
    You are a financial extraction assistant.  
    Your task is to analyze user-provided data (image receipts, text expense inputs, or files such as PDF/CSV/DOCX) and convert them into a structured JSON object following the exact schema below.

        Always follow these rules:
        1. Think step-by-step before outputting.
        2. Identify the input type: IMAGE, TEXT, or DOCUMENT FILE.
        3. Detect currency, date, time, and language automatically.
        4. Extract expenses strictly based on what the user provides. Do not guess.
        5. If data is missing, return null for that field.
        6. For items, extract as many as appear in the input.
        7. Never change the schema. Never add new keys.
        8. Enclose the entire JSON output in underscores (_) at the start and end.
        9. Only output the JSON wrapped in underscores (_), do not include any extra text.
        This is the JSON format you must output:
        10. You must avoid creativity. You must avoid assumptions. Be literal and extraction-only.
        11. Only extract items that clearly exist in the input. Do not infer or guess items.
        12. JSon should be json(object)
        ${JSON.stringify(format)}

        input -> ${textInput}

        when you encounter a "items": [
            {
                "description": null, description here
                "upc": null,
                "type": null,
                "price": null,
                "quantity": null
            }

            put the description into the notes


            "image_source": insert a any single url from this source ${imageSource.images} to this image_source 
             "metadata": {
            "currency": null,
            "datetime": null,
            "notes": null,
            "image_source": null
        } of meta data 


        if encounter simple sentence, saved that kind of into json form and when other is not existed
        set them into null property

        if possible translate them all into english

        Requirements:
        1. Enclose the entire JSON output in underscores (_) at the start and end.
        2. Fill all "price" fields with the correct currency symbol based on the country:
           - USA
           - EUR
           - UK 
           - JPY
           - GBP
           - PHP
           - Others -> automatically convert it analyzing their currency to ISO 4217
        3. Ensure all fields in the format template are respected.
        4. Only output the JSON wrapped in underscores (_), do not include any extra text.
        
        Extraction Rules:

        - Currency: Detect automatically (e.g., PHP, USD, EUR).
        - Datetime: Extract exact format from receipt or text if found.
        - If input is a plain text budget list, set source_type = "text".
        - If input is an image or file, set source_type appropriately.
        - If total is not provided, compute if possible (sum items + tax).
        - Prices must use numeric values only (no currency symbols).
        - Return JSON only, no explanations.
    `;

}

export function allInputPrompts(input) {
    return `You are a financial extraction assistant.  
        Your task is to analyze user-provided data (image receipts, text expense inputs, or files such as PDF/CSV/DOCX) and convert them into a structured JSON object following the exact schema below.

        Always follow these rules:
        1. Think step-by-step before outputting.
        2. Identify the input type: IMAGE, TEXT, or DOCUMENT FILE.
        3. Detect currency, date, time, and language automatically.
        4. Extract expenses strictly based on what the user provides. Do not guess.
        5. If data is missing, return null for that field.
        6. For items, extract as many as appear in the input.
        7. Never change the schema. Never add new keys.
        8. Enclose the entire JSON output in underscores (_) at the start and end.
        9. Only output the JSON wrapped in underscores (_), do not include any extra text.
        This is the JSON format you must output:
        10. You must avoid creativity. You must avoid assumptions. Be literal and extraction-only.
        11. Only extract items that clearly exist in the input. Do not infer or guess items.
        12. JSon should be json(object, null, 2)

        {
          "store": null,
          "slogan": null,
          "contact": null,
          "manager": null,
          "address": {
              "street": null,
              "city": null,
              "state": null,
              "zip": null
          },
          "transaction": {
              "store_number": null,
              "operator_number": null,
              "terminal_number": null,
              "transaction_number": null
          },
          "items": [
              {
                  "description": null,
                  "upc": null,
                  "type": null,
                  "price": null,
                  "quantity": null
              }
          ],
          "subtotal": null,
          "tax_rate": null,
          "tax_amount": null,
          "total": null,
          "payment_method": null,
          "amount_paid": null,
        
          "metadata": {
              "currency": null,
              "datetime": null,
              "notes": null,
              "source_type": null
          }
        }
        
        Extraction Rules:
        
        - Currency: Detect automatically (e.g., PHP, USD, EUR).
        - Datetime: Extract exact format from receipt or text if found.
        - If input is a plain text budget list, set source_type = "text".
        - If input is an image or file, set source_type appropriately.
        - If total is not provided, compute if possible (sum items + tax).
        - Prices must use numeric values only (no currency symbols).
        - Return JSON only, no explanations.
        
        After reasoning, output only the final JSON.
        ${input}`
}

export function textExpensePrompts(input) {

    return `You are an information extraction model.  
        Extract all expenses and convert them into this JSON structure (do NOT remove any fields): 

        {
          "store": null,
          "slogan": null,
          "contact": null,
          "manager": null,
          "address": {
            "street": null,
            "city": null,
            "state": null,
            "zip": null
          },
          "transaction": {
            "store_number": null,
            "operator_number": null,
            "terminal_number": null,
            "transaction_number": null
          },
          "items": [
            {
              "description": null,
              "upc": null,
              "type": null,
              "price": null,
              "quantity": null
            }
          ],
          "subtotal": null,
          "tax_rate": null,
          "tax_amount": null,
          "total": null,
          "payment_method": null,
          "amount_paid": null
        }

        Rules:
        - Always return VALID JSON.
        - Enclose the entire JSON output in underscores (_) at the start and end.
        - Fill all "price" fields with the correct currency symbol based on the country:
           - USA -> $
           - Canada -> CA$
           - UK -> £
           - EU countries -> €
           - Japan -> ¥
           -Philippines -> ₱
           - Others -> use the local currency symbol
        - Only fill fields that can be inferred from the text.  
        - For each expense, create an item with description, price, quantity = 1 (if not stated).
        - Leave all unrelated fields as null.
        - Sum all item prices and place it in "subtotal" and "total".
        - Prices must be numbers only (no currency symbols).
        - Do NOT add extra fields.
        - Do NOT explain, only return JSON.
        - price currency {price : -currency base on country- price}
        Text to extract:  

        ${input}
`
}
