#!/usr/bin/env node

/**
 * Note Command - Notepad Wisdom for RTL Forge
 *
 * RTL 설계 지식을 캡처하고 관리합니다.
 *
 * Usage:
 *   /note learning "내용"
 *   /note decision "내용"
 *   /note issue "내용"
 *   /note problem "내용"
 *   /note show [category]
 *   /note search "키워드"
 *   /note resolve-problem "문제 제목" --solution "해결책"
 *   /note --design <name> learning "내용"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OMC_DIR = '.omc/rtl-forge/notepads';

const CATEGORIES = {
  learning: 'learnings.md',
  decision: 'decisions.md',
  issue: 'issues.md',
  problem: 'problems.md'
};

const CATEGORY_LABELS = {
  learning: '기술적 발견',
  decision: '아키텍처 결정',
  issue: '알려진 이슈',
  problem: '현재 블로커'
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function inferDesignName() {
  // Try to infer design name from current directory
  const cwd = process.cwd();
  const basename = path.basename(cwd);

  // Check if we're in a typical RTL project structure
  if (fs.existsSync('rtl') || fs.existsSync('src') || fs.existsSync('design')) {
    return basename;
  }

  // Default design name
  return 'default';
}

function getDesignPath(designName) {
  return path.join(OMC_DIR, designName);
}

function getCategoryFile(designName, category) {
  const designPath = getDesignPath(designName);
  ensureDir(designPath);
  return path.join(designPath, CATEGORIES[category]);
}

function appendToFile(filePath, content) {
  const timestamp = getTimestamp();
  const entry = `\n## ${timestamp}\n\n${content}\n`;

  if (!fs.existsSync(filePath)) {
    const header = `# ${path.basename(filePath, '.md')}\n`;
    fs.writeFileSync(filePath, header + entry, 'utf-8');
  } else {
    fs.appendFileSync(filePath, entry, 'utf-8');
  }
}

function addNote(category, content, designName, options = {}) {
  const filePath = getCategoryFile(designName, category);

  let fullContent = content;

  // Add status tag for problems
  if (category === 'problem' && !options.status) {
    fullContent = `### [ACTIVE] ${content}`;
  }

  appendToFile(filePath, fullContent);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✅ NOTE ADDED                              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  카테고리: ${CATEGORY_LABELS[category].padEnd(48)}║
║  설계: ${designName.padEnd(52)}║
║  파일: ${path.relative('.', filePath).padEnd(52)}║
║                                                               ║
║  내용:                                                        ║
║  ${content.substring(0, 57).padEnd(57)}║
${content.length > 57 ? `║  ${content.substring(57, 114).padEnd(57)}║` : ''}
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    filePath,
    category,
    designName
  };
}

function showNotes(designName, category = null) {
  const designPath = getDesignPath(designName);

  if (!fs.existsSync(designPath)) {
    return {
      success: false,
      message: `
╔═══════════════════════════════════════════════════════════════╗
║                    📋 NO NOTES FOUND                          ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  설계 "${designName}"에 대한 노트가 없습니다.                    ║
║                                                               ║
║  노트를 추가하려면:                                            ║
║    /note learning "내용"                                      ║
║    /note decision "내용"                                      ║
║    /note issue "내용"                                         ║
║    /note problem "내용"                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`
    };
  }

  const categories = category ? [category] : Object.keys(CATEGORIES);
  let output = `
╔═══════════════════════════════════════════════════════════════╗
║                    📋 DESIGN NOTES                            ║
║                    ${designName.padEnd(43)}║
╠═══════════════════════════════════════════════════════════════╣
`;

  for (const cat of categories) {
    const filePath = getCategoryFile(designName, cat);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').length - 1;
        const size = (fs.statSync(filePath).size / 1024).toFixed(1);

        output += `║                                                               ║
║  📄 ${CATEGORY_LABELS[cat].padEnd(52)}║
║     파일: ${path.relative('.', filePath).padEnd(48)}║
║     크기: ${size} KB, ${lines} lines${' '.repeat(Math.max(0, 36 - String(size).length - String(lines).length))}║
║                                                               ║
`;
      } catch (e) {
        output += `║  📄 ${CATEGORY_LABELS[cat].padEnd(52)}║
║     [읽기 오류: ${e.message.substring(0, 40).padEnd(40)}]║
`;
      }
    }
  }

  output += `║───────────────────────────────────────────────────────────────║
║                                                               ║
║  명령어:                                                      ║
║    /note learning "..."   - 기술적 발견 기록                  ║
║    /note decision "..."   - 아키텍처 결정 기록                ║
║    /note issue "..."      - 알려진 이슈 기록                  ║
║    /note problem "..."    - 블로커 문제 기록                  ║
║    /note search "키워드"  - 노트 검색                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

  return {
    success: true,
    message: output,
    designName,
    categories
  };
}

function searchNotes(designName, keyword) {
  const designPath = getDesignPath(designName);

  if (!fs.existsSync(designPath)) {
    return {
      success: false,
      message: `설계 "${designName}"에 대한 노트가 없습니다.`
    };
  }

  const results = [];

  for (const [cat, filename] of Object.entries(CATEGORIES)) {
    const filePath = path.join(designPath, filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
          // Find the section header (## timestamp)
          let sectionStart = i;
          while (sectionStart > 0 && !lines[sectionStart].startsWith('## ')) {
            sectionStart--;
          }

          results.push({
            category: cat,
            file: filename,
            line: i + 1,
            timestamp: lines[sectionStart].replace('## ', ''),
            match: lines[i].trim()
          });
        }
      }
    }
  }

  if (results.length === 0) {
    return {
      success: false,
      message: `
╔═══════════════════════════════════════════════════════════════╗
║                    🔍 NO RESULTS                              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  키워드 "${keyword}"를 찾을 수 없습니다.                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`
    };
  }

  let output = `
╔═══════════════════════════════════════════════════════════════╗
║                    🔍 SEARCH RESULTS                          ║
║                    ${results.length} match(es) for "${keyword}"${' '.repeat(Math.max(0, 31 - keyword.length - String(results.length).length))}║
╠═══════════════════════════════════════════════════════════════╣
`;

  for (const result of results) {
    output += `║                                                               ║
║  📄 ${CATEGORY_LABELS[result.category].padEnd(52)}║
║     ${result.timestamp.padEnd(57)}║
║     ${result.match.substring(0, 57).padEnd(57)}║
║                                                               ║
`;
  }

  output += `╚═══════════════════════════════════════════════════════════════╝
`;

  return {
    success: true,
    message: output,
    results
  };
}

function resolveProblem(designName, problemTitle, solution) {
  const filePath = getCategoryFile(designName, 'problem');

  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      message: '문제 파일이 존재하지 않습니다.'
    };
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const timestamp = getTimestamp();

  // Find the problem and mark as RESOLVED
  const lines = content.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(problemTitle) && lines[i].includes('[ACTIVE]')) {
      lines[i] = lines[i].replace('[ACTIVE]', `[RESOLVED ${timestamp}]`);
      modified = true;
      break;
    }
  }

  if (!modified) {
    return {
      success: false,
      message: `문제 "${problemTitle}"를 찾을 수 없습니다.`
    };
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

  // Add solution to learnings
  const learningPath = getCategoryFile(designName, 'learning');
  const learningContent = `### ${problemTitle} 해결\n\n**문제**: ${problemTitle}\n**해결책**: ${solution}`;
  appendToFile(learningPath, learningContent);

  return {
    success: true,
    message: `
╔═══════════════════════════════════════════════════════════════╗
║                    ✅ PROBLEM RESOLVED                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  문제: ${problemTitle.substring(0, 52).padEnd(52)}║
║  해결 시각: ${timestamp.padEnd(46)}║
║                                                               ║
║  ✓ problems.md에 [RESOLVED] 마크 추가                        ║
║  ✓ learnings.md에 해결책 기록                                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`,
    problemTitle,
    solution,
    timestamp
  };
}

function parseArgs(args) {
  const options = {
    action: null,
    content: null,
    design: null,
    category: null,
    keyword: null,
    problemTitle: null,
    solution: null,
    status: null
  };

  let i = 0;

  // First argument is the action
  if (i < args.length && !args[i].startsWith('--')) {
    options.action = args[i];
    i++;
  } else {
    options.action = 'show';
  }

  // Handle different action types
  if (options.action === 'show') {
    if (i < args.length && !args[i].startsWith('--')) {
      options.category = args[i];
      i++;
    }
  } else if (options.action === 'search') {
    if (i < args.length && !args[i].startsWith('--')) {
      options.keyword = args[i];
      i++;
    }
  } else if (options.action === 'resolve-problem') {
    if (i < args.length && !args[i].startsWith('--')) {
      options.problemTitle = args[i];
      i++;
    }
  } else {
    // For learning, decision, issue, problem - next arg is content
    if (i < args.length && !args[i].startsWith('--')) {
      options.content = args[i];
      i++;
    }
  }

  // Parse remaining options
  while (i < args.length) {
    if (args[i] === '--design' && i + 1 < args.length) {
      options.design = args[i + 1];
      i += 2;
    } else if (args[i] === '--solution' && i + 1 < args.length) {
      options.solution = args[i + 1];
      i += 2;
    } else if (args[i] === '--status' && i + 1 < args.length) {
      options.status = args[i + 1];
      i += 2;
    } else {
      i++;
    }
  }

  return options;
}

export default async function note(args) {
  const options = parseArgs(args);

  if (options.action === 'show') {
    const designName = options.design || inferDesignName();
    return showNotes(designName, options.category);
  }

  if (options.action === 'search') {
    if (!options.keyword) {
      return {
        success: false,
        message: '검색 키워드를 지정해주세요: /note search "키워드"'
      };
    }
    const designName = options.design || inferDesignName();
    return searchNotes(designName, options.keyword);
  }

  if (options.action === 'resolve-problem') {
    if (!options.problemTitle || !options.solution) {
      return {
        success: false,
        message: '문제 제목과 해결책을 지정해주세요: /note resolve-problem "제목" --solution "해결책"'
      };
    }
    const designName = options.design || inferDesignName();
    return resolveProblem(designName, options.problemTitle, options.solution);
  }

  // Add note
  const category = options.action;
  if (!CATEGORIES[category]) {
    return {
      success: false,
      message: `잘못된 카테고리: ${category}\n유효한 카테고리: learning, decision, issue, problem`
    };
  }

  if (!options.content) {
    return {
      success: false,
      message: `내용을 지정해주세요: /note ${category} "내용"`
    };
  }

  const designName = options.design || inferDesignName();
  return addNote(category, options.content, designName, options);
}

// CLI entry point
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  note(args)
    .then(result => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
