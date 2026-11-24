#!/usr/bin/env node
/**
 * Tailwind CSS v4 synchronization, verification, and upgrade script.
 *
 * Commands:
 *   node scripts/tailwind-sync.mjs build
 *   node scripts/tailwind-sync.mjs check
 *   node scripts/tailwind-sync.mjs upgrade [--patch | --major | --to=X.Y.Z]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = path.join(ROOT, 'package.json');
const INPUT_CSS = path.join(ROOT, 'src', 'tailwind.input.css');
const VENDOR_CSS = path.join(ROOT, 'vendor', 'tailwind.css');
const TIMER_HTML = path.join(ROOT, 'timer.html');

const EXACT_SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;
const CDN_URL_RE = /https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@(\d+\.\d+\.\d+)/g;
const THEME_STYLE_RE = /(<style\s+type="text\/tailwindcss">)([\s\S]*?)(<\/style>)/;
const VENDOR_HEADER_RE = /^\/\*!\s*tailwindcss\s+v(\d+\.\d+\.\d+)\b/;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getPinnedVersion() {
  const pkg = readJson(PKG_PATH);
  const tw = pkg.devDependencies?.tailwindcss;
  const cli = pkg.devDependencies?.['@tailwindcss/cli'];

  if (!tw || !cli) {
    throw new Error('package.json must declare both "tailwindcss" and "@tailwindcss/cli" in devDependencies.');
  }
  if (!EXACT_SEMVER_RE.test(tw) || !EXACT_SEMVER_RE.test(cli)) {
    throw new Error(
      `Tailwind devDependencies must be pinned to exact X.Y.Z versions (found tailwindcss="${tw}", @tailwindcss/cli="${cli}").`
    );
  }
  if (tw !== cli) {
    throw new Error(
      `Version mismatch in package.json: tailwindcss="${tw}" !== @tailwindcss/cli="${cli}".`
    );
  }
  return tw;
}

function extractCanonicalThemeBlock() {
  const raw = fs.readFileSync(INPUT_CSS, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  let startIndex = 0;

  while (startIndex < lines.length) {
    const trimmed = lines[startIndex].trim();
    if (trimmed === '' || trimmed.startsWith('@import ') || trimmed.startsWith('@source ')) {
      startIndex++;
    } else {
      break;
    }
  }

  const block = lines.slice(startIndex).join('\n').trim();
  if (!block.includes('@theme')) {
    throw new Error(`No @theme block found in ${path.relative(ROOT, INPUT_CSS)}.`);
  }
  return block;
}

function normalizeCssBlock(css) {
  const lines = css.replace(/\r\n/g, '\n').split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^(\s*)/)[1].length);
  const minIndent = indents.length ? Math.min(...indents) : 0;

  return lines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent).trimEnd())).join('\n');
}

function indentCssBlock(block, indent = '        ') {
  return block
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : `${indent}${line}`))
    .join('\n');
}

function syncTimerHtml(version, canonicalTheme, { write }) {
  const html = fs.readFileSync(TIMER_HTML, 'utf8');
  const errors = [];

  const cdnMatches = [...html.matchAll(CDN_URL_RE)];
  if (cdnMatches.length === 0) {
    errors.push('Could not find pinned @tailwindcss/browser@X.Y.Z CDN URL in timer.html.');
  } else {
    for (const match of cdnMatches) {
      if (match[1] !== version) {
        errors.push(`timer.html pins @tailwindcss/browser@${match[1]}, expected ${version}.`);
      }
    }
  }

  const styleMatch = html.match(THEME_STYLE_RE);
  if (!styleMatch) {
    errors.push('Could not find <style type="text/tailwindcss"> block in timer.html.');
  } else {
    const htmlTheme = normalizeCssBlock(styleMatch[2]);
    const canonicalNormalized = normalizeCssBlock(canonicalTheme);
    if (htmlTheme !== canonicalNormalized) {
      errors.push('timer.html <style type="text/tailwindcss"> block differs from src/tailwind.input.css.');
    }
  }

  if (!write) {
    return errors;
  }

  if (cdnMatches.length === 0 || !styleMatch) {
    throw new Error(errors.join('\n'));
  }

  let updated = html.replace(
    CDN_URL_RE,
    `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@${version}`
  );
  const formattedTheme = `\n${indentCssBlock(canonicalTheme, '        ')}\n    `;
  updated = updated.replace(THEME_STYLE_RE, `$1${formattedTheme}$3`);

  if (updated !== html) {
    fs.writeFileSync(TIMER_HTML, updated, 'utf8');
    console.log(`Updated timer.html (CDN @tailwindcss/browser@${version} + @theme block).`);
  }
  return [];
}

function runTailwindCli(outputPath) {
  const binName = process.platform === 'win32' ? 'tailwindcss.cmd' : 'tailwindcss';
  const cliBin = path.join(ROOT, 'node_modules', '.bin', binName);

  if (!fs.existsSync(cliBin)) {
    throw new Error('Local Tailwind CLI not found in node_modules/.bin. Run "npm install" first.');
  }

  execFileSync(cliBin, ['-i', INPUT_CSS, '-o', outputPath, '--minify'], {
    cwd: ROOT,
    stdio: 'pipe',
  });
}

function readVendorHeaderVersion(css) {
  const match = css.match(VENDOR_HEADER_RE);
  return match ? match[1] : null;
}

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function npmViewVersions(pkgName) {
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const out = execFileSync(npmBin, ['view', pkgName, 'versions', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(out);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.filter((v) => EXACT_SEMVER_RE.test(v));
}

function cmdBuild() {
  const version = getPinnedVersion();
  const canonicalTheme = extractCanonicalThemeBlock();

  syncTimerHtml(version, canonicalTheme, { write: true });
  runTailwindCli(VENDOR_CSS);

  const built = fs.readFileSync(VENDOR_CSS, 'utf8');
  const headerVersion = readVendorHeaderVersion(built);
  if (headerVersion !== version) {
    throw new Error(
      `Generated vendor/tailwind.css header reports v${headerVersion ?? 'unknown'}, expected v${version}.`
    );
  }

  const bytes = Buffer.byteLength(built, 'utf8');
  console.log(`Built vendor/tailwind.css (tailwindcss v${version}, ${(bytes / 1024).toFixed(2)} KB / ${bytes} bytes).`);
}

function cmdCheck() {
  const version = getPinnedVersion();
  const canonicalTheme = extractCanonicalThemeBlock();
  const errors = [];

  errors.push(...syncTimerHtml(version, canonicalTheme, { write: false }));

  if (!fs.existsSync(VENDOR_CSS)) {
    errors.push('vendor/tailwind.css does not exist.');
  } else {
    const committed = fs.readFileSync(VENDOR_CSS, 'utf8');
    const headerVersion = readVendorHeaderVersion(committed);
    if (headerVersion !== version) {
      errors.push(
        `vendor/tailwind.css header is v${headerVersion ?? 'unknown'}, expected v${version}.`
      );
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitreous-tw-'));
    const tmpOut = path.join(tmpDir, 'tailwind.css');
    try {
      runTailwindCli(tmpOut);
      const fresh = fs.readFileSync(tmpOut, 'utf8');
      if (committed !== fresh) {
        errors.push(
          'vendor/tailwind.css is out of sync with src/tailwind.input.css and timer.html.'
        );
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  if (errors.length > 0) {
    console.error('Tailwind sync check FAILED:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error('\nRun "npm run tailwind:build" to resynchronize.');
    process.exit(1);
  }

  const size = fs.statSync(VENDOR_CSS).size;
  console.log(
    `OK: Tailwind v${version} is fully synchronized (package.json, timer.html CDN + @theme, vendor/tailwind.css [${(size / 1024).toFixed(2)} KB]).`
  );
}

function cmdUpgrade(args) {
  const currentVersion = getPinnedVersion();
  const [curMajor, curMinor] = currentVersion.split('.').map(Number);

  const allowPatchOnly = args.includes('--patch');
  const allowMajor = args.includes('--major');
  const explicitArg = args.find((a) => a.startsWith('--to='));
  const explicitTarget = explicitArg ? explicitArg.slice('--to='.length) : null;

  if (explicitTarget && !EXACT_SEMVER_RE.test(explicitTarget)) {
    throw new Error(`Invalid --to version "${explicitTarget}". Expected exact X.Y.Z.`);
  }

  console.log(`Current pinned Tailwind version: v${currentVersion}`);
  console.log('Checking npm registry for matching tailwindcss, @tailwindcss/cli, and @tailwindcss/browser releases...');

  const twVersions = new Set(npmViewVersions('tailwindcss'));
  const cliVersions = new Set(npmViewVersions('@tailwindcss/cli'));
  const browserVersions = new Set(npmViewVersions('@tailwindcss/browser'));

  const shared = [...twVersions].filter((v) => cliVersions.has(v) && browserVersions.has(v));
  shared.sort(compareSemver);

  let target;
  if (explicitTarget) {
    if (!shared.includes(explicitTarget)) {
      throw new Error(
        `Version ${explicitTarget} is not published across all three packages (tailwindcss, @tailwindcss/cli, @tailwindcss/browser).`
      );
    }
    target = explicitTarget;
  } else {
    const candidates = shared.filter((v) => {
      const [maj, min] = v.split('.').map(Number);
      if (allowMajor) return true;
      if (allowPatchOnly) return maj === curMajor && min === curMinor;
      return maj === curMajor;
    });
    target = candidates[candidates.length - 1];
  }

  if (!target) {
    throw new Error('Could not resolve a matching target Tailwind release.');
  }

  if (target === currentVersion) {
    console.log(`Already on latest matching version (v${currentVersion}). Running sync check...`);
    cmdCheck();
    return;
  }

  const oldSize = fs.existsSync(VENDOR_CSS) ? fs.statSync(VENDOR_CSS).size : 0;
  const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  console.log(`Upgrading Tailwind CSS: v${currentVersion} -> v${target}...`);
  execFileSync(
    npmBin,
    ['install', '--save-dev', '--save-exact', `tailwindcss@${target}`, `@tailwindcss/cli@${target}`],
    { cwd: ROOT, stdio: 'inherit' }
  );

  cmdBuild();

  const newSize = fs.statSync(VENDOR_CSS).size;
  const delta = newSize - oldSize;
  const sign = delta >= 0 ? '+' : '';

  console.log('\nUpgrade summary:');
  console.log(`  Version:             v${currentVersion} -> v${target}`);
  console.log(`  vendor/tailwind.css: ${oldSize} B -> ${newSize} B (${sign}${delta} B)`);
  console.log('\nNext steps:');
  console.log('  1. Bump CACHE_NAME in sw.js so offline PWA caches pick up the new vendor/tailwind.css.');
  console.log('  2. Run the 5-point verification matrix (online CDN, blocked CDN, 200 block page, hung timeout, offline PWA).');
}

const [command, ...restArgs] = process.argv.slice(2);

try {
  if (command === 'build') {
    cmdBuild();
  } else if (command === 'check') {
    cmdCheck();
  } else if (command === 'upgrade') {
    cmdUpgrade(restArgs);
  } else {
    console.error('Usage: node scripts/tailwind-sync.mjs <build|check|upgrade> [--patch|--major|--to=X.Y.Z]');
    process.exit(1);
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
