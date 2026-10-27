#!/usr/bin/env node
/**
 * Grocery image audit.
 *
 * The audit now reads the **live catalogue** instead of the source
 * spreadsheet, because that is the only place that knows which image each
 * product actually uses, where that image came from and whether it was
 * verified.
 *
 * It writes:
 *   reports/grocery-image-audit.csv   one row per grocery product
 *   reports/grocery-image-report.md    summary tables
 *
 * Usage: node scripts/audit-grocery-images.mjs
 */

import { spawnSync } from "node:child_process";
import path from "node:path";

const report = path.resolve("scripts/report-grocery-images.mjs");
const result = spawnSync(process.execPath, [report], { stdio: "inherit" });
process.exit(result.status ?? 0);
