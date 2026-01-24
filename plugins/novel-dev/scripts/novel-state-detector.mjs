#!/usr/bin/env node

/**
 * Novel-Sisyphus State Detector Hook
 * 사용자 입력에서 소설 관련 키워드 감지 및 컨텍스트 제공
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { findStateFile, readState } from './lib/state-utils.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function readJsonFile(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function extractPrompt(input) {
  try {
    const data = JSON.parse(input);
    if (data.prompt) return data.prompt;
    if (data.message?.content) return data.message.content;
    if (Array.isArray(data.parts)) {
      return data.parts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join(' ');
    }
    return '';
  } catch {
    const match = input.match(/"(?:prompt|content|text)"\s*:\s*"([^"]+)"/);
    return match ? match[1] : '';
  }
}

function removeCodeBlocks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '');
}

async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch {}
    const directory = data.directory || process.cwd();

    const prompt = extractPrompt(input);
    if (!prompt) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const cleanPrompt = removeCodeBlocks(prompt).toLowerCase();

    // Ralph Loop 활성 상태 확인 - novels/ 하위 프로젝트에서 찾기
    const novelsDir = join(directory, 'novels');
    let ralphState = null;
    if (existsSync(novelsDir)) {
      const { readdirSync } = await import('fs');
      const projects = readdirSync(novelsDir)
        .filter(f => existsSync(join(novelsDir, f, 'meta', 'project.json')));

      // 가장 최근 프로젝트에서 상태 찾기
      for (const proj of projects) {
        const projectPath = join(novelsDir, proj);
        const stateInfo = findStateFile(projectPath);
        if (stateInfo) {
          ralphState = readState(projectPath);
          break;
        }
      }
    }

    // Ralph Loop 활성 중이면 리마인더 제공
    if (ralphState?.ralph_active) {
      const currentAct = ralphState.current_act || 1;
      const currentChapter = ralphState.current_chapter || 1;

      // 취소 명령어 감지
      if (/cancel|중단|취소|stop/.test(cleanPrompt)) {
        console.log(JSON.stringify({ continue: true }));
        return;
      }

      console.log(JSON.stringify({
        continue: true,
        message: `<novel-ralph-reminder>

🔄 **Ralph Loop 진행 중** (막 ${currentAct}, 회차 ${currentChapter})

현재 작업을 계속 진행해주세요.
- 중단하려면: 사용자에게 확인 후 \`/cancel-ralph\` 사용
- 현재 상태: \`${ralphState.project_id}\`

</novel-ralph-reminder>

---
`
      }));
      return;
    }

    // === Magic Keywords 감지 (OMC 스타일) ===
    const magicKeywords = {
      // Autopilot 트리거
      autopilot: /autopilot|자동\s*집필|auto\s*write|풀\s*자동|완전\s*자동|자동으로\s*(?:써|작성|집필)/,
      // 병렬 집필 트리거
      parallel: /병렬|parallel|빠르게|빨리|울트라|ulw|동시에\s*(?:써|집필)/,
      // 분석/검토 트리거
      analyze: /분석|analyze|검토|review|체크|확인|일관성|consistency/,
      // 끝까지 (Ralph Loop) 트리거
      persist: /끝까지|멈추지\s*마|don't\s*stop|완료될\s*때까지|ralph/,
    };

    // Magic keyword 처리
    let detectedMode = null;
    let modeMessage = '';

    if (magicKeywords.autopilot.test(cleanPrompt)) {
      detectedMode = 'autopilot';
      modeMessage = `<novel-autopilot-hint>

🚀 **Novel Autopilot 모드 감지됨**

자동 집필 모드를 시작하려면 아이디어와 함께 명령해주세요:
\`/novel-sisyphus:autopilot {작품 아이디어}\`

예시:
\`\`\`
autopilot: 현대 판타지, 30화, 히든 아이돌이 주인공인 회귀물
\`\`\`

</novel-autopilot-hint>

---
`;
    } else if (magicKeywords.parallel.test(cleanPrompt)) {
      detectedMode = 'parallel';
      modeMessage = `<novel-parallel-hint>

⚡ **병렬 집필 모드 감지됨**

여러 회차를 동시에 집필하려면:
- 막 단위: \`/write_act {막번호}\`
- 전체: \`/write_all\` (Ralph Loop)

</novel-parallel-hint>

---
`;
    } else if (magicKeywords.analyze.test(cleanPrompt)) {
      detectedMode = 'analyze';
      modeMessage = `<novel-analyze-hint>

🔍 **분석 모드 감지됨**

사용 가능한 분석 명령어:
- \`/consistency_check\` - 전체 설정 일관성 검사
- \`/evaluate\` - 품질 평가
- \`/timeline\` - 시간 흐름 시각화

</novel-analyze-hint>

---
`;
    } else if (magicKeywords.persist.test(cleanPrompt)) {
      detectedMode = 'persist';
      modeMessage = `<novel-persist-hint>

🔄 **지속 모드 (Ralph Loop) 감지됨**

작업이 완료될 때까지 자동으로 계속하려면:
\`/write_all\` - 전체 자동 집필 (품질 게이트 포함)

중단 시: \`/cancel-ralph\` 또는 "중단"

</novel-persist-hint>

---
`;
    }

    // Magic keyword 감지 시 바로 응답
    if (detectedMode && modeMessage) {
      console.log(JSON.stringify({
        continue: true,
        message: modeMessage
      }));
      return;
    }

    // 소설 집필 관련 키워드 감지
    const novelKeywords = /소설|집필|원고|회차|캐릭터|세계관|플롯|복선|떡밥|퇴고/;
    const writeKeywords = /write|init|design|gen.?plot|revise|evaluate|export/;

    if (novelKeywords.test(cleanPrompt) || writeKeywords.test(cleanPrompt)) {
      // 현재 프로젝트 정보 로드
      const novelsDir = join(directory, 'novels');
      if (!existsSync(novelsDir)) {
        console.log(JSON.stringify({
          continue: true,
          message: `<novel-hint>

💡 **소설 프로젝트가 없습니다.**

새 프로젝트를 시작하려면: \`/init {작품 아이디어}\`

예시:
\`\`\`
/init 현대 로맨스, 계약 연애 트로프, 50화 분량의 달달한 러브 코미디
\`\`\`

</novel-hint>

---
`
        }));
        return;
      }
    }

    // 기본: 통과
    console.log(JSON.stringify({ continue: true }));
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
