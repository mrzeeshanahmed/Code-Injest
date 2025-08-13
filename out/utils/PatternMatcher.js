"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternMatcher = void 0;
// Advanced glob pattern matcher for Code Digest
const minimatch_1 = require("minimatch");
class PatternMatcher {
    static match(path, patterns) {
        return patterns.some(pattern => (0, minimatch_1.minimatch)(path, pattern));
    }
}
exports.PatternMatcher = PatternMatcher;
//# sourceMappingURL=PatternMatcher.js.map