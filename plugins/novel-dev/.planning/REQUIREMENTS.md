# Requirements: Novel-Dev v5.0

**Defined:** 2026-02-05
**Core Value:** AI가 썼다는 것을 모를 수준의 자연스러운 한국어 장르소설 생성

## v1 Requirements

### Foundation (FOUN)

- [x] **FOUN-01**: 스타일 라이브러리 — 장르별 명작 소설의 문체/구조 패턴을 few-shot exemplar로 저장하고 집필 시 자동 주입
- [x] **FOUN-02**: 컨텍스트 매니저 — 계층형 메모리(핫/웜/콜드)로 장편 소설 일관성 유지 (3챕터 슬라이딩 윈도우)
- [x] **FOUN-03**: 장면(Scene) 데이터 모델 — 챕터를 장면 단위로 분해하는 스키마와 데이터 구조

### Core Pipeline (PIPE)

- [x] **PIPE-01**: 장면 단위 집필 — 챕터를 장면으로 분해하여 개별 집필 후 조합 (40%+ 품질 향상)
- [x] **PIPE-02**: Quality Oracle — 점수 대신 구체적 수술 지시를 내리는 평가 시스템 (위치, 문제, 수정법)
- [x] **PIPE-03**: Prose Surgeon — Quality Oracle의 지시에 따라 타겟 수정만 수행하는 에이전트
- [x] **PIPE-04**: novelist 에이전트 프롬프트 전면 재설계 — AI체 탈피, 감각적 묘사, 리듬감 있는 문장
- [x] **PIPE-05**: editor 에이전트 프롬프트 재설계 — 구체적 문체 개선 지시 기반 수정
- [x] **PIPE-06**: critic 에이전트 프롬프트 재설계 — 문학적 품질 기준으로 진단적 평가

### Korean Specialization (KORE)

- [x] **KORE-01**: 경어 체계 매트릭스 — 캐릭터 관계별 경어/반말 규칙 자동 적용
- [x] **KORE-02**: AI체 금지 표현 리스트 — "한편", "그러나", "~하였다" 등 AI 특유 표현 차단 및 대체
- [x] **KORE-03**: 한국어 문체 텍스처 라이브러리 — 의성어/의태어, 비유, 호흡 조절 패턴 DB

### Advanced Quality (ADVQ)

- [x] **ADVQ-01**: 다단계 퇴고 파이프라인 — 초고 → 톤 개선 → 문체 다듬기 → 최종 교정 (4단계)
- [x] **ADVQ-02**: 레퍼런스 스타일 학습 — 특정 작가/작품의 문체 패턴 분석 및 집필 시 적용
- [x] **ADVQ-03**: 감정 서브텍스트 엔진 — 대화 아래 숨겨진 감정 계층 자동 생성
- [x] **ADVQ-04**: 캐릭터 음성 차별화 — 등장인물마다 고유한 화법, 사고방식, 어휘 패턴

### Self-Improvement (SELF)

- [x] **SELF-01**: Exemplar 자동 축적 — 최고 점수 구절을 자동으로 스타일 라이브러리에 추가
- [x] **SELF-02**: 품질 트렌드 추적 — 챕터별 품질 변화를 추적하여 퇴행 감지

## v2 Requirements

### Optimization

- **OPT-01**: 병렬 장면 드래프팅 — 독립 장면들을 병렬로 집필하여 속도 향상
- **OPT-02**: 교차 챕터 음성 드리프트 감지 — 장편에서 캐릭터 음성 일관성 자동 검증

### Extended Features

- **EXT-01**: 다국어 지원 — 영문/일문 소설 집필
- **EXT-02**: 출판 포맷 변환 — ePub, PDF 내보내기
- **EXT-03**: 협업 모드 — 다수 사용자 동시 작업

## Out of Scope

| Feature | Reason |
|---------|--------|
| 비소설 콘텐츠 (시, 에세이) | 소설 집필에 집중 |
| 영문/다국어 (v1) | 한국어 특화 먼저 완성 |
| 출판 포맷 변환 | 원고 품질이 우선 |
| 실시간 협업 | 단일 사용자 워크플로우 |
| LLM 자체 파인튜닝 | 프롬프트 엔지니어링으로 해결 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| PIPE-01 | Phase 2 | Complete |
| PIPE-02 | Phase 2 | Complete |
| PIPE-03 | Phase 2 | Complete |
| PIPE-04 | Phase 2 | Complete |
| PIPE-05 | Phase 2 | Complete |
| PIPE-06 | Phase 2 | Complete |
| KORE-01 | Phase 3 | Complete |
| KORE-02 | Phase 3 | Complete |
| KORE-03 | Phase 3 | Complete |
| ADVQ-01 | Phase 4 | Complete |
| ADVQ-02 | Phase 4 | Complete |
| ADVQ-03 | Phase 4 | Complete |
| ADVQ-04 | Phase 4 | Complete |
| SELF-01 | Phase 5 | Complete |
| SELF-02 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-06 — all v1 requirements complete*
