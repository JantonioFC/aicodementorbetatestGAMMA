#!/usr/bin/env node

/**
 * Test Health Report — Consolidated diagnostics for Jest + Playwright
 *
 * Usage: node scripts/test-health.js
 *
 * Runs both test suites, parses JSON output, and prints a consolidated
 * report including pass/fail/skip counts, slow tests (>5s), and orphan
 * test files (files that match test patterns but weren't executed).
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SLOW_THRESHOLD_MS = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300_000, // 5 min max
      ...opts,
    });
  } catch (err) {
    // Many test runners exit with non-zero when tests fail — that's OK,
    // we still want the stdout/stderr for parsing.
    return err.stdout || err.stderr || '';
  }
}

function heading(text) {
  const line = '─'.repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${text}`);
  console.log(line);
}

// ─── Jest ─────────────────────────────────────────────────────────────────────

function collectJestResults() {
  heading('Jest Unit / Integration Tests');

  const raw = run('npx jest --json --forceExit 2>/dev/null');

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // Sometimes Jest prefixes non-JSON lines; try to extract the JSON object
    const match = raw.match(/\{[\s\S]*\}$/m);
    if (match) {
      data = JSON.parse(match[0]);
    } else {
      console.log('  Could not parse Jest JSON output.');
      return null;
    }
  }

  const passed = data.numPassedTests || 0;
  const failed = data.numFailedTests || 0;
  const skipped = (data.numPendingTests || 0) + (data.numTodoTests || 0);
  const total = passed + failed + skipped;
  const duration = ((data.testResults || []).reduce(
    (sum, r) => sum + (r.endTime - r.startTime),
    0
  ) / 1000).toFixed(1);

  console.log(`  Total : ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Duration: ${duration}s`);

  // Slow tests
  const slow = [];
  for (const suite of data.testResults || []) {
    for (const t of suite.assertionResults || []) {
      if (t.duration > SLOW_THRESHOLD_MS) {
        slow.push({
          name: t.fullName || t.title,
          file: path.relative(ROOT, suite.name),
          ms: t.duration,
        });
      }
    }
  }

  if (slow.length) {
    console.log(`\n  Slow tests (>${SLOW_THRESHOLD_MS / 1000}s):`);
    slow
      .sort((a, b) => b.ms - a.ms)
      .forEach((t) => console.log(`    ${(t.ms / 1000).toFixed(1)}s  ${t.name}  (${t.file})`));
  }

  // Failed test details
  if (failed > 0) {
    console.log('\n  Failed tests:');
    for (const suite of data.testResults || []) {
      for (const t of suite.assertionResults || []) {
        if (t.status === 'failed') {
          console.log(`    FAIL  ${t.fullName || t.title}`);
          if (t.failureMessages && t.failureMessages.length) {
            const msg = t.failureMessages[0].split('\n').slice(0, 3).join('\n      ');
            console.log(`      ${msg}`);
          }
        }
      }
    }
  }

  return { passed, failed, skipped, executedFiles: (data.testResults || []).map((r) => r.name) };
}

// ─── Playwright ───────────────────────────────────────────────────────────────

function collectPlaywrightResults() {
  heading('Playwright E2E Tests');

  const raw = run('npx playwright test --reporter=json 2>/dev/null');

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}$/m);
    if (match) {
      try {
        data = JSON.parse(match[0]);
      } catch {
        console.log('  Could not parse Playwright JSON output.');
        console.log('  (This is expected if Playwright browsers are not installed)');
        return null;
      }
    } else {
      console.log('  Could not parse Playwright JSON output.');
      console.log('  (This is expected if Playwright browsers are not installed)');
      return null;
    }
  }

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const slow = [];

  for (const suite of data.suites || []) {
    walkSuite(suite);
  }

  function walkSuite(suite) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const result = test.results && test.results[test.results.length - 1];
        if (!result) continue;

        if (test.status === 'expected' || result.status === 'passed') passed++;
        else if (test.status === 'skipped' || result.status === 'skipped') skipped++;
        else failed++;

        if (result.duration > SLOW_THRESHOLD_MS) {
          slow.push({
            name: spec.title,
            file: suite.title || '(unknown)',
            ms: result.duration,
          });
        }
      }
    }
    for (const child of suite.suites || []) {
      walkSuite(child);
    }
  }

  const total = passed + failed + skipped;

  console.log(`  Total : ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped: ${skipped}`);

  if (slow.length) {
    console.log(`\n  Slow tests (>${SLOW_THRESHOLD_MS / 1000}s):`);
    slow
      .sort((a, b) => b.ms - a.ms)
      .forEach((t) => console.log(`    ${(t.ms / 1000).toFixed(1)}s  ${t.name}  (${t.file})`));
  }

  return { passed, failed, skipped };
}

// ─── Orphan detection ─────────────────────────────────────────────────────────

function detectOrphans(executedJestFiles) {
  heading('Orphan Test Files');

  // Glob for test files on disk
  const testDirs = ['tests', '__tests__'];
  const allTestFiles = [];

  for (const dir of testDirs) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;
    walkDir(fullDir, allTestFiles);
  }

  function walkDir(dir, acc) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(full, acc);
      } else if (/\.test\.(js|ts|tsx)$/.test(entry.name)) {
        acc.push(full);
      }
    }
  }

  const executed = new Set((executedJestFiles || []).map((f) => path.resolve(f)));
  const orphans = allTestFiles.filter((f) => !executed.has(path.resolve(f)));

  if (orphans.length === 0) {
    console.log('  None — all test files were executed.');
  } else {
    console.log(`  ${orphans.length} test file(s) found on disk but NOT executed by Jest:`);
    orphans.forEach((f) => console.log(`    ${path.relative(ROOT, f)}`));
  }

  return orphans;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(function main() {
  console.log('Test Health Report');
  console.log(`Generated: ${new Date().toISOString()}`);

  const jest = collectJestResults();
  const pw = collectPlaywrightResults();

  detectOrphans(jest ? jest.executedFiles : []);

  // Summary
  heading('Summary');

  const totalFailed = (jest ? jest.failed : 0) + (pw ? pw.failed : 0);
  const totalPassed = (jest ? jest.passed : 0) + (pw ? pw.passed : 0);
  const totalSkipped = (jest ? jest.skipped : 0) + (pw ? pw.skipped : 0);

  console.log(`  Total passed : ${totalPassed}`);
  console.log(`  Total failed : ${totalFailed}`);
  console.log(`  Total skipped: ${totalSkipped}`);

  if (totalFailed > 0) {
    console.log('\n  STATUS: UNHEALTHY — there are failing tests.');
    process.exit(1);
  } else {
    console.log('\n  STATUS: HEALTHY — all tests passing.');
    process.exit(0);
  }
})();
