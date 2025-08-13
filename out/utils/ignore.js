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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgnoreFilter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const ignore_1 = __importDefault(require("ignore"));
class IgnoreFilter {
    constructor() {
        this.defaultIgnores = constants_1.DEFAULT_IGNORE_PATTERNS;
        // Store ignore patterns per directory for correct scoping
        this.dirIgnores = {};
        this.allPatterns = [];
        this.ignoreInstance = (0, ignore_1.default)();
    }
    async initialize(rootPath) {
        this.ignoreInstance.add(this.defaultIgnores);
        await this.loadIgnoreFiles(rootPath, ['.gitignore', '.gitingestignore']);
    }
    async loadIgnoreFiles(rootPath, filenames) {
        // Walk the directory tree and collect ignore patterns per directory
        await this.walkDirectory(rootPath, async (dirPath) => {
            for (const filename of filenames) {
                const ignoreFilePath = path.join(dirPath, filename);
                try {
                    const content = await fs.promises.readFile(ignoreFilePath, 'utf8');
                    const patterns = content
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line && !line.startsWith('#'));
                    if (patterns.length) {
                        this.dirIgnores[dirPath] = (this.dirIgnores[dirPath] || (0, ignore_1.default)()).add(patterns);
                        this.allPatterns.push(...patterns);
                    }
                }
                catch {
                    // Ignore files that can't be read
                }
            }
        });
        // Add all patterns to the global instance for legacy support
        if (this.allPatterns.length) {
            this.ignoreInstance.add(this.allPatterns);
        }
    }
    async walkDirectory(dirPath, callback) {
        await callback(dirPath);
        try {
            const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== '.git') {
                    const subDirPath = path.join(dirPath, entry.name);
                    await this.walkDirectory(subDirPath, callback);
                }
            }
        }
        catch {
            // Ignore directories we can't read
        }
    }
    shouldIgnore(relativePath) {
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
exports.IgnoreFilter = IgnoreFilter;
//# sourceMappingURL=ignore.js.map