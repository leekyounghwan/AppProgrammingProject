import { readFileSync } from "fs";

// .env 파일에서 API 키 로드
const envContent = readFileSync(".env", "utf-8");
const API_KEY = envContent.match(/OPENROUTER_API_KEY=(.+)/)?.[1]?.trim();
const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

// ── 1. 텍스트 생성 테스트 (qwen/qwen3-6b-plus:free) ──────────────────────────
async function testTextGeneration() {
  console.log("▶ [1] 텍스트 생성 테스트 (qwen/qwen3.6-plus)");
  console.log("   프롬프트: '한국어로 안녕하세요를 영어, 일본어, 중국어로 번역해줘'\n");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "qwen/qwen3.6-plus",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: "한국어로 안녕하세요를 영어, 일본어, 중국어로 번역해줘. 간단하게 각 언어명과 번역 결과만 알려줘.",
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("   ❌ 오류:", JSON.stringify(data, null, 2));
    return;
  }

  const answer = data.choices?.[0]?.message?.content ?? "(응답 없음)";
  console.log("   ✅ 응답:\n  ", answer);
  console.log(`\n   모델: ${data.model}`);
  console.log(`   토큰 사용: 입력 ${data.usage?.prompt_tokens} / 출력 ${data.usage?.completion_tokens}\n`);
}

// ── 2. 이미지 인식 테스트 (google/gemma-3-27b-it:free) ────────────────────────
async function testImageRecognition() {
  console.log("▶ [2] 이미지 인식 테스트 (google/gemma-3-27b-it:free)");
  // 테스트용 공개 이미지 (강아지 사진)
  const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/1200px-YellowLabradorLooking_new.jpg";
  console.log(`   이미지: ${imageUrl}\n`);

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "google/gemma-3-27b-it:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: "이 이미지에 무엇이 있는지 한국어로 간단히 설명해줘.",
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("   ❌ 오류:", JSON.stringify(data, null, 2));
    return;
  }

  const answer = data.choices?.[0]?.message?.content ?? "(응답 없음)";
  console.log("   ✅ 응답:\n  ", answer);
  console.log(`\n   모델: ${data.model}`);
  console.log(`   토큰 사용: 입력 ${data.usage?.prompt_tokens} / 출력 ${data.usage?.completion_tokens}\n`);
}

// ── 실행 ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("=".repeat(60));
  console.log("  OpenRouter API 테스트");
  console.log("=".repeat(60) + "\n");

  await testTextGeneration();
  console.log("-".repeat(60) + "\n");
  await testImageRecognition();

  console.log("=".repeat(60));
  console.log("  테스트 완료");
  console.log("=".repeat(60));
})();
