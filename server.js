import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { text, category, tone } = req.body || {};

    if (typeof text !== "string" || text.trim().length < 40) {
      return res.status(400).json({
        error: "뉴스 원문을 40자 이상 입력해 주세요."
      });
    }

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: `
당신은 한국어 뉴스 요약 전문가입니다.

다음 규칙을 지키세요.
1. 반드시 한국어로 작성하세요.
2. 원문에 없는 사실이나 수치를 만들지 마세요.
3. 제목은 명확하고 간결하게 작성하세요.
4. 핵심 요점은 3개로 작성하세요.
5. 요약문은 쉽게 이해할 수 있도록 작성하세요.
6. 결과는 JSON 형식으로 작성하세요.
      `,
      input: `
뉴스 분야: ${category || "일반 뉴스"}
요약 스타일: ${tone || "쉽고 간결하게"}

뉴스 원문:
${text}
      `,
      text: {
        format: {
          type: "json_schema",
          name: "news_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: {
                type: "string"
              },
              bullets: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              summary: {
                type: "string"
              }
            },
            required: [
              "title",
              "bullets",
              "summary"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const result = JSON.parse(response.output_text);

    return res.status(200).json({
      title: result.title,
      bullets: result.bullets,
      summary: result.summary
    });

  } catch (error) {
    console.error("뉴스 요약 서버 오류:", error.message);

    return res.status(500).json({
      error: "뉴스 요약 처리 중 오류가 발생했습니다.",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `돈벌쥐 AI 뉴스 서버 실행 중: http://localhost:${PORT}`
  );
});
