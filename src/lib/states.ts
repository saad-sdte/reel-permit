import fs from "node:fs";
import path from "node:path";
import type { StateConfig } from "@/lib/state-config";

/**
 * Dynamic state discovery.
 *
 * State configs live at src/data/states/<slug>.ts and each must:
 *   export const config: StateConfig = { ... };   // named export
 *   export default config;                         // default export too
 *
 * Files whose names start with "_" (e.g. _example.ts.txt) are ignored, as are
 * non-.ts files. Because discovery is dynamic, state agents can add states in
 * parallel without ever touching shared code.
 *
 * NOTE: getStateSlugs() uses the filesystem and is intended for build-time
 * server components (home grid, /states, sitemap). getStateConfig() uses a
 * webpack context dynamic import and also works at runtime in the API route.
 */

const STATES_DIR = path.join(process.cwd(), "src", "data", "states");

/** Slugs of all state configs present at build time. */
export function getStateSlugs(): string[] {
  try {
    return fs
      .readdirSync(STATES_DIR)
      .filter((file) => file.endsWith(".ts") && !file.startsWith("_"))
      .map((file) => file.replace(/\.ts$/, ""))
      .sort();
  } catch {
    return [];
  }
}

const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Load one state config by slug. Returns null when the file does not exist yet. */
export async function getStateConfig(slug: string): Promise<StateConfig | null> {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    // NB: the ".ts" suffix narrows the webpack context to *\.ts files only,
    // so _example.ts.txt is never pulled into the bundle.
    const mod = await import(`@/data/states/${slug}.ts`);
    const config = (mod.config ?? mod.default ?? null) as StateConfig | null;
    if (!config || config.slug !== slug) return null;
    return config;
  } catch {
    return null;
  }
}

/** All available state configs, ordered by state name. */
export async function getAllStateConfigs(): Promise<StateConfig[]> {
  const slugs = getStateSlugs();
  const configs = await Promise.all(slugs.map((slug) => getStateConfig(slug)));
  return configs
    .filter((c): c is StateConfig => c !== null)
    .sort((a, b) => a.stateName.localeCompare(b.stateName));
}
