# revise-pipeline

퇴고 파이프라인 - critic → editor → proofreader 순차 실행

## Triggers

- "퇴고 파이프라인", "revise pipeline"
- "전문 퇴고", "professional revision"

## Pipeline Stages

```
┌─────────┐    ┌─────────┐    ┌─────────────┐
│ critic  │ →  │ editor  │ →  │ proofreader │
│ (평가)  │    │ (수정)  │    │ (교정)      │
└─────────┘    └─────────┘    └─────────────┘
```

### Stage 1: Critic (품질 평가)

```javascript
const criticResult = await Task({
  subagent_type: "novel-dev:critic",
  model: "opus",
  prompt: `다음 챕터를 평가하고 개선점을 제시하세요:

${chapterContent}

평가 항목:
- 문장력 (1-100)
- 캐릭터 일관성 (1-100)
- 플롯 진행 (1-100)
- 몰입도 (1-100)
- 장르 적합성 (1-100)

구체적인 개선 제안을 포함하세요.`
});
```

### Stage 2: Editor (원고 수정)

Critic의 피드백을 바탕으로 수정:

```javascript
const editorResult = await Task({
  subagent_type: "novel-dev:editor",
  model: "sonnet",
  prompt: `다음 원고를 수정하세요:

## 원본
${chapterContent}

## Critic 피드백
${criticResult.feedback}

## 수정 지침
- 문체 일관성 유지
- 불필요한 수식어 제거
- Show don't tell 원칙 적용
- 리듬감 개선`
});
```

### Stage 3: Proofreader (최종 교정)

```javascript
const proofResult = await Task({
  subagent_type: "novel-dev:proofreader",
  model: "haiku",
  prompt: `최종 교정을 수행하세요:

${editorResult.revised}

검사 항목:
- 맞춤법
- 띄어쓰기
- 문장부호
- 오탈자`
});
```

## Data Flow

각 단계의 출력이 다음 단계의 입력으로 전달됨:

```
critic.feedback → editor.input
editor.revised → proofreader.input
proofreader.final → output
```

## Output

```markdown
## 퇴고 완료 리포트

### 변경 요약
- Critic 지적사항: 12개
- Editor 수정: 8개 반영, 4개 보류
- Proofreader 교정: 3개

### 품질 변화
| 항목 | Before | After | 변화 |
|------|--------|-------|------|
| 문장력 | 72 | 85 | +13 |
| 몰입도 | 68 | 82 | +14 |

### 수정된 원고
[파일 저장됨: chapters/chapter_005_revised.md]
```

## Usage

```
/novel-dev:revise-pipeline 5
/novel-dev:revise-pipeline 1-3  # 범위 지정
```

## Abort Conditions

- Critic 점수가 40점 미만: "근본적 재작성 필요" 경고 후 중단
- 3회 이상 반복 수정에도 개선 없음: 사용자 확인 요청
