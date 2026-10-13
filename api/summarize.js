```javascript
import OpenAI from "openai";

export default async function handler(req, res) {
  // 1. POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 허용됩니다."
    });
  }

  // 2. OpenAI API 키 확인
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다."
    });
  }

  try {
    // 3. 요청 데이터 확인
    const { text, category, tone } = req.body || {};

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400
```
