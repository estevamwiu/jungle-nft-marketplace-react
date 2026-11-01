import { spawn } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { setTimeout as delay } from "node:timers/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { launch } from "chrome-launcher"
import lighthouse, { desktopConfig } from "lighthouse"
import { chromium } from "@playwright/test"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const baseURL = "http://127.0.0.1:4174"
const reportDirectory = resolve(root, "lighthouse-reports")
const runCount = 3
const routes = [
  { name: "home", path: "/?scenario=default" },
  { name: "nft-details", path: "/nft/1?scenario=default" },
]
const metricAudits = {
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  tbt: "total-blocking-time",
}
const preview = spawn(
  process.execPath,
  [
    resolve(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4174",
    "--strictPort",
  ],
  { cwd: root, stdio: "inherit", windowsHide: true }
)

async function waitForPreview() {
  const deadline = Date.now() + 30_000
  let lastError

  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      throw new Error(
        `Vite preview exited before becoming ready (code ${preview.exitCode}).`
      )
    }

    try {
      const response = await fetch(baseURL)

      if (response.ok) {
        return
      }

      lastError = new Error(
        `Vite preview returned HTTP ${response.status}.`
      )
    } catch (error) {
      lastError = error
    }

    await delay(500)
  }

  throw new Error("Vite preview did not become ready within 30 seconds.", {
    cause: lastError,
  })
}

