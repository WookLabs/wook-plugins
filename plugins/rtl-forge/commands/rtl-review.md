---
name: rtl-review
description: RTL 코드 리뷰 요청. rtl-review 스킬을 트리거합니다.
---

# /rtl-review

RTL 코드 리뷰를 시작합니다.

## 사용법

```
/rtl-review                      # 현재 작업 중인 모듈 리뷰
/rtl-review rtl/fifo_ctrl.sv     # 특정 파일 리뷰
/rtl-review --full               # 전체 RTL 리뷰 (모든 분석 포함)
```

## 동작

1. 대상 파일/모듈 식별
2. `rtl-review` 스킬 활성화
3. 정적 분석 (Verilator/Slang) 실행
4. 에이전트 기반 분석 (아키텍처, lint, CDC, 합성)
5. Confidence ≥ 80 결과만 보고
6. Dual output (Markdown + JSON)

## 분석 항목

- **Architecture**: 모듈 구조, 인터페이스, 파라미터 설계
- **Lint**: 코딩 스타일, 네이밍, 구조적 이슈
- **CDC**: 클럭 도메인 크로싱 위험성
- **Synthesis**: 합성 가능성, 타이밍 예측

## 출력

- `.rtl-forge/review-{module}.md` - 사람 읽기용 Markdown
- `.rtl-forge/review-{module}.json` - 도구 처리용 JSON
