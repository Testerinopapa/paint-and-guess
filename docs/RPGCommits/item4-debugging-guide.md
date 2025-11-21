# Item 4 Integration - Debugging Guide

## Overview

Comprehensive debugging has been added to the Item 4 integration (Text Output, Terminal UI, and Story History). This guide explains how to use the debugging features to troubleshoot and monitor the typing effects, markdown rendering, and story entry management.

## Debug Configuration

Debugging is enabled by default in development mode. You can also enable it explicitly:

### Environment Variables

```bash
# Enable all RPG debugging (includes StoryWindow)
VITE_DEBUG_RPG=true

# Enable only StoryWindow debugging
VITE_DEBUG_STORY=true

# Enable only TypingText debugging
VITE_DEBUG_TYPING=true
```

## Debug Features

### 1. StoryWindow Debugging

The StoryWindow component logs:
- Component mount/unmount
- Story text processing
- Entry creation and updates
- Typing state changes
- Auto-scroll events
- Markdown rendering errors

#### Console Output

When debugging is enabled, you'll see logs like:

```
[StoryWindow] [2024-01-15T10:30:45.123Z] [INFO] StoryWindow mounted
[StoryWindow] [2024-01-15T10:30:45.124Z] [ACTION] Processing story text
[StoryWindow] [2024-01-15T10:30:45.125Z] [INFO] New entry created [0]
[StoryWindow] [2024-01-15T10:30:45.126Z] [ACTION] Story entries updated
```

#### Window Debug Utilities

Access debug utilities via the browser console:

```javascript
// Show help
__STORY_DEBUG__.help()

// Show configuration
__STORY_DEBUG__.logConfig()

// Test markdown rendering
__STORY_DEBUG__.checkMarkdown("**Bold** *italic* `code`")

// Test typing speed
__STORY_DEBUG__.testTyping("Hello world", 50)
```

### 2. TypingText Debugging

The TypingText component logs:
- Typing start/completion
- Progress updates (every 10 characters)
- Performance metrics
- Cleanup/interruption events

#### Console Output

```
[TypingText] [2024-01-15T10:30:45.200Z] [ACTION] [abc123] Starting typing effect
[TypingText] [2024-01-15T10:30:45.500Z] [INFO] [abc123] Typing progress
[TypingText] [2024-01-15T10:30:46.000Z] [ACTION] [abc123] Typing completed
```

#### Metrics Tracked

- **Total Time**: Actual time taken to complete typing
- **Expected Time**: Calculated time based on speed × length
- **Efficiency**: Percentage of expected vs actual time
- **Characters Per Second**: Typing speed in CPS

### 3. Markdown Rendering Debugging

Markdown rendering errors are caught and logged:

```
[StoryWindow] [2024-01-15T10:30:45.300Z] [ERROR] Markdown rendering error
```

## Debug Log Levels

### Info (`info`)
General information about component state and operations:
- Component mount
- Entry creation
- Progress updates

### Action (`action`)
Significant state changes or operations:
- Story text processing
- Typing start/completion
- Entry updates

### Warn (`warn`)
Non-critical issues:
- Typing interruption
- Unexpected state changes

### Error (`error`)
Critical errors:
- Markdown rendering failures
- Component errors

## Using Debug Utilities

### In Browser Console

1. **Open Developer Tools** (F12 or Right-click → Inspect)
2. **Navigate to Console tab**
3. **Type debug commands**:

```javascript
// Get help
__STORY_DEBUG__.help()

// Check markdown
__STORY_DEBUG__.checkMarkdown("**Bold** text with *italic*")

// Test typing speed
__STORY_DEBUG__.testTyping("This is a test", 30)
```

### Debugging Story Entries

To inspect story entries in real-time, use the RPG store debug utilities:

```javascript
// Get current story text
__RPG_DEBUG__.getStory()

// Get current state
__RPG_DEBUG__.getState()

// Log state snapshot
__RPG_DEBUG__.logState()
```

## Common Debug Scenarios

### 1. Typing Effect Not Working

**Symptoms**: Text appears instantly without typing animation

**Debug Steps**:
1. Check if typing is enabled:
   ```javascript
   // In StoryWindow component, check enableTyping state
   ```
2. Check console for typing logs:
   ```
   [TypingText] [ACTION] Starting typing effect
   ```
3. Verify entry is marked as new:
   ```
   [StoryWindow] [INFO] New entry created [X]
   ```

### 2. Markdown Not Rendering

**Symptoms**: Markdown syntax appears as plain text

**Debug Steps**:
1. Check for markdown errors:
   ```
   [StoryWindow] [ERROR] Markdown rendering error
   ```
