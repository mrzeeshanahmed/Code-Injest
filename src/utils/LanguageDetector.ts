// File type detection for Code Ingest
import * as path from 'path';

export class LanguageDetector {
  static detect(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const map: Record<string, string> = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.php': 'PHP',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.json': 'JSON',
      '.yml': 'YAML',
      '.yaml': 'YAML',
      '.md': 'Markdown',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.xml': 'XML',
      '.sh': 'Shell',
      '.sql': 'SQL'
    };
    return map[ext] || 'Unknown';
  }
}
