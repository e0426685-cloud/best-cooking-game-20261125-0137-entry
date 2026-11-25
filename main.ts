// Sizzle & Serve — hand-in program (Node 22, standard library only).
//
// The game lives in game/ beside this file as plain static files, and the
// maker's screenshots live in screenshots/. This program hands both in: it
// copies them into the output directory and writes dossier.json, the
// summary the judge reads, using the kit's vendored buildDossier library.
//
// The grader runs it twice in a fresh container with no network, a
// read-only copy of the repository and a writable /output, and both runs
// must write the same bytes — so this program only copies and summarises,
// never timestamps or randomises anything.
//
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Caps from the competition gate: at most 4 screenshots of 256 KiB, at most
// 993 files / 48 MiB under game/, paths under 1000 bytes, dossier text
// capped at 160 KiB. buildDossier enforces them; a breach refuses the entry
// here rather than silently handing in something the scorer would refuse.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
