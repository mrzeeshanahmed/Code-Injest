// Content optimization for Code Digest (Gitingest-level)
import { FileMetadata } from './RepositoryScanner';

export interface ContentProcessorOptions {
  tokenEstimation: {
    estimatedTokens: number;
    tokenLimit?: number;
    compressionSuggestions: string[];
  };
  contentOptimization: {
    prioritizeFiles: boolean;
    summarizeRepetitive: boolean;
    extractKeyFunctions: boolean;
    includeCommitContext?: boolean;
  };
  outputFormats: {
    plainText: boolean;
    markdown: boolean;
    jsonStructured?: boolean;
    customTemplate?: string;
  };
}

export class ContentProcessor {
  constructor(private options: ContentProcessorOptions) {}

  process(files: FileMetadata[]): string {
    // Prioritize important files
    let prioritized: FileMetadata[] = files;
    if (this.options.contentOptimization.prioritizeFiles) {
      prioritized = this.prioritizeFiles(files);
    }

    // Summarize repetitive code patterns
    let summaries: string[] = [];
    if (this.options.contentOptimization.summarizeRepetitive) {
      summaries = this.summarizePatterns(prioritized);
    }

    // Extract key functions/classes
    let keyExtracts: string[] = [];
    if (this.options.contentOptimization.extractKeyFunctions) {
      keyExtracts = this.extractKeyFunctions(prioritized);
    }

    // Token limit optimization
    let tokenWarning = '';
    if (this.options.tokenEstimation.tokenLimit && this.options.tokenEstimation.estimatedTokens > this.options.tokenEstimation.tokenLimit) {
      tokenWarning = `⚠️ Estimated tokens (${this.options.tokenEstimation.estimatedTokens}) exceed limit (${this.options.tokenEstimation.tokenLimit})`;
    }

    // Output formatting
    if (this.options.outputFormats.jsonStructured) {
      return JSON.stringify({
        files: prioritized.map(f => ({ path: f.path, size: f.size })),
        summaries,
        keyExtracts,
        tokenWarning
      }, null, 2);
    }
    if (this.options.outputFormats.markdown) {
      let md = '';
      for (const f of prioritized) {
        md += `### ${f.path}\n- Size: ${f.size}\n`;
      }
      if (summaries.length) {
        md += '\n#### Summaries\n' + summaries.map(s => `- ${s}`).join('\n');
      }
      if (keyExtracts.length) {
        md += '\n#### Key Functions/Classes\n' + keyExtracts.map(k => `- ${k}`).join('\n');
      }
      if (tokenWarning) md += `\n> ${tokenWarning}`;
      return md;
    }
    // Custom template (basic)
    if (this.options.outputFormats.customTemplate) {
      let out = this.options.outputFormats.customTemplate;
      out = out.replace('{{files}}', prioritized.map(f => f.path).join(', '));
      out = out.replace('{{summaries}}', summaries.join(', '));
      out = out.replace('{{keyExtracts}}', keyExtracts.join(', '));
      out = out.replace('{{tokenWarning}}', tokenWarning);
      return out;
    }
    // Plain text fallback
    let txt = prioritized.map(f => `FILE: ${f.path}\nSIZE: ${f.size}\n`).join('\n');
    if (summaries.length) txt += '\nSummaries:\n' + summaries.join('\n');
    if (keyExtracts.length) txt += '\nKey Functions/Classes:\n' + keyExtracts.join('\n');
    if (tokenWarning) txt += `\n${tokenWarning}`;
    return txt;
  }

  private prioritizeFiles(files: FileMetadata[]): FileMetadata[] {
    // Entry points, configs, main modules first
    const important = files.filter(f => /main\.(js|ts|py)$|index\.(js|ts|tsx)$|App\.(js|ts|tsx)$|package\.json$|requirements\.txt$|pyproject\.toml$|setup\.py$|config\./.test(f.path));
    const rest = files.filter(f => !important.includes(f));
    return [...important, ...rest];
  }

  private summarizePatterns(files: FileMetadata[]): string[] {
    // Simple: summarize files with >80% identical lines
    const fs = require('fs');
    const summaries: string[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split(/\r?\n/);
        const lineCounts: Record<string, number> = {};
        for (const line of lines) {
          lineCounts[line] = (lineCounts[line] || 0) + 1;
        }
        const maxCount = Math.max(...Object.values(lineCounts));
        if (maxCount / lines.length > 0.8 && lines.length > 20) {
          summaries.push(`${file.path}: repetitive code detected (${Math.round(100 * maxCount / lines.length)}%)`);
        }
      } catch {}
    }
    return summaries;
  }

  private extractKeyFunctions(files: FileMetadata[]): string[] {
    // Extract function/class names from code files
    const fs = require('fs');
    const keyItems: string[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const extRaw = file.path.split('.').pop();
        const ext = typeof extRaw === 'string' ? extRaw.toLowerCase() : '';
        if (['js', 'ts', 'tsx', 'py'].includes(ext)) {
          // JS/TS/PY: function and class names
          const funcMatches = content.match(/function\s+(\w+)/g) || [];
          const classMatches = content.match(/class\s+(\w+)/g) || [];
          const defMatches = ext === 'py' ? (content.match(/def\s+(\w+)/g) || []) : [];
          keyItems.push(...funcMatches.map((m: string) => `${file.path}: ${m}`));
          keyItems.push(...classMatches.map((m: string) => `${file.path}: ${m}`));
          keyItems.push(...defMatches.map((m: string) => `${file.path}: ${m}`));
        }
      } catch {}
    }
    return keyItems;
    }
  }
