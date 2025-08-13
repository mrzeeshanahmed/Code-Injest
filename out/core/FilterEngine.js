"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterEngine = void 0;
// Advanced pattern matching & filtering for Code Digest (Gitingest-level)
const minimatch_1 = require("minimatch");
class FilterEngine {
    constructor(options) {
        this.options = options;
    }
    filter(files) {
        return files.filter(file => {
            if (file.size > this.options.maxFileSize)
                return false;
            if (this.options.minFileSize && file.size < this.options.minFileSize)
                return false;
            if (this.options.excludePatterns.some(pattern => (0, minimatch_1.minimatch)(file.path, pattern)))
                return false;
            if (this.options.includePatterns.length && !this.options.includePatterns.some(pattern => (0, minimatch_1.minimatch)(file.path, pattern)))
                return false;
            if (this.options.skipDirectories.some(dir => file.path.includes(`/${dir}/`)))
                return false;
            // Content-based filtering
            if (this.options.contentFilters && file.content) {
                if (this.options.contentFilters.requiresKeywords && !this.options.contentFilters.requiresKeywords.some(kw => file.content?.includes(kw)))
                    return false;
                if (this.options.contentFilters.excludesKeywords && this.options.contentFilters.excludesKeywords.some(kw => file.content?.includes(kw)))
                    return false;
            }
            return true;
        });
    }
}
exports.FilterEngine = FilterEngine;
//# sourceMappingURL=FilterEngine.js.map