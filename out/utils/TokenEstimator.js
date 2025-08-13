"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEstimator = void 0;
// Enhanced token counting for Code Ingest
class TokenEstimator {
    estimate(text) {
        // Simple heuristic: tokens ≈ words * 1.3
        const words = text.split(/\s+/).filter(word => word.length > 0).length;
        return Math.floor(words * 1.3);
    }
}
exports.TokenEstimator = TokenEstimator;
//# sourceMappingURL=TokenEstimator.js.map