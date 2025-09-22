import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTaskFilters } from "../hooks/use-task-filters";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface TaskSearchProps {
  placeholder?: string;
  className?: string;
}

export const TaskSearch = ({ 
  placeholder = "Search tasks...", 
  className = "" 
}: TaskSearchProps) => {
  const [{ search }, setFilters] = useTaskFilters();
  const [searchValue, setSearchValue] = useState(search ?? "");
  const debouncedSearch = useDebounce(searchValue, 300);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip initial mount to avoid setting search on page load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only update if the debounced value is actually different
    if (debouncedSearch !== search) {
      setFilters({ search: debouncedSearch || null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Sync local state with URL state when search changes from outside
  useEffect(() => {
    if (search !== searchValue) {
      setSearchValue(search ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const clearSearch = () => {
    setSearchValue("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="pl-10 pr-10 h-8"
      />
      {searchValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};