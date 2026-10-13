```javascript
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 허용됩니다."
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Vercel에 OPENAI_API_KEY 환경 변수를 설정해 주세요."
    });
  }

  try {
    const { text, category, tone } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "요약할 뉴스 본문을 입력해 주세요."
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어 뉴스 편집자입니다. 뉴스 내용을 정확하고 쉽게 요약하세요. 제공되지 않은 사실은 만들어내지 마세요. JSON 형식으로만 답변하세요. title은 짧은 뉴스 제목, bullets는
```
