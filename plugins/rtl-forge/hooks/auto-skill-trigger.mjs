#!/usr/bin/env node

/**
 * Auto Skill Trigger Hook
 *
 * 사용자 입력에서 키워드를 감지하여 관련 스킬을 자동 활성화합니다.
 * 주로 한글 키워드를 지원합니다.
 *
 * Hook Type: UserPromptSubmit
 */

// 스킬별 트리거 키워드 매핑
const SKILL_TRIGGERS = {
  'spec-driven-design': {
    keywords: [
      // 한글
      '설계하자', '스펙 작성', '아키텍처', '새 모듈', '인터페이스 정의',
      '모듈 설계', '새로운 모듈', '스펙 문서', '설계 시작',
      // 영어
      'design spec', 'new module', 'architecture', 'interface spec'
    ],
    description: '문서 기반 설계 워크플로우 (스펙 → 리뷰 → 승인 → RTL)',
    priority: 'high'
  },

  'rtl-change-protocol': {
    keywords: [
      // 한글
      'RTL 수정', 'RTL 변경', '코드 수정', '로직 변경', '모듈 수정',
      '신호 추가', '포트 추가', '레지스터 추가', 'FSM 수정',
      '파이프라인 추가', '클럭 변경',
      // 영어
      'modify RTL', 'change RTL', 'edit verilog', 'update module'
    ],
    description: 'RTL 변경 승인 프로토콜 (문서 기반)',
    priority: 'high'
  },

  'rtl-review': {
    keywords: [
      // 한글
      '리뷰해', '검토해', '분석해', '코드 리뷰', 'RTL 리뷰',
      '모듈 분석', '설계 검토', '품질 검사', '코드 검사',
      '스펙 대비', '문서 대비', '린트', '정적 분석',
      // LSP/린트 도구
      'verilator', 'slang', 'verible', 'svls', 'lint',
      // 영어
      'review', 'analyze', 'inspect', 'code review', 'static analysis'
    ],
    description: 'RTL 코드 종합 리뷰, LSP 정적 분석, 스펙 대비 검증',
    priority: 'medium'
  },

  'timing-diagram': {
    keywords: [
      // 한글
      '타이밍', '파형', '웨이브폼', '사이클', '클럭 다이어그램',
      '시퀀스 다이어그램', '타이밍 그려', '파형 그려',
      // 영어
      'timing diagram', 'waveform', 'timing chart', 'cycle diagram'
    ],
    description: 'ASCII 타이밍 다이어그램 생성',
    priority: 'medium'
  },

  'verification-sim': {
    keywords: [
      // 한글
      '시뮬레이션', '시뮬 돌려', '검증해', '테스트해',
      '커버리지', '시뮬 실행',
      // 시뮬레이터
      'questa', 'vsim', 'vcs', 'xcelium', 'xrun', 'verdi',
      // 영어
      'simulation', 'simulate', 'run sim', 'coverage'
    ],
    description: '시뮬레이션 기반 검증 (Questa/VCS/Xcelium)',
    priority: 'high'
  },

  'systematic-debugging': {
    keywords: [
      // 한글
      '디버그', '디버깅', '왜 안돼', '왜 안되', '에러 분석',
      '문제 해결', '원인 분석', '버그', '안 돌아가',
      'CDC 문제', '시뮬 에러', '메타스테빌리티',
      // 영어
      'debug', 'why not working', 'error analysis', 'root cause',
      'CDC issue', 'sim error'
    ],
    description: 'Questa 기반 체계적 디버깅 프로토콜',
    priority: 'high'
  },

  'notepad-wisdom': {
    keywords: [
      // 한글
      '기록해', '노트', '메모', '저장해', '기억해',
      '나중에 참고', '문서화', '결정 기록', '이슈 기록',
      '배운 것', '학습 기록',
      // 영어
      'note', 'remember', 'save', 'document', 'record'
    ],
    description: '설계 지식 캡처 시스템',
    priority: 'low'
  },

  'rtl-analyze': {
    keywords: [
      // 한글
      '신호 추적', '신호 찾아', '어디서 구동', '어디서 오는',
      '계층 분석', '구조 보여', '모듈 트리', '인스턴스 트리',
      '심볼 검색', '정의 찾아', '포트 목록', '포트 정보',
      '타입 확인', '비트폭', 'driver 찾아', 'load 찾아',
      // 도구
      'slang', 'ast 분석', 'ast-json',
      // 영어
      'trace signal', 'find driver', 'hierarchy', 'symbol search'
    ],
    description: 'Slang 기반 RTL 정밀 분석 (신호 추적, 계층 분석)',
    priority: 'high'
  },

  'rtl-init': {
    keywords: [
      // 한글
      '프로젝트 초기화', '프로젝트 설정', 'CLAUDE.md 만들어',
      'RTL 프로젝트 시작', '초기 설정', '프로젝트 세팅',
      // 영어
      'rtl init', 'project init', 'setup project', 'create CLAUDE.md'
    ],
    description: 'RTL 프로젝트 초기화 (CLAUDE.md 생성)',
    priority: 'medium'
  }
};

