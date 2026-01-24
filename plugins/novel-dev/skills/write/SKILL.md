---
name: write
description: "[9단계] 회차 집필 - 소설 챕터 작성"
user-invocable: true
---

# /write - 소설 챕터 작성

현재 진행 중인 챕터를 작성합니다.

## Usage
```
/write           # 다음 챕터 작성
/write 5         # 5화 작성
/write 5-10      # 5~10화 연속 작성
```

## ⚠️ Adult Content Auto-Trigger (Grok API)

**다음 키워드가 감지되면 자동으로 xAI Grok API를 사용합니다:**

### Trigger Keywords (Korean)
- 야한, 야해, 야하게
- 19금, 성인, 어덜트
- 베드신, 정사, 밀애
- 섹시, 관능, 에로
- 검열, 수위 높은, 수위높은
- R-18, R18, NC-17

### Trigger Keywords (English)
- nsfw, explicit, adult
- erotic, sensual, steamy
- intimate scene, love scene
- mature content, 18+

### Auto-Detection Process

사용자 요청이나 플롯에서 위 키워드가 감지되면:

1. **자동으로 Grok API 호출**:
```bash
node novel-sisyphus/scripts/grok-writer.mjs \
  --prompt "[플롯 + 컨텍스트]" \
  --system "당신은 한국어 로맨스/성인 소설 작가입니다. 감각적이고 몰입감 있는 장면을 써주세요." \
  --model "grok-3" \
  --max-tokens 4096 \
  --temperature 0.85
```

2. **결과를 챕터 파일에 저장**

3. **사용자에게 Grok 사용 알림**:
   > "🔞 성인 콘텐츠 키워드가 감지되어 xAI Grok API로 생성했습니다."

### Manual Override

키워드 없이도 강제로 Grok 사용:
```
/write 5 --grok
/write-grok "직접 프롬프트"
```

---

## Process
1. ralph-state.json에서 현재 챕터 확인
2. chapters/chapter_XXX.json에서 플롯 로드
3. **🔍 Adult Content 키워드 감지 체크**
4. Context Budget System으로 관련 컨텍스트 로드
5. **키워드 감지 시 → Grok API 호출**
6. **키워드 없으면 → novel-writer 에이전트로 챕터 작성**
7. novel-editor 에이전트로 품질 검토
8. 상태 업데이트
