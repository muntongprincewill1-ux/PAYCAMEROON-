require('dotenv').config();
async function test() {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
          { role: 'user', parts: [
              { text: "Just reply 'OK'." }
          ]}
      ]
  });
  console.log(response.text);
}
test();
