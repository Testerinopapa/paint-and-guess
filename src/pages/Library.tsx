import { useState } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarPreview } from "@/games/paint-and-guess/components/avatar/preview";
import { createDefaultAvatarConfig } from "@/lib/avatar/config";
import { safeLoadAvatarConfig } from "@/lib/avatar/validation";
import { useEffect } from "react";

// Mock book data - will be replaced with actual API
const recommendedBooks = [
  {
    id: "1",
    title: "A Teaspoon of Earth and Sea",
    author: "Dina Nayeri",
    genre: "Fiction",
    coverColor: "bg-teal-500",
  },
  {
    id: "2",
    title: "Here is Real Magic",
    author: "Nami Gordanfarh",
    genre: "Fiction",
    coverColor: "bg-yellow-400",
  },
  {
    id: "3",
    title: "The Water Cure",
    author: "Sophie Lucasbrown",
    genre: "Biography",
    coverColor: "bg-green-400",
  },
  {
    id: "4",
    title: "Sugar Run",
    author: "Mesha Maren",
    genre: "Mystery",
    coverColor: "bg-blue-600",
  },
];

const allBooks = [
  {
    id: "1",
    title: "The lovely bones",
    author: "Alice Sebold",
    category: "Mystery",
    availability: "Coming soon",
    status: "Booked 5/10/23",
    action: "Book now",
  },
  {
    id: "2",
    title: "The Girl in Red",
    author: "D'Arcy",
    category: "Mystery",
    availability: "Coming soon",
    status: "Free",
    action: "Take a book",
  },
  {
    id: "3",
    title: "The Bees",
    author: "Laline Paull",
    category: "Fiction",
    availability: "Only reading room",
    status: "Taken by you",
    action: "Return till 2/1",
  },
  {
    id: "4",
    title: "Lord of the Flies",
    author: "William Golding",
    category: "Fiction",
    availability: "Available",
    status: "Free",
    action: "Take a book",
  },
];

const Library = () => {
  const { user } = useAuth();
  const [avatarConfig, setAvatarConfig] = useState(() => createDefaultAvatarConfig());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold">BOOKS</h1>
          <div className="flex items-center gap-6">
            <button className="text-sm font-medium text-primary border-b-2 border-primary pb-1">
              LIBRARY
            </button>
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              ORDERS
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Order a New Book
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <AvatarPreview config={avatarConfig} size={32} />
              </div>
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for books, genres, authors and more..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
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
      <div className="space-y-4">
        <Tabs defaultValue="recommended" className="w-full">
          <TabsList>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="recently-saved">Recently Saved</TabsTrigger>
          </TabsList>
          <TabsContent value="recommended" className="mt-4">
            <ScrollArea className="w-full" orientation="horizontal">
              <div className="flex gap-4 pb-4">
                {recommendedBooks.map((book) => (
                  <Card key={book.id} className="min-w-[200px] flex-shrink-0">
                    <div className={`${book.coverColor} h-64 rounded-t-lg flex items-center justify-center`}>
                      <BookOpen className="w-16 h-16 text-white/80" />
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2 capitalize">
                        {book.genre}
                      </Badge>
                      <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.author}</p>
                    </CardContent>
                  </Card>
                ))}
                {/* Promotional Card */}
                <Card className="min-w-[300px] flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 border-0">
                  <CardContent className="p-6 text-white h-full flex flex-col justify-between">
                    <div>
                      <Badge className="bg-emerald-500 text-white mb-4">Till 30th June</Badge>
                      <h3 className="text-2xl font-bold mb-2">TEXTBOOKS SHOULD BE PASSED</h3>
                      <p className="text-blue-100">Share knowledge, pass it forward</p>
                    </div>
                    <div className="mt-4">
                      <Button variant="secondary" className="w-full">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="recently-saved" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              No recently saved books
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Books Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Books</h2>
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
                {allBooks.map((book) => (
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
                      <Button variant="outline" size="sm">
                        {book.action}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Library;

