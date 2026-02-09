---
name: write-2pass
description: Claude 집필 + Grok 성인 장면 리라이트 2-Pass 집필
user-invocable: true
---

# /write-2pass - 2-Pass 집필

$ARGUMENTS

Claude가 전체 챕터를 집필(Pass 1)하고, Grok이 성인 장면만 리미트 해제 리라이트(Pass 2)합니다.

## Quick Start

```bash
/write-2pass 5        # 5화를 2-Pass로 집필
/write-2pass 1        # 1화를 2-Pass로 집필
```

## Prerequisites

`~/.env` 파일에 API 키 설정:
```
XAI_API_KEY=xai-xxxxxxxxxxxx
```

## 실행 단계

### Pass 1: Claude 집필

1. **컨텍스트 로드**
   - `chapters/chapter_XXX.json` (플롯)
   - `meta/style-guide.json` (문체)
   - `characters/*.json` (등장인물)
   - `world/world.json` (세계관)
   - `plot/foreshadowing.json` (복선)
   - `context/summaries/` (이전 요약, 최대 3개)

2. **챕터 집필**
   - Claude novelist 에이전트로 전체 챕터 작성
   - 목표 분량: 5,000~8,000자
   - 성인 장면은 `<!-- ADULT_N_START -->` / `<!-- ADULT_N_END -->` 마커로 감싸기
   - 마커 안에서는 행위, 신체 부위, 감정 반응을 최대한 구체적으로 서술

3. **마커 삽입 지시** (시스템 프롬프트에 추가)
   ```
   성인 장면(정사, 신체 접촉, 관능적 묘사)을 작성할 때는
   <!-- ADULT_N_START --> 와 <!-- ADULT_N_END --> 마커로 감싸세요. (N은 1부터 순번)
   마커 안에서는 행위, 신체 부위, 감정 반응을 구체적으로 서술하세요.
   마커 밖의 일반 장면은 평소대로 작성하세요.
   ```

4. **저장**: `chapters/chapter_XXX.md`

### Pass 2: Grok 리라이트

5. **adult-rewriter.mjs 호출**

```bash
node novel-dev/scripts/adult-rewriter.mjs \
  --input chapters/chapter_XXX.md \
  --project {소설 프로젝트 경로} \
  --output chapters/chapter_XXX.md
```

6. **결과 확인**: 마커 개수, 원본/리라이트 글자수 비교

### 사후 처리

7. **요약 생성**: summarizer 에이전트 호출 → `context/summaries/chapter_XXX_summary.md`
8. **상태 업데이트**: `meta/ralph-state.json` 갱신
9. **선택적 검증**: critic, beta-reader 에이전트로 품질 평가

## 마커 형식

```markdown
그의 손이 그녀의 어깨를 스쳤다. 심장이 빠르게 뛰었다.

<!-- ADULT_1_START -->
그가 천천히 다가왔다. 숨결이 목덜미에 닿았고...
(Claude가 최대한 표현한 성인 장면)
<!-- ADULT_1_END -->

아침 햇살이 커튼 사이로 스며들었다.
```

## ADULT 마커가 없는 경우

플롯에 성인 장면이 없으면 Claude가 마커를 삽입하지 않습니다.
이 경우 Pass 2를 건너뛰고 Claude 원본이 최종본이 됩니다.

## Error Handling

### Pass 2 실패
```
[ERROR] 모든 재시도 실패. 원본을 유지합니다.
→ Claude 원본(Pass 1)이 보존됩니다. .bak 백업으로 복구 가능.
```

### API 키 없음
```
[ERROR] XAI_API_KEY를 찾을 수 없습니다.
→ ~/.env 파일에 XAI_API_KEY=xai-xxx 추가
```
