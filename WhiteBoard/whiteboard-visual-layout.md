# Whiteboard Feature - Visual Layout Documentation

## Overview

This document describes the visual layout, component structure, and UI organization of the Whiteboard feature. It covers both the lobby (room selection) and the active room (drawing interface) views.

---

## 1. Whiteboard Lobby Layout

The lobby is the entry point where users can create new rooms or join existing ones.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Container (max-w-2xl)                        │
│                              Centered                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                   Header Section (centered)                   │  │
│  │                                                                │  │
│  │              Whiteboard (text-3xl font-bold)                  │  │
│  │      Create or join a collaborative whiteboard room           │  │
│  │                    (text-muted-foreground)                    │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐ │
│  │   Create Room Card           │  │   Join Room Card             │ │
│  │                              │  │                              │ │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │ │
│  │  │ Card Header            │  │  │  │ Card Header            │  │ │
│  │  │ Create Room (Title)    │  │  │  │ Join Room (Title)      │  │ │
│  │  │ Start a new...         │  │  │  │ Join an existing...    │  │ │
│  │  │ (Description)          │  │  │  │ (Description)          │  │ │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │ │
│  │                              │  │                              │ │
│  │  ┌────────────────────────┐  │  │  ┌────────────────────────┐  │ │
│  │  │ Card Content           │  │  │  │ Card Content           │  │ │
│  │  │                        │  │  │  │                        │  │ │
│  │  │ Room Name (Label)      │  │  │  │ Game PIN (Label)       │  │ │
│  │  │ [Input: My Whiteboard] │  │  │  │ [Input: 123456]        │  │ │
│  │  │                        │  │  │  │                        │  │ │
│  │  │ Your Name (Label)      │  │  │  │ Your Name (Label)      │  │ │
│  │  │ [Input: Player]        │  │  │  │ [Input: Player]        │  │ │
│  │  │                        │  │  │  │                        │  │ │
│  │  │ [Create Room Button]   │  │  │  │ [Join Room Button]     │  │ │
│  │  │   (full width)         │  │  │  │   (outline variant)    │  │ │
│  │  └────────────────────────┘  │  │  └────────────────────────┘  │ │
│  └──────────────────────────────┘  └──────────────────────────────┘ │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │     Connection Status (if not connected, centered)            │  │
│  │          Connecting to server... (text-muted)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Single Column)

