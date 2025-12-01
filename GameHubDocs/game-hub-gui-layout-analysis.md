# Game Hub GUI Layout Analysis

## Overview
The Game Hub uses a three-section layout: **Sidebar**, **TopBar**, and **Main Content Area**.

## Layout Structure

### HubLayout Component (`src/components/HubLayout.tsx`)
- **Container**: Full-screen flex container with `h-screen` and `overflow-hidden`
- **Layout**: Horizontal flex with Sidebar on left, content area on right

```
┌─────────────────────────────────────────┐
│  Sidebar  │  TopBar                     │
│           ├─────────────────────────────┤
│           │  Main Content (Outlet)     │
│           │                             │
└───────────┴─────────────────────────────┘
```

## Components

### 1. Sidebar (`src/components/Sidebar.tsx`)
- **Width**: Fixed `w-16` (64px)
- **Position**: Left side, full height
- **Background**: `bg-sidebar-bg` with right border
- **Content**:
  - Logo: "G" icon at top
  - Navigation items (icon-only):
    - Home (`/hub`)
    - Library (`/hub/library`)
    - Recent (`/hub/recent`)
    - Favorites (`/hub/favorites`)
    - Trending (`/hub/trending`)
    - Friends (`/hub/friends`)
  - Settings button at bottom
- **Styling**: Active state uses primary color with shadow

### 2. TopBar (`src/components/TopBar.tsx`)
- **Height**: Fixed `h-16` (64px)
- **Position**: Top of main content area
- **Background**: `bg-topbar-bg` with bottom border
- **Left Section**:
  - Navigation tabs: "My Games", "Store", "Community"
  - "My Games" is active by default
- **Right Section**:
  - Search input (64px width) with search icon
  - Notification bell with red dot indicator
  - User profile dropdown:
    - Shows avatar preview (32x32)
    - Username
    - Dropdown menu: Settings, Logout
    - Falls back to "Player" if not authenticated

### 3. Main Content Area
- **Container**: Flex column, takes remaining space (`flex-1`)
- **Padding**: `p-8` (32px)
- **Scroll**: `overflow-y-auto` for vertical scrolling
- **Content**: Renders child routes via `<Outlet />`

## Pages

### AllGames (`/hub`)
- **Title**: "My Games" with subtitle "Your gaming library"
- **Layout**: Responsive grid
  - Mobile: 2 columns
  - Medium: 3 columns
  - Large: 4 columns
  - XL: 5 columns
- **Content**: GameCard components showing all available games
- **Features**: Shows "Last played" timestamp on hover

### Library (`/hub/library`)
- **Header**: "BOOKS" title with "LIBRARY" and "ORDERS" tabs
- **Top Actions**: "Order a New Book" button, user avatar
- **Search**: Full-width search with category filter
- **Tabs**: "Recommended" and "Recently Saved"
- **Content**: 
  - Horizontal scrollable book cards
  - Table view with book details
  - Promotional card for textbook campaign

### GameDetail (`/hub/games/:gameId`)
- **Back Button**: Returns to `/hub`
- **Hero Section**: GameHero component
- **Layout**: 2-column grid (details + sidebar)
- **Content**:
  - About section
  - Screenshots gallery
  - Preview component
  - Game info card (status, players, metrics)
  - Related games section

## GameCard Component
- **Aspect Ratio**: 3:4 (portrait)
- **Image**: Background or thumbnail image
- **Hover Effects**:
  - Scale up (105%)
  - Shadow with primary color
  - Gradient overlay appears
  - Shows game title and "Last played" text
  - Play button appears
- **Fallback**: Game emoji (🎮) if image fails

## Styling
- **Theme**: Uses CSS variables for colors (`--background`, `--foreground`, etc.)
- **Colors**: 
  - Sidebar: `bg-sidebar-bg`
  - TopBar: `bg-topbar-bg`
  - Cards: `bg-game-card`
- **Borders**: Consistent `border-border` color
- **Transitions**: Smooth hover effects on interactive elements

## Routing
All hub routes are nested under `/hub`:
- `/hub` → AllGames (index)
- `/hub/library` → Library
- `/hub/games/:gameId` → GameDetail
- `/hub/games/*` → Individual game routes (ping-pong, trivia-blitz, etc.)

## Responsive Design
- Sidebar: Fixed width, always visible
- TopBar: Full width, fixed height
- Content: Responsive grid adjusts columns based on screen size
- Search: Fixed width (256px) in TopBar