function median(values) {
  const sorted = values
    .filter((value) => typeof value === "number")
    .sort((left, right) => left - right)

  if (sorted.length === 0) {
    return null
  }

  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function formatScore(score) {
  return score === null ? "n/a" : `${Math.round(score * 100)}`
}

function formatMetric(value, digits = 0) {
  return value === null ? "n/a" : value.toFixed(digits)
}

function summarizeRuns(runs) {
  const categoryNames = Object.keys(runs[0].categories)

  return {
    runCount: runs.length,
    medianCategories: Object.fromEntries(
      categoryNames.map((name) => [
        name,
        median(runs.map((run) => run.categories[name])),
      ])
    ),
    medianMetrics: Object.fromEntries(
      Object.keys(metricAudits).map((name) => [
        name,
        median(runs.map((run) => run.metrics[name])),
      ])
    ),
  }
}

async function runAudit(browser, route, viewport, runNumber) {
  const url = new URL(route.path, baseURL).toString()
  const result = await lighthouse(
    url,
    {
      port: browser.port,
      output: ["html", "json"],
      logLevel: "warn",
      onlyCategories: [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
      ],
    },
    viewport === "desktop" ? desktopConfig : undefined
  )

  if (!result) {
    throw new Error(`Lighthouse did not return a report for ${url}.`)
  }

  const reports = Array.isArray(result.report)
    ? result.report
    : [result.report]

  if (reports.length !== 2) {
    throw new Error(`Lighthouse returned an unexpected report for ${url}.`)
  }

  const reportPrefix = `${route.name}-${viewport}-run-${runNumber}`
  await writeFile(
    resolve(reportDirectory, `${reportPrefix}.html`),
    reports[0],
    "utf8"
  )
  await writeFile(
    resolve(reportDirectory, `${reportPrefix}.json`),
    reports[1],
    "utf8"
  )

  const categories = Object.fromEntries(
    Object.entries(result.lhr.categories).map(([name, category]) => [
      name,
      category.score,
    ])
  )
  const metrics = Object.fromEntries(
    Object.entries(metricAudits).map(([name, auditId]) => {
      const value = result.lhr.audits[auditId]?.numericValue

      return [name, typeof value === "number" ? value : null]
    })
  )

  return {
    run: runNumber,
    url,
    categories,
    metrics,
    settings: {
      formFactor: result.lhr.configSettings.formFactor,
      throttlingMethod: result.lhr.configSettings.throttlingMethod,
      throttling: result.lhr.configSettings.throttling,
      screenEmulation: result.lhr.configSettings.screenEmulation,
    },
  }
}

function createMarkdownSummary(summary) {
  const rows = summary.audits.map(({ page, viewport, ...audit }) => {
    const categories = audit.medianCategories
    const metrics = audit.medianMetrics

    return [
      `| ${viewport} | ${page} | ${formatScore(categories.performance)} | ${formatScore(categories.accessibility)} | ${formatScore(categories["best-practices"])} | ${formatScore(categories.seo)} | ${metrics.lcp === null ? "n/a" : formatMetric(metrics.lcp / 1000, 2)} | ${formatMetric(metrics.cls, 3)} | ${formatMetric(metrics.tbt)} |`,
    ].join("")
  })

  return [
    "# Lighthouse median audit",
    "",
    `Generated: ${summary.environment.generatedAt}`,
    `Node: ${summary.environment.nodeVersion}; Chrome: ${summary.environment.chromeVersion}`,
    `Tools: Lighthouse ${summary.environment.toolVersions.lighthouse}; chrome-launcher ${summary.environment.toolVersions.chromeLauncher}`,
    `Platform: ${summary.environment.platform}; scenario: ${summary.conditions.scenario}; build: ${summary.conditions.build}`,
    `Runs: ${summary.conditions.runCount} per page and viewport. Lighthouse settings are recorded in summary.json.`,
    "",
    "| Viewport | Page | Performance | Accessibility | Best Practices | SEO | LCP median (s) | CLS median | TBT median (ms) |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    "See each run's HTML and JSON report for details.",
    "",
  ].join("\n")
}

async function main() {
  await mkdir(reportDirectory, { recursive: true })
  await waitForPreview()

  let browser

  try {
    browser = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: [
        "--headless=new",
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    })

    const versionResponse = await fetch(
      `http://127.0.0.1:${browser.port}/json/version`
    )

    if (!versionResponse.ok) {
      throw new Error(
        `Chrome version endpoint returned HTTP ${versionResponse.status}.`
      )
    }

    const browserInfo = await versionResponse.json()

    if (typeof browserInfo.Browser !== "string") {
      throw new Error("Chrome did not report its browser version.")
    }

    const packageLock = JSON.parse(
      await readFile(resolve(root, "package-lock.json"), "utf8")
    )
    const audits = []

    for (const viewport of ["mobile", "desktop"]) {
      for (const route of routes) {
        const runs = []

        for (let runNumber = 1; runNumber <= runCount; runNumber += 1) {
          const run = await runAudit(browser, route, viewport, runNumber)
          runs.push(run)

          console.log(
            `${viewport} ${route.name} run ${runNumber}/${runCount}: ${Object.entries(
              run.categories
            )
              .map(([name, score]) => `${name} ${formatScore(score)}`)
              .join(" | ")}`
          )
        }

        const audit = {
          page: route.name,
          viewport,
          ...summarizeRuns(runs),
          runs,
        }
        audits.push(audit)

        console.log(
          `${viewport} ${route.name} median: ${Object.entries(
            audit.medianCategories
          )
            .map(([name, score]) => `${name} ${formatScore(score)}`)
            .join(" | ")}`
        )
      }
    }

    const summary = {
      environment: {
        generatedAt: new Date().toISOString(),
        nodeVersion: process.version,
        platform: `${process.platform} ${process.arch}`,
        chromeVersion: browserInfo.Browser,
        chromeUserAgent: browserInfo["User-Agent"],
        chromeExecutable: chromium.executablePath(),
        toolVersions: {
          lighthouse:
            packageLock.packages["node_modules/lighthouse"].version,
          chromeLauncher:
            packageLock.packages["node_modules/chrome-launcher"].version,
          playwright:
            packageLock.packages["node_modules/@playwright/test"].version,
          vite: packageLock.packages["node_modules/vite"].version,
        },
      },
      conditions: {
        build: "Vite production build served with vite preview",
        scenario: "default MSW mocks",
        runCount,
        routes: routes.map((route) => route.path),
        viewports: ["mobile", "desktop"],
        reportFormat: ["HTML", "JSON"],
      },
      audits,
    }

    await writeFile(
      resolve(reportDirectory, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8"
    )
    await writeFile(
      resolve(reportDirectory, "summary.md"),
      createMarkdownSummary(summary),
      "utf8"
    )

    console.log(`Lighthouse reports saved to ${reportDirectory}`)
  } finally {
    if (browser) {
      await browser.kill()
    }

    if (preview.exitCode === null && preview.signalCode === null) {
      preview.kill()
      await new Promise((resolveExit) => preview.once("exit", resolveExit))
    }
  }
}

main().catch((error) => {
  console.error("Lighthouse audit failed:", error)
  process.exitCode = 1
})
