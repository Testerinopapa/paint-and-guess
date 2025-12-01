import { useState, useEffect, useMemo } from "react";
import { Search, Plus, BookOpen, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { useGutenbergBooks } from "@/hooks/useGutenbergBooks";
import { transformGutenbergBook, getCoverColor, type LibraryBook } from "@/lib/gutenberg";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useIsMobile } from "@/hooks/useIsMobile";

const Library = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [avatarConfig, setAvatarConfig] = useState(() => createDefaultAvatarConfig());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Debounce search query to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch books from Gutenberg API
  const { data, isLoading, error } = useGutenbergBooks({
    search: debouncedSearch || undefined,
    topic: selectedCategory !== "all" ? selectedCategory : undefined,
    enabled: true,
  });

  // Transform Gutenberg books to Library format
  const libraryBooks: LibraryBook[] = useMemo(() => {
    if (!data?.results) return [];
    return data.results.map(transformGutenbergBook);
  }, [data]);

  // Get recommended books (top downloaded, first 4)
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

  useEffect(() => {
    if (user?.id) {
      const stored = safeLoadAvatarConfig(user.id);
      if (stored) {
        setAvatarConfig(stored);
      }
    } else {
      const anonymousStored = safeLoadAvatarConfig(null);
      if (anonymousStored) {
        setAvatarConfig(anonymousStored);
      }
    }
  }, [user]);

  const handleBookAction = (book: LibraryBook) => {
    if (book.downloadUrl) {
      window.open(book.downloadUrl, "_blank");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 md:gap-8">
          <h1 className="text-xl md:text-2xl font-bold">BOOKS</h1>
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="text-xs sm:text-sm font-medium text-primary border-b-2 border-primary pb-1">
              LIBRARY
            </button>
            <button className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              ORDERS
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm px-3 sm:px-4">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Order a New Book</span>
            <span className="sm:hidden">Order</span>
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                <AvatarPreview config={avatarConfig} size={isMobile ? 28 : 32} />
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">{user.username}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={isMobile ? "Search books..." : "Search for books, genres, authors and more..."}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="fiction">Fiction</SelectItem>
            <SelectItem value="mystery">Mystery</SelectItem>
            <SelectItem value="biography">Biography</SelectItem>
            <SelectItem value="non-fiction">Non-Fiction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommended Section */}
      <div className="space-y-3 md:space-y-4">
        <Tabs defaultValue="recommended" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="recommended" className="flex-1 sm:flex-initial">Recommended</TabsTrigger>
            <TabsTrigger value="recently-saved" className="flex-1 sm:flex-initial">Recently Saved</TabsTrigger>
          </TabsList>
          <TabsContent value="recommended" className="mt-3 md:mt-4">
            {isLoading ? (
              <div className="flex gap-3 md:gap-4 pb-4 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="min-w-[160px] sm:min-w-[200px] flex-shrink-0">
                    <Skeleton className="h-48 sm:h-64 w-full rounded-t-lg" />
                    <CardContent className="p-3 md:p-4">
                      <Skeleton className="h-3 sm:h-4 w-12 sm:w-16 mb-2" />
                      <Skeleton className="h-4 sm:h-5 w-full mb-1" />
                      <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-6 md:py-8 text-destructive text-sm md:text-base">
                Failed to load books. Please try again.
              </div>
            ) : (
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="flex gap-3 md:gap-4 pb-4">
                  {recommendedBooks.map((book) => (
                    <Card key={book.id} className="min-w-[160px] sm:min-w-[200px] flex-shrink-0">
                      <div className={`${book.coverColor} h-48 sm:h-64 rounded-t-lg flex items-center justify-center`}>
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white/80" />
                      </div>
                      <CardContent className="p-3 md:p-4">
                        <Badge variant="secondary" className="mb-2 capitalize text-xs">
                          {book.genre}
                        </Badge>
                        <h3 className="font-bold text-sm sm:text-lg mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{book.author}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {/* Promotional Card */}
                  <Card className="min-w-[240px] sm:min-w-[300px] flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 border-0">
                    <CardContent className="p-4 sm:p-6 text-white h-full flex flex-col justify-between">
                      <div>
                        <Badge className="bg-emerald-500 text-white mb-3 sm:mb-4 text-xs">Till 30th June</Badge>
                        <h3 className="text-lg sm:text-2xl font-bold mb-2">TEXTBOOKS SHOULD BE PASSED</h3>
                        <p className="text-blue-100 text-xs sm:text-sm">Share knowledge, pass it forward</p>
                      </div>
                      <div className="mt-3 sm:mt-4">
                        <Button variant="secondary" className="w-full text-xs sm:text-sm">
                          Learn More
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="recently-saved" className="mt-3 md:mt-4">
            <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">
              No recently saved books
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Books List */}
      <div className="space-y-3 md:space-y-4">
        <h2 className="text-lg md:text-xl font-semibold">Books</h2>
        {isLoading ? (
          <div className="space-y-3 md:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    <Skeleton className="h-20 md:h-12 flex-1" />
                    <Skeleton className="h-12 w-24 md:w-32" />
                    <Skeleton className="h-12 w-20 md:w-24" />
                    <Skeleton className="h-10 w-24 md:w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="text-center py-4 md:py-6 text-destructive text-sm md:text-base">
                Failed to load books. Please try again.
              </div>
            </CardContent>
          </Card>
        ) : libraryBooks.length === 0 ? (
          <Card>
            <CardContent className="p-6 md:p-8">
              <div className="text-center py-4 md:py-6 text-muted-foreground text-sm md:text-base">
                {searchQuery ? "No books found. Try a different search." : "No books available."}
              </div>
            </CardContent>
          </Card>
        ) : isMobile ? (
          /* Mobile Card Layout */
          <div className="space-y-3">
            {libraryBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Title and Author */}
                    <div>
                      <h3 className="font-semibold text-base mb-1 line-clamp-2">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </div>
                    
                    {/* Category and Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {book.category}
                      </Badge>
                      <span className={`text-xs font-medium ${
                        book.status === "Free" ? "text-emerald-500" : "text-muted-foreground"
                      }`}>
                        {book.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {book.availability}
                      </span>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookAction(book)}
                      disabled={!book.downloadUrl}
                      className="w-full h-10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {book.action}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop Table Layout */
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {libraryBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {book.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{book.availability}</TableCell>
                      <TableCell>
                        <span className={book.status === "Free" ? "text-emerald-500" : "text-muted-foreground"}>
                          {book.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBookAction(book)}
                          disabled={!book.downloadUrl}
                        >
                          {book.action}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Library;

