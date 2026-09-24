import { CATEGORIES } from "./receiptNormalize.js";

const SCHEMA = `{
  "store": string|null,
  "slogan": string|null,
  "contact": string|null,
  "manager": string|null,
  "address": { "street": string|null, "city": string|null, "state": string|null, "zip": string|null },
  "transaction": { "store_number": string|null, "operator_number": string|null, "terminal_number": string|null, "transaction_number": string|null },
  "items": [ { "description": string, "upc": string|null, "type": string|null, "category": string, "price": number, "quantity": number } ],
  "subtotal": number|null,
  "tax_rate": number|null,
  "tax_amount": number|null,
  "total": number|null,
  "payment_method": string|null,
  "amount_paid": number|null,
  "metadata": { "currency": "PHP", "datetime": string|null, "notes": string|null, "type": "Expense"|"Income" }
}`;

const SHARED_RULES = `
- Reply with one JSON object and nothing else. No markdown, no comments.
- Numbers are plain numbers: 1234.5, not "₱1,234.50".
- "price" is the unit price; "quantity" defaults to 1.
- "category" must be one of: ${CATEGORIES.join(", ")}.
- Use null for anything the input doesn't show. Don't invent items.
- Translate item names to English when they're in another language.
- metadata.currency is always "PHP".`;

// ocrLines: array of text lines from Azure Read, in reading order.
export const receiptImagePrompt = (ocrLines, now = new Date()) => `You read OCR output from a photographed receipt and return it as structured JSON.

OCR lines (top to bottom, may be split or out of order):
${ocrLines.map((l, i) => `${i + 1}: ${l}`).join("\n")}

Return JSON in this shape:
${SCHEMA}

Rules:${SHARED_RULES}
- An item name and its price are often on separate lines; pair them up.
- Strip stray symbols (·, +, *, trailing "B"/"V" tax flags) from item names.
- Totals, subtotals, tax, change and payment lines are not items.
- metadata.datetime: the receipt's date and time as ISO 8601. If there's none, use "${now.toISOString()}".
- metadata.type is "Expense" unless the document is clearly a payment received.`;

export const quickTextPrompt = (text, now = new Date()) => `You turn a short note about money into structured JSON.

Note:
"""${text}"""

Return JSON in this shape:
${SCHEMA}

Rules:${SHARED_RULES}
- Each amount mentioned is its own item. "store" is the shop or person named, if any.
- metadata.type is "Income" for money received (salary, payment, refund, sold), otherwise "Expense".
- metadata.notes: the original note, trimmed.
- metadata.datetime: resolve words like "yesterday" against ${now.toISOString()} and return ISO 8601. If no date is mentioned, use that timestamp.`;