```
┌─────────────────────────────┐
│    Container (full width)   │
│                             │
│  ┌───────────────────────┐  │
│  │   Header (centered)   │  │
│  │                       │  │
│  │   Whiteboard          │  │
│  │   Description text    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Create Room Card    │  │
│  │   (full width)        │  │
│  │                       │  │
│  │   [Form fields]       │  │
│  │   [Create Button]     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Join Room Card      │  │
│  │   (full width)        │  │
│  │                       │  │
│  │   [Form fields]       │  │
│  │   [Join Button]       │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Lobby)

```
WhiteboardLobby
├── Container (mx-auto, max-w-2xl, py-8)
│   ├── Header Section (mb-8, text-center)
│   │   ├── h1 "Whiteboard" (text-3xl, font-bold, mb-2)
│   │   └── p Description (text-muted-foreground)
│   │
│   ├── Grid Container (grid, gap-6, md:grid-cols-2)
│   │   ├── Create Room Card
│   │   │   ├── CardHeader
│   │   │   │   ├── CardTitle "Create Room"
│   │   │   │   └── CardDescription
│   │   │   └── CardContent (space-y-4)
│   │   │       ├── Room Name Input Group
│   │   │       │   ├── Label "Room Name"
│   │   │       │   └── Input (placeholder: "My Whiteboard")
│   │   │       ├── Player Name Input Group
│   │   │       │   ├── Label "Your Name"
│   │   │       │   └── Input (placeholder: "Player")
│   │   │       └── Button "Create Room" (full width, disabled if not connected)
│   │   │
│   │   └── Join Room Card
│   │       ├── CardHeader
│   │       │   ├── CardTitle "Join Room"
│   │       │   └── CardDescription
│   │       └── CardContent (space-y-4)
│   │           ├── Game PIN Input Group
│   │           │   ├── Label "Game PIN"
│   │           │   └── Input (placeholder: "123456", maxLength: 6, numeric only)
│   │           ├── Player Name Input Group
│   │           │   ├── Label "Your Name"
│   │           │   └── Input (placeholder: "Player")
│   │           └── Button "Join Room" (full width, outline variant, disabled if not connected)
│   │
│   └── Connection Status (conditional, mt-4, text-center, text-muted)
│       └── "Connecting to server..." (if !isConnected)
```

### Responsive Behavior

- **Desktop (md and above)**: Two-column grid layout
- **Mobile**: Single column stack
- Cards maintain consistent spacing with gap-6
- Container centered with max-w-2xl constraint
- Padding (py-8) for vertical spacing

---

## 2. Whiteboard Room Layout

The active room view contains the drawing interface with canvas and controls.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Whiteboard Room Container                         │
│                      (flex flex-col h-full)                          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        Header Bar                             │  │
│  │                    (mb-4, flex, items-center)                 │  │
│  │                                                                │  │
│  │  ┌──────────────────────┐          ┌──────────────────────┐  │  │
│  │  │  Title Section       │          │  Leave Room Button   │  │  │
│  │  │                      │          │  (outline variant)    │  │  │
│  │  │  Whiteboard          │          │                      │  │  │
│  │  │  (text-2xl, bold)    │          │                      │  │  │
│  │  │                      │          │                      │  │  │
│  │  │  [👥] 2 players      │          │                      │  │  │
│  │  │  • PIN: 123456       │          │                      │  │  │
│  │  │  (text-sm, muted)    │          │                      │  │  │
│  │  └──────────────────────┘          └──────────────────────┘  │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Toolbar Controls                           │  │
│  │              (flex, gap-4, items-center, mb-4)                │  │
│  │                    (flex-wrap for mobile)                     │  │
│  │                                                                │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │ Color:   │  │ Brush Size:  │  │ [🗑️] Clear Canvas   │  │  │
│  │  │ [■]      │  │ [━━━━━━━━] 5 │  │    (outline)         │  │  │
│  │  │ (picker) │  │  (range)     │  │                      │  │  │
│  │  └──────────┘  └──────────────┘  └──────────────────────┘  │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Canvas Container                         │  │
│  │            (flex-1, overflow-auto, bg-muted/20)               │  │
│  │                  (rounded-lg, p-4)                            │  │
│  │                      (centered content)                        │  │
│  │                                                                │  │
│  │         ┌──────────────────────────────────────┐             │  │
│  │         │   Canvas Wrapper (border-2, rounded) │             │  │
│  │         │      (bg-white, shadow-lg)           │             │  │
│  │         │                                        │             │  │
│  │         │  ┌────────────────────────────────┐  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  │      Canvas (1000x700px)       │  │             │  │
│  │         │  │     (responsive scaling)       │  │             │  │
│  │         │  │      cursor: crosshair         │  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  │                                │  │             │  │
│  │         │  └────────────────────────────────┘  │             │  │
│  │         │                                        │             │  │
│  │         └──────────────────────────────────────┘             │  │
│  │                                                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│   Whiteboard Room           │
│                             │
│  ┌───────────────────────┐  │
│  │   Header              │  │
│  │   Whiteboard          │  │
│  │   [👥] 2 players      │  │
│  │   • PIN: 123456       │  │
│  │   [Leave Room]        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │   Toolbar (wrapped)   │  │
│  │                       │  │
│  │   Color: [■]          │  │
│  │                       │  │
│  │   Brush: [━━━━] 5     │  │
│  │                       │  │
│  │   [🗑️] Clear         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   Canvas Container    │  │
│  │   (scaled to fit)     │  │
│  │                       │  │
│  │   [Drawing Area]      │  │
│  │                       │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘
```

### Component Structure (Room)

