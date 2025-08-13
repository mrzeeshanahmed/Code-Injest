// Repository analysis for Code Digest (Gitingest-level)
import { FileMetadata } from './RepositoryScanner';

export interface RepositoryAnalysis {
  statistics: {
    fileCount: number;
    totalLines: number;
    codeLines: number;
    commentLines: number;
    blankLines: number;
    tokenEstimate: number;
    languageBreakdown: Record<string, {
      files: number;
      lines: number;
      percentage: number;
    }>;
  };
  dependencies: {
    packageFiles: string[];
    dependencies: Record<string, string>;
    devDependencies?: Record<string, string>;
    technicalStack: string[];
  };
  codeInsights: {
    duplicatedFiles?: string[];
    largeFiles: Array<{path: string; size: number}>;
    complexityIndicators?: Record<string, number>;
  };
}

export class AnalysisEngine {
  analyze(files: FileMetadata[]): RepositoryAnalysis {
    const fs = require('fs');
    const crypto = require('crypto');
    const languageMap: Record<string, string> = {
      'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python', 'java': 'Java', 'c': 'C', 'cpp': 'C++', 'cs': 'C#',
      'rb': 'Ruby', 'go': 'Go', 'rs': 'Rust', 'php': 'PHP', 'swift': 'Swift', 'kt': 'Kotlin', 'dart': 'Dart',
      'json': 'JSON', 'xml': 'XML', 'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'yml': 'YAML', 'yaml': 'YAML',
      'md': 'Markdown', 'sh': 'Shell', 'sql': 'SQL'
    };

    let totalLines = 0, codeLines = 0, commentLines = 0, blankLines = 0, tokenEstimate = 0;
    const languageBreakdown: Record<string, {files: number; lines: number; percentage: number}> = {};
    const fileHashes: Record<string, string> = {};
    const hashToFiles: Record<string, string[]> = {};
    const largeFiles: Array<{path: string; size: number}> = [];
    const complexityIndicators: Record<string, number> = {};
    const packageFiles: string[] = [];
    let dependencies: Record<string, string> = {};
    let devDependencies: Record<string, string> = {};
    const technicalStack: string[] = [];

    for (const file of files) {
      // Language detection
      const ext = file.path.split('.').pop()?.toLowerCase() || '';
      const lang = languageMap[ext] || ext;
      if (!languageBreakdown[lang]) languageBreakdown[lang] = {files: 0, lines: 0, percentage: 0};
      languageBreakdown[lang].files++;

      // Large file detection
      if (file.size > 100000) largeFiles.push({path: file.path, size: file.size});

      // Dependency file detection
      if (/package\.json$|requirements\.txt$|Pipfile$|pyproject\.toml$|Gemfile$|composer\.json$|go\.mod$|Cargo\.toml$|pom\.xml$/.test(file.path)) {
        packageFiles.push(file.path);
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          if (file.path.endsWith('package.json')) {
            const pkg = JSON.parse(content);
            dependencies = {...dependencies, ...pkg.dependencies};
            devDependencies = {...devDependencies, ...pkg.devDependencies};
            technicalStack.push('Node.js');
          } else if (file.path.endsWith('requirements.txt') || file.path.endsWith('Pipfile')) {
            content.split('\n').forEach((line: string) => {
              const dep = line.trim().split('==')[0];
              if (dep) dependencies[dep] = '';
            });
            technicalStack.push('Python');
          } else if (file.path.endsWith('pyproject.toml')) {
            technicalStack.push('Python');
          } else if (file.path.endsWith('Gemfile')) {
            technicalStack.push('Ruby');
          } else if (file.path.endsWith('composer.json')) {
            technicalStack.push('PHP');
          } else if (file.path.endsWith('go.mod')) {
            technicalStack.push('Go');
          } else if (file.path.endsWith('Cargo.toml')) {
            technicalStack.push('Rust');
          } else if (file.path.endsWith('pom.xml')) {
            technicalStack.push('Java');
          }
        } catch {}
      }

      // File content analysis
      let lines: string[] = [];
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        lines = content.split(/\r?\n/);
        // Duplicate detection (hash)
        const hash = crypto.createHash('md5').update(content).digest('hex');
        fileHashes[file.path] = hash;
        if (!hashToFiles[hash]) hashToFiles[hash] = [];
        hashToFiles[hash].push(file.path);

        // Line counting
        totalLines += lines.length;
        languageBreakdown[lang].lines += lines.length;
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) blankLines++;
          else if (/^\/\//.test(trimmed) || /^#/.test(trimmed) || /^\*/.test(trimmed)) commentLines++;
          else codeLines++;
        }
        // Token estimation (simple)
        tokenEstimate += content.split(/\s+/).length;

        // Complexity (very basic: count functions/classes)
        if (lang === 'JavaScript' || lang === 'TypeScript' || lang === 'Python') {
          const funcCount = (content.match(/function |def |class /g) || []).length;
          complexityIndicators[file.path] = funcCount;
        }
      } catch {}
    }

    // Language percentage calculation
    const totalLangLines = Object.values(languageBreakdown).reduce((sum, l) => sum + l.lines, 0);
    for (const lang in languageBreakdown) {
      languageBreakdown[lang].percentage = totalLangLines ? Math.round(100 * languageBreakdown[lang].lines / totalLangLines) : 0;
    }

    // Duplicated files
    const duplicatedFiles: string[] = [];
    for (const hash in hashToFiles) {
      if (hashToFiles[hash].length > 1) duplicatedFiles.push(...hashToFiles[hash]);
    }

    return {
      statistics: {
        fileCount: files.length,
        totalLines,
        codeLines,
        commentLines,
        blankLines,
        tokenEstimate,
        languageBreakdown
      },
      dependencies: {
        packageFiles,
        dependencies,
        devDependencies,
        technicalStack: Array.from(new Set(technicalStack))
      },
      codeInsights: {
        duplicatedFiles,
        largeFiles,
        complexityIndicators
      }
    };
  }
}
