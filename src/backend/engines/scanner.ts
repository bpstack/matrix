import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const TARGET_FILES = [
  'roadmap.md', 'plan.md', 'todo.md', 'guia.md', 'readme.md', 'changelog.md',
  'ROADMAP.md', 'PLAN.md', 'TODO.md', 'GUIA.md', 'README.md', 'CHANGELOG.md',
];

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'out',
  'coverage', '.cache', '.vite', '__pycache__', 'target', 'vendor',
  '.turbo', '.output',
]);

const LANG_MAP: Record<string, { name: string; color: string }> = {
  '.ts': { name: 'TypeScript', color: '#3178c6' },
  '.tsx': { name: 'TypeScript', color: '#3178c6' },
  '.js': { name: 'JavaScript', color: '#f1e05a' },
  '.jsx': { name: 'JavaScript', color: '#f1e05a' },
  '.py': { name: 'Python', color: '#3572a5' },
  '.rs': { name: 'Rust', color: '#dea584' },
  '.go': { name: 'Go', color: '#00add8' },
  '.java': { name: 'Java', color: '#b07219' },
  '.kt': { name: 'Kotlin', color: '#a97bff' },
  '.cs': { name: 'C#', color: '#178600' },
  '.cpp': { name: 'C++', color: '#f34b7d' },
  '.c': { name: 'C', color: '#555555' },
  '.rb': { name: 'Ruby', color: '#701516' },
  '.php': { name: 'PHP', color: '#4f5d95' },
  '.swift': { name: 'Swift', color: '#f05138' },
  '.vue': { name: 'Vue', color: '#41b883' },
  '.svelte': { name: 'Svelte', color: '#ff3e00' },
  '.html': { name: 'HTML', color: '#e34c26' },
  '.css': { name: 'CSS', color: '#563d7c' },
  '.scss': { name: 'SCSS', color: '#c6538c' },
  '.json': { name: 'JSON', color: '#292929' },
  '.yaml': { name: 'YAML', color: '#cb171e' },
  '.yml': { name: 'YAML', color: '#cb171e' },
  '.md': { name: 'Markdown', color: '#083fa1' },
  '.sql': { name: 'SQL', color: '#e38c00' },
  '.sh': { name: 'Shell', color: '#89e051' },
  '.dart': { name: 'Dart', color: '#00b4ab' },
  '.lua': { name: 'Lua', color: '#000080' },
  '.zig': { name: 'Zig', color: '#ec915c' },
};

export interface FileScanResult {
  file: string;
  totalTasks: number;
  completedTasks: number;
  blockers: string[];
  wipItems: string[];
  progressPercent: number;
}

export interface ScanResult {
  totalTasks: number;
  completedTasks: number;
  blockers: number;
  wipItems: number;
  progressPercent: number;
  rawData: FileScanResult[];
}

export interface TechStats {
  totalLines: number;
  languages: { name: string; color: string; lines: number; percent: number }[];
  hasTests: boolean;
  hasCiCd: boolean;
  dependencies: number;
  lastCommit: { message: string; date: string } | null;
  gitBranch: string | null;
  gitDirty: boolean;
}

