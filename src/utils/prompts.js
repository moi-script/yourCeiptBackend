
export const handleReceiptFormatPrompts = (ocrText, image_source) => {
    console.log('This is image source for handling image receipt formats :: ', image_source);
    const formatDate = new Date().toISOString();
    const format = {
        "store": "String",
        "slogan": "String",
        "contact": "String",
        "manager": "String",
        "address": {
            "street": "String" ,
            "city": "String",
            "state": "String" ,
            "zip": "String"
        },
        "transaction": {
            "store_number": "String" ,
            "operator_number": "String" ,
            "terminal_number": "String" ,
            "transaction_number": "String"
        },
        "items": [
            {
                "description": "String ",
                "upc": "String" ,
                "type": "String" ,
                "category": "String" ,
                "price": "Number" ,
                "quantity": "Number" 
            }
        ],
        "subtotal": "Number" ,
        "tax_rate": "Number" ,
        "tax_amount": "Number" ,
        "total": "Number" ,
        "payment_method": "String",
        "amount_paid": "Number" ,

        "metadata": {
            "currency": "String" ,
            "datetime": "String ", 
            "notes": "String",
            "source_type": "String",
            "type": "String",
            "image_source": "String"
        }
    }
    
        return `You are a Receipt Parser. Convert messy OCR text into clean JSON.

        TASK:
        1. Parse the receipt data from this array: [${ocrText}]
        2. Extract store info, items, and prices
        3. Return ONLY valid JSON (no markdown, no explanations)

        RULES:
        - Combine split lines that belong together (item name + price)
        - Remove symbols like ·, +, B from item names
        - Look for patterns: "quantity X price" then "item name" then "total"
        - The available currency should only be PHP or Philippine Peso 
        - If category is missing, assign one: [Groceries, Housing, Transportation, Dining, Utilities, Income, Healthcare, Entertainment, Other]
        - For image_source: randomly pick ONE url from: ${image_source} if null then put null for image source

        OUTPUT FORMAT:
        ${JSON.stringify(format, null, 2)}

        IMPORTANT:
        - Each item gets its own entry in the items array
        - Fill all fields (use null if data missing)
        - Put the random image URL in metadata.image_source
        - Put the Income or Expense only in the metadata.type 
        - Convert metadata.datetime into ISOString format if no date is provided put this date ${formatDate}
        - Return pure JSON only
`;

}