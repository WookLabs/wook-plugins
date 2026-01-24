import * as fs from 'fs/promises';
import * as path from 'path';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 기존 context 로직 재사용 (Option C: import as library)
import { loadContextWithBudget } from "../context/index.js";
import { logToolCall, logError } from "./logger.js";

// =============================================================================
// Security & Utility Helpers
// =============================================================================

/**
 * Path Traversal 방지: 결과 경로가 base 경로 내에 있는지 확인
 */
function safePath(basePath: string, ...segments: string[]): string {
  // 먼저 각 세그먼트에서 .. 이 있는지 확인
  for (const seg of segments) {
    if (seg.includes('..') || seg.includes('\0')) {
      throw new Error(`Path traversal detected: ${segments.join('/')}`);
    }
  }
  const resolved = path.resolve(basePath, ...segments);
  const resolvedBase = path.resolve(basePath);
  // 경로 정규화 후 비교 (OS 독립적)
  const normalizedResolved = path.normalize(resolved);
  const normalizedBase = path.normalize(resolvedBase);
  if (!normalizedResolved.startsWith(normalizedBase + path.sep) && normalizedResolved !== normalizedBase) {
    throw new Error(`Path traversal detected: ${segments.join('/')}`);
  }
  return resolved;
}

/**
 * ID 검증: 파일명에 사용 가능한 안전한 ID인지 확인
 */
function validateId(id: string, fieldName: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error(`${fieldName} is required`);
  }
  // 경로 구분자나 상위 디렉토리 참조 금지
  if (id.includes('/') || id.includes('\\') || id.includes('..') || id.includes('\0')) {
    throw new Error(`Invalid ${fieldName}: contains forbidden characters`);
  }
  // 너무 긴 ID 방지
  if (id.length > 100) {
    throw new Error(`${fieldName} too long (max 100 chars)`);
  }
}

/**
 * Error를 안전하게 변환
 */
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}

/**
 * JSON을 안전하게 파싱하고 배열인지 확인
 */
function parseJsonArray(content: string, context: string): unknown[] {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error(`${context}: expected array, got ${typeof data}`);
  }
  return data;
}

const server = new McpServer({
  name: "novel-context",
  version: "1.0.0",
});

// Tool 1: get_relevant_context
server.registerTool(
  "get_relevant_context",
  {
    description: "현재 챕터에 필요한 모든 관련 컨텍스트를 우선순위 기반으로 반환",
    inputSchema: {
      chapter: z.number().int().positive().describe("챕터 번호"),
      max_tokens: z.number().int().positive().default(60000).describe("최대 토큰 수"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ chapter, max_tokens, project_path }) => {
    const startTime = Date.now();
    const params = { chapter, max_tokens, project_path };
    try {
      const context = await loadContextWithBudget(chapter, project_path, max_tokens);
      logToolCall("get_relevant_context", params, startTime);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(context, null, 2),
        }],
      };
    } catch (error) {
      logError("get_relevant_context", toError(error));
      return {
        content: [{
          type: "text",
          text: `Error loading context: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

// Tool 2: get_character
server.registerTool(
  "get_character",
  {
    description: "특정 캐릭터의 상세 프로필 조회",
    inputSchema: {
      character_id: z.string().describe("캐릭터 ID"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ character_id, project_path }) => {
    const startTime = Date.now();
    const params = { character_id, project_path };
    try {
      // Security: ID 검증 및 경로 안전 확인
      validateId(character_id, "character_id");
      const filePath = safePath(project_path, "characters", `${character_id}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      logToolCall("get_character", params, startTime);
      return { content: [{ type: "text", text: data }] };
    } catch (error) {
      logError("get_character", toError(error));
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { content: [{ type: "text", text: `Character error: ${msg}` }] };
    }
  }
);

// Tool 3: get_foreshadowing
server.registerTool(
  "get_foreshadowing",
  {
    description: "현재 챕터와 관련된 복선 목록 조회",
    inputSchema: {
      chapter: z.number().int().positive().describe("챕터 번호"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ chapter, project_path }) => {
    const startTime = Date.now();
    const params = { chapter, project_path };
    try {
      const filePath = safePath(project_path, "plot", "foreshadowing.json");
      const rawData = await fs.readFile(filePath, "utf-8");
      const data = parseJsonArray(rawData, "foreshadowing.json");
      const relevant = data.filter((f: unknown) => {
        const item = f as { plant_chapter?: number; payoff_chapter?: number };
        return (item.plant_chapter ?? 0) <= chapter &&
               (!item.payoff_chapter || item.payoff_chapter >= chapter);
      });
      logToolCall("get_foreshadowing", params, startTime);
      return { content: [{ type: "text", text: JSON.stringify(relevant, null, 2) }] };
    } catch (error) {
      logError("get_foreshadowing", toError(error));
      return { content: [{ type: "text", text: "[]" }] };
    }
  }
);

// Tool 4: get_world
server.registerTool(
  "get_world",
  {
    description: "세계관 설정 및 장소 정보 통합 조회",
    inputSchema: {
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ project_path }) => {
    const startTime = Date.now();
    const params = { project_path };
    try {
      const worldPath = safePath(project_path, "world", "world.json");
      const locationsPath = safePath(project_path, "world", "locations.json");

      let world = {};
      let locations: unknown[] = [];

      try {
        world = JSON.parse(await fs.readFile(worldPath, "utf-8"));
      } catch { /* world.json 없음 - 무시 */ }

      try {
        locations = JSON.parse(await fs.readFile(locationsPath, "utf-8"));
      } catch { /* locations.json 없음 - 무시 */ }

      logToolCall("get_world", params, startTime);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ world, locations }, null, 2),
        }],
      };
    } catch (error) {
      logError("get_world", toError(error));
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown'}` }],
      };
    }
  }
);