/** Scan markdown files for checkbox progress */
export function scanProject(projectPath: string): ScanResult {
  if (!fs.existsSync(projectPath)) {
    return { totalTasks: 0, completedTasks: 0, blockers: 0, wipItems: 0, progressPercent: 0, rawData: [] };
  }

  const rawData: FileScanResult[] = [];

  for (const filename of TARGET_FILES) {
    const filePath = path.join(projectPath, filename);
    if (!fs.existsSync(filePath)) continue;

    // Avoid scanning the same file twice (case-insensitive duplicate)
    const lowerName = filename.toLowerCase();
    if (rawData.some(r => r.file.toLowerCase() === lowerName)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let total = 0;
    let completed = 0;
    const blockers: string[] = [];
    const wipItems: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Markdown checkboxes: - [x] (done) / - [ ] (pending)
      if (/^[-*] \[x\]/i.test(trimmed)) {
        total++;
        completed++;
      } else if (/^[-*] \[ \]/.test(trimmed)) {
        total++;
      }
      // Headers (## or ###) count as tasks — ✅ = done, no ✅ = pending
      else if (/^#{2,3} /.test(trimmed)) {
        total++;
        if (/✅/.test(trimmed)) completed++;
      }
      if (/BLOCKER:/i.test(trimmed)) {
        blockers.push(trimmed.replace(/.*BLOCKER:\s*/i, '').trim());
      }
      if (/WIP:/i.test(trimmed)) {
        wipItems.push(trimmed.replace(/.*WIP:\s*/i, '').trim());
      }
    }

    rawData.push({
      file: filename,
      totalTasks: total,
      completedTasks: completed,
      blockers,
      wipItems,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }

  const totalTasks = rawData.reduce((s, r) => s + r.totalTasks, 0);
  const completedTasks = rawData.reduce((s, r) => s + r.completedTasks, 0);
  const blockers = rawData.reduce((s, r) => s + r.blockers.length, 0);
  const wipItems = rawData.reduce((s, r) => s + r.wipItems.length, 0);

  return {
    totalTasks,
    completedTasks,
    blockers,
    wipItems,
    progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    rawData,
  };
}

/** Collect technical stats from filesystem */
export function collectTechStats(projectPath: string): TechStats {
  const lineCounts: Record<string, number> = {};
  let totalLines = 0;

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (LANG_MAP[ext]) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n').length;
            lineCounts[ext] = (lineCounts[ext] || 0) + lines;
            totalLines += lines;
          } catch {
            // skip unreadable files
          }
        }
      }
    }
  }

  walk(projectPath);

  const languages = Object.entries(lineCounts)
    .map(([ext, lines]) => ({
      name: LANG_MAP[ext].name,
      color: LANG_MAP[ext].color,
      lines,
      percent: totalLines > 0 ? Math.round((lines / totalLines) * 100) : 0,
    }))
    .sort((a, b) => b.lines - a.lines);

  // Merge duplicates (e.g. .ts and .tsx both = TypeScript)
  const merged: typeof languages = [];
  for (const lang of languages) {
    const existing = merged.find(l => l.name === lang.name);
    if (existing) {
      existing.lines += lang.lines;
      existing.percent = totalLines > 0 ? Math.round((existing.lines / totalLines) * 100) : 0;
    } else {
      merged.push({ ...lang });
    }
  }
  merged.sort((a, b) => b.lines - a.lines);

  // Detect tests
  const hasTests = checkExists(projectPath, [
    'test', 'tests', '__tests__', 'spec', 'specs',
  ]) || hasFilePattern(projectPath, /\.(test|spec)\./);

  // Detect CI/CD
  const hasCiCd = checkExists(projectPath, [
    '.github/workflows', '.gitlab-ci.yml', '.circleci', 'Jenkinsfile',
    '.travis.yml', 'azure-pipelines.yml',
  ]);

  // Count dependencies
  const dependencies = countDependencies(projectPath);

  // Git info
  const lastCommit = getLastCommit(projectPath);
  const gitBranch = getGitBranch(projectPath);
  const gitDirty = isGitDirty(projectPath);

  return {
    totalLines,
    languages: merged,
    hasTests,
    hasCiCd,
    dependencies,
    lastCommit,
    gitBranch,
    gitDirty,
  };
}

function checkExists(base: string, paths: string[]): boolean {
  return paths.some(p => fs.existsSync(path.join(base, p)));
}

function hasFilePattern(dir: string, pattern: RegExp, depth = 2): boolean {
  if (depth <= 0) return false;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.isFile() && pattern.test(entry.name)) return true;
      if (entry.isDirectory() && hasFilePattern(path.join(dir, entry.name), pattern, depth - 1)) return true;
    }
  } catch {
    // skip
  }
  return false;
}

function countDependencies(projectPath: string): number {
  let count = 0;
  // package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      count += Object.keys(pkg.dependencies || {}).length;
      count += Object.keys(pkg.devDependencies || {}).length;
    } catch { /* skip */ }
  }
  // requirements.txt
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (fs.existsSync(reqPath)) {
    try {
      const lines = fs.readFileSync(reqPath, 'utf-8').split('\n').filter(l => l.trim() && !l.startsWith('#'));
      count += lines.length;
    } catch { /* skip */ }
  }
  // Cargo.toml
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  if (fs.existsSync(cargoPath)) {
    try {
      const content = fs.readFileSync(cargoPath, 'utf-8');
      const depSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
      if (depSection) {
        count += depSection[1].split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
      }
    } catch { /* skip */ }
  }
  return count;
}

function getLastCommit(projectPath: string): { message: string; date: string } | null {
  try {
    const result = execSync('git log -1 --format="%s|||%ai"', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 });
    const [message, date] = result.trim().split('|||');
    return { message, date };
  } catch {
    return null;
  }
}

function getGitBranch(projectPath: string): string | null {
  try {
    return execSync('git branch --show-current', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function isGitDirty(projectPath: string): boolean {
  try {
    const result = execSync('git status --porcelain', { cwd: projectPath, encoding: 'utf-8', timeout: 5000 });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}
