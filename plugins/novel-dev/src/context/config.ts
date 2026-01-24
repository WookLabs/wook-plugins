/**
 * Context Loader Configuration
 *
 * Defines project path structure for flexible deployment.
 */

export interface ProjectPaths {
  chapters: string;
  summaries: string;
  characters: string;
  meta: string;
  plots: string;
  world: string;
  foreshadowing: string;
}

export const DEFAULT_PATHS: ProjectPaths = {
  chapters: 'chapters',
  summaries: 'context/summaries',
  characters: 'characters',
  meta: 'meta',
  plots: 'chapters',
  world: 'world',
  foreshadowing: 'plot',
};
