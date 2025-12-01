# GameHub Redirect & Rewrite Rules

This document lists all possible redirect and rewrite rules for the GameHub application based on the current routing configuration.

## Overview

The GameHub uses React Router for client-side routing. For static site hosting (like Render), you need rewrite rules to serve `index.html` for all routes, allowing React Router to handle the routing client-side.

## SPA Routing Rules (Rewrites)

These rules ensure all routes are handled by React Router. **Use rewrites (not redirects)** to preserve the URL while serving `index.html`.

### Universal SPA Rewrite (Recommended)
This single rule handles all client-side routes:

| Source | Destination | Action | Status Code | Notes |
|--------|-------------|--------|-------------|-------|
| `/*` | `/index.html` | Rewrite | 200 | Catches all routes and serves index.html for React Router |

**Render Dashboard Format:**
- **Source**: `/*`
- **Destination**: `/index.html`
- **Action**: Rewrite

**Important Note**: The router has been updated to handle direct access to `/index.html` by redirecting it to `/`. This ensures that if someone directly accesses `/index.html`, they'll be properly redirected through the authentication flow.

---

## Legacy Route Redirects (Optional)

If you want to handle legacy route redirects at the server level (instead of client-side), you can add these redirects. However, the current implementation handles these client-side via `GameRouteRedirect` component.

### Old Game Routes → New Hub Routes

| Source | Destination | Action | Status Code | Notes |
|--------|-------------|--------|-------------|-------|
| `/games/*` | `/hub/games/*` | Redirect | 301 | Redirects old `/games/*` paths to `/hub/games/*` |

**Render Dashboard Format:**
- **Source**: `/games/*`
- **Destination**: `/hub/games/*`
- **Action**: Redirect
- **Status Code**: 301 (Permanent Redirect)

**Note**: This is currently handled client-side by the `GameRouteRedirect` component. Adding it as a server-side redirect is optional but can improve SEO and reduce client-side redirect overhead.

---

## Complete Route List

For reference, here are all the routes defined in the application:

### Public Routes
- `/` - Root (redirects to `/login` or `/hub` based on auth status)
- `/login` - Login page
- `/register` - Registration page

### Protected Hub Routes (require authentication)
- `/hub` - Hub main page (AllGames - game listing)
- `/hub/library` - User's game library
- `/hub/games/:gameId` - Game detail page (dynamic game ID)

### Game Routes (under `/hub/games/`)
- `/hub/games/ping-pong` - Ping Pong game
- `/hub/games/chronicles-of-the-abyss` - RPG game (Chronicles of the Abyss)
- `/hub/games/trivia-blitz` - Trivia Blitz lobby
- `/hub/games/trivia-blitz/room/:roomId` - Trivia Blitz game room (dynamic room ID)
- `/hub/games/canva` - Canva game lobby
- `/hub/games/canva/room/:roomId` - Canva game room (dynamic room ID)

### Legacy Routes (handled by client-side redirect)
- `/games/*` - Any old game route (redirects to `/hub/games/*`)

### Special Routes
- `/index.html` - Redirects to `/` (handles direct access to index.html file)

### Error Routes
- `*` - 404 Not Found page (catch-all for undefined routes)

---

## Recommended Configuration

### For Render Static Site

**Minimum Required Rule:**
1. **Universal SPA Rewrite**
   - Source: `/*`
   - Destination: `/index.html`
   - Action: Rewrite
   - Status: 200

**Optional Additional Rule:**
2. **Legacy Route Redirect** (if you want server-side redirects)
   - Source: `/games/*`
   - Destination: `/hub/games/*`
   - Action: Redirect
   - Status: 301

### Implementation Steps

1. **Go to Render Dashboard**
   - Navigate to your `paint-and-guess-frontend` static site
   - Click on "Settings"
   - Find "Redirects/Rewrites" section

2. **Add Universal SPA Rewrite**
   - Click "Add Redirect/Rewrite"
   - Set Source: `/*`
   - Set Destination: `/index.html`
   - Select Action: **Rewrite** (not Redirect)
   - Save

3. **Optional: Add Legacy Redirect**
   - Click "Add Redirect/Rewrite"
   - Set Source: `/games/*`
   - Set Destination: `/hub/games/*`
   - Select Action: **Redirect**
   - Set Status Code: 301
   - Save

---

## Alternative: Using `_redirects` File

If your hosting provider supports `_redirects` files (like Netlify), you can use:

```
# Universal SPA rewrite
/*    /index.html   200

# Legacy route redirect (optional)
/games/*    /hub/games/*    301
```

**Note**: Render static sites may not automatically support `_redirects` files. Use the dashboard configuration method above for Render.

---

## Testing Routes

After configuring redirects/rewrites, test these scenarios:

1. **Direct URL Access**
   - Navigate directly to `https://your-domain.com/hub` (should load, not 404)
   - Navigate directly to `https://your-domain.com/hub/games/trivia-blitz` (should load)
   - Navigate directly to `https://your-domain.com/login` (should load)
   - Navigate directly to `https://your-domain.com/index.html` (should redirect to `/` and then to `/login` or `/hub` based on auth)

2. **Legacy Route Redirects** (if configured)
   - Navigate to `https://your-domain.com/games/trivia-blitz` (should redirect to `/hub/games/trivia-blitz`)

3. **Client-Side Navigation**
   - Click links within the app (should work smoothly)
   - Use browser back/forward buttons (should work correctly)

4. **404 Handling**
   - Navigate to a non-existent route like `/nonexistent` (should show 404 page)

---

## Notes

- **Rewrites vs Redirects**: Use **rewrites** for SPA routing (preserves URL, serves index.html). Use **redirects** for permanent URL changes (changes URL in browser).
- **Status Codes**: 
  - `200` for rewrites (serves content without changing URL)
  - `301` for permanent redirects (tells browsers/search engines the URL has moved)
  - `302` for temporary redirects (less common, use 301 for permanent moves)
- **Wildcards**: The `/*` pattern matches all routes. More specific rules should be listed before the catch-all rule.
- **Order Matters**: If using multiple rules, more specific rules should come before general ones.

