import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 허용됩니다.",
    });
  }

  try {
    const { text, category, tone } = req.body || {};

    // 뉴스 원문 확인
    if (typeof text !== "string" || text.trim().length < 40) {
      return res.status(400).json({
        error: "뉴스 원문을 40자 이상 입력해 주세요.",
      });
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY 환경 변수가 없습니다.");

      return res.status(500).json({
        error: "서버에 OpenAI API 키가 설정되지 않았습니다.",
      });
    }

    // OpenAI 뉴스 요약 요청
    const response = await client.responses.create({
      model: "gpt-4.1-mini",

      instructions: `
당신은 한국어 뉴스 요약 전문가입니다.

다음 규칙을 지키세요.
1. 반드시 한국어로 작성하세요.
2. 원문에 없는 사실이나 수치를 만들지 마세요.
3. 제목은 명확하고 간결하게 작성하세요.
4. 핵심 요점은 정확히 3개로 작성하세요.
5. 요약문은 쉽고 간결하게 작성하세요.
6. 제목, 핵심 요점, 요약문을 JSON 형식으로 반환하세요.
      `,

      input: `
뉴스 분야: ${category || "일반 뉴스"}
요약 스타일: ${tone || "쉽고 간결하게"}

뉴스 원문:
${text.trim()}
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
                type: "string",
              },
              bullets: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              summary: {
                type: "string",
              },
            },
            required: ["title", "bullets", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    // AI 응답을 JSON으로 변환
    const result = JSON.parse(response.output_text);

    // 프런트엔드에 결과 반환
    return res.status(200).json({
      title: result.title,
      bullets: result.bullets,
      summary: result.summary,
    });
  } catch (error) {
    console.error("뉴스 요약 오류:", error);

    return res.status(500).json({
      error: "뉴스 요약 처리 중 오류가 발생했습니다.",
    });
  }
}
