<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-24 -->

# Tools

워크스페이스 관리 도구 모음

## Purpose

플러그인 개발을 지원하는 유틸리티 스킬과 스크립트

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ref-sync/` | 레퍼런스 레포 동기화 |
| `ref-compare/` | 레퍼런스 간 패턴 비교 |
| `ref-stats/` | 레퍼런스 통계 분석 |
| `plugin-scaffold/` | 새 플러그인 스캐폴딩 |

## Quick Usage

### ref-sync
```bash
node tools/ref-sync/sync.mjs
```
모든 `ref/` 레포를 git pull로 업데이트

### ref-compare (TODO)
레퍼런스 간 agent/skill/hook 패턴 비교

### ref-stats (TODO)
각 레퍼런스의 컴포넌트 수 및 특성 분석

### plugin-scaffold (TODO)
새 플러그인 디렉토리 구조 자동 생성

## For AI Agents

### Working In This Directory

- 도구 스크립트는 `node` 또는 `bash`로 실행
- 각 도구는 독립적으로 동작
- 결과는 `.workspace/` 에 캐시/로그

### Adding New Tools

1. 새 디렉토리 생성: `tools/[tool-name]/`
2. `SKILL.md` 작성 (frontmatter 포함)
3. 스크립트 구현 (`*.mjs` 또는 `*.sh`)
4. 이 파일에 문서 추가

<!-- MANUAL: -->
