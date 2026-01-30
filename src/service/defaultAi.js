import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiKey } from "../utils/getKey.js";

const genAI = new GoogleGenerativeAI(getGeminiKey());
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // Use "gemini-1.5-flash" for speed/free tier


export const request = async (req, res) => {

        try {
            const { prompt } = req.body;
            console.log('prompt :: return a object value for this ', prompt);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            res.json({ text: response.text() });
        } catch (error) {
            console.log('Err ;:', error)
            res.status(500).json({ error: "AI failed to respond" });
        }
    };

export const defaultAi = async (prompt) => {
 try {
            console.log('prompt :: return a object value for this ', prompt);
            const result = await model.generateContent(prompt);
            const response = await result.response;

            return response.text()

            // res.json({ text: response.text() });
        } catch (error) {
            console.log('Err ;:', error)
            res.status(500).json({ error: "AI failed to respond" });
        }
}