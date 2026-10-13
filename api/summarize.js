import OpenAI from "openai";

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
// 1. POST 요청만 허용
if (req.method !== "POST") {
return res.status(405).json({
error: "POST 요청만 허용됩니다.",
});
}

// 2. API 키 확인
if (!process.env.OPENAI_API_KEY) {
return res.status(500).json({
error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.",
});
}

try {
// 3. 요청 데이터 확인
const { text, category, tone } = req.body || {};

```
if (typeof text !== "string" || !text.trim()) {
  return res.status(400).json({
    error: "요약할 뉴스 내용을 입력해 주세요.",
  });
}

// 4. 요약 스타일 설정
const styles = {
  "쉽고 간결하게":
    "어려운 표현을 피하고 핵심 내용을 쉽고 간결하게 작성하세요.",

  "핵심 숫자 중심으로":
    "금액, 비율, 날짜, 통계 등 핵심 숫자를 중심으로 요약하세요. 원문에 없는 숫자는 만들지 마세요.",

  "초보자도 이해하기 쉽게":
    "뉴스에 익숙하지 않은 사람도 이해할 수 있도록 배경과 의미를 쉬운 말로 설명하세요.",

  "중립적인 뉴스 문체로":
    "감정적인 표현이나 편향적인 판단을 피하고 객관적인 뉴스 문체로 작성하세요.",
};

const selectedTone =
  styles[tone] || styles["쉽고 간결하게"];

// 5. AI 뉴스 요약 요청
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",

  messages: [
    {
      role: "system",
      content: `
```

당신은 한국어 뉴스 요약 전문가입니다.

다음 규칙을 지키세요.

1. 원문에 없는 사실을 만들어내지 마세요.
2. 핵심 내용을 정확하게 요약하세요.
3. 제목은 짧고 명확하게 작성하세요.
4. 핵심 요점은 3개에서 5개로 작성하세요.
5. 뉴스 분류를 요약에 참고하세요.
6. ${selectedTone}

반드시 다음 JSON 형식으로만 응답하세요.
{
"title": "뉴스 제목",
"bullets": [
"핵심 내용 1",
"핵심 내용 2",
"핵심 내용 3"
],
"summary": "전체 요약"
}
`.trim(),
},

```
    {
      role: "user",
      content: `
```

뉴스 분류: ${category || "일반"}

뉴스 원문:
${text.trim()}
`.trim(),
},
],

```
  response_format: {
    type: "json_object",
  },

  temperature: 0.3,
});

// 6. AI 응답 확인
const content = completion.choices?.[0]?.message?.content;

if (!content) {
  return res.status(502).json({
    error: "AI가 요약 결과를 반환하지 않았습니다.",
  });
}

// 7. JSON 결과 변환
let result;

try {
  result = JSON.parse(content);
} catch {
  return res.status(502).json({
    error: "AI 요약 결과를 해석할 수 없습니다.",
  });
}

// 8. 결과 형식 확인
if (
  typeof result.title !== "string" ||
  !Array.isArray(result.bullets) ||
  typeof result.summary !== "string"
) {
  return res.status(502).json({
    error: "AI 요약 결과의 형식이 올바르지 않습니다.",
  });
}

// 9. 요약 결과 반환
return res.status(200).json({
  title: result.title,
  bullets: result.bullets,
  summary: result.summary,
});
```

} catch (error) {
console.error("뉴스 요약 API 오류:", error);

```
return res.status(500).json({
  error: "뉴스 요약 중 오류가 발생했습니다. Vercel 함수 로그를 확인해 주세요.",
});
```

}
}
