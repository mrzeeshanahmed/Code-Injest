// Advanced glob pattern matcher for Code Digest
import { minimatch } from 'minimatch';

export class PatternMatcher {
  static match(path: string, patterns: string[]): boolean {
    return patterns.some(pattern => minimatch(path, pattern));
  }
}
