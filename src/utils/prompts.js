
export const hanldeReceiptFormatPrompts = (ocrText, image_source) => {

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
            "image_source": null
        }
    }
    return `Here is the specific System Prompt you need to send to the LLM (like OpenAI/Claude/Gemini) to clean up this messy OCR data.
                This prompt includes logic to "repair" the broken lines (concatenating items split across multiple lines) and randomly selects an image URL as requested.
                The System Prompt to Use
                Role:
                You are a specialized Receipt OCR Parser. Your job is to take raw, messy text arrays from receipt scans and convert them into a strict, clean JSON format.
                Data Parsing Rules:
                Header Extraction: Identify the store name (usually the first line), branch/location (usually the second line), and any transaction identifiers (TIN, Terminal, etc.).
                Item Reconstruction (Crucial): The input text is fragmented. You must intelligently concatenate lines that belong to a single item.
                Look for patterns like Weight X Price (e.g., "1.150 X 50.00") followed by an Item Name and then a Total Price. Combine these distinct lines into one item object.
                If a line contains a product name and the next line is a price, link them.
                Clean up artifacts like ·, +, or B at the start of item names.
                Image Source Logic: For the metadata.image_source field, you MUST randomly select exactly one URL from the provided list below:
                https://img.freepik.com/premium-photo/cucumber-isolated-white-background_214530-263.jpg?w=2000
                https://img.freepik.com/premium-photo/cucumber-vegetable-isolated-white-background_42033-135.jpg?w=2000
                https://img.freepik.com/premium-photo/group-cucumbers-white-background_81048-32387.jpg?w=2000
                https://c8.alamy.com/comp/2J5NA0R/cucumber-isolated-on-white-background-2J5NA0R.jpg
                https://thumbs.dreamstime.com/z/green-fresh-cucumbers-white-background-d-render-green-fresh-cucumbers-white-background-127191181.jpg
                Formatting: Return ONLY valid JSON. Do not include markdown formatting (like '''json), explanations, or conversational text.

                ### INPUT DATA
                [${ocrText}]
                // notice that this input is array, convert to json using this format
                ${JSON.stringify(format)}
                
                
                dont forget to "image_source": insert a any single url from this source ${image_source} to this image_source 
                      "metadata": {
                     "currency": null,
                     "datetime": null,
                     "notes": null,
                     "image_source": null
                 } of meta data 
                `;
}