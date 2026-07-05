const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { parse } = require('node-html-parser');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env file. Copy .env.example to .env and fill in values.');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getConfig() {
  const required = [
    'SEARCH_BASE_URL',
    'SEARCH_TYPE',
    'SEARCH_MODULE',
    'STATUS_AVAILABLE',
    'STATUS_WAITLIST',
    'STATUS_UNAVAILABLE',
    'NOTIFY_ON_AVAILABLE',
    'NOTIFY_ON_WAITLIST',
    'CHECK_INTERVAL_MINUTES'
  ];

  const config = {};
  for (const key of required) {
    const value = process.env[key];
    if (value === undefined) {
      console.error(`Missing required environment variable: ${key}`);
      process.exit(1);
    }
    config[key] = value;
  }

  return config;
}

async function fetchBasePage(url) {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome'
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    const html = await page.content();
    return { html, browser };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

function extractCsrfToken(html) {
  const root = parse(html);
  const input = root.querySelector('input[name="_csrf_token"]');
  return input ? input.getAttribute('value') : null;
}

function maskToken(token) {
  if (!token || token.length <= 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

async function main() {
  let browser = null;

  try {
    loadEnv();
    const config = getConfig();

    console.log(`Fetching base page: ${config.SEARCH_BASE_URL}`);
    const { html, browser: launchedBrowser } = await fetchBasePage(config.SEARCH_BASE_URL);
    browser = launchedBrowser;

    const token = extractCsrfToken(html);
    if (!token) {
      console.error('Failed to extract _csrf_token from base page');
      process.exit(1);
    }

    console.log(`CSRF token extracted: ${maskToken(token)} (length: ${token.length})`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main().catch((error) => {
  console.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
