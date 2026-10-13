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
      error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다."
    });
  }

  try {
    const { text, category, tone } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "요약할 뉴스 본문을 입력해 주세요."
      });
    }

    const styles = {
      simple:
        "어려운 용어를 피하고 누구나 이해할 수 있도록 쉽고 간결하게 요약하세요.",

      numbers:
        "금액, 비율, 날짜, 통계 등 중요한 숫자를 우선적으로 추려 설명하세요. 기사에 없는 숫자는 만들지 마세요.",

      beginner:
        "뉴스를 처음 접하는 사람도 이해할 수 있도록 배경과 핵심 의미를 쉬운 말로 설명하세요."
    };

    const selectedStyle =
      styles[tone] ||
      "핵심 내용을 중립적이고 명확한 한국어로 요약하세요.";

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
당신은 정확하고 신뢰할 수 있는 한국어 뉴스 편집자입니다.

다음 규칙을 지키세요.
1. 기사에 없는 사실을 만들어 내지 마세요.
2. 핵심 내용을
```
