import React from 'react';
import { Search, Filter, SlidersHorizontal, Grid, Columns, Box, List, BookOpen, Languages, BookMarked, GraduationCap, Video, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ContentType = 'books' | 'vocabulary' | 'grammar' | 'reference' | 'videos';
export type ViewMode = 'grid' | 'bookshelf' | 'list';
export type SortOption = 'default' | 'title' | 'progress' | 'grade';

export interface BookFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedSubject: string;
  onSubjectChange: (subj: string) => void;
  subjects: string[];
  selectedGrade: number;
  onGradeChange: (grade: number) => void;
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalResults: number;
  onResetFilters: () => void;
  className?: string;
}

export const BookFilter: React.FC<BookFilterProps> = ({
  search,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  subjects,
  selectedGrade,
  onGradeChange,
  contentType,
  onContentTypeChange,
  viewMode,
  onViewModeChange,
  sortOption,
  onSortChange,
  totalResults,
  onResetFilters,
  className = '',
}) => {
  const contentTabs = [
    { id: 'books' as ContentType, label: 'PDF Books', icon: BookOpen },
    { id: 'vocabulary' as ContentType, label: 'Vocabulary', icon: Languages },
    { id: 'grammar' as ContentType, label: 'Grammar', icon: BookMarked },
    { id: 'reference' as ContentType, label: 'Reference', icon: GraduationCap },
    { id: 'videos' as ContentType, label: 'Videos', icon: Video },
  ];

  const hasActiveFilters = search !== '' || selectedSubject !== 'All' || selectedGrade !== 0 || sortOption !== 'default';

  return (
    <div className={`glass rounded-2xl p-4 sm:p-5 border border-border/80 shadow-lg space-y-4 ${className}`}>
      {/* Top: Content Type Tabs & View Mode Toggles */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-border/50 pb-3">
        {/* Content Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {contentTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = contentType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onContentTypeChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-poppins font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md neon-glow font-bold'
                    : 'glass text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode & Result Counter */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <span className="text-xs font-mono text-muted-foreground">
            Showing <strong className="text-foreground font-bold">{totalResults}</strong> items
          </span>

          {/* Layout Mode Selector (Grid, 3D Shelf, List) */}
          <div className="flex items-center gap-1 glass p-1 rounded-xl border border-border/60">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="2D Grid Layout"
            >
              <Grid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={() => onViewModeChange('bookshelf')}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'bookshelf' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="3D Bookshelf Perspective"
            >
              <Box className="h-3.5 w-3.5 text-neon-cyan" />
              <span className="hidden sm:inline">3D Shelf</span>
            </button>

            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground font-bold shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Compact List View"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Search Input & Sort Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search */}
        <div className="sm:col-span-8 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search textbooks, topics, formulas, or Ethiopian curriculum modules..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-poppins text-xs sm:text-sm transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="sm:col-span-4 flex items-center gap-2">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full bg-muted/40 border border-border/80 rounded-xl px-3 py-2.5 text-xs font-poppins text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="default">Sort by Recommended</option>
            <option value="title">Alphabetical (A - Z)</option>
            <option value="progress">Reading Progress</option>
            <option value="grade">Grade Level</option>
          </select>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="outline"
              onClick={onResetFilters}
              className="px-2.5 py-2.5 rounded-xl text-xs font-poppins text-muted-foreground hover:text-destructive shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom: Subject Filter Pills */}
      <div className="space-y-2 pt-1 border-t border-border/40">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Filter by Subject:</span>
          {selectedSubject !== 'All' && (
            <span className="text-primary font-bold">Selected: {selectedSubject}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {subjects.map((s) => {
            const isSelected = selectedSubject === s;
            return (
              <button
                key={s}
                onClick={() => onSubjectChange(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-poppins transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm neon-glow'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grade Selector Pills */}
      <div className="space-y-2 pt-1 border-t border-border/40">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Filter by Grade Level:</span>
          {selectedGrade > 0 && (
            <span className="text-secondary font-bold">Grade {selectedGrade}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onGradeChange(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-poppins transition-all shrink-0 ${
              selectedGrade === 0
                ? 'bg-secondary text-secondary-foreground font-semibold shadow-sm'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
            }`}
          >
            All Grades
          </button>
          {Array.from({ length: 12 }, (_, i) => {
            const g = i + 1;
            const isSelected = selectedGrade === g;
            return (
              <button
                key={g}
                onClick={() => onGradeChange(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-poppins transition-all shrink-0 ${
                  isSelected
                    ? 'bg-secondary text-secondary-foreground font-semibold shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                Grade {g}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BookFilter;
