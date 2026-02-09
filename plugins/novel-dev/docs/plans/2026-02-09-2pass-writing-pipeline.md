# 2-Pass 집필 파이프라인 설계

## 요약

Claude가 전체 챕터를 집필하고(Pass 1), Grok이 성인 장면만 리미트 해제 리라이트(Pass 2)하는 2-Pass 파이프라인.

## 배경 & 동기

### 현재 문제
1. **Grok 단독 집필의 분량 부족** — grok-4-1-fast-reasoning이 ~3,000자에서 자발적 종료 (finish_reason: "stop"). max_tokens 30000으로 올려도 무효
2. **reasoning 토큰 오버헤드** — reasoning 모델이 thinking에 토큰을 소모해 실제 본문이 짧아짐
3. **모델 라우팅 문제** — grok-4-1-fast 지정해도 내부적으로 reasoning으로 라우팅

### 2-Pass의 장점
- Claude의 검증된 서사 품질 + 충분한 분량 활용
- Grok은 성인 장면 리라이트에만 집중 (짧은 구간이라 분량 문제 없음)
- Grok 전용 스킬 3개 + 스크립트 3개 제거 → 구조 단순화

## 전체 흐름

```
Pass 1 (Claude)                    Pass 2 (Grok)
+-----------------------+         +-------------------------+
| 전체 챕터 집필         |         | 챕터 전체 수신           |
| 성인 장면도 최대한     |  --->   | ADULT 마커 구간만        |
| 표현 + 번호 마커 삽입  |         | 리미트 해제 리라이트     |
+-----------------------+         +-------------------------+
                                            |
                                            v
                                  +-------------------------+
                                  | JSON으로 구간별 출력     |
                                  | 스크립트가 원본에 교체   |
                                  | -> 최종 chapter.md      |
                                  +-------------------------+
```

## 마커 형식

번호 부여 방식으로 다중 마커 매칭 문제 해결:

```markdown
그의 손이 그녀의 어깨를 스쳤다. 심장이 빠르게 뛰었다.

<!-- ADULT_1_START -->
그가 천천히 다가왔다. 숨결이 목덜미에 닿았고...
(Claude가 최대한 표현한 성인 장면 A)
<!-- ADULT_1_END -->

아침 햇살이 커튼 사이로 스며들었다. 두 사람은 카페로 향했다.

<!-- ADULT_2_START -->
테이블 아래로 그의 손이 슬며시...
(Claude가 최대한 표현한 성인 장면 B)
<!-- ADULT_2_END -->

그녀는 빨개진 얼굴을 돌렸다.
```

## Pass 1: Claude 집필

기존 `/write` 스킬의 novelist 에이전트에 시스템 프롬프트 지시 추가:

```
성인 장면(정사, 신체 접촉, 관능적 묘사)을 작성할 때는
<!-- ADULT_N_START --> 와 <!-- ADULT_N_END --> 마커로 감싸세요. (N은 1부터 순번)
마커 안에서는 행위, 신체 부위, 감정 반응을 구체적으로 서술하세요.
마커 밖의 일반 장면은 평소대로 작성하세요.
```

기존 컨텍스트 시스템(플롯, 요약, 캐릭터, 세계관, 복선) 그대로 유지.

## Pass 2: Grok 리라이트

### 입력
- 챕터 전체 텍스트 (컨텍스트용)
- `meta/style-guide.json`의 `adult_writing` 섹션

### 시스템 프롬프트
```
당신은 한국어 성인 소설 리라이터입니다.

[adult_writing 스타일 가이드]

## 작업 지시
- 입력으로 소설 챕터 전체가 주어집니다.
- <!-- ADULT_N_START --> 와 <!-- ADULT_N_END --> 사이의 장면만 성인소설 수준으로 리라이트하세요.
- 마커 밖의 텍스트는 절대 수정하지 마세요.
- 주변 문장의 톤과 문체를 유지하세요.
- 결과를 반드시 아래 JSON 형식으로 출력하세요.

## 출력 형식 (JSON만 출력)
{
  "1": "리라이트된 장면 1 텍스트...",
  "2": "리라이트된 장면 2 텍스트..."
}
```

### 출력 파싱
- JSON 파싱 → 번호별 텍스트 추출
- 원본에서 `<!-- ADULT_N_START -->...<!-- ADULT_N_END -->` 구간을 해당 번호의 Grok 출력으로 교체
- 마커 태그 제거
- 최종 텍스트 저장

## 스크립트 구조

