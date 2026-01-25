# verify-chapter

Run parallel validation on a chapter with 3 validators and confidence filtering.

## Triggers

- "챕터 검증", "chapter verify"
- "품질 검사", "quality check"
- 자동: 챕터 완료 후

## Protocol

### Step 1: Parallel Validation

3개 검증 에이전트를 병렬로 실행:

```javascript
await Promise.all([
  Task({ subagent_type: "novel-dev:chapter-verifier", model: "sonnet", prompt: chapterContext }),
  Task({ subagent_type: "novel-dev:beta-reader", model: "sonnet", prompt: chapterContext }),
  Task({ subagent_type: "novel-dev:genre-validator", model: "sonnet", prompt: chapterContext })
]);
```

### Step 2: Confidence Filtering

검증 결과에서 신뢰도 기반 필터링:

| 신뢰도 | 처리 |
|--------|------|
| ≥85% | 자동 반영 |
| 70-84% | 사용자 확인 후 반영 |
| <70% | 참고용 표시만 |

### Step 3: Summary Report

```markdown
## 검증 결과 요약

| Validator | Score | Status |
|-----------|-------|--------|
| chapter-verifier | 87점 | ✅ PASS |
| beta-reader | 82점 | ✅ PASS |
| genre-validator | 96점 | ✅ PASS |

**종합 판정:** APPROVED
```

## Thresholds

### Regular Mode
| Validator | Threshold |
|-----------|-----------|
| chapter-verifier | ≥85점 |
| beta-reader | ≥80점 |
| genre-validator | ≥95점 |

### Masterpiece Mode (1화)
| Validator | Threshold |
|-----------|-----------|
| chapter-verifier | ≥90점 |
| beta-reader | ≥85점 |
| genre-validator | ≥97점 |

## Usage

```
/novel-dev:verify-chapter 5
/novel-dev:verify-chapter 1 --masterpiece
```

## Output

검증 통과 시: `<promise>CHAPTER_VERIFIED</promise>`
검증 실패 시: 실패 항목과 개선 제안 목록 출력
