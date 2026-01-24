# Write-Grok 사용 예시

## 기본 사용

### 예시 1: 단순 장면 생성

**명령:**
```
/write-grok "두 주인공이 비 내리는 밤에 처음으로 키스하는 장면"
```

**결과:**
```markdown
빗줄기가 창문을 두드리는 소리가 방 안을 가득 채웠다.

"너... 진짜 바보야." 유나가 속삭였다.

민준은 대답 대신 그녀의 볼에 닿은 빗물을 손가락으로 닦아주었다.
그 손길이 어느새 그녀의 턱선을 따라 내려왔고,
두 사람의 숨결이 하나가 되는 건 자연스러운 일이었다.

창밖의 비가 더욱 거세졌지만,
그들의 세계에는 오직 서로의 심장 소리만이 존재했다.
```

### 예시 2: 컨텍스트 포함

**명령:**
```
/write-grok "
이전 장면: 민준이 유나를 구하기 위해 위험을 무릅씀.
캐릭터:
- 민준: 무뚝뚝하지만 속정 깊은 재벌 3세
- 유나: 독립적이지만 연애에 서툰 직장인

다음 장면을 써줘: 위기에서 벗어난 후 감정이 폭발하는 장면
"
```

**결과:**
```markdown
"왜 그런 짓을 한 거야!"

유나의 외침이 텅 빈 골목에 메아리쳤다.
그녀의 눈에서 눈물이 쏟아지고 있었다.

"너 다치면 어떡하려고... 나 때문에 네가..."

"그만." 민준이 그녀의 손목을 잡아끌었다.
"난 괜찮아."

"괜찮긴 뭐가 괜찮아! 피 나잖아!"

민준은 그녀의 손을 자신의 가슴에 가져다 댔다.
심장이 미친 듯이 뛰고 있었다.

"봐. 살아있잖아."

유나는 그 심장 박동을 느끼며 더 이상 말을 잇지 못했다.
대신 그의 품에 얼굴을 묻었다.

"바보... 바보야..."
```

## 고급 사용

### 예시 3: 시스템 프롬프트 커스터마이징

**명령:**
```bash
node scripts/grok-writer.mjs \
  --system "당신은 감각적인 로맨스 소설 작가입니다. 오감을 활용한 묘사를 잘하며, 긴장감을 점진적으로 높이는 것을 잘합니다." \
  --prompt "첫 밤을 보내기 전 서로를 바라보는 장면" \
  --temperature 0.85 \
  --max-tokens 2000
```

### 예시 4: 특정 장르 스타일

**무협 스타일:**
```bash
node scripts/grok-writer.mjs \
  --system "당신은 고전 무협 소설 작가입니다. 화려한 무공 묘사와 협객의 의리를 강조합니다." \
  --prompt "주인공이 검을 뽑아 적과 대결하는 장면"
```

**스릴러 스타일:**
```bash
node scripts/grok-writer.mjs \
  --system "당신은 긴장감 넘치는 스릴러 작가입니다. 짧은 문장과 급박한 전개를 사용합니다." \
  --prompt "범인을 쫓는 긴박한 추격 장면"
```

### 예시 5: 파일 출력

**명령:**
```bash
node scripts/grok-writer.mjs \
  --prompt "15화 클라이맥스 장면" \
  --output novels/my-novel/chapters/chapter_015.md \
  --max-tokens 6000
```

## 워크플로우 통합 예시

### 예시 6: Claude와 협업

**1단계: Claude로 플롯 확인**
```
/write 15
```
→ "이 장면은 콘텐츠 정책상 생성할 수 없습니다" 응답

**2단계: Grok으로 대체 생성**
```
/write-grok --chapter 15
```
→ 성공적으로 생성

**3단계: Claude로 품질 평가**
```
/evaluate 15
```
→ 플롯 일관성, 캐릭터 일관성 검사 수행

**4단계: 필요시 퇴고**
```
/revise 15
```

### 예시 7: 여러 장면 일괄 생성

```javascript
// 민감한 장면이 있는 회차들
const sensitiveChapters = [5, 12, 28, 35, 42];

for (const ch of sensitiveChapters) {
  const plotData = await readChapterPlot(ch);

  await exec(`node scripts/grok-writer.mjs \
    --prompt "${plotData.current_plot}" \
    --output "novels/my-novel/chapters/chapter_${ch.toString().padStart(3, '0')}.md"
  `);

  console.log(`Chapter ${ch} generated`);
}
```

## 에러 핸들링 예시

### API 키 없음

**상황:**
```
/write-grok "테스트"
```

**결과:**
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.

설정 방법:
1. https://console.x.ai 에서 API 키 발급
2. ~/.env 파일에 추가:
   XAI_API_KEY=xai-xxxxxxxxxxxx
3. 다시 시도
```

### 토큰 한도 초과

**상황:**
```bash
node scripts/grok-writer.mjs --max-tokens 100000 --prompt "..."
```

**결과:**
```
[ERROR] Grok API Error (400): max_tokens exceeds limit
→ 최대 허용: 8192 tokens
→ 요청값: 100000 tokens

해결: --max-tokens 8000 이하로 설정
```

## 팁과 모범 사례

### 좋은 프롬프트 작성법

**❌ 나쁜 예:**
```
로맨스 장면 써줘
```

**✅ 좋은 예:**
```
[배경]
- 장소: 빗소리가 들리는 옥상
- 시간: 해 질 녘
- 상황: 오해가 풀린 직후

[캐릭터]
- 여주: 말이 없지만 눈빛으로 감정 표현
- 남주: 평소 차가웠지만 지금은 솔직해짐

[요청]
서로의 마음을 확인하고 첫 키스를 나누는 장면.
대화보다 행동과 감정 묘사 위주로.
분량: 약 1000자
```

### Temperature 가이드

| 장면 유형 | 권장 Temperature |
|-----------|------------------|
| 일상/대화 | 0.5-0.6 |
| 감정 장면 | 0.7-0.8 |
| 액션/추격 | 0.6-0.7 |
| 실험적 장면 | 0.9-1.0 |
