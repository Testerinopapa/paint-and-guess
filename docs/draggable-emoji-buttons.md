# Draggable Emoji Buttons Guide

Simple guide for creating draggable emoji buttons that open popup panels.

## Overview

Draggable emoji buttons are fixed-position UI elements that:
- Display as large emojis (3rem size)
- Can be dragged around the screen
- Open popup panels when clicked (not dragged)
- Spawn side-by-side at the bottom of the screen

## Dependencies

```typescript
import Draggable from "react-draggable";
import { useState, useRef, useEffect } from "react";
```

## Basic Pattern

### 1. State Setup

```typescript
// Position state (initialize with fallback)
const [emojiPos, setEmojiPos] = useState(() => {
  if (typeof window !== "undefined") {
    return { x: window.innerWidth - 120, y: window.innerHeight - 120 };
  }
  return { x: 0, y: 0 };
});

// Ref for react-draggable
const emojiNodeRef = useRef<HTMLDivElement>(null);

// Track if user was dragging (to distinguish from click)
const wasDragging = useRef(false);
```

### 2. Position Initialization

```typescript
useEffect(() => {
  const updatePositions = () => {
    if (typeof window !== "undefined") {
      setEmojiPos({
        x: window.innerWidth - 120,  // Adjust X for spacing
        y: window.innerHeight - 120, // Bottom of screen
      });
    }
  };
  
  updatePositions();
  window.addEventListener("resize", updatePositions);
  return () => window.removeEventListener("resize", updatePositions);
}, []);
```

### 3. Click Handler

```typescript
const handleClick = (e: React.MouseEvent) => {
  // Only trigger action if we didn't just drag
  if (!wasDragging.current) {
    e.stopPropagation();
    onOpenPanel(); // Your callback function
  }
  wasDragging.current = false;
};
```

### 4. Draggable Component

```typescript
<Draggable
  nodeRef={emojiNodeRef}
  defaultPosition={emojiPos}
  onStart={() => {
    wasDragging.current = false;
  }}
  onDrag={(e, data) => {
    // Only consider it dragging if moved more than 5px
    if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
      wasDragging.current = true;
    }
  }}
  onStop={() => {
    // Reset after a short delay to allow click to fire
    setTimeout(() => {
      wasDragging.current = false;
    }, 50);
  }}
>
  <div
    ref={emojiNodeRef}
    onClick={handleClick}
    style={{
      position: "fixed",
      zIndex: 40,
      cursor: "grab",
      left: 0,
      top: 0,
      fontSize: "3rem",
      userSelect: "none",
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.cursor = "grabbing";
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.cursor = "grab";
    }}
    title="Click to open panel, drag to move"
  >
    📦 {/* Your emoji */}
  </div>
</Draggable>
```

## Complete Example

Here's a complete example for a new emoji button:

```typescript
// In your component (e.g., ActionPanel.tsx)

// 1. Add state
const [newEmojiPos, setNewEmojiPos] = useState(() => {
  if (typeof window !== "undefined") {
    return { x: window.innerWidth - 360, y: window.innerHeight - 120 };
  }
  return { x: 0, y: 0 };
});

const newEmojiNodeRef = useRef<HTMLDivElement>(null);
const newWasDragging = useRef(false);

// 2. Add to useEffect for position updates
useEffect(() => {
  const updatePositions = () => {
    if (typeof window !== "undefined") {
      // ... existing positions ...
      setNewEmojiPos({
        x: window.innerWidth - 360, // Adjust spacing (80px between emojis)
        y: window.innerHeight - 120,
      });
    }
  };
  // ... rest of useEffect
}, []);

// 3. Add click handler
const handleNewClick = (e: React.MouseEvent) => {
  if (!newWasDragging.current) {
    e.stopPropagation();
    onOpenNewPanel(); // Your callback
  }
  newWasDragging.current = false;
};

// 4. Add Draggable component in JSX
<Draggable
  nodeRef={newEmojiNodeRef}
  defaultPosition={newEmojiPos}
  onStart={() => { newWasDragging.current = false; }}
  onDrag={(e, data) => {
    if (Math.abs(data.deltaX) > 5 || Math.abs(data.deltaY) > 5) {
      newWasDragging.current = true;
    }
  }}
  onStop={() => {
    setTimeout(() => { newWasDragging.current = false; }, 50);
  }}
>
  <div
    ref={newEmojiNodeRef}
    onClick={handleNewClick}
    style={{
      position: "fixed",
      zIndex: 40,
      cursor: "grab",
      left: 0,
      top: 0,
      fontSize: "3rem",
      userSelect: "none",
    }}
    onMouseDown={(e) => { e.currentTarget.style.cursor = "grabbing"; }}
    onMouseUp={(e) => { e.currentTarget.style.cursor = "grab"; }}
    title="Click to open new panel, drag to move"
  >
    🎯 {/* Your emoji */}
  </div>
</Draggable>
```

## Key Points

### Position Spacing
- **80px spacing** between emojis (recommended)
- Rightmost: `window.innerWidth - 120`
- Middle: `window.innerWidth - 200`
- Left: `window.innerWidth - 280`
- New leftmost: `window.innerWidth - 360`

### Drag Detection
- Uses `deltaX` and `deltaY` to detect movement
- Only counts as drag if moved **>5px**
- Prevents accidental drags from blocking clicks

### Z-Index Layers
- **Emoji buttons:** `z-40` (above main content)
- **Popup panels:** `z-50` (above emoji buttons)

### Required Props Pattern
```typescript
interface ComponentProps {
  // ... other props
  onOpenNewPanel?: () => void; // Optional callback
}
```

## Quick Checklist

When creating a new draggable emoji button:

- [ ] Add position state with fallback
- [ ] Add `useRef` for the node
- [ ] Add `wasDragging` ref
- [ ] Add position to `useEffect` update function
- [ ] Add click handler function
- [ ] Add `Draggable` component with all handlers
- [ ] Add callback prop to component interface
- [ ] Pass callback from parent component
- [ ] Choose emoji and adjust X position for spacing

## Common Issues

### Emoji not draggable
- Make sure `nodeRef` is passed to both `Draggable` and the `div`
- Check that `position: "fixed"` is set in style

### Click not working
- Verify `wasDragging.current` is being reset properly
- Check that `onStop` has the setTimeout delay

### Emojis overlapping
- Adjust X positions (use 80px spacing)
- Update all positions in the `useEffect` resize handler



