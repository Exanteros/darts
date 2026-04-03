require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.BASE_URL
});
(async ()=>{
    const knowledgeBase = `Support E-Mail: support@pudo-dartmasters.de\nBrand-Name: Dart Masters Support\n\nTurnierübersicht:\n- Name: TestCup\n  Ort: Puschendorf\n  Start: 2026-03-06T13:50:47.792Z\n  Ende: n/a\n  Status: ACTIVE\n  Max. Spieler: 64\n  Eintritt: 10 Euro\n  Checkout-Modus: DOUBLE_OUT`;
    const system = `Du bist ein restriktiver, professioneller Support-Mitarbeiter für das Dart Masters Turnier.\nWICHTIGE REGELN:\n1. ...\n7. Nutze ausschließlich die folgende Wissensdatenbank zur Beantwortung von Fragen:\n\nWISSENSDATENBANK:\n${knowledgeBase}`;
    const res = await openai.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-oss-120b',
        messages:[{role:'system',content:system},{role:'user',content:'Wie heißt das aktuelle Turnier?'}],
        max_tokens:20
    });
    console.log(res.choices[0].message.content);
})();