### 제거
```
scripts/grok-writer.mjs
scripts/grok-batch-writer.mjs
scripts/assemble-grok-prompt.mjs
skills/write-grok/
skills/write-grok-act/
skills/write-grok-batch/
```

### 신규
```
scripts/adult-rewriter.mjs    -- Grok API로 마커 구간 리라이트
```

### adult-rewriter.mjs CLI
```bash
node scripts/adult-rewriter.mjs \
  --input chapters/chapter_001.md \
  --project ./novels/my-novel \
  --output chapters/chapter_001.md \
  [--model grok-4-1-fast-reasoning] \
  [--max-tokens 30000] \
  [--temperature 0.85] \
  [--dry-run]  # 마커 감지만, API 호출 안 함
```

### 처리 흐름
1. `--input` 파일 읽기
2. 정규식으로 `<!-- ADULT_N_START -->...<!-- ADULT_N_END -->` 파싱
3. 마커 없으면 → "리라이트 대상 없음" 출력, 원본 유지
4. 마커 있으면:
   a. 원본을 `.bak` 백업 (Pass 2 실패 시 복구용)
   b. `adult_writing` 스타일가이드 로드 (`project/meta/style-guide.json`)
   c. 시스템 프롬프트 + 챕터 전체를 Grok API에 전달
   d. JSON 응답 파싱
   e. 번호별 매칭 → 마커 구간 교체
   f. 마커 태그 제거 → `--output` 저장
   g. `.bak` 삭제

## 스킬 구성

### 신규 스킬

| 스킬 | 설명 |
|------|------|
| `/write-2pass` | 단일 챕터 2-Pass 집필 |
| `/write-act-2pass` | Act 단위 2-Pass 집필 |

### /write-2pass 흐름
```
1. Claude novelist가 챕터 집필 (Pass 1)
   - 플롯, 스타일가이드, 캐릭터, 세계관, 복선 참조
   - 성인 장면에 ADULT 마커 삽입
   - chapters/chapter_XXX.md 저장

2. adult-rewriter.mjs 호출 (Pass 2)
   - 마커 감지 → Grok API → 교체 → 저장

3. 사후 처리
   - summarizer → 요약 생성
   - ralph-state.json 업데이트
```

### /write-act-2pass 흐름
```
1. plot/structure.json에서 Act 범위 확인
2. for each chapter in act:
     /write-2pass {chapter}
3. 막 완료 후:
     /consistency-check
     /revise
     /evaluate
```

## 리스크 & 완화

### R1: Grok이 JSON 형식을 안 따름
- **완화**: JSON 파싱 실패 시 재시도 (최대 2회). 그래도 실패하면 `.bak`에서 원본 복구
- **대안**: JSON 대신 마커 구분자 (`---ADULT_1---`) 사용도 고려

### R2: Claude 자기검열로 마커 내용이 너무 순함
- **완화**: "행위, 신체 부위, 감정 반응을 구체적으로"라는 강한 지시
- **보완**: 플롯의 씬 정보(`scenes[].summary`)를 Grok에도 전달하여 맥락 보충

### R3: 경계부 톤 불일치
- **완화**: Grok 시스템 프롬프트에 "주변 문장의 톤과 문체를 유지하라" 지시
- **보완**: 스타일가이드 전체를 Grok에게도 전달

### R4: Pass 2 실패 시 데이터 손실
- **완화**: `.bak` 백업 → 교체 성공 후에만 삭제

## 마이그레이션

### plugin.json
- 5.5.1 → 6.0.0 (breaking change: Grok 전용 스킬 제거)

### writer_mode 영향
- `"grok"` → deprecated (2-Pass로 대체)
- `"claude"` → 그대로 유지
- `"hybrid"` → 이미 deprecated, 제거
- 신규: `"2pass"` 는 사용하지 않음 (별도 스킬로 분리)

## 검증 계획

### 단계 1: adult-rewriter.mjs 단독 테스트
```bash
# 마커가 있는 테스트 파일로 검증
node scripts/adult-rewriter.mjs --input test-chapter.md --project ./test --dry-run
node scripts/adult-rewriter.mjs --input test-chapter.md --project ./test --output test-output.md
```

### 단계 2: /write-2pass E2E 테스트
```bash
/write-2pass 1  # 1화 2-Pass 집필, 마커 삽입 → Grok 리라이트 → 최종 저장 확인
```

### 단계 3: /write-act-2pass E2E 테스트
```bash
/write-act-2pass 1  # 1막 전체, 각 챕터별 2-Pass 순차 실행 확인
```
