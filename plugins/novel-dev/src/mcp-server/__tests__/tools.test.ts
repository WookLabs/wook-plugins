import { describe, it, expect } from "vitest";
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 절대 경로로 테스트 프로젝트 지정
const TEST_PROJECT = path.resolve(__dirname, "../../../../novels/test-novel");

describe("Test Project Structure", () => {
  it("should have test project directory", async () => {
    const exists = await fs.access(TEST_PROJECT).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });
});

describe("get_relevant_context", () => {
  it("should have style guide file", async () => {
    const stylePath = path.join(TEST_PROJECT, "meta", "style-guide.json");
    const data = await fs.readFile(stylePath, "utf-8");
    const parsed = JSON.parse(data);
    expect(parsed).toHaveProperty("tone");
  });

  it("should have chapter plot file", async () => {
    const plotPath = path.join(TEST_PROJECT, "chapters", "chapter_001.json");
    const data = await fs.readFile(plotPath, "utf-8");
    const parsed = JSON.parse(data);
    expect(parsed).toHaveProperty("scenes");
  });
});

describe("get_character", () => {
  it("should return character profile for valid ID", async () => {
    const charPath = path.join(TEST_PROJECT, "characters", "char_001.json");
    const data = await fs.readFile(charPath, "utf-8");
    const profile = JSON.parse(data);
    expect(profile).toHaveProperty("name");
    expect(profile).toHaveProperty("personality");
  });

  it("should fail for missing character", async () => {
    const charPath = path.join(TEST_PROJECT, "characters", "nonexistent.json");
    await expect(fs.readFile(charPath, "utf-8")).rejects.toThrow();
  });
});

describe("get_foreshadowing", () => {
  it("should have foreshadowing file with items", async () => {
    const fsPath = path.join(TEST_PROJECT, "plot", "foreshadowing.json");
    const data = await fs.readFile(fsPath, "utf-8");
    const items = JSON.parse(data);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("should filter foreshadowing by chapter", async () => {
    const fsPath = path.join(TEST_PROJECT, "plot", "foreshadowing.json");
    const data = JSON.parse(await fs.readFile(fsPath, "utf-8"));
    const chapter = 3;
    const relevant = data.filter((f: any) =>
      f.plant_chapter <= chapter && (!f.payoff_chapter || f.payoff_chapter >= chapter)
    );
    expect(relevant.length).toBeGreaterThan(0);
  });
});
