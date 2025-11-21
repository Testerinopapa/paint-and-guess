# RPG Game Crawler

Automated crawler for testing the **Chronicles of the Abyss** RPG game.

## Overview

This crawler comprehensively tests the RPG game functionality including:
- Navigation to the RPG game page
- UI component rendering (PlayerPanel, StoryWindow, ActionPanel, CommandInput)
- Action button interactions (Explore, Inventory, Stats, Save)
- Command input and submission
- State changes verification (character stats, location, story text)
- Command unlocking verification
- Level progression testing
- Story text updates
- Scrolling functionality
- Debug utilities access
- Zustand store state management

## Prerequisites

1. **Start the development servers:**
   ```bash
   npm run dev:all
   # OR
   .\start-dev.ps1
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install chromium
   ```

3. **Optional: Enable debug mode for detailed logs:**
   ```bash
   # Set environment variable
   $env:VITE_DEBUG_RPG="true"
   npm run dev
   ```

## Running the Crawler

### Option 1: Using npm script
```bash
npm run crawl:rpg
# OR
npm run test:rpg
```

### Option 2: Using tsx directly
```bash
npx tsx scripts/test-rpg-game-crawler.ts
```

## What It Tests

### 1. Navigation to RPG Game
- Navigates to `/games/chronicles-of-the-abyss`
- Verifies page loads correctly
- Checks for game title and subtitle
- Takes screenshot of loaded page

### 2. UI Components Rendering
- Verifies PlayerPanel is visible (HP, Mana, XP, Gold, Level)
- Verifies StoryWindow displays location and story text
- Verifies ActionPanel shows actions and commands
- Verifies CommandInput field and submit button

### 3. Action Buttons Interaction
- Clicks each action button (Explore, Inventory, Stats, Save)
- Verifies story text updates after each action
- Captures state changes
- Takes screenshot after actions

### 4. Command Input and Submission
- Tests multiple commands (Attack, Investigate Symbols, Cast Light Spell, Rest)
- Verifies character stats change (HP, Mana, XP, Gold)
- Verifies story text updates
- Captures before/after state

### 5. Command Unlocking
- Tests that performing actions unlocks new commands
- Verifies command list grows
- Checks that new commands are added correctly

### 6. State Management (Zustand Store)
- Verifies debug utilities are available (`__RPG_DEBUG__`)
- Tests state access methods
- Verifies character, location, and story state
- Checks performance statistics

### 7. Scrolling Functionality
- Tests page scrolling
- Verifies Action Panel scrolls independently
- Verifies Story Window scrolls independently
- Tests scrolling to bottom and back to top

### 8. Level Progression
- Submits commands that grant XP
- Verifies XP increases
- Checks for level-ups
- Captures character progression

## Output

The crawler generates:

1. **Screenshots** (`test-screenshots-rpg-crawl/`):
   - `01-rpg-game-loaded.png` - Initial game page
   - `03-after-actions.png` - After action button clicks
   - `04-after-commands.png` - After command submissions
   - `05-level-progression.png` - After XP/level changes

2. **Test Results** (`test-results-rpg-crawl.json`):
   - Summary of all tests
   - Pass/fail status
   - Detailed results for each test
   - Duration of each test
   - Initial character state

3. **Logs** (`test-screenshots-rpg-crawl/`):
   - `console-logs.txt` - All console logs
   - `debug-logs.txt` - RPG-specific debug logs

## Configuration

You can configure the crawler using environment variables:

```bash
# Set frontend URL (default: http://localhost:8080)
$env:TEST_URL="http://localhost:8080"

# Enable debug mode
$env:VITE_DEBUG_RPG="true"

# Run crawler
npm run crawl:rpg
```

## Expected Results

All tests should pass if:
- ✅ RPG game page loads correctly
- ✅ All UI components render
- ✅ Actions trigger state changes
- ✅ Commands update character stats
- ✅ New commands unlock after actions
- ✅ Debug utilities work correctly
- ✅ Scrolling works for all panels
- ✅ XP and level progression works

## Troubleshooting

### Browser won't launch
- Make sure Playwright is installed: `npx playwright install chromium`
- Check that no other browser instance is blocking port access

### Tests fail with "element not found"
- Ensure the dev servers are running (`npm run dev:all`)
- Check that the RPG game route is accessible at `/games/chronicles-of-the-abyss`
- Verify UI components haven't changed class names

### State changes not detected
- Enable debug mode: `VITE_DEBUG_RPG=true`
- Check browser console for errors
- Verify Zustand store is working correctly

### Commands don't update state
- Check that commands are spelled correctly
- Verify command handlers are working in the store
- Check debug logs for command resolution errors

## Debug Mode

When `VITE_DEBUG_RPG=true` is set, the crawler will capture additional debug logs including:
- State change logs
- Action/command resolution logs
- Character delta logs
- Performance statistics

You can also manually interact with the game using the browser console:

```javascript
// Get current state
__RPG_DEBUG__.getState()

// Get character stats
__RPG_DEBUG__.getCharacter()

// Perform action
__RPG_DEBUG__.performAction("explore")

// Submit command
__RPG_DEBUG__.submitCommand("attack")

// Get help
__RPG_DEBUG__.help()
```

## Notes

- The crawler runs in non-headless mode so you can watch it interact with the game
- Some tests may take longer if waiting for state updates
- Screenshots are saved for each major test phase
- All results are saved to JSON for programmatic analysis

