/**
 * Style Library Storage Module
 *
 * Provides CRUD operations for style exemplars with file-based persistence.
 * Exemplars are stored in project's meta/style-library.json.
 */

import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import type {
  StyleLibrary,
  StyleExemplar,
  StyleLibraryMetadata,
  NewExemplarInput,
} from './types.js';

// ============================================================================
// Constants
// ============================================================================

const STYLE_LIBRARY_PATH = 'meta/style-library.json';

/**
 * Creates an empty style library with default metadata
 */
function createEmptyLibrary(): StyleLibrary {
  return {
    exemplars: [],
    metadata: {
      version: '1.0.0',
      total_exemplars: 0,
      genres_covered: [],
      last_updated: new Date().toISOString(),
    },
  };
}

// ============================================================================
// Load and Save
// ============================================================================

/**
 * Loads the style library from the project directory.
 *
 * @param projectDir - The project root directory
 * @returns The loaded style library, or an empty library if not found
 *
 * @example
 * ```typescript
 * const library = await loadLibrary('/path/to/project');
 * console.log(library.metadata.total_exemplars);
 * ```
 */
export async function loadLibrary(projectDir: string): Promise<StyleLibrary> {
  const filePath = path.join(projectDir, STYLE_LIBRARY_PATH);

  if (!existsSync(filePath)) {
    return createEmptyLibrary();
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const library = JSON.parse(content) as StyleLibrary;

    // Ensure required fields exist for backward compatibility
    if (!library.metadata) {
      library.metadata = createEmptyLibrary().metadata;
    }

    return library;
  } catch (error) {
    console.error(`Error loading style library: ${error}`);
    return createEmptyLibrary();
  }
}

/**
 * Saves the style library to the project directory.
 *
 * Updates metadata.total_exemplars and metadata.last_updated automatically.
 *
 * @param projectDir - The project root directory
 * @param library - The style library to save
 *
 * @example
 * ```typescript
 * await saveLibrary('/path/to/project', updatedLibrary);
 * ```
 */
export async function saveLibrary(
  projectDir: string,
  library: StyleLibrary
): Promise<void> {
  const filePath = path.join(projectDir, STYLE_LIBRARY_PATH);
  const dirPath = path.dirname(filePath);

  // Ensure meta directory exists
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  // Update metadata
  const updatedMetadata: StyleLibraryMetadata = {
    ...library.metadata,
    total_exemplars: library.exemplars.length,
    genres_covered: extractGenres(library.exemplars),
    last_updated: new Date().toISOString(),
  };

  const updatedLibrary: StyleLibrary = {
    exemplars: library.exemplars,
    metadata: updatedMetadata,
  };

  await fs.writeFile(filePath, JSON.stringify(updatedLibrary, null, 2), 'utf-8');
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Adds a new exemplar to the library.
 *
 * Generates a unique ID and sets created_at automatically.
 *
 * @param library - The current library state
 * @param exemplar - The new exemplar data (without id and created_at)
 * @returns A new library state with the exemplar added
 *
 * @example
 * ```typescript
 * const newLibrary = addExemplar(library, {
 *   content: '그녀의 심장이 빠르게 뛰기 시작했다...',
 *   genre: ['romance'],
 *   scene_type: 'emotional-peak',
 *   is_anti_exemplar: false,
 *   source: 'curated'
 * });
 * ```
 */
export function addExemplar(
  library: StyleLibrary,
  exemplar: NewExemplarInput
): StyleLibrary {
  const id = generateExemplarId(exemplar.genre[0], library.exemplars);
  const created_at = new Date().toISOString();

  const newExemplar: StyleExemplar = {
    ...exemplar,
    id,
    created_at,
  };

  return {
    ...library,
    exemplars: [...library.exemplars, newExemplar],
  };
}

/**
 * Removes an exemplar from the library by ID.
 *
 * Also removes any anti_exemplar_pair references to the removed ID.
 *
 * @param library - The current library state
 * @param id - The ID of the exemplar to remove
 * @returns A new library state with the exemplar removed
 *
 * @example
 * ```typescript
 * const newLibrary = removeExemplar(library, 'exm_romance_001');
 * ```
 */
export function removeExemplar(library: StyleLibrary, id: string): StyleLibrary {
  // Remove the exemplar
  const filteredExemplars = library.exemplars.filter((e) => e.id !== id);

  // Clean up anti_exemplar_pair references
  const cleanedExemplars = filteredExemplars.map((e) => {
    if (e.anti_exemplar_pair === id) {
      const { anti_exemplar_pair, ...rest } = e;
      return rest as StyleExemplar;
    }
    return e;
  });

  return {
    ...library,
    exemplars: cleanedExemplars,
  };
}

/**
 * Updates an existing exemplar with partial data.
 *
 * @param library - The current library state
 * @param id - The ID of the exemplar to update
 * @param updates - Partial exemplar data to merge
 * @returns A new library state with the exemplar updated
 *
 * @example
 * ```typescript
 * const newLibrary = updateExemplar(library, 'exm_romance_001', {
 *   quality_notes: 'Updated note explaining the exemplar'
 * });
 * ```
 */
export function updateExemplar(
  library: StyleLibrary,
  id: string,
  updates: Partial<StyleExemplar>
): StyleLibrary {
  const updatedExemplars = library.exemplars.map((e) => {
    if (e.id === id) {
      return { ...e, ...updates, id }; // Preserve original ID
    }
    return e;
  });

  return {
    ...library,
    exemplars: updatedExemplars,
  };
}

/**
 * Finds an exemplar by ID
 *
 * @param library - The library to search
 * @param id - The ID to find
 * @returns The exemplar or undefined if not found
 */
export function findExemplarById(
  library: StyleLibrary,
  id: string
): StyleExemplar | undefined {
  return library.exemplars.find((e) => e.id === id);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique exemplar ID in format exm_{genre}_{NNN}
 */
function generateExemplarId(genre: string, existingExemplars: StyleExemplar[]): string {
  // Normalize genre to lowercase with underscores
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Count existing exemplars with this genre prefix
  const prefix = `exm_${normalizedGenre}_`;
  const existingIds = existingExemplars
    .filter((e) => e.id.startsWith(prefix))
    .map((e) => {
      const numPart = e.id.slice(prefix.length);
      return parseInt(numPart, 10);
    })
    .filter((n) => !isNaN(n));

  const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

/**
 * Extracts unique genres from exemplar list
 */
function extractGenres(exemplars: StyleExemplar[]): string[] {
  const genres = new Set<string>();
  for (const exemplar of exemplars) {
    for (const genre of exemplar.genre) {
      genres.add(genre);
    }
  }
  return Array.from(genres).sort();
}
