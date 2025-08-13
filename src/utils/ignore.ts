import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_IGNORE_PATTERNS } from './constants';
import ignore, { Ignore } from 'ignore';


export class IgnoreFilter {
    private ignoreInstance: Ignore;
    private defaultIgnores: string[] = DEFAULT_IGNORE_PATTERNS;

    // Store ignore patterns per directory for correct scoping
    private dirIgnores: Record<string, Ignore> = {};
    private allPatterns: string[] = [];

    constructor() {
        this.ignoreInstance = ignore();
    }

    async initialize(rootPath: string): Promise<void> {
        this.ignoreInstance.add(this.defaultIgnores);
        await this.loadIgnoreFiles(rootPath, ['.gitignore', '.gitingestignore']);
    }

    private async loadIgnoreFiles(rootPath: string, filenames: string[]): Promise<void> {
        // Walk the directory tree and collect ignore patterns per directory
        await this.walkDirectory(rootPath, async (dirPath) => {
            for (const filename of filenames) {
                const ignoreFilePath = path.join(dirPath, filename);
                try {
                    const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
                    const patterns = content
                        .split('\n')
                        .map((line: string) => line.trim())
                        .filter((line: string) => line && !line.startsWith('#'));
                    if (patterns.length) {
                        this.dirIgnores[dirPath] = (this.dirIgnores[dirPath] || ignore()).add(patterns);
                        this.allPatterns.push(...patterns);
                    }
                } catch {
                    // Ignore files that can't be read
                }
            }
        });
        // Add all patterns to the global instance for legacy support
        if (this.allPatterns.length) {
            this.ignoreInstance.add(this.allPatterns);
        }
    }

    private async walkDirectory(dirPath: string, callback: (dir: string) => Promise<void>): Promise<void> {
        await callback(dirPath);
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== '.git') {
                    const subDirPath = path.join(dirPath, entry.name);
                    await this.walkDirectory(subDirPath, callback);
                }
            }
        } catch {
            // Ignore directories we can't read
        }
    }

    shouldIgnore(relativePath: string): boolean {
        // Find the deepest directory ignore instance that applies
        const parts = relativePath.split(/[\\\/]/);
        for (let i = parts.length; i >= 0; i--) {
            const dir = parts.slice(0, i).join(path.sep);
            if (this.dirIgnores[dir] && this.dirIgnores[dir].ignores(relativePath)) {
                return true;
            }
        }
        // Fallback to global instance
        return this.ignoreInstance.ignores(relativePath);
    }
}
