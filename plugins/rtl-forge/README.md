# RTL-Forge

> Verilog/SystemVerilog RTL Design & Verification Plugin with Document-Driven Workflow

## 핵심 철학

**Iron Law: RTL은 승인된 문서를 구현한다. 문서 없이 RTL 없다.**

- **문서 기반 설계**: 스펙 → 리뷰 → 승인 → RTL
- **무단 수정 차단**: 모든 RTL 변경은 사용자 승인 필수
- **타이밍 다이어그램 필수**: 사이클 단위 시각화 없이 변경 불가
- **명분 기반 변경**: 모든 로직에는 이유가 있다
- **Opus 전용**: RTL은 대충할 부분이 없음

## 설치

```bash
node tools/plugin-manager/manager.mjs install ./plugins/rtl-forge
node tools/plugin-manager/manager.mjs enable rtl-forge
```

## 에이전트

| Agent | Model | 권한 | 역할 |
|-------|-------|------|------|
| rtl-architect | Opus | READ-ONLY | 마이크로아키텍처 분석 |
| rtl-coder | Opus | PROPOSE-ONLY | RTL 코드 작성 제안 |
| verification-engineer | Opus | READ-ONLY | UVM 검증 환경 분석 |
| assertion-writer | Opus | READ-ONLY | SVA/PSL 어서션 분석 |
| lint-reviewer | Opus | READ-ONLY | Lint 및 코딩 스타일 검사 |
| cdc-analyst | Opus | READ-ONLY | CDC 분석 |
| synthesis-advisor | Opus | READ-ONLY | 합성 최적화 조언 |
| coverage-analyst | Opus | READ-ONLY | 커버리지 분석 |
| rtl-critic | Opus | READ-ONLY | 변경 제안 검토 |
| doc-writer | Opus | DOCS-ONLY | 문서화 |

## 사용법

### RTL 코드 수정 요청

```
"FIFO에 backpressure 처리를 추가해줘"
```

자동으로 rtl-change-protocol이 활성화되어:
1. 변경 이유 분석
2. BEFORE/AFTER 타이밍 다이어그램 생성
3. 영향 분석
4. 사용자 승인 요청

### RTL 코드 리뷰

```
"이 모듈 리뷰해줘"
```

자동으로 rtl-review 스킬이 활성화되어:
1. 아키텍처 분석
2. Lint 검사
3. CDC 분석
4. 합성 검토

### 스펙/변경 승인/거부

```bash
# 스펙 문서 승인/거부
/approve-spec                        # 스펙 문서 승인
/reject-spec --reason "인터페이스 재검토"  # 스펙 거부

# RTL 변경 승인/거부
/approve-change                      # 최근 변경 승인
/approve-change --comment "조건부 승인"  # 코멘트와 함께 승인
/reject-change --reason "타이밍 재검토"  # 거부

# 기타
/show-pending                        # 대기 중인 스펙/변경 확인
/note learning "CDC 동기화 패턴 학습"   # 노트패드에 기록
```

## 타이밍 다이어그램 예시

```
         cycle  1    2    3    4    5    6    7    8
                │    │    │    │    │    │    │    │
   clk      ────┴────┴────┴────┴────┴────┴────┴────┴────

   valid    ____/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\________________

   data     ====<D0  ><D1  ><D2  ><D3  ><D4  >=========

   ready    ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\____/‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
                             │
                        backpressure
```

## 보안

- `rtl-write-guard` 훅이 모든 RTL 파일 수정 시도를 차단
- 승인된 변경만 `.omc/rtl-forge/approved-changes.json`에 기록
- 모든 변경 이력은 `.omc/rtl-forge/change-history.json`에 보존

## 라이선스

MIT

## 저자

WookLabs
