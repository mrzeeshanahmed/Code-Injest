"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryScanner = void 0;
// Advanced file discovery for Code Digest (Gitingest-level)
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RepositoryScanner {
    constructor(rootDir) {
        this.rootDir = rootDir;
    }
    async scan(options = {}) {
        const results = [];
        await this._scanDir(this.rootDir, 0, options.maxDepth ?? 20, options.skipDirs ?? [], results);
        return results;
    }
    async _scanDir(dir, depth, maxDepth, skipDirs, results) {
        if (depth > maxDepth)
            return;
        let entries = [];
        try {
            entries = await fs.promises.readdir(dir);
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            let stat;
            try {
                stat = await fs.promises.lstat(fullPath);
            }
            catch {
                continue;
            }
            if (stat.isDirectory()) {
                if (skipDirs.includes(entry))
                    continue;
                await this._scanDir(fullPath, depth + 1, maxDepth, skipDirs, results);
            }
            else if (stat.isFile() || stat.isSymbolicLink()) {
                let isSymlink = stat.isSymbolicLink();
                let symlinkTarget = undefined;
                if (isSymlink) {
                    try {
                        symlinkTarget = await fs.promises.readlink(fullPath);
                    }
                    catch { }
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
exports.RepositoryScanner = RepositoryScanner;
//# sourceMappingURL=RepositoryScanner.js.map