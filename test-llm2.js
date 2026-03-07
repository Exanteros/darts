require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL || "https://llm-server.llmhub.t-systems.net/v2"
});
async function main() {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-oss-120b",
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 10
        });
        console.log(response.choices[0].message.content);
    } catch(e) {
        console.log("STATUS:", e.status);
    }
}
main();
