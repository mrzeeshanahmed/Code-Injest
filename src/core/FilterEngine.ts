// Advanced pattern matching & filtering for Code Ingest (Gitingest-level)
import { minimatch } from 'minimatch';

export interface FilteringOptions {
  suggestedIncludes: string[];
  suggestedExcludes: string[];
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSize: number;
  minFileSize?: number;
  contentFilters?: {
    requiresKeywords?: string[];
    excludesKeywords?: string[];
    languageSpecific?: boolean;
  };
  maxDepth?: number;
  skipDirectories: string[];
}

export class FilterEngine {
  constructor(private options: FilteringOptions) {}

  filter(files: Array<{ path: string; size: number; type: string; content?: string }>): Array<{ path: string; size: number; type: string }> {
    return files.filter(file => {
      if (file.size > this.options.maxFileSize) return false;
      if (this.options.minFileSize && file.size < this.options.minFileSize) return false;
      if (this.options.excludePatterns.some(pattern => minimatch(file.path, pattern))) return false;
      if (this.options.includePatterns.length && !this.options.includePatterns.some(pattern => minimatch(file.path, pattern))) return false;
      if (this.options.skipDirectories.some(dir => file.path.includes(`/${dir}/`))) return false;
      // Content-based filtering
      if (this.options.contentFilters && file.content) {
        if (this.options.contentFilters.requiresKeywords && !this.options.contentFilters.requiresKeywords.some(kw => file.content?.includes(kw))) return false;
        if (this.options.contentFilters.excludesKeywords && this.options.contentFilters.excludesKeywords.some(kw => file.content?.includes(kw))) return false;
      }
      return true;
    });
  }
}