/**
 * 입력 텍스트에서 키워드 매칭
 */
function findMatchingSkills(userInput) {
  const input = userInput.toLowerCase();
  const matches = [];

  for (const [skillName, config] of Object.entries(SKILL_TRIGGERS)) {
    for (const keyword of config.keywords) {
      if (input.includes(keyword.toLowerCase())) {
        matches.push({
          skill: skillName,
          keyword: keyword,
          description: config.description,
          priority: config.priority
        });
        break; // 스킬당 하나의 매치만
      }
    }
  }

  // 우선순위 정렬: high > medium > low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  matches.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return matches;
}

/**
 * 스킬 활성화 메시지 생성
 */
function generateActivationMessage(matches) {
  if (matches.length === 0) {
    return null;
  }

  const primary = matches[0];
  let message = `
╔═══════════════════════════════════════════════════════════════╗
║              🎯 RTL-Forge 스킬 자동 감지                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  감지된 키워드: "${primary.keyword}"
║  활성화 스킬: ${primary.skill}
║  설명: ${primary.description}
║                                                               ║`;

  if (matches.length > 1) {
    message += `
║  ─────────────────────────────────────────────────────────────║
║  추가 관련 스킬:                                              ║`;
    for (let i = 1; i < Math.min(matches.length, 4); i++) {
      message += `
║    • ${matches[i].skill}: ${matches[i].description}`;
    }
    message += `
║                                                               ║`;
  }

  message += `
╚═══════════════════════════════════════════════════════════════╝
`;

  return message;
}

/**
 * 메인 훅 핸들러
 */
export default function autoSkillTrigger(hookContext) {
  const { prompt } = hookContext;

  if (!prompt || typeof prompt !== 'string') {
    return { continue: true };
  }

  const matches = findMatchingSkills(prompt);

  if (matches.length > 0) {
    const message = generateActivationMessage(matches);

    return {
      continue: true,
      message: message,
      metadata: {
        detected_skills: matches.map(m => m.skill),
        primary_skill: matches[0].skill,
        trigger_keyword: matches[0].keyword
      }
    };
  }

  return { continue: true };
}

// CLI 테스트용
if (process.argv[1] && process.argv[1].includes('auto-skill-trigger')) {
  console.log('RTL-Forge Auto Skill Trigger Hook');
  console.log('==================================\n');

  const testInputs = [
    'RTL 수정해줘',
    '이 모듈 리뷰해줘',
    '타이밍 다이어그램 그려줘',
    '합성 완료했어',
    '에러 계속 나는데 자동 수정해줘',
    '전체 검증 플로우 실행해',
    '어서션 추가해줘',
    '왜 안돼? 디버깅 해줘',
    '이거 기록해줘',
    '일반적인 질문'
  ];

  console.log('테스트 결과:\n');
  for (const input of testInputs) {
    const result = autoSkillTrigger({ prompt: input });
    console.log(`입력: "${input}"`);
    if (result.metadata) {
      console.log(`  → 감지: ${result.metadata.primary_skill} (키워드: "${result.metadata.trigger_keyword}")`);
    } else {
      console.log(`  → 매칭 없음`);
    }
    console.log('');
  }
}
