# Library Implementation Documentation

## Overview

The Library feature provides a comprehensive book browsing and reading interface integrated with Project Gutenberg's free e-book collection via the Gutendex API. Users can search, filter, and access thousands of public domain books directly from the application.

## Architecture

### Components

1. **Library Page** (`src/pages/Library.tsx`)
   - Main component that renders the library interface
   - Handles user interactions (search, filtering, book selection)
   - Displays recommended books and full book table

2. **Gutenberg Books Hook** (`src/hooks/useGutenbergBooks.ts`)
   - Custom React Query hook for fetching books from Gutendex API
   - Manages API state, caching, and error handling

3. **Gutenberg Utilities** (`src/lib/gutenberg.ts`)
   - Data transformation functions
   - Category mapping and cover color generation
   - Type definitions for library books

## API Integration

### Gutendex API

The library uses the **Gutendex API** (`https://gutendex.com/`), which is a REST API wrapper around Project Gutenberg's catalog.

#### Endpoints Used

- `GET /books/` - List books with optional query parameters
  - `search` - Search books by title, author, or subject
  - `topic` - Filter by topic/subject
  - `page` - Pagination support

#### Example API Call

```typescript
GET https://gutendex.com/books/?search=shakespeare&topic=fiction&page=1
```

#### Response Structure

```typescript
interface GutenbergResponse {
  count: number;           // Total number of results
  next: string | null;     // URL for next page
  previous: string | null; // URL for previous page
  results: GutenbergBook[];
}

interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{
    name: string;
    birth_year: number | null;
    death_year: number | null;
  }>;
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: {
    [key: string]: string; // Format type -> URL mapping
  };
  download_count: number;
}
```

## Component Structure

### Library Page Layout

```
Library
├── Top Bar
│   ├── "BOOKS" Logo
│   ├── Navigation Tabs (LIBRARY, ORDERS)
│   ├── "Order a New Book" Button
│   └── User Profile
├── Search and Filter Section
│   ├── Search Input (with debouncing)
│   └── Category Dropdown
├── Recommended Section
│   ├── Tabs (Recommended, Recently Saved)
│   ├── Horizontal Scrollable Book Cards
│   └── Promotional Card
└── Books Table
    ├── Table Headers
    └── Book Rows with Actions
```

## Key Features

### 1. Search Functionality

- **Debounced Search**: 500ms delay to reduce API calls
- Searches across title, author, and subjects
- Real-time results as user types

```typescript
const debouncedSearch = useDebounce(searchQuery, 500);

const { data } = useGutenbergBooks({
  search: debouncedSearch || undefined,
  // ...
});
```

### 2. Category Filtering

Categories are mapped from Gutenberg subjects:

- **Fiction**: Fiction, Poetry, Drama, Adventure, Romance, Horror, Fantasy, Science fiction
- **Mystery**: Mystery
- **Biography**: Biography
- **Non-Fiction**: History, Science, Philosophy

```typescript
const subjectToCategory: Record<string, string> = {
  "Fiction": "Fiction",
  "Mystery": "Mystery",
  "Biography": "Biography",
  "History": "Non-Fiction",
  // ...
};
```

### 3. Recommended Books

- Automatically selects top 4 most downloaded books
- Sorted by `download_count` in descending order
- Displayed in horizontal scrollable cards

```typescript
const recommendedBooks = useMemo(() => {
  const sorted = [...libraryBooks].sort((a, b) => b.downloadCount - a.downloadCount);
  return sorted.slice(0, 4).map(book => ({
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.category,
    coverColor: getCoverColor(book.category),
  }));
}, [libraryBooks]);
```

### 4. Book Cards

Each book card displays:
- Color-coded cover (based on category)
- Genre badge
- Title (truncated if too long)
- Author name

Cover colors:
- Fiction: Teal (`bg-teal-500`)
- Mystery: Blue (`bg-blue-600`)
- Biography: Green (`bg-green-400`)
- Non-Fiction: Purple (`bg-purple-500`)

### 5. Book Table

The table shows:
- **Title**: Full book title
- **Author**: Author name(s)
- **Category**: Badge with category
- **Availability**: Always "Available" (all Gutenberg books are free)
- **Status**: Always "Free"
- **Action**: "Read now" button that opens book in new tab

## Data Flow