2. Test markdown syntax:
   ```javascript
   __STORY_DEBUG__.checkMarkdown("**test**")
   ```
3. Verify text contains markdown:
   ```javascript
   __RPG_DEBUG__.getStory()
   ```

### 3. Performance Issues

**Symptoms**: Slow typing, laggy scrolling

**Debug Steps**:
1. Check typing performance:
   ```
   [TypingText] [ACTION] Typing completed
   {
     totalTime: "1500ms",
     expectedTime: "900ms",
     efficiency: "60%"
   }
   ```
2. Monitor entry count:
   ```
   [StoryWindow] [ACTION] Story entries updated
   {
     totalEntries: 50,
     typingEntries: 1
   }
   ```

### 4. Entries Not Appearing

**Symptoms**: Story text updates but entries don't show

**Debug Steps**:
1. Check story processing:
   ```
   [StoryWindow] [ACTION] Processing story text
   ```
2. Verify entry creation:
   ```
   [StoryWindow] [INFO] New entry created [X]
   ```
3. Check auto-scroll:
   ```
   [StoryWindow] [INFO] Auto-scrolled story window
   ```

## Performance Monitoring

### Typing Performance

The TypingText component tracks:
- **Actual Duration**: Real time taken
- **Expected Duration**: Calculated time (speed × length)
- **Efficiency**: How close actual is to expected
- **CPS**: Characters per second

Example output:
```
[TypingText] [ACTION] Typing completed
{
  totalTime: "1200ms",
  expectedTime: "900ms",
  efficiency: "75%",
  charactersPerSecond: "25.0"
}
```

### Story Processing Performance

StoryWindow logs processing metrics:
- Entry count
- Typing entries count
- Command vs narrative breakdown
- Processing time

## Debug Best Practices

1. **Enable Debugging in Development**: Always use `VITE_DEBUG_RPG=true` during development
2. **Monitor Console**: Keep console open to catch errors early
3. **Use Debug Utilities**: Leverage `__STORY_DEBUG__` and `__RPG_DEBUG__` for quick checks
4. **Check Performance**: Monitor typing efficiency and story processing times
5. **Test Markdown**: Use `checkMarkdown()` to verify markdown syntax before adding to story

## Disabling Debugging

To disable debugging in production:

1. **Remove environment variables**:
   ```bash
   # Don't set these in production
   # VITE_DEBUG_RPG=false
   ```

2. **Or set explicitly**:
   ```bash
   VITE_DEBUG_RPG=false
   VITE_DEBUG_STORY=false
   VITE_DEBUG_TYPING=false
   ```

Debugging is automatically disabled when:
- `import.meta.env.DEV` is `false` (production build)
- Environment variables are not set

## Integration with Existing RPG Debug

The StoryWindow debugging integrates with the existing RPG store debugging:

```javascript
// Both available in console
__RPG_DEBUG__.help()      // RPG store utilities
__STORY_DEBUG__.help()    // StoryWindow utilities
```

## Example Debug Session

```javascript
// 1. Check configuration
__STORY_DEBUG__.logConfig()

// 2. Test markdown
__STORY_DEBUG__.checkMarkdown("**Bold** *italic* `code`")

// 3. Test typing
__STORY_DEBUG__.testTyping("Hello world", 30)

// 4. Get current story
__RPG_DEBUG__.getStory()

// 5. Submit a command and watch logs
__RPG_DEBUG__.submitCommand("attack")

// 6. Check story again
__RPG_DEBUG__.getStory()
```

## Troubleshooting

### Debug Not Showing

1. **Check environment variables**: Ensure `VITE_DEBUG_RPG=true` is set
2. **Check console filter**: Make sure console isn't filtering out logs
3. **Refresh page**: Debug utilities load on component mount
4. **Check browser**: Some browsers may block console logs

### Too Much Debug Output

1. **Disable specific debuggers**:
   ```bash
   VITE_DEBUG_STORY=false  # Disable StoryWindow only
   VITE_DEBUG_TYPING=false # Disable TypingText only
   ```

2. **Use console filtering**: Filter by `[StoryWindow]` or `[TypingText]`

### Performance Impact

Debug logging has minimal performance impact:
- Logs are only created when debugging is enabled
- Console operations are async
- No impact on production builds (debugging disabled)

## Summary

The debugging system provides:
- ✅ Comprehensive logging for all operations
- ✅ Performance metrics and monitoring
- ✅ Console utilities for quick debugging
- ✅ Error tracking and reporting
- ✅ Integration with existing RPG debug tools

Use these tools to quickly identify and resolve issues with the typing effects, markdown rendering, and story management.