// Tool 5: get_chapter_summary
server.registerTool(
  "get_chapter_summary",
  {
    description: "특정 챕터의 요약 조회",
    inputSchema: {
      chapter: z.number().int().positive().describe("챕터 번호"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ chapter, project_path }) => {
    const startTime = Date.now();
    const params = { chapter, project_path };
    try {
      // 챕터 번호 범위 제한 (1-9999)
      if (chapter > 9999) {
        throw new Error("Chapter number too large (max 9999)");
      }
      const summaryPath = safePath(
        project_path,
        "context",
        "summaries",
        `chapter_${String(chapter).padStart(3, '0')}_summary.md`
      );
      const data = await fs.readFile(summaryPath, "utf-8");
      logToolCall("get_chapter_summary", params, startTime);
      return { content: [{ type: "text", text: data }] };
    } catch (error) {
      logError("get_chapter_summary", toError(error));
      return { content: [{ type: "text", text: `Summary not found for chapter ${chapter}` }] };
    }
  }
);

// Tool 6: get_plot_structure
server.registerTool(
  "get_plot_structure",
  {
    description: "전체 플롯 구조 (막 구성, 메인 아크) 조회",
    inputSchema: {
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ project_path }) => {
    const startTime = Date.now();
    const params = { project_path };
    try {
      const structurePath = safePath(project_path, "plot", "structure.json");
      const mainArcPath = safePath(project_path, "plot", "main-arc.json");

      let structure = {};
      let mainArc = {};

      try {
        structure = JSON.parse(await fs.readFile(structurePath, "utf-8"));
      } catch { /* structure.json 없음 */ }

      try {
        mainArc = JSON.parse(await fs.readFile(mainArcPath, "utf-8"));
      } catch { /* main-arc.json 없음 */ }

      logToolCall("get_plot_structure", params, startTime);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ structure, mainArc }, null, 2),
        }],
      };
    } catch (error) {
      logError("get_plot_structure", toError(error));
      return {
        content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown'}` }],
      };
    }
  }
);

// Tool 7: search_context
server.registerTool(
  "search_context",
  {
    description: "키워드로 컨텍스트 파일 검색 (캐릭터, 세계관, 요약에서)",
    inputSchema: {
      keyword: z.string().min(1).describe("검색 키워드"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ keyword, project_path }) => {
    const startTime = Date.now();
    const params = { keyword, project_path };
    const results: Array<{ file: string; matches: string[] }> = [];
    const searchDirs = ["characters", "world", "context/summaries"];

    for (const dir of searchDirs) {
      try {
        const dirPath = safePath(project_path, dir);
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          // 파일명에 경로 구분자 포함 방지
          if (file.includes('/') || file.includes('\\') || file.includes('..')) {
            continue;
          }
          const filePath = safePath(dirPath, file);
          try {
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
              const content = await fs.readFile(filePath, "utf-8");
              if (content.toLowerCase().includes(keyword.toLowerCase())) {
                const lines = content.split('\n');
                const matchLines = lines
                  .filter(line => line.toLowerCase().includes(keyword.toLowerCase()))
                  .slice(0, 3);
                results.push({ file: `${dir}/${file}`, matches: matchLines });
              }
            }
          } catch { /* 파일 읽기 실패 - 무시 */ }
        }
      } catch { /* 디렉토리 없음 - 무시 */ }
    }

    logToolCall("search_context", params, startTime);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
);