```
User Input (Search/Filter)
    ↓
useDebounce Hook (500ms delay)
    ↓
useGutenbergBooks Hook
    ↓
Gutendex API Request
    ↓
API Response
    ↓
transformGutenbergBook Function
    ↓
LibraryBook[] Array
    ↓
Component Rendering
```

## State Management

### React Query Configuration

```typescript
useQuery({
  queryKey: ["gutenberg-books", search, topic, page],
  queryFn: () => fetchGutenbergBooks(options),
  enabled: options.enabled !== false,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,     // 10 minutes
});
```

- **Query Key**: Includes search, topic, and page for proper caching
- **Stale Time**: Data considered fresh for 5 minutes
- **Cache Time**: Data kept in cache for 10 minutes

## Error Handling

### Loading States

- Skeleton loaders for book cards
- Skeleton loaders for table rows
- Loading indicators during API calls

### Error States

```typescript
{error && (
  <div className="text-center py-8 text-destructive">
    Failed to load books. Please try again.
  </div>
)}
```

### Empty States

```typescript
{libraryBooks.length === 0 && !isLoading && (
  <div className="text-center py-8 text-muted-foreground">
    {searchQuery 
      ? "No books found. Try a different search." 
      : "No books available."}
  </div>
)}
```

## Book Access

### Download URLs

Books are accessed via their format URLs, prioritized as:
1. `text/html` - HTML format (preferred)
2. `text/plain; charset=utf-8` - Plain text with UTF-8
3. `application/epub+zip` - EPUB format
4. `text/plain` - Plain text fallback

### Opening Books

```typescript
const handleBookAction = (book: LibraryBook) => {
  if (book.downloadUrl) {
    window.open(book.downloadUrl, "_blank");
  }
};
```

Books open in a new tab to preserve the library interface.

## Type Definitions

### LibraryBook Interface

```typescript
interface LibraryBook {
  id: string;              // Unique identifier (gutenberg-{id})
  title: string;           // Book title
  author: string;          // Author name(s)
  category: string;        // Mapped category
  availability: string;    // Always "Available"
  status: string;          // Always "Free"
  action: string;          // Always "Read now"
  gutenbergId: number;     // Original Gutenberg ID
  downloadUrl?: string;    // URL to read/download book
  coverImageUrl?: string;  // Future: cover image URL
  subjects: string[];      // Original subjects from API
  downloadCount: number;   // Popularity metric
}
```

## Utilities

### transformGutenbergBook

Transforms a Gutenberg API book object into the Library format:

```typescript
function transformGutenbergBook(book: GutenbergBook): LibraryBook {
  // Extract author
  const author = book.authors.length > 0 
    ? book.authors.map(a => a.name).join(", ")
    : "Unknown Author";
  
  // Map category from subjects
  const category = getCategoryFromSubjects(book.subjects);
  
  // Get best available download URL
  const downloadUrl = book.formats["text/html"] 
    || book.formats["text/plain; charset=utf-8"]
    || book.formats["application/epub+zip"]
    || book.formats["text/plain"];

  return {
    id: `gutenberg-${book.id}`,
    title: book.title,
    author,
    category,
    availability: "Available",
    status: "Free",
    action: "Read now",
    gutenbergId: book.id,
    downloadUrl,
    subjects: book.subjects,
    downloadCount: book.download_count,
  };
}
```

### getCoverColor

Generates a Tailwind CSS color class based on category:

```typescript
export function getCoverColor(category: string): string {
  const colorMap: Record<string, string> = {
    "Fiction": "bg-teal-500",
    "Mystery": "bg-blue-600",
    "Biography": "bg-green-400",
    "Non-Fiction": "bg-purple-500",
  };
  return colorMap[category] || "bg-gray-500";
}
```

## Performance Optimizations

### 1. Debouncing

Search input is debounced by 500ms to prevent excessive API calls:

```typescript
const debouncedSearch = useDebounce(searchQuery, 500);
```

### 2. Memoization

Expensive computations are memoized:

```typescript
const libraryBooks = useMemo(() => {
  if (!data?.results) return [];
  return data.results.map(transformGutenbergBook);
}, [data]);

const recommendedBooks = useMemo(() => {
  const sorted = [...libraryBooks].sort((a, b) => b.downloadCount - a.downloadCount);
  return sorted.slice(0, 4).map(/* ... */);
}, [libraryBooks]);
```

### 3. React Query Caching

- Automatic caching of API responses
- Stale-while-revalidate pattern
- Deduplication of concurrent requests

