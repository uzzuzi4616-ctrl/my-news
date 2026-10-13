import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
// 1. POST 요청만 허용
if (req.method !== "POST") {
return res.status(405).json({
error: "POST 요청만 허용됩니다."
});
}

// 2. Gemini API 키 확인
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
return res.status(500).json({
error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다."
});
}

try {
// 3. 입력 데이터 확인
const { text, category, tone } = req.body || {};

```
if (typeof text !== "string" || !text.trim()) {
  return res.status(400).json({
    error: "요약할 뉴스 내용을 입력해 주세요."
  });
}

// 4. 요약 스타일 설정
const styles = {
  "쉽고 간결하게":
    "어려운 표현을 피하고 핵심 내용을 쉽고 간결하게 작성하세요.",

  "핵심 숫자 중심으로":
    "금액, 비율, 날짜, 통계 등 핵심 숫자를 중심으로 작성하세요. 원문에 없는 숫자는 만들지 마세요.",

  "초보자도 이해하기 쉽게":
    "뉴스에 익숙하지 않은 사람도 이해할 수 있도록 배경과 의미를 쉬운 말로 설명하세요.",

  "중립적인 뉴스 문체로":
    "감정적인 표현이나 편향적인 판단을 피하고 객관적인 뉴스 문체로 작성하세요."
};

const selectedTone =
  styles[tone] || styles["쉽고 간결하게"];

const selectedCategory =
  typeof category === "string" && category.trim()
    ? category.trim()
    : "일반 뉴스";

// 5. Gemini 클라이언트 생성
const ai = new GoogleGenAI({
  apiKey: apiKey
});

// 6. AI 뉴스 요약 요청
const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",

  contents: `
```

당신은 한국어 뉴스 요약 전문가입니다.

다음 규칙을 반드시 지키세요.

1. 반드시 한국어로 작성하세요.
2. 원문에 없는 사실이나 수치를 만들지 마세요.
3. 뉴스의 핵심 내용을 정확하게 요약하세요.
4. 제목은 명확하고 간결하게 작성하세요.
5. 핵심 요점은 3개로 작성하세요.
6. 요약문은 독자가 쉽게 이해할 수 있도록 작성하세요.
7. 결과는 지정된 JSON 형식으로만 반환하세요.

뉴스 분야:
${selectedCategory}

요약 스타일:
${selectedTone}

요약할 뉴스 원문:
${text}
`,

```
  config: {
    responseMimeType: "application/json",

    responseSchema: {
      type: "OBJECT",

      properties: {
        title: {
          type: "STRING",
          description: "뉴스의 핵심을 담은 제목"
        },

        bullets: {
          type: "ARRAY",
          items: {
            type: "STRING"
          },
          description: "뉴스의 핵심 요점 3개"
        },

        summary: {
          type: "STRING",
          description: "뉴스 전체를 이해하기 쉽게 요약한 문단"
        }
      },

      required: [
        "title",
        "bullets",
        "summary"
      ]
    }
  }
});

// 7. AI 응답 확인
const resultText = response.text;

if (!resultText) {
  throw new Error(
    "Gemini에서 요약 결과를 반환하지 않았습니다."
  );
}

// 8. JSON 변환
const result = JSON.parse(resultText);

// 9. 응답 형식 확인
if (
  typeof result.title !== "string" ||
  !Array.isArray(result.bullets) ||
  typeof result.summary !== "string"
) {
  throw new Error(
    "AI 응답의 데이터 형식이 올바르지 않습니다."
  );
}

// 10. 프런트엔드로 결과 반환
return res.status(200).json({
  title: result.title,
  bullets: result.bullets,
  summary: result.summary
});
```

} catch (error) {
// 11. 오류 기록
console.error("Gemini 뉴스 요약 오류:", {
message: error?.message,
status: error?.status,
code: error?.code
});

```
// 12. 오류 내용 반환
return res.status(500).json({
  error: "뉴스 요약 처리 중 오류가 발생했습니다.",
  details: error?.message || "알 수 없는 서버 오류"
});
```

}
}
