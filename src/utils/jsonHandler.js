import chalk from "chalk";
import { readTextAi } from "../service/runAi.js";
import { getTravilyKey } from "./getKey.js";

export function jsonToObjOutput(data) {
  if (data.length > 1 && typeof data === 'object') {
    return data.map(obj => {
      const jsonMatch = obj.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    })
  }
  if (typeof data === 'string') {
    console.log('Data ::', data);
    const jsonMatch = data.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null

  }
  const jsonMatch = data.pop().match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null

}

export const processItems = (data) => {
  data.forEach(({ items }, i) => {
    console.log('Index -- ' + i, ' items :: ', items);
  })
}

export async function aiPrompt(scribe, tesseract = "", imageSource) {
  try {
    // console.log('Image source :: ', imageSource);

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
          "category": null,
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
        "image_source": null
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
        7. It must contains category, auto pick a matching category[Food, Transportation, Entertainment, Shopping, Utilities, Income, Healthcare, Other] base on item, otherwise return other
        8. Never change the schema. Never add new keys.
        9. Enclose the entire JSON output in underscores (_) at the start and end.
        10. Only output the JSON wrapped in underscores (_), do not include any extra text.
        This is the JSON format you must output:
        11. You must avoid creativity. You must avoid assumptions. Be literal and extraction-only.
        12. Only extract items that clearly exist in the input. Do not infer or guess items.
        13. JSon should be json(object)
        ${JSON.stringify(format)}

        Input 1 -> ${scribe}
        Input 2 -> ${tesseract}

            "image_source": insert a any single url from this source ${imageSource} to this
             image_source search for the most matched source to item description 
             "metadata": {
            "currency": null, // you must only put php in currency even though there was any other currency value in input
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

  } catch (err) {
    console.error(err);
  }



} // degraded prompts

// integrate prompts for filtering and the input text
export function filterItemsAiPrompt(input) {
  const imageSearchPrompt = `You are an intelligent data extraction assistant. Your task is to analyze the input text (receipt or invoice).

        ### INSTRUCTIONS :
        You must generate a generic, high-quality search query for an image of the main purchase. Follow this logic:
        1. **Identify the "Main" Item:** Look at the items list. Select the item that is most likely the primary product (usually the first item or the most expensive one).
        2. **Clean the Text:** Remove brand codes, UPCs, quantities (e.g., "2x", "1 pc"), and technical specs (e.g., "v2.0", "#8842"). Keep only the descriptive product name.
        3. **Format for Image Search:** Combine the [Clean Product Name] + "white background"
         - You must return only a valid query like 1 sentence or less than 5 word the is a product name from [Food, Transportation, Entertainment, Shopping, Utilities, Income, Healthcare, Other]
        `
  return imageSearchPrompt + input;
}



// filter text into valid query
export async function filterItemQuickParser(input, req) {
  try {
    const result = await readTextAi(filterItemsAiPrompt(input))(req); // unable ai model settings
    return result;

  } catch (err) {
    console.error('Unable to filterItems prompts');
  }
}


// producing images after a valid query
export const findImagesWithTavily = async (imageQuery) => {

  const apiKey = `${getTravilyKey()}`;
  try {

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: imageQuery,
        include_images: true,
        search_depth: "basic",
        max_results: 2
      })
    });

    if(!response.ok) throw Error("This request exceeds your plan's set usage limit. Please upgrade your plan or contact support@tavily.com")

    const data = await response.json();
    return data.images;
  } catch (err) {
    console.error('Unable to find images in tavily', err);

  }
};



export function quickPrompt(textInput, imageSource) {
  console.log(chalk.blue('Text input --->', textInput));
  console.log(chalk.red('Image source --->', imageSource));
  const date = new Date();


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
        "category": null,
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
      "type" : null,
      "image_source": null
    }
  }
return `
You are a financial extraction assistant.

Task:
Convert user-provided IMAGE, TEXT, or DOCUMENT (PDF/CSV/DOCX) inputs into a structured JSON object that strictly follows the schema below.

Rules:
1. Identify input type automatically.
2. Detect currency, date, time, and language.
3. Extract only what exists in the input. Never guess.
4. Missing data must be null.
5. Extract all listed items.
6. You should only assign only the : [FOOD, transportation, entertainment, dining, shopping, utilities, income, healthcare, other] in category. 
7. Never change, add, or remove schema keys.
8. Output JSON only. No explanations.
9. Avoid creativity and assumptions.  
10. Translate to English if possible.

Schema (must match exactly):
${JSON.stringify(format)}

Input:
${textInput}

Item Handling:
- Map item descriptions correctly.
- If required, duplicate description into metadata.notes.
- Prices must be numeric only.
- If subtotal/total is missing, use item prices or compute when possible.

Metadata Rules:
- type must be either "Income" or "Expense".
- image_source must be a single URL from: ${imageSource}.
- If no date exists, use: ${date}.
- source_type = text | image | document.

Output Requirements:
1. Respect detected currency (ISO 4217 if unknown).
2. Return JSON object only — no extra text.

Extraction Rules:
- Currency should be PHP or philippine peso only and datetime must be exact if found.
- If input is a simple sentence, map values and set others to null.
- If total is missing, compute when possible.
- Never infer missing items.
`;
}



export function reducedTextPromptTavily(textInput) {
  return `Base on this input -> ${textInput} ->
          I need find atleast 1 product then produce an simple query less than 6 words about that specific product
  `
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







