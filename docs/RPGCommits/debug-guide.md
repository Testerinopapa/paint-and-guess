# RPG Integration Debug Guide

This guide explains the comprehensive debugging system added to the RPG game integration.

## Overview

The debugging system provides:
- **Centralized logging** with category-based filtering
- **Performance tracking** for operations
- **Content generation debugging** for Faker.js/Chance.js
- **Inventory operation tracking**
- **Animation lifecycle monitoring**
- **Console utilities** for testing and inspection

## Debug Configuration

Debug modes can be controlled via environment variables:

```bash
# Enable all RPG debugging
VITE_DEBUG_RPG=true

# Enable specific categories
VITE_DEBUG_CONTENT=true    # Content generation
VITE_DEBUG_INVENTORY=true  # Inventory operations
VITE_DEBUG_ANIMATIONS=true # Animation lifecycle
```

In development mode, all debugging is enabled by default.

## Console Utilities

All debug utilities are exposed on `window.__RPG_DEBUG_INTEGRATION__` in development.

### Getting Help

```javascript
__RPG_DEBUG_INTEGRATION__.help()
```

### Logger Utilities

```javascript
// Get all logs (optionally filtered)
__RPG_DEBUG_INTEGRATION__.logs.getAll()
__RPG_DEBUG_INTEGRATION__.logs.getAll("Content", "action", 50) // category, level, limit

// Get statistics
__RPG_DEBUG_INTEGRATION__.logs.getStats()

// Clear logs
__RPG_DEBUG_INTEGRATION__.logs.clear()

// Export logs as JSON
__RPG_DEBUG_INTEGRATION__.logs.export()
```

### Content Generation Testing

```javascript
// Generate test content
__RPG_DEBUG_INTEGRATION__.content.generateNPC()
__RPG_DEBUG_INTEGRATION__.content.generateItem()
__RPG_DEBUG_INTEGRATION__.content.generateMonster(5) // with character level
__RPG_DEBUG_INTEGRATION__.content.generateLocation()
__RPG_DEBUG_INTEGRATION__.content.generateLootTable("high")
```

### Inventory Management

```javascript
// Get current inventory
__RPG_DEBUG_INTEGRATION__.inventory.getItems()

// Add item (generates random if not provided)
__RPG_DEBUG_INTEGRATION__.inventory.addItem()
__RPG_DEBUG_INTEGRATION__.inventory.addItem(customItem)

// Remove item
__RPG_DEBUG_INTEGRATION__.inventory.removeItem(item)

// Clear inventory
__RPG_DEBUG_INTEGRATION__.inventory.clear()
```

### Performance Tracking

```javascript
// Get performance stats for all operations
__RPG_DEBUG_INTEGRATION__.performance.getStats()

// Get stats for specific operation
__RPG_DEBUG_INTEGRATION__.performance.getStats("inventory.addItem")

// Clear performance data
__RPG_DEBUG_INTEGRATION__.performance.clear()
__RPG_DEBUG_INTEGRATION__.performance.clear("inventory.addItem")
```

### Configuration

```javascript
// View current debug configuration
__RPG_DEBUG_INTEGRATION__.config
```

## Debug Categories

### Content Generation

All content generation functions log their operations:

- **NPC Generation**: Logs name, title, dialogue, quest
- **Item Generation**: Logs type, rarity, value, generation time
- **Monster Generation**: Logs name, level, HP, loot, character level used
- **Location Generation**: Logs name, description, danger level
- **Loot Table Generation**: Logs difficulty, item count, items generated

### Inventory Operations

Tracks all inventory changes:

- **Item Added**: Logs item details, inventory size, total value
- **Item Removed**: Logs item details, inventory size after removal
- **Panel Open/Close**: Logs state changes
- **Errors**: Logs when items not found or operations fail

### Animation Lifecycle

Monitors animation events:

- **Start**: When animations begin
- **Complete**: When animations finish (with duration)
- **Errors**: When animations fail

Tracked components:
- `PlayerPanel`: Render, stat updates
- `ActionPanel`: Mount, button interactions
- `InventoryPanel`: Open, close, item animations
- `StoryWindow`: Text entry animations

### Performance Metrics

Tracks operation timing:

- `inventory.addItem`: Time to add items
- `inventory.removeItem`: Time to remove items
- `command.searchForTreasure`: Loot generation time
- `PlayerPanel.render`: Component render time
- `Content Generation`: Individual generation times

## Log Levels

- **info**: General information
- **warn**: Warnings (non-critical issues)
- **error**: Errors (critical issues)
- **action**: User actions and state changes
- **success**: Successful operations

## Example Usage

### Testing Content Generation

```javascript
// Generate and inspect an item
const item = await __RPG_DEBUG_INTEGRATION__.content.generateItem();
console.log("Generated item:", item);

// Generate a monster for level 10 character
const monster = await __RPG_DEBUG_INTEGRATION__.content.generateMonster(10);
console.log("Monster stats:", { name: monster.name, level: monster.level, hp: monster.hp });
```

### Testing Inventory

```javascript
// Add 5 random items
for (let i = 0; i < 5; i++) {
  await __RPG_DEBUG_INTEGRATION__.inventory.addItem();
}

// Check inventory
const items = __RPG_DEBUG_INTEGRATION__.inventory.getItems();
console.log(`Inventory has ${items.length} items`);

// View performance stats
const stats = __RPG_DEBUG_INTEGRATION__.performance.getStats("inventory.addItem");
console.log("Add item performance:", stats);
```

### Analyzing Logs

```javascript
// Get all content generation logs
const contentLogs = __RPG_DEBUG_INTEGRATION__.logs.getAll("Content");

// Get error logs only
const errors = __RPG_DEBUG_INTEGRATION__.logs.getAll(undefined, "error");

// Get statistics
const stats = __RPG_DEBUG_INTEGRATION__.logs.getStats();
console.log("Log statistics:", stats);

// Export for analysis
const exportData = __RPG_DEBUG_INTEGRATION__.logs.export();
console.log(JSON.stringify(exportData, null, 2));
```

## Integration with Existing Debug

The new debug system integrates with the existing `__RPG_DEBUG__` utilities:

- **Store Debug**: `__RPG_DEBUG__` (from useRpgStore.tsx)
- **Story Debug**: `__STORY_DEBUG__` (from StoryWindow.tsx)
- **Integration Debug**: `__RPG_DEBUG_INTEGRATION__` (new)

All systems work together and can be used simultaneously.

## Best Practices

1. **Use specific categories** when filtering logs to reduce noise
2. **Track performance** for operations that might be slow
3. **Export logs** before clearing for analysis
4. **Test content generation** before using in production
5. **Monitor inventory operations** to catch bugs early

## Troubleshooting

### Debug utilities not available

- Ensure you're in development mode (`import.meta.env.DEV`)
- Check that `VITE_DEBUG_RPG=true` is set
- Verify the debug module is imported in `pages/Index.tsx`

### No logs appearing

- Check browser console filter settings
- Verify debug configuration: `__RPG_DEBUG_INTEGRATION__.config`
- Ensure operations are being performed (logs only appear on actions)

### Performance tracking not working

- Performance tracking requires explicit calls to `performanceTracker.start()`
- Check that operations are wrapped with performance tracking
- Use `getStats()` to verify tracking is active