```
WhiteboardRoom
├── Container (flex flex-col, h-full)
│   │
│   ├── Header Bar (mb-4, flex, items-center, justify-between)
│   │   ├── Title Section
│   │   │   ├── h1 "Whiteboard" (text-2xl, font-bold, mb-2)
│   │   │   └── Info Row (flex, items-center, gap-2, text-sm, muted)
│   │   │       ├── Users Icon (w-4, h-4)
│   │   │       ├── Player Count "{count} players"
│   │   │       ├── Separator "•"
│   │   │       └── Game PIN "PIN: {pin}" (if available)
│   │   │
│   │   └── Leave Room Button (outline variant)
│   │       └── Navigates to /hub/whiteboard
│   │
│   ├── Toolbar (flex, gap-4, items-center, mb-4, flex-wrap)
│   │   ├── Color Picker Group (flex, items-center, gap-2)
│   │   │   ├── Label "Color:" (text-sm, font-medium)
│   │   │   └── Color Input (w-12, h-8, rounded, border, cursor-pointer)
│   │   │
│   │   ├── Brush Size Group (flex, items-center, gap-2)
│   │   │   ├── Label "Brush Size:" (text-sm, font-medium)
│   │   │   ├── Range Input (w-32, min: 1, max: 50)
│   │   │   └── Size Display (text-sm, w-8, text-right)
│   │   │
│   │   └── Clear Button (outline variant, flex, items-center, gap-2)
│   │       ├── Trash2 Icon (w-4, h-4)
│   │       └── Text "Clear Canvas"
│   │
│   └── Canvas Container (flex-1, overflow-auto, bg-muted/20, rounded-lg, p-4)
│       └── Canvas Wrapper (flex, items-center, justify-center)
│           └── Canvas Container Div
│               ├── Style (border-2, border-border, rounded-lg, overflow-hidden)
│               ├── Style (bg-white, shadow-lg)
│               ├── Dimensions (1000px × 700px, responsive scaling)
│               ├── Aspect Ratio (1000/700)
│               └── Canvas Element
│                   ├── ref={canvasRef}
│                   ├── style (display: block, cursor: crosshair)
│                   └── Fabric.js Canvas Instance
```

### Canvas Dimensions & Scaling

- **Fixed Internal Dimensions**: 1000px × 700px
- **Aspect Ratio**: 10:7 (approximately 1.43:1)
- **Responsive Behavior**:
  - Canvas maintains aspect ratio
  - Scales down to fit container
  - Maximum width/height: 100%
  - Centered within container

### Empty State

When user is not in a room:

```
┌─────────────────────────────────────┐
│                                     │
│          (centered content)         │
│                                     │
│     "Not in a room"                 │
│     (text-muted-foreground)         │
│                                     │
│     [Go to Whiteboard Button]       │
│                                     │
└─────────────────────────────────────┘
```

---

## 3. Visual Design Details

### Color Scheme

