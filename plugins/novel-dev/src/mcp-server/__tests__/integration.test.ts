import { describe, it, expect } from "vitest";
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { loadContextWithBudget } from "../../context/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_PROJECT = path.resolve(__dirname, "../../../../novels/test-novel");

describe("Integration: loadContextWithBudget", () => {
  it("should load context for chapter 5 without duplicate foreshadowing", async () => {
    const result = await loadContextWithBudget(5, TEST_PROJECT, 60000);

    // 복선 아이템이 단일 (foreshadowing-relevant)인지 확인
    const foreshadowingItems = result.items.filter(i => i.type === 'foreshadowing');
    expect(foreshadowingItems.length).toBeLessThanOrEqual(1);

    // 복선이 있다면 ID 확인
    if (foreshadowingItems.length === 1) {
      expect(foreshadowingItems[0].id).toBe('foreshadowing-relevant');
    }

    // 필수 항목 존재 확인
    expect(result.items.some(i => i.type === 'style')).toBe(true);
    expect(result.items.some(i => i.type === 'plot')).toBe(true);
  });

  it("should return items for valid project even with high chapter number", async () => {
    // 999번 챕터는 없지만, style guide는 항상 로드됨
    const result = await loadContextWithBudget(999, TEST_PROJECT, 60000);
    expect(result.items.some(i => i.type === 'style')).toBe(true);
    expect(result.items.some(i => i.id === 'plot-999')).toBe(false);
  });
});

describe("Integration: Test Data Prerequisites", () => {
  it("should have world.json or locations.json for get_world test", async () => {
    const worldPath = path.join(TEST_PROJECT, "world", "world.json");
    const locPath = path.join(TEST_PROJECT, "world", "locations.json");

    const worldExists = await fs.access(worldPath).then(() => true).catch(() => false);
    const locExists = await fs.access(locPath).then(() => true).catch(() => false);

    expect(worldExists || locExists).toBe(true);
  });

  it("should have timeline.json after Task 2.0 completion", async () => {
    const timelinePath = path.join(TEST_PROJECT, "plot", "timeline.json");
    const exists = await fs.access(timelinePath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("should have character with searchable name", async () => {
    const charPath = path.join(TEST_PROJECT, "characters", "char_001.json");
    const content = await fs.readFile(charPath, "utf-8");
    expect(content.toLowerCase()).toContain("민수");
  });
});

describe("Integration: File Structure Validation", () => {
  it("should have valid foreshadowing.json structure", async () => {
    const fsPath = path.join(TEST_PROJECT, "plot", "foreshadowing.json");
    const content = await fs.readFile(fsPath, "utf-8");
    const data = JSON.parse(content);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("plant_chapter");
  });

  it("should have valid style-guide.json", async () => {
    const stylePath = path.join(TEST_PROJECT, "meta", "style-guide.json");
    const content = await fs.readFile(stylePath, "utf-8");
    const data = JSON.parse(content);
    expect(data).toHaveProperty("tone");
  });
});
