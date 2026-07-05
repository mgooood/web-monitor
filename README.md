# WebTrac Class Availability Monitor

A small Node.js script that checks the Arlington WebTrac site for woodworking classes and displays availability information in the console. The script uses a real Chrome browser to get past Cloudflare bot detection.

## Status

All implementation tickets are complete.

- T1: Project skeleton
- T2: Base page fetch and CSRF token extraction
- T3: WOOD search request and results parsing
- T4: Removed (future-date filtering not needed)
- T5: Removed (email notifications not needed)
- T6: Logging and error handling
- T7: Live test against WebTrac
- T8: Documentation

## Prerequisites

- macOS (the script is designed and tested on a Mac)
- Node.js installed
- Google Chrome installed (the script uses Playwright with the system Chrome channel)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mgooood/web-monitor.git
cd web-monitor
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Download the Playwright browser binaries:

```bash
npx playwright install chromium
```

This stores the browser in a global cache on your Mac, so it only needs to be done once per Playwright version.

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` and fill in your values. The most important variables are:

| Variable | Purpose |
|---|---|
| `SEARCH_BASE_URL` | The WebTrac search page URL |
| `SEARCH_TYPE` | Class type code, e.g., `WOOD` for woodworking |
| `SEARCH_MODULE` | WebTrac module, e.g., `AR` for Activity Registration |
| `STATUS_AVAILABLE` | Text that indicates an available class |
| `STATUS_WAITLIST` | Text that indicates a waitlist-only class |
| `STATUS_UNAVAILABLE` | Text that indicates an unavailable class |
| `NOTIFY_ON_AVAILABLE` | Set to `true` to highlight available classes |
| `NOTIFY_ON_WAITLIST` | Set to `true` to highlight waitlist classes |
| `CHECK_INTERVAL_MINUTES` | Optional polling interval if you later use a scheduler |

The `.env` file is ignored by Git and never committed.

## Usage

Run the monitor manually from the project directory:

```bash
node monitor.js
```

A Chrome window will open briefly, load the WebTrac site, solve the Cloudflare challenge, fetch the woodworking search results, and then close. The results are printed to the console.

## Sample Output

```text
Run started: Sun, Jul 05, 2026, 01:18:06 PM EDT
Fetching base page: https://vaarlingtonweb.myvscloud.com/webtrac/web/search.html
CSRF token extracted: iJ6H...626Q (length: 130)
Fetching search results: https://vaarlingtonweb.myvscloud.com/webtrac/web/search.html?Action=Start&type=WOOD&module=AR&_csrf_token=...
Total classes parsed: 1
Matching classes: 0

All classes:
- Intro to Woodshop
  Activity: 440180
  Section: A
  Full Activity #: 440180-A
  Status: Unavailable
  Description: Intro to Woodshop
  Dates: 06/23/2026 - 07/14/2026
  Times: 6:00 pm - 8:30 pm
  Days: Tu
  Location: Thomas Jefferson Center
  Link: https://vaarlingtonweb.myvscloud.com/webtrac/web/iteminfo.html?Module=AR&FMID=350225786
```

Status text is color-coded in the terminal:

- **Green** for `Available`
- **Orange** for `Waitlist`
- **Red** for `Unavailable`

Color is automatically stripped if you redirect the output to a file.

## Notes

- The script is designed to be run manually when you are at your Mac.
- Continuous scheduling is not recommended on a laptop because the Mac must stay awake for scheduled checks to run. If you want to schedule it anyway, use `cron` or `launchd` and keep the Mac awake.
- No email or other notifications are sent. All output goes to the console.

## Troubleshooting

### `Missing .env file`

Copy `.env.example` to `.env` and fill in the values.

### `Executable doesn't exist at ... chrome-headless-shell`

Run `npx playwright install chromium` to download the browser.

### `Failed to extract _csrf_token from base page`

The WebTrac HTML may have changed, or the page was blocked by Cloudflare. Try running the script again. If it keeps failing, the site structure may have changed and the selectors in `monitor.js` may need updating.

### `Status: Unavailable` is the only class shown

The current WOOD classes may all be unavailable. The script will still highlight any available or waitlist classes when they appear. You can verify the matching logic by temporarily setting `STATUS_UNAVAILABLE` in `.env` to match the status text, but remember to set it back.

### No Chrome window appears

Make sure Google Chrome is installed. The script uses `channel: 'chrome'` in Playwright, which requires a system Chrome installation.
