import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const client = new OpenAI({
apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));

// 뉴스 카드 웹페이지 제공
app.use(express.static("public"));

// AI 뉴스 요약 API
app.post("/api/summarize", async (req, res) => {
    try {
        const { text, category, tone } = req.body;

        // 기사 내용 확인
        if (!text || text.trim().length < 40) {
            return res.status(400).json({
                error: "기사 내용을 40자 이상 입력해 주세요."
            });
        }

        // API 키 확인
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                error: "AI API 키가 설정되지 않았습니다."
            });
        }

        // OpenAI AI 요약 요청
        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",
                headers: {
                    "Authorization":
                        `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",

                    instructions: `
                        당신은 한국어 뉴스 전문 편집자입니다.
                        제공된 기사 내용만을 근거로 요약하세요.
                        확인되지 않은 사실을 만들지 마세요.
                        제목 1개와 핵심 요약 3개를 작성하세요.
                        결과는 반드시 JSON으로 반환하세요.
                    `,

                    input: `
                        뉴스 분야: ${category || "오늘의 뉴스"}
                        요약 스타일: ${tone || "쉽고 간결하게"}

                        기사 본문:
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
                })
            }
        );

        const data = await response.json();

        // AI 응답 오류 처리
        if (!response.ok) {
            console.error("AI API 오류:", data);

            return res.status(502).json({
                error: "AI 요약에 실패했습니다. API 설정을 확인해 주세요."
            });
        }

        // AI가 생성한 텍스트 추출
        const resultText = (data.output || [])
            .flatMap(item => item.content || [])
            .filter(item => item.type === "output_text")
            .map(item => item.text)
            .join("");

        if (!resultText) {
            return res.status(502).json({
                error: "AI 응답이 비어 있습니다."
            });
        }

        const result = JSON.parse(resultText);

        // 제목과 요약 결과 반환
        res.json(result);

    } catch (error) {
        console.error("서버 오류:", error);

        res.status(500).json({
            error: "서버 내부 오류가 발생했습니다."
        });
    }
});

// 서버 실행
app.listen(PORT, () => {
    console.log(
        `돈벌쥐 AI 뉴스 서버 실행 중: http://localhost:${PORT}`
    );
});
