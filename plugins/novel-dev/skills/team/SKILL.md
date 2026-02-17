---
name: team
description: 에이전트 팀 관리 및 실행
user-invocable: true
---

# /team - 에이전트 팀 관리 및 실행

> **Note**: 이 문서의 코드 블록은 AI 오케스트레이터를 위한 실행 패턴 명세입니다.

에이전트를 역할 기반 팀으로 조직화하여 병렬/순차/파이프라인/협업 실행을 수행합니다.

## Quick Start

```bash
/team list                          # 사용 가능한 팀 목록
/team info verification-team        # 팀 구성 상세 정보
/team run verification-team 5       # 5화에 검증 팀 실행
/team run deep-review-team 3        # 3화에 심층 리뷰 팀 실행
/team run revision-team 7           # 7화에 퇴고 팀 실행
/team create my-custom-team         # 사용자 정의 팀 생성
/team status                        # 활성 팀 세션 상태
```

## Subcommands

### `/team list` — 팀 목록 조회

`teams/` 디렉토리에서 모든 `.team.json` 파일을 검색하여 표시합니다.

```spec
const teamFiles = Glob('teams/*.team.json');
const teams = teamFiles.map(f => {
  const def = Read(f);
  return { name: def.name, display_name: def.display_name, category: def.category, agents: def.agents.length };
});
```

**출력 형식:**

```
+==================================================+
|          AVAILABLE TEAMS                          |
+==================================================+
|                                                   |
|  Category: planning                               |
|  - planning-team (설계 팀) — 3 agents             |
|                                                   |
|  Category: writing                                |
|  - writing-team (집필 팀) — 3 agents              |
|  - writing-team-2pass (2-Pass 집필 팀) — 5 agents |
|                                                   |
|  Category: verification                           |
|  - verification-team (검증 팀) — 3 agents         |
|  - deep-review-team (심층 리뷰 팀) — 6 agents     |
|                                                   |
|  Category: revision                               |
|  - revision-team (퇴고 팀) — 4 agents             |
|                                                   |
|  Custom Teams:                                    |
|  (없음)                                           |
|                                                   |
+==================================================+
```

---

### `/team info <name>` — 팀 상세 정보

특정 팀의 구성, 워크플로우, 품질 게이트를 상세 표시합니다.

```spec
const def = Read(`teams/${name}.team.json`);
```

**출력 형식:**

```
+==================================================+
|          TEAM INFO: 검증 팀                        |
+==================================================+
|                                                   |
|  Name: verification-team                          |
|  Category: verification                           |
|  Workflow: parallel                               |
|                                                   |
|  Agents:                                          |
|  - critic (validator) — 문학 품질 평가             |
|  - beta-reader (validator) — 독자 경험 분석        |
|  - genre-validator (validator) — 장르 적합성 검증   |
|                                                   |
|  Workflow Steps:                                  |
|  1. validate — [critic, beta-reader,              |
|     genre-validator] (parallel)                   |
|                                                   |
|  Quality Gates: ENABLED                           |
|  - critic: >= 85                                  |
|  - beta-reader: >= 75                             |
|  - genre-validator: >= 90                         |
|  Consensus: all_pass                              |
|                                                   |
|  Cost Estimate: ~90K tokens                       |
|                                                   |
+==================================================+
```

---

### `/team run <name> [args]` — 팀 실행 (핵심)

팀 정의에 따라 에이전트 팀을 구성하고 실행합니다.

#### Phase 0: 비용 경고

```spec
const def = Read(`teams/${teamName}.team.json`);
const agentCount = def.agents.length;
const estimatedTokens = def.cost_estimate?.tokens_per_agent * agentCount;

// 비용 안내 표시
display(`
  팀 실행 비용 안내
  팀: ${def.display_name} (${def.name})
  에이전트 수: ${agentCount}개
  워크플로우: ${def.workflow.type}
  예상 토큰: ~${estimatedTokens / 1000}K
  ${def.cost_estimate?.warning_message || ''}
`);
```

AskUserQuestion으로 사용자 확인:
- "진행" — 팀 전체 실행
- "최소 실행" — 필수 에이전트만 (optional 에이전트 제외)
- "취소" — 실행 중단

#### Phase 1: 컨텍스트 로드

기존 Context Budget System 우선순위에 따라 컨텍스트를 로드합니다:

```spec
// 챕터 기반 태스크
const context = {
  chapterNum: args.chapter,
  chapterMd: Read(`chapters/chapter_${pad(args.chapter)}.md`),
  chapterJson: Read(`chapters/chapter_${pad(args.chapter)}.json`),
  styleGuide: Read('meta/style-guide.json'),
  characters: Glob('characters/*.json').map(Read),
  world: Read('world/world.json'),
  summaries: loadRecentSummaries(3)
};
```

#### Phase 2: 팀 생성 및 에이전트 스폰

workflow.type에 따라 실행 방식을 결정합니다:

**parallel / sequential / pipeline:**

```spec
// team-orchestrator 에이전트에 위임
Task({
  subagent_type: "novel-dev:team-orchestrator",
  model: "sonnet",
  prompt: `
    팀 실행: ${teamName}
    대상: Chapter ${chapterNum}
    팀 정의: teams/${teamName}.team.json

    워크플로우 타입: ${def.workflow.type}
    에이전트 목록: ${def.agents.map(a => a.agent).join(', ')}

    컨텍스트:
    ${JSON.stringify(context)}

    품질 게이트: ${JSON.stringify(def.quality_gates)}

    실행 후 종합 리포트를 생성하세요.
  `
});
```

