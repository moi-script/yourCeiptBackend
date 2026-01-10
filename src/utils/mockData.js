export const MOCK_RECEIPTS = [
    {
        store: "Starbucks Coffee",
        address: { city: "Makati", street: "Ayala Ave" },
        items: [
            { description: "Caramel Macchiato", price: 180, quantity: 1, category: "Food" },
            { description: "Bagel with Cream Cheese", price: 120, quantity: 1, category: "Food" }
        ],
        subtotal: 300,
        total: 300,
        metadata: { type: "expense", currency: "PHP" }
    },
    {
        store: "7-Eleven",
        address: { city: "Taguig", street: "BGC High Street" },
        items: [
            { description: "Gulp Soft Drink", price: 45, quantity: 1, category: "Food" },
            { description: "Umbrella", price: 150, quantity: 1, category: "Shopping" }
        ],
        subtotal: 195,
        total: 195,
        metadata: { type: "expense", currency: "PHP" }
    }
];

export const getRandomMock = () => {
    return MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
}