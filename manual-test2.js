require('dotenv').config();
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.BASE_URL });
(async () => {
  try {
    const kb = `Support E-Mail: support@pudo-dartmasters.de\nBrand-Name: Darts Masters Support\n\nTurnierübersicht:\n- Name: TestCup\n  Ort: Puschendorf\n  Start: 2026-03-06T13:50:47.792Z\n  Ende: n/a\n  Status: ACTIVE\n  Max. Spieler: 64\n  Eintritt: 10 Euro\n  Checkout-Modus: DOUBLE_OUT`;
    const system = `Du bist ein restriktiver, professioneller Support-Mitarbeiter für das Darts Masters Turnier.\nWICHTIGE REGELN:\n1. ...\n7. Nutze ausschließlich die folgende Wissensdatenbank zur Beantwortung von Fragen:\n\nWISSENSDATENBANK:\n${kb}`;
    const r = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-oss-120b',
      messages: [{ role: 'system', content: system }, { role: 'user', content: 'Wie heißt das aktuelle Turnier?' }],
      max_tokens: 50
    });
    console.log('RAW', JSON.stringify(r, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
