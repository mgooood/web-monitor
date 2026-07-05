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

async function launchBrowser() {
  return chromium.launch({
    headless: false,
    channel: 'chrome'
  });
}

async function navigateToPage(page, url, waitMs = 5000) {
  await page.goto(url, { waitUntil: 'networkidle' });
  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }
  return page.content();
}

function extractCsrfToken(html) {
  const root = parse(html);
  const input = root.querySelector('input[name="_csrf_token"]');
  return input ? input.getAttribute('value') : null;
}

function buildSearchUrl(baseUrl, type, module, token) {
  const url = new URL(baseUrl);
  url.searchParams.set('Action', 'Start');
  url.searchParams.set('type', type);
  url.searchParams.set('module', module);
  url.searchParams.set('_csrf_token', token);
  return url.toString();
}

function parseSearchResults(html) {
  const root = parse(html);
  const results = [];

  const containers = root.querySelectorAll('.result-content.tablecollapsecontainer');
  for (const container of containers) {
    const nameEl = container.querySelector('.result-header__info h2 span');
    const activityEl = container.querySelector('.result-header__info h2 em');
    const className = nameEl ? nameEl.text.trim() : '';
    const baseActivity = activityEl ? activityEl.text.trim() : '';

    const rows = container.querySelectorAll('tbody tr');
    for (const row of rows) {
      const statusEl = row.querySelector('[data-title="Availability"] .itemstatus');
      const activityLinkEl = row.querySelector('[data-title="Activity #"] a');
      const descriptionEl = row.querySelector('[data-title="Description"] a');
      const datesEl = row.querySelector('[data-title="Dates"]');
      const timesEl = row.querySelector('[data-title="Times"]');
      const daysEl = row.querySelector('[data-title="Days"]');
      const locationEl = row.querySelector('[data-title="Location"]');

      const fullActivity = activityLinkEl ? activityLinkEl.text.trim() : '';
      const sectionId = fullActivity.includes('-') ? fullActivity.split('-').pop() : '';

      results.push({
        className,
        baseActivity,
        fullActivity,
        sectionId,
        description: descriptionEl ? descriptionEl.text.trim() : '',
        detailUrl: activityLinkEl ? activityLinkEl.getAttribute('href') : '',
        status: statusEl ? statusEl.text.trim() : '',
        dates: datesEl ? formatCellText(datesEl.text) : '',
        times: timesEl ? formatCellText(timesEl.text) : '',
        days: daysEl ? daysEl.text.trim() : '',
        location: locationEl ? locationEl.text.trim() : ''
      });
    }
  }

  return results;
}

function maskToken(token) {
  if (!token || token.length <= 8) return '***';
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

function formatCellText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}

function colorStatus(status, config) {
  const useColor = process.stdout.isTTY;
  const reset = '\x1b[0m';
  const red = '\x1b[38;5;196m';
  const orange = '\x1b[38;5;208m';
  const green = '\x1b[38;5;82m';

  const lower = status.toLowerCase();
  let color = '';
  if (lower === config.STATUS_UNAVAILABLE.toLowerCase()) color = red;
  else if (lower === config.STATUS_WAITLIST.toLowerCase()) color = orange;
  else if (lower === config.STATUS_AVAILABLE.toLowerCase()) color = green;

  return useColor ? `${color}${status}${reset}` : status;
}

function logResults(results, config) {
  const availableKeyword = config.STATUS_AVAILABLE.toLowerCase();
  const waitlistKeyword = config.STATUS_WAITLIST.toLowerCase();
  const includeAvailable = config.NOTIFY_ON_AVAILABLE.toLowerCase() === 'true';
  const includeWaitlist = config.NOTIFY_ON_WAITLIST.toLowerCase() === 'true';

  const matching = results.filter((item) => {
    const status = item.status.toLowerCase();
    if (status === availableKeyword) return includeAvailable;
    if (status === waitlistKeyword) return includeWaitlist;
    return false;
  });

  console.log(`Total classes parsed: ${results.length}`);
  console.log(`Matching classes: ${matching.length}`);
  console.log('');

  if (results.length === 0) {
    console.log('No classes found.');
    return;
  }

  console.log('All classes:');
  for (const item of results) {
    console.log(`- ${item.className} [${item.sectionId}]`);
    console.log(`  Activity: ${item.fullActivity}`);
    console.log(`  Status: ${colorStatus(item.status, config)}`);
    console.log(`  Description: ${item.description}`);
    console.log(`  Dates: ${item.dates}`);
    console.log(`  Times: ${item.times}`);
    console.log(`  Days: ${item.days}`);
    console.log(`  Location: ${item.location}`);
    console.log(`  Link: ${item.detailUrl}`);
  }

  if (matching.length > 0) {
    console.log('');
    console.log('Matching classes:');
    for (const item of matching) {
      console.log(`- ${item.className} [${item.sectionId}]`);
      console.log(`  Status: ${colorStatus(item.status, config)}`);
      console.log(`  Link: ${item.detailUrl}`);
    }
  }
}

async function main() {
  let browser = null;
  let page = null;

  try {
    loadEnv();
    const config = getConfig();

    console.log(`Fetching base page: ${config.SEARCH_BASE_URL}`);
    browser = await launchBrowser();
    page = await browser.newPage();

    const baseHtml = await navigateToPage(page, config.SEARCH_BASE_URL, 5000);
    const token = extractCsrfToken(baseHtml);
    if (!token) {
      console.error('Failed to extract _csrf_token from base page');
      process.exit(1);
    }

    console.log(`CSRF token extracted: ${maskToken(token)} (length: ${token.length})`);

    const searchUrl = buildSearchUrl(
      config.SEARCH_BASE_URL,
      config.SEARCH_TYPE,
      config.SEARCH_MODULE,
      token
    );
    console.log(`Fetching search results: ${searchUrl}`);

    const searchHtml = await navigateToPage(page, searchUrl, 5000);
    const results = parseSearchResults(searchHtml);

    logResults(results, config);
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
