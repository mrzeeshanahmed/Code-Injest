// Advanced file discovery for Code Digest (Gitingest-level)
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  path: string;
  size: number;
  modified: Date;
  type: string;
  isBinary: boolean;
  isSymlink?: boolean;
  symlinkTarget?: string;
}

export class RepositoryScanner {
  constructor(private rootDir: string) {}

  async scan(options: { maxDepth?: number; skipDirs?: string[] } = {}): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    await this._scanDir(this.rootDir, 0, options.maxDepth ?? 20, options.skipDirs ?? [], results);
    return results;
  }

  private async _scanDir(dir: string, depth: number, maxDepth: number, skipDirs: string[], results: FileMetadata[]) {
    if (depth > maxDepth) return;
    let entries: string[] = [];
    try {
      entries = await fs.promises.readdir(dir);
    } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      let stat;
      try { stat = await fs.promises.lstat(fullPath); } catch { continue; }
      if (stat.isDirectory()) {
        if (skipDirs.includes(entry)) continue;
        await this._scanDir(fullPath, depth + 1, maxDepth, skipDirs, results);
      } else if (stat.isFile() || stat.isSymbolicLink()) {
        let isSymlink = stat.isSymbolicLink();
        let symlinkTarget: string | undefined = undefined;
        if (isSymlink) {
          try {
            symlinkTarget = await fs.promises.readlink(fullPath);
          } catch {}
        }
        results.push({
          path: fullPath,
          size: stat.size,
          modified: stat.mtime,
          type: path.extname(entry).slice(1),
          isBinary: false, // TODO: integrate binary detection
          isSymlink,
          symlinkTarget
        });
      }
    }
  }
}
