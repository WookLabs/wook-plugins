---
name: quickstart
description: "5단계 퀵스타트 가이드 - 새로운 사용자를 위한 간편 워크플로우"
user-invocable: true
trigger_patterns:
  - "퀵스타트"
  - "빠른 시작"
  - "quickstart"
  - "처음 시작"
---

# Quickstart - 5단계 소설 완성 가이드

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다. 실행 가능한 TypeScript/JavaScript 코드가 아닙니다.

## 개요

novel-dev의 40개 이상의 기능을 5단계로 압축한 간편 워크플로우입니다.
처음 사용하는 분도 쉽게 소설을 완성할 수 있습니다.

## 5단계 워크플로우

사용자에게 다음 5단계를 안내합니다:

### Step 1: `/init` — 소설 기획
장르, 분량, 컨셉을 입력하면 프로젝트가 생성됩니다.

### Step 2: `/design` — 세계관·캐릭터·플롯 설계
Simple Mode에서는 다음 스킬을 자동 순차 실행합니다:
1. `/world` — 세계관 설계
2. `/character` — 캐릭터 설계
3. `/design-relationship` — 관계 설계
4. `/main-arc` — 메인 아크 설계
5. `/sub-arc` — 서브 아크 설계
6. `/foreshadow` — 복선 설계
7. `/hook` — 훅 설계

각 단계 완료 후 사용자에게 간단한 확인만 받고 다음으로 진행합니다.

### Step 3: `/plot` — 회차별 플롯 생성
전체 회차의 플롯 JSON을 자동 생성합니다.

### Step 4: `/write-all` — 자동 집필
Ralph Loop으로 전체 회차를 자동 집필합니다.
품질 게이트(70점)를 통과할 때까지 자동 재시도합니다.

### Step 5: `/revise` — 퇴고
완성된 원고를 다듬습니다.

## 실행 로직

퀵스타트가 호출되면:

1. 현재 프로젝트 상태를 확인합니다
2. 아직 프로젝트가 없으면 Step 1부터 안내합니다
3. 이미 진행 중이면 현재 위치를 감지하여 다음 단계를 안내합니다

상태 감지 로직:
- `meta/project.json` 없음 → Step 1 안내
- `meta/project.json` 있고 `world/` 비어있음 → Step 2 안내
- `world/`, `characters/` 있고 `plot/chapters/` 비어있음 → Step 3 안내
- `plot/chapters/` 있고 `chapters/` 텍스트 없음 → Step 4 안내
- `chapters/` 텍스트 있음 → Step 5 안내

## Mode 선호도 저장

퀵스타트를 처음 실행할 때, AskUserQuestion으로 모드를 선택합니다:

질문: "어떤 모드로 작업하시겠습니까?"
옵션:
- "Simple (5단계, 가이드)" — 처음 사용자에게 추천
- "Standard (17 커맨드, 전체 제어)" — 경험 있는 사용자
- "Expert (40+ 스킬, 최대 유연성)" — 파워 유저

선택 결과를 `.omc/state/novel-dev-prefs.json`에 저장:
```json
{
  "mode": "simple",
  "updatedAt": "ISO-timestamp"
}
```

언제든 `/help --mode=expert`로 모드 변경 가능합니다.
