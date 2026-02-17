<!-- Generated: 2026-01-24 -->

# wook-plugins

WookLabs Claude Code 플러그인 개발 워크스페이스

## Purpose

플러그인 마켓플레이스 및 개발 환경. 8개의 레퍼런스 레포를 분석하여 최고의 패턴을 추출하고 자체 플러그인을 개발합니다.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `plugins/` | 개발된 플러그인 (마켓플레이스 배포용) |
| `ref/` | 레퍼런스 레포지토리 (읽기 전용, see `ref/AGENTS.md`) |
| `tools/` | 워크스페이스 도구 (see `tools/AGENTS.md`) |
| `templates/` | 추출된 템플릿 패턴 |
| `docs/` | 문서화 |
| `.workspace/` | 캐시 및 로그 |

## Key Files

| File | Description |
|------|-------------|
| `.claude-plugin/marketplace.json` | 마켓플레이스 정의 |
| `ref/_index.json` | 레퍼런스 메타데이터 캐시 |
| `README.md` | 마켓플레이스 사용 가이드 |

## For AI Agents

### Quick Actions

| Task | Action |
|------|--------|
| 레퍼런스 업데이트 | `node tools/ref-sync/sync.mjs` |
| 새 플러그인 생성 | `plugins/` 에 새 디렉토리 생성 |
| 패턴 비교 | `ref/AGENTS.md` 참조 |

### Working In This Directory

- **새 플러그인**: `plugins/[name]/` 구조로 생성
- **레퍼런스 확인**: `ref/` 에서 패턴 참조 (수정 금지)
- **도구 사용**: `tools/` 의 스킬 활용

### Plugin Development Workflow

1. `ref/` 에서 유사한 기능의 플러그인 분석
2. `templates/` 에서 적절한 템플릿 선택
3. `plugins/[name]/` 에 새 플러그인 생성
4. 개발 및 테스트
5. `.claude-plugin/marketplace.json` 에 등록

## Reference Summary

| Ref | Agents | Skills | Best For |
|-----|--------|--------|----------|
| superpowers | 1 | 14 | TDD, brainstorming |
| claude-plugins-official | - | - | Official patterns |
| oh-my-claude | 10 | 7 | Python hooks |
| oh-my-opencode | - | - | OpenCode patterns |
| rlm | - | - | Recursive context |

<!-- MANUAL: -->
