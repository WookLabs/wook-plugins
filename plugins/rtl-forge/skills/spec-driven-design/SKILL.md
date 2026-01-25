---
name: spec-driven-design
description: 문서 기반 설계 워크플로우. 스펙 문서 작성 → 사용자 리뷰 → 합의 → RTL 작성.
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# Spec-Driven Design (문서 기반 설계)

## 핵심 철학

**Iron Law: RTL은 승인된 문서를 구현한다. 문서 없이 RTL 없다.**

## 워크플로우

### Phase 1: 스펙 초안 작성
- AI가 요구사항 기반 초안 작성
- 문서 위치: `docs/{module}-arch.md`, `docs/{module}-interface.md`, `docs/{module}-uarch.md`

### Phase 2: 리뷰 루프
- 사용자: "이 부분은 이렇게"
- AI: 문서 수정
- 반복

### Phase 3: 승인
- 사용자: `/approve-spec`
- 문서 상태 → APPROVED

### Phase 4: RTL 작성
- 승인된 문서 기반으로만 코드 작성

## 문서 템플릿

### 아키텍처 스펙 (docs/{module}-arch.md)
```markdown
# {MODULE} 아키텍처 스펙

## 상태: DRAFT | IN_REVIEW | APPROVED

## 개요
- 목적
- 주요 기능

## 블록 다이어그램
(ASCII 또는 텍스트 설명)

## 서브모듈
| 모듈명 | 역할 |
|--------|------|

## 클럭 도메인
- ...

## 리셋 전략
- ...
```

### 인터페이스 스펙 (docs/{module}-interface.md)
```markdown
# {MODULE} 인터페이스 스펙

## 상태: DRAFT | IN_REVIEW | APPROVED

## 포트 목록
| 이름 | 방향 | 폭 | 설명 |
|------|------|-----|------|

## 타이밍 다이어그램
(ASCII 타이밍 다이어그램)

## 프로토콜
- 핸드셰이크 규칙
- 에러 처리
```

### 마이크로아키텍처 스펙 (docs/{module}-uarch.md)
```markdown
# {MODULE} 마이크로아키텍처 스펙

## 상태: DRAFT | IN_REVIEW | APPROVED

## FSM
- 상태 목록
- 상태 전이

## 데이터패스
- 파이프라인 단계
- 레지스터 설명

## 타이밍 요구사항
- 목표 주파수
- 크리티컬 패스
```

## 트리거 키워드
- "설계하자"
- "스펙 작성"
- "아키텍처"
- "새 모듈"
- "인터페이스 정의"

## 금지 사항
- 문서 승인 없이 RTL 코드 작성
- 스펙 문서 없이 모듈 구현
- 사용자 리뷰 건너뛰기

## 관련 커맨드
- `/approve-spec`: 스펙 문서 승인
- `/approve-change`: RTL 변경 승인

## 관련 스킬
- rtl-change-protocol: 기존 RTL 변경 시 사용
- timing-diagram: 타이밍 시각화
