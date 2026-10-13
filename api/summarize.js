const response = await fetch('/api/summarize', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({
text,
category: $('category').value,
tone: $('tone').value
})
});

const rawResponse = await response.text();

let data;

try {
data = JSON.parse(rawResponse);
} catch (error) {
console.error('서버 원본 응답:', rawResponse);

throw new Error(
`서버가 JSON이 아닌 응답을 보냈습니다. HTTP ${response.status}: ${rawResponse.slice(0, 300)}`
);
}

if (!response.ok) {
throw new Error(
data.details || data.error || `HTTP ${response.status}`
);
}

// 성공한 경우 결과 표시
console.log('요약 결과:', data);