## Future Enhancements

### Potential Features

1. **Pagination**
   - Implement page navigation using `next`/`previous` from API
   - Add "Load More" button or infinite scroll

2. **Book Details Modal**
   - Show full book information
   - Display all subjects, languages, download formats
   - Show download statistics

3. **Recently Saved**
   - Store user's recently viewed books in localStorage
   - Implement the "Recently Saved" tab functionality

4. **Favorites**
   - Allow users to favorite books
   - Store favorites in backend or localStorage

5. **Reading Progress**
   - Track reading progress per book
   - Resume reading from last position

6. **Book Covers**
   - Integrate with cover image API (e.g., Open Library Covers API)
   - Replace color-coded placeholders with actual covers

7. **Advanced Filters**
   - Filter by language
   - Filter by copyright status
   - Sort by download count, title, author

8. **Backend Integration**
   - Create proxy endpoint to avoid CORS issues
   - Add server-side caching
   - Implement user-specific features (favorites, reading history)

## Usage Examples

### Basic Search

```typescript
// User types "shakespeare" in search box
// After 500ms delay, API is called:
GET https://gutendex.com/books/?search=shakespeare

// Results are transformed and displayed in table
```

### Category Filter

```typescript
// User selects "Fiction" from dropdown
// API is called with topic filter:
GET https://gutendex.com/books/?topic=fiction

// Only fiction books are displayed
```

### Combined Search and Filter

```typescript
// User searches "adventure" and selects "Fiction"
GET https://gutendex.com/books/?search=adventure&topic=fiction

// Returns fiction books matching "adventure"
```

## Testing Considerations

### Test Cases

1. **Search Functionality**
   - Test debouncing (should not call API on every keystroke)
   - Test empty search (should show all books)
   - Test special characters in search

2. **Category Filtering**
   - Test each category filter
   - Test "All Categories" option
   - Test combined search + filter

3. **Loading States**
   - Verify skeleton loaders appear during fetch
   - Verify loading state clears after data arrives

4. **Error Handling**
   - Test network errors
   - Test API errors (404, 500, etc.)
   - Verify error messages display correctly

5. **Book Actions**
   - Test "Read now" button opens correct URL
   - Test books without download URLs are disabled
   - Verify new tab opens correctly

6. **Recommended Books**
   - Verify top 4 books by download count
   - Test with empty results
   - Test with less than 4 books

## Dependencies

### Required Packages

- `@tanstack/react-query` - Data fetching and caching
- `lucide-react` - Icons (Search, Plus, BookOpen)
- `react-router-dom` - Navigation (if needed for book details)

### Internal Dependencies

- `@/shared/hooks/useDebounce` - Search debouncing
- `@/contexts/AuthContext` - User authentication
- `@/lib/avatar/*` - Avatar display
- `@/components/ui/*` - UI components (Button, Card, Table, etc.)

## File Structure

```
src/
├── pages/
│   └── Library.tsx              # Main library component
├── hooks/
│   └── useGutenbergBooks.ts     # Gutenberg API hook
├── lib/
│   └── gutenberg.ts             # Transformation utilities
└── shared/
    └── hooks/
        └── useDebounce.ts       # Debounce utility
```

## API Rate Limits

The Gutendex API is public and free, but consider:

- **Rate Limiting**: No official rate limits, but be respectful
- **Caching**: React Query caches responses for 5-10 minutes
- **Debouncing**: Search is debounced to reduce calls
- **Future**: Consider backend proxy for better control

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Solution: Use backend proxy endpoint
   - Current: Direct API calls (may work in production)

2. **Slow Loading**
   - Solution: Increase cache times
   - Add pagination to reduce initial load

3. **No Results**
   - Check API response structure
   - Verify search query format
   - Check network tab for API errors

4. **Books Not Opening**
   - Verify download URL exists
   - Check URL format
   - Test URL in browser directly

## Related Documentation

- [Sidebar Implementation](./sidebar-implementation.md)
- [Game Hub Analysis](./game-hub-analysis.md)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Gutendex API Documentation](https://gutendex.com/)

## Conclusion

The Library feature provides a seamless interface for browsing and accessing Project Gutenberg's free e-book collection. The implementation uses modern React patterns with React Query for efficient data management, debouncing for performance, and a clean UI that matches the application's design system.

The architecture is extensible, allowing for future enhancements like pagination, favorites, reading progress, and more advanced filtering options.








