
// matching for a json starts with _ and ends with _
export function jsonToObjOutput(data) {

    const regex = /_\s*(\{[\s\S]*?\})\s*_/;

    // const match = data.match(regex);
    // if(!match) {
    //     return null
    // }
    //     return JSON.parse(match[1]);


    return data.map(result => {
    const match = result.match(regex);
        if(match){
            const jsonStr = match[1];
            return JSON.parse(jsonStr);
        }
    })
}

export const processItems = (data) => {
    data.forEach(({items}, i) => {
        console.log('Index -- ' + i, ' items :: ', items);
    })
}




        // ${JSON.stringify(format, null, 2)}

    const reconcilate = `
        You are a reconciliation engine. 
        You receive two OCR results (Input 1 and Input 2).
        Input 1 is HIGH CONFIDENCE.
        Input 2 is LOW CONFIDENCE.

        RULES:
        1. Always trust Input 1 first.
        2. Only use Input 2 when Input 1 is missing a field.
        3. NEVER combine conflicting numbers. Use the Input 1 value.
        4. If Input 2 contains an implausible number (e.g. $599 instead of $5.99), ignore it.
        5. Validate that prices fall in the expected range of $0.10–$100.
        6. Output ONE final clean receipt.
`

  //       12. JSon should be json(object, null, 2)

  
export function aiPrompt(scribe, tesseract) {
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
            "source_type": null
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

        Requirements:
        1. Enclose the entire JSON output in underscores (_) at the start and end.
        2. Fill all "price" fields with the correct currency symbol based on the country:
           - USA -> $
           - Canada -> CA$
           - UK -> £
           - EU countries -> €
           - Japan -> ¥
           - Others -> use the local currency symbol
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
