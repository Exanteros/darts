require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL
});
async function main() {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-oss-120b",
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 100
        });
        console.log(response.choices[0].message);
    } catch(e) {
        console.log(e);
    }
}
main();