// Tool 8: get_timeline
server.registerTool(
  "get_timeline",
  {
    description: "스토리 타임라인 및 이벤트 조회",
    inputSchema: {
      project_path: z.string().describe("소설 프로젝트 경로"),
      chapter: z.number().int().positive().optional().describe("특정 챕터만 필터링 (선택)"),
    },
  },
  async ({ project_path, chapter }) => {
    const startTime = Date.now();
    const params = { project_path, chapter };
    try {
      const timelinePath = safePath(project_path, "plot", "timeline.json");
      const rawData = await fs.readFile(timelinePath, "utf-8");
      const data = JSON.parse(rawData) as { timeline?: Array<{ events?: Array<{ chapter: number }> }> };

      if (chapter) {
        const timeline = Array.isArray(data.timeline) ? data.timeline : [];
        const filtered = {
          ...data,
          timeline: timeline.map((day) => ({
            ...day,
            events: Array.isArray(day.events) ? day.events.filter((e) => e.chapter === chapter) : [],
          })).filter((day) => day.events && day.events.length > 0),
        };
        logToolCall("get_timeline", params, startTime);
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      }

      logToolCall("get_timeline", params, startTime);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (error) {
      logError("get_timeline", toError(error));
      return { content: [{ type: "text", text: "Timeline not found" }] };
    }
  }
);

// Tool 9: get_characters_batch
server.registerTool(
  "get_characters_batch",
  {
    description: "여러 캐릭터 정보를 한 번에 조회합니다.",
    inputSchema: {
      character_ids: z.array(z.string()).describe("조회할 캐릭터 ID 목록 (예: ['char_001', 'char_002'])"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ character_ids, project_path }) => {
    const startTime = Date.now();
    const params = { character_ids, project_path };
    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    for (const charId of character_ids) {
      try {
        // Security: ID 검증 및 경로 안전 확인
        validateId(charId, "character_id");
        const filePath = safePath(project_path, "characters", `${charId}.json`);
        const data = await fs.readFile(filePath, "utf-8");
        results[charId] = JSON.parse(data);
      } catch (error) {
        const err = toError(error);
        errors[charId] = err.message.includes("ENOENT") ? "Character not found" : err.message;
      }
    }

    logToolCall("get_characters_batch", params, startTime);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          characters: results,
          errors,
          count: Object.keys(results).length
        }, null, 2),
      }],
    };
  }
);

// Tool 10: get_summaries_range
server.registerTool(
  "get_summaries_range",
  {
    description: "범위 내 회차 요약을 한 번에 조회합니다.",
    inputSchema: {
      start_chapter: z.number().int().positive().describe("시작 챕터 번호"),
      end_chapter: z.number().int().positive().describe("종료 챕터 번호"),
      project_path: z.string().describe("소설 프로젝트 경로"),
    },
  },
  async ({ start_chapter, end_chapter, project_path }) => {
    const startTime = Date.now();
    const params = { start_chapter, end_chapter, project_path };

    try {
      // 범위 검증
      if (start_chapter > end_chapter) {
        throw new Error("start_chapter must be <= end_chapter");
      }
      if (end_chapter > 9999) {
        throw new Error("Chapter number too large (max 9999)");
      }
      if (end_chapter - start_chapter > 100) {
        throw new Error("Range too large (max 100 chapters at once)");
      }

      const summaries: Record<number, string> = {};
      const errors: Record<number, string> = {};

      for (let chapter = start_chapter; chapter <= end_chapter; chapter++) {
        try {
          const summaryPath = safePath(
            project_path,
            "context",
            "summaries",
            `chapter_${String(chapter).padStart(3, '0')}_summary.md`
          );
          const data = await fs.readFile(summaryPath, "utf-8");
          summaries[chapter] = data;
        } catch (error) {
          const err = toError(error);
          errors[chapter] = err.message.includes("ENOENT") ? "Summary not found" : err.message;
        }
      }

      logToolCall("get_summaries_range", params, startTime);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            summaries,
            errors,
            count: Object.keys(summaries).length
          }, null, 2),
        }],
      };
    } catch (error) {
      logError("get_summaries_range", toError(error));
      return {
        content: [{
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }],
      };
    }
  }
);

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Novel Context MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
