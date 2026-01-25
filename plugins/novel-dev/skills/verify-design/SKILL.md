# verify-design

설계 검증 파이프라인 - consistency-verifier → genre-validator 순차 실행

## Triggers

- "설계 검증", "design verify"
- "설정 검사", "setting check"
- 자동: 설계 단계 완료 후

## Pipeline Stages

```
┌─────────────────────┐    ┌─────────────────┐
│ consistency-verifier│ →  │ genre-validator │
│ (일관성 검증)        │    │ (장르 검증)      │
└─────────────────────┘    └─────────────────┘
```

### Stage 1: Consistency Verifier

설정 파일들 간의 일관성 검증:

```javascript
const consistencyResult = await Task({
  subagent_type: "novel-dev:consistency-verifier",
  model: "sonnet",
  prompt: `다음 설계 파일들의 일관성을 검증하세요:

## 검증 대상
- meta/project.json
- world/world.json
- characters/*.json
- plot/main-arc.json
- plot/sub-arcs/*.json
- plot/timeline.json

## 검증 항목
1. 캐릭터 ID 참조 일관성
2. 타임라인 순서 정합성
3. 세계관 규칙 충돌 여부
4. 복선 배치/회수 매칭
5. 장소/설정 묘사 일관성

모순점 발견 시 구체적 위치와 수정 제안 포함.`
});
```

### Stage 2: Genre Validator

장르 필수 요소 충족 검증:

```javascript
const genreResult = await Task({
  subagent_type: "novel-dev:genre-validator",
  model: "sonnet",
  prompt: `설계가 장르 요구사항을 충족하는지 검증하세요:

## 프로젝트 정보
${projectMeta}

## 검증 항목
1. 장르 필수 트로프 포함 여부
2. 필수 비트 배치 계획
3. 클리셰 사용 적절성
4. 독자 기대 충족 예상치
5. 상업성 지표 (훅 밀도, 클리프행어 등)

장르: ${genre}
레시피: ${recipe}`
});
```

## Verification Matrix

| 항목 | 검증자 | 기준 |
|------|--------|------|
| 캐릭터 ID | consistency-verifier | 모든 참조가 유효 |
| 타임라인 | consistency-verifier | 순서 충돌 없음 |
| 세계관 규칙 | consistency-verifier | 모순 없음 |
| 필수 트로프 | genre-validator | 80% 이상 포함 |
| 상업성 | genre-validator | 점수 ≥85 |

## Output

```markdown
## 설계 검증 리포트

### 일관성 검증 결과
**상태:** ✅ PASS (점수: 92/100)

발견된 경미한 이슈:
- char_003 등장 시점이 타임라인과 1일 차이 (자동 수정됨)

### 장르 검증 결과
**상태:** ✅ PASS (점수: 88/100)

장르 적합성:
- 필수 트로프: 5/5 ✓
- 필수 비트 배치: 12/15 (80%)
- 상업성 점수: 85점

권장 사항:
- "반전" 비트를 25화에서 22화로 앞당기는 것 권장
- 클리프행어 밀도 약간 증가 필요 (현재 65% → 권장 75%)

### 종합 판정
**APPROVED** - 집필 진행 가능
```

## Usage

```
/novel-dev:verify-design
/novel-dev:verify-design --fix  # 자동 수정 가능한 이슈 수정
```

## Fail Conditions

검증 실패 시 집필 단계 진입 차단:

| 조건 | 처리 |
|------|------|
| 일관성 점수 <70 | 집필 차단, 수정 필요 |
| 장르 점수 <80 | 경고 후 진행 가능 |
| 필수 트로프 <60% | 집필 차단 |
| 캐릭터 참조 오류 | 자동 수정 시도 |