- **Background**: System background color
- **Card Background**: Card component default
- **Canvas Background**: White (#ffffff)
- **Canvas Border**: Border color (2px solid)
- **Muted Background**: bg-muted/20 for canvas container
- **Text Primary**: Default text color
- **Text Muted**: text-muted-foreground for secondary text

### Typography

- **Main Title (Lobby)**: text-3xl, font-bold
- **Room Title**: text-2xl, font-bold
- **Card Titles**: CardTitle component
- **Labels**: text-sm, font-medium
- **Body Text**: Default
- **Muted Text**: text-muted-foreground, text-sm

### Spacing

- **Container Padding**: py-8 (vertical), mx-auto (horizontal centering)
- **Card Gap**: gap-6 between cards
- **Form Field Spacing**: space-y-4 within CardContent
- **Input Group Spacing**: space-y-2
- **Toolbar Gap**: gap-4 between controls
- **Header Margin**: mb-4 (margin bottom)

### Interactive Elements

#### Buttons
- **Primary Button**: Default variant (Create Room)
- **Secondary Button**: Outline variant (Join Room, Leave Room, Clear)
- **Full Width**: w-full for form buttons
- **Disabled State**: Disabled when not connected

#### Inputs
- **Text Inputs**: Standard Input component
- **Color Picker**: Native HTML color input (12×8px display)
- **Range Slider**: 32px width, shows current value
- **Cursor**: Pointer for color picker, default for text inputs

#### Canvas
- **Cursor**: crosshair when over canvas
- **Drawing**: Immediate visual feedback
- **Interaction**: Mouse/touch events for drawing

---

## 4. Responsive Breakpoints

### Mobile First Approach

- **Base (Mobile)**: Single column layout
  - Cards stack vertically
  - Toolbar wraps to multiple rows
  - Full-width inputs and buttons

- **Medium (md: 768px+)**: Two-column layout
  - Create/Join cards side-by-side
  - Toolbar remains single row if space allows

### Container Constraints

- **Lobby**: max-w-2xl (672px max width)
- **Room**: Full height (h-full), full width
- **Canvas**: Responsive scaling within container

---

## 5. Layout Hierarchy

### Lobby Page Structure

```
Page Container
└── WhiteboardProvider (Context Provider)
    └── Routes
        └── Route "/hub/whiteboard"
            └── WhiteboardLobby
                ├── Container (centered, max-w-2xl)
                ├── Header (title + description)
                ├── Grid (Create + Join cards)
                └── Connection Status (conditional)
```

### Room Page Structure

```
Page Container
└── WhiteboardProvider (Context Provider)
    └── Routes
        └── Route "/hub/whiteboard/room/:roomId"
            └── WhiteboardRoom
                ├── Header Bar
                ├── Toolbar Controls
                └── Canvas Container
                    └── Fabric.js Canvas
```

---

## 6. State-Dependent UI Elements

### Connection Status Indicator
- **Visible**: Only when `!isConnected`
- **Position**: Below cards, centered
- **Text**: "Connecting to server..."
- **Style**: text-sm, text-muted-foreground

### Room Information Display
- **Players Count**: Always shown when in room
- **Game PIN**: Only shown if PIN exists
- **Format**: "👥 {count} players • PIN: {pin}"

### Button States
- **Create/Join Buttons**: Disabled if `!isConnected`
- **Clear Button**: Always enabled when in room
- **Leave Room Button**: Always visible when in room

---

## 7. Canvas Interaction Area

### Canvas Dimensions
- **Logical Size**: 1000px × 700px (internal coordinate system)
- **Display Size**: Scaled to fit container (maintains aspect ratio)
- **Background**: White
- **Border**: 2px solid border color

### Drawing Area Behavior
- **Full Canvas Area**: Drawable
- **Responsive Scaling**: Maintains aspect ratio
- **Overflow**: Canvas container scrolls if needed
- **Centering**: Canvas centered within container

### Toolbar Controls Relationship
- **Color Picker**: Sets brush stroke color
- **Brush Size**: Sets stroke width (1-50px range)
- **Clear Button**: Broadcasts clear to all users

---

## 8. Navigation Flow

```
┌─────────────┐
│   GameHub   │
└──────┬──────┘
       │
       ├───> /hub/whiteboard
       │     │
       │     └───> WhiteboardLobby
       │           │
       │           ├─── Create Room ──┐
       │           │                   │
       │           └─── Join Room ─────┤
       │                               │
       │                               ▼
       │                    /hub/whiteboard/room/:roomId
       │                          │
       │                          └───> WhiteboardRoom
       │                                    │
       │                                    └─── Leave Room ──> Back to Lobby
       │
```

---

## 9. Accessibility Considerations

### Visual Structure
- **Semantic HTML**: Proper heading hierarchy (h1 for main title)
- **Labels**: All inputs have associated labels
- **Icon + Text**: Icons paired with text labels

### Interactive Elements
- **Keyboard Navigation**: All inputs and buttons are keyboard accessible
- **Enter Key**: Submits forms in input fields
- **Focus States**: Visible focus indicators on interactive elements

### Color Contrast
- **Text**: Meets contrast requirements (uses theme colors)
- **Muted Text**: Still readable for secondary information

---

## 10. Component Dependencies

### UI Components Used
- **Button**: From `@/components/ui/button`
- **Input**: From `@/components/ui/input`
- **Label**: From `@/components/ui/label`
- **Card**: From `@/components/ui/card` (Card, CardContent, CardHeader, CardTitle, CardDescription)

### Icons Used
- **Users**: From `lucide-react` (player count)
- **Trash2**: From `lucide-react` (clear button)

### External Libraries
- **Fabric.js**: Canvas rendering and drawing
- **Socket.io Client**: Real-time communication
- **React Router**: Navigation

---

## Summary

The Whiteboard feature uses a clean, two-view layout:

1. **Lobby View**: Simple two-card interface for room creation/joining, responsive grid layout
2. **Room View**: Full-height drawing interface with header, toolbar, and centered canvas

Both views maintain consistency with the GameHub design system using shadcn-ui components and Tailwind CSS styling. The layout is fully responsive, working seamlessly from mobile to desktop screens.











