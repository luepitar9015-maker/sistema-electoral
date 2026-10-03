require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'];

async function testModels() {
  for (const m of models) {
    const start = Date.now();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde {"saludo": "hola"} en json' }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      const data = await res.json();
      console.log(`Model ${m} -> Status: ${res.status} (${Date.now() - start}ms):`, data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message);
    } catch (e) {
      console.log(`Model ${m} -> Error: ${e.message}`);
    }
  }
}
testModels();
