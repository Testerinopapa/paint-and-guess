# Avatar Customizer Crawl Test

Automated testing script that crawls through all avatar customization options to find bugs.

## Features

- ✅ Automatically opens the avatar customizer
- ✅ Clicks through all tabs (Skin, Hair, Clothes, Accessories, Face, Style, Body)
- ✅ Tests all option buttons in each tab
- ✅ Tests color pickers with various colors
- ✅ Tests action buttons (Randomize, Reset)
- ✅ Captures screenshots on errors
- ✅ Generates detailed test report (JSON)
- ✅ Detects crashes (avatar preview disappearing)
- ✅ Captures console errors

## Prerequisites

1. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```

   The script will connect to `http://localhost:8080` by default.

## Usage

### Run the test:

```bash
npm run test:avatar-crawl
```

Or directly with tsx:

```bash
npx tsx scripts/test-avatar-crawl.ts
```

### Custom URL:

```bash
TEST_URL=http://localhost:3000 npm run test:avatar-crawl
```

## Output

The script generates:

1. **Console output** - Real-time progress and results
2. **`test-results-avatar-crawl.json`** - Detailed test results with pass/fail status
3. **`test-screenshots/`** - Screenshots of errors (if any)

### Example Output:

```
🧪 Starting Avatar Customizer Crawl Test

📍 Testing URL: http://localhost:8080

1. Navigating to app...
2. Opening avatar customizer...
   ✅ Customizer opened

3. Found 6 tabs: Skin, Hair, Clothes, Accessories, Face, Style

📋 Testing Skin tab...
  Found 12 clickable options in Skin tab
  ✅ Light
  ✅ Medium
  ✅ Dark
  ...

📊 Test Summary
============================================================
Total tests: 156
✅ Passed: 154
❌ Failed: 2
Success rate: 98.7%

💾 Results saved to test-results-avatar-crawl.json
```

## Test Results Format

The JSON output contains an array of test results:

```json
[
  {
    "category": "Hair",
    "option": "Short",
    "passed": true
  },
  {
    "category": "Clothes",
    "option": "T-Shirt",
    "passed": false,
    "error": "Avatar preview disappeared after click"
  }
]
```

## Troubleshooting

### "Could not find avatar button"
- Make sure the dev server is running
- Check that you're on the Lobby page (`/`)
- The script looks for buttons with text "Click to customize" or containing an avatar image

### "Failed to open customizer"
- Ensure the dialog appears after clicking the avatar button
- Check browser console for JavaScript errors
- Try increasing timeout values in the script

### No options found in tabs
- The tab might be empty or still loading
- Check that the customizer dialog is fully rendered
- Verify the tab names match exactly (case-sensitive)

## Configuration

You can modify these constants in the script:

- `BASE_URL` - Default: `http://localhost:8080`
- `DELAY_MS` - Delay between clicks (default: 150ms)
- `SCREENSHOT_DIR` - Directory for error screenshots (default: `test-screenshots`)

## Notes

- The script runs in **non-headless mode** by default so you can watch it work
- Set `headless: true` in the script for CI/CD environments
- The script automatically skips duplicate options
- Color pickers are tested with red, green, and blue values
- Action buttons (Randomize, Reset) are tested at the end

