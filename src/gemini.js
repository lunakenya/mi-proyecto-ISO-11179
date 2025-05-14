export async function llamarGemini(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('API KEY usada:', apiKey);

  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No se generó contenido válido.';
}
