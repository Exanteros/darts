require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL || "https://llm-server.llmhub.t-systems.net/v2"
});
async function main() {
    try {
        const response = await openai.models.list();
        console.log(response.data.map(m => m.id));
    } catch(e) {
        console.log("STATUS:", e.status);
        console.log(e.message);
    }
}
main();
