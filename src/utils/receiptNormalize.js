// Turns whatever a model returned into the exact receipt shape the app
// stores. Models return "₱1,234.50" for numbers, drop keys, invent
// categories; rejecting all of that made extraction fail far too often.

export const CATEGORIES = [
  "Groceries", "Dining", "Housing", "Transportation", "Utilities",
  "Shopping", "Entertainment", "Healthcare", "Income", "Other",
];

const CATEGORY_ALIASES = {
  food: "Groceries", grocery: "Groceries", supermarket: "Groceries",
  restaurant: "Dining", cafe: "Dining", coffee: "Dining", drinks: "Dining",
  rent: "Housing", home: "Housing",
  transport: "Transportation", travel: "Transportation", fuel: "Transportation", gas: "Transportation",
  bills: "Utilities", electricity: "Utilities", water: "Utilities", internet: "Utilities",
  retail: "Shopping", clothing: "Shopping",
  health: "Healthcare", pharmacy: "Healthcare", medicine: "Healthcare", medical: "Healthcare",
  salary: "Income",
  general: "Other", misc: "Other", miscellaneous: "Other",
};

const str = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" || /^(null|undefined|n\/a|string)$/i.test(s) ? null : s;
};

export const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^0-9.,-]/g, "");
  if (!cleaned) return null;
  // "1.234,50" (EU) vs "1,234.50" (US/PH): the last separator is the decimal one.
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const normalized =
    lastComma > lastDot
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
};

export const normalizeCategory = (v) => {
  const s = str(v);
  if (!s) return "Other";
  const exact = CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
  if (exact) return exact;
  return CATEGORY_ALIASES[s.toLowerCase()] || "Other";
};

const round2 = (n) => (n === null ? null : Math.round(n * 100) / 100);

const toIsoDate = (v, fallback) => {
  const s = str(v);
  if (s) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() > 1990) return d.toISOString();
  }
  return fallback;
};

// Some models answer a note like "grab 180, 7-eleven 95" with one receipt
// per merchant. The app stores one receipt per entry, so fold them together.
function mergeReceipts(list) {
  const receipts = list.filter((x) => x && typeof x === "object");
  if (receipts.length <= 1) return receipts[0] || {};
  const stores = [...new Set(receipts.map((x) => str(x.store)).filter(Boolean))];
  return {
    ...receipts[0],
    store: stores.length === 1 ? stores[0] : null,
    items: receipts.flatMap((x) => (Array.isArray(x.items) ? x.items : [])),
    subtotal: null,
    tax_amount: null,
    total: null,
    amount_paid: null,
  };
}

export function normalizeReceipt(raw, { sourceType = "image", now = new Date() } = {}) {
  const r = Array.isArray(raw) ? mergeReceipts(raw) : raw && typeof raw === "object" ? raw : {};
  const address = r.address || {};
  const txn = r.transaction || {};
  const meta = r.metadata || {};

  const items = (Array.isArray(r.items) ? r.items : [])
    .map((it) => ({
      description: str(it?.description),
      upc: str(it?.upc),
      type: str(it?.type),
      category: normalizeCategory(it?.category),
      price: round2(num(it?.price)),
      quantity: num(it?.quantity) ?? 1,
    }))
    .filter((it) => it.description || it.price !== null);

  const itemsSum = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
  const taxAmount = round2(num(r.tax_amount));
  let subtotal = round2(num(r.subtotal));
  let total = round2(num(r.total));
  if (subtotal === null && items.length) subtotal = round2(itemsSum);
  if (total === null) total = subtotal !== null ? round2(subtotal + (taxAmount || 0)) : null;

  const type = /income/i.test(String(meta.type || "")) ? "Income" : "Expense";

  return {
    store: str(r.store),
    slogan: str(r.slogan),
    contact: str(r.contact),
    manager: str(r.manager),
    address: {
      street: str(address.street),
      city: str(address.city),
      state: str(address.state),
      zip: str(address.zip),
    },
    transaction: {
      store_number: str(txn.store_number),
      operator_number: str(txn.operator_number),
      terminal_number: str(txn.terminal_number),
      transaction_number: str(txn.transaction_number),
    },
    items,
    subtotal,
    tax_rate: num(r.tax_rate),
    tax_amount: taxAmount,
    total,
    payment_method: str(r.payment_method),
    amount_paid: round2(num(r.amount_paid)) ?? total,
    metadata: {
      // The app displays everything in pesos (see prompts), keep that contract.
      currency: "PHP",
      datetime: toIsoDate(meta.datetime, now.toISOString()),
      notes: str(meta.notes),
      source_type: sourceType,
      type,
      image_source: str(meta.image_source),
    },
  };
}

// Throws if a parsed result is too empty to be worth showing.
export function assertUsableReceipt(data) {
  const r = normalizeReceipt(data);
  if (!r.store && r.items.length === 0 && r.total === null) {
    throw new Error("Response had no store, items or total");
  }
}