**collaborative:**

```spec
// Claude Code TeamCreate 사용
const teamId = `${teamName}-ch${chapterNum}-${timestamp}`;
TeamCreate({ team_name: teamId });

// 각 팀원 에이전트 스폰
for (const member of def.agents) {
  Task({
    subagent_type: `novel-dev:${member.agent}`,
    team_name: teamId,
    name: member.agent,
    prompt: buildMemberPrompt(member, context)
  });
}
```

#### Phase 3: Task 분배

workflow.type에 따라 작업 생성:

```spec
// parallel: 모든 에이전트에 동시 태스크 생성
// sequential: 순차적으로 태스크 생성 (이전 결과를 다음 입력으로)
// pipeline: 단계별 순차, 단계 내 가능하면 병렬
// collaborative: lead가 자율 분배
```

#### Phase 4: 실행 모니터링

```spec
// 팀 상태 파일 업데이트
const stateFile = `.omc/state/team-${teamId}.json`;
// 각 에이전트 완료 시 상태 갱신
// workflow_progress 업데이트
```

#### Phase 5: 결과 수집 & 보고

```spec
// 모든 에이전트 결과 수집
const allResults = collectResults(members);

// 품질 게이트 적용 (해당 시)
if (def.quality_gates?.enabled) {
  const gateResult = applyQualityGates(allResults, def.quality_gates);
  // consensus 판정: all_pass / majority / weighted
}

// 종합 리포트 생성
generateTeamReport(def, allResults, gateResult);

// 팀 종료
if (workflow.type === 'collaborative') {
  // shutdown_request to all members
  TeamDelete();
}
```

**종합 리포트 출력:**

```
+==================================================+
|          TEAM RESULTS: {display_name}             |
+==================================================+
|                                                   |
|  팀: {display_name}                               |
|  대상: Chapter {N}                                |
|  워크플로우: {workflow.type}                       |
|  소요 시간: {duration}                            |
|                                                   |
|  Agent           | Score | Verdict   | Threshold  |
|  ----------------|-------|-----------|------------|
|  critic          |  87   | PASS      | >= 85      |
|  beta-reader     |  82   | PASS      | >= 75      |
|  genre-validator |  91   | PASS      | >= 90      |
|                                                   |
|  종합 판정: PASS                                   |
|  종합 점수: 86.4/100                               |
|                                                   |
|  주요 피드백:                                     |
|  1. [critic] 대화 자연스러움 개선 권장 (78%)       |
|  2. [beta-reader] 중반부 이탈 위험 (75%)          |
|                                                   |
|  권장 조치:                                       |
|  - /revise {N} --focus dialogue                   |
|  - /revise {N} --focus pacing                     |
|                                                   |
+==================================================+
```

---

### `/team create <name>` — 사용자 정의 팀 생성

대화형 위자드로 사용자 정의 팀을 생성합니다.

```spec
// 1. 템플릿 로드
const template = Read('templates/team.template.json');

// 2. AskUserQuestion으로 팀 구성 질문
//    - 팀 이름, 설명
//    - 에이전트 선택 (사용 가능한 14개 에이전트 목록 제시)
//    - 각 에이전트 역할 (lead/worker/support/validator)
//    - 워크플로우 유형 (sequential/parallel/pipeline/collaborative)
//    - 품질 게이트 활성화 여부 및 기준 점수

// 3. 팀 정의 파일 생성
Write(`teams/${name}.team.json`, teamDefinition);
```

---

### `/team status` — 활성 팀 세션 상태

현재 실행 중인 팀 세션 상태를 표시합니다.

```spec
const stateFiles = Glob('.omc/state/team-*.json');
const activeTeams = stateFiles
  .map(Read)
  .filter(s => s.status === 'running' || s.status === 'initializing');
```

**출력 형식:**

```
+==================================================+
|          ACTIVE TEAM SESSIONS                     |
+==================================================+
|                                                   |
|  team_verification-team_20260217_143000            |
|  Status: running                                  |
|  Progress: 2/3 agents completed                   |
|  Elapsed: 1m 30s                                  |
|                                                   |
|  (다른 활성 세션 없음)                              |
|                                                   |
+==================================================+
```

---

## 의존 에이전트

| Agent | 사용 팀 |
|-------|---------|
| team-orchestrator | 모든 팀 (오케스트레이션) |
| plot-architect | planning-team |
| lore-keeper | planning-team |
| style-curator | planning-team |
| novelist | writing-team |
| scene-drafter | writing-team-2pass |
| assembly-agent | writing-team-2pass |
| critic | verification-team, deep-review-team, writing-team-2pass, revision-team |
| prose-surgeon | writing-team-2pass |
| beta-reader | verification-team, deep-review-team |
| genre-validator | verification-team |
| editor | revision-team |
| consistency-verifier | deep-review-team, revision-team |
| engagement-optimizer | deep-review-team |
| character-voice-analyzer | deep-review-team |
| prose-quality-analyzer | deep-review-team |
| proofreader | writing-team, writing-team-2pass, revision-team |
| summarizer | writing-team |

## Documentation

**Workflow Patterns**: See `references/team-workflows.md`
**Usage Examples**: See `examples/example-usage.md`
