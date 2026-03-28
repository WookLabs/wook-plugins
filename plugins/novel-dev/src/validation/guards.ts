import { z } from 'zod';

// Minimal Guard Schemas (required fields only — passthrough preserves the rest)

export const CharacterGuard = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
});

export const ChapterPlotGuard = z.object({
  chapter_number: z.number(),
  scenes: z.array(z.object({ scene_number: z.number() })),
});

export const ForeshadowingGuard = z.object({
  items: z.array(z.object({ id: z.string() })),
});

export const StructureGuard = z.object({
  acts: z.array(z.object({ act_number: z.number() })),
});

export const ManifestGuard = z.object({
  total_chapters: z.number(),
});

export const TrendDataGuard = z.object({
  chapters: z.array(z.unknown()),
});

export const StyleLibraryGuard = z.object({
  exemplars: z.array(z.unknown()),
});

/**
 * Safe JSON parse with Zod validation.
 * Returns validated data on success, null on failure.
 * Strips fields not in schema.
 */
export function safeParse<T>(
  content: string,
  schema: z.ZodType<T>,
  context: string
): T | null {
  try {
    const raw = JSON.parse(content);
    const result = schema.safeParse(raw);
    if (!result.success) {
      console.error(`[validation] ${context}:`, result.error.message);
      return null;
    }
    return result.data;
  } catch (err) {
    console.error(`[validation] ${context}:`, `JSON parse failed — ${err}`);
    return null;
  }
}

/**
 * Safe JSON parse that validates minimum required fields
 * but preserves ALL additional fields (passthrough mode).
 */
export function safeParsePassthrough<T extends z.ZodRawShape>(
  content: string,
  schema: z.ZodObject<T>,
  context: string
): z.infer<z.ZodObject<T>> & Record<string, unknown> | null {
  try {
    const raw = JSON.parse(content);
    const result = schema.passthrough().safeParse(raw);
    if (!result.success) {
      console.error(`[validation] ${context}:`, result.error.message);
      return null;
    }
    return result.data as z.infer<z.ZodObject<T>> & Record<string, unknown>;
  } catch (err) {
    console.error(`[validation] ${context}:`, `JSON parse failed — ${err}`);
    return null;
  }
}
