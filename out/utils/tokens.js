"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenEstimator = void 0;
class TokenEstimator {
    estimate(text, scheme = 'gpt-3.5', language) {
        let tokens = 0;
        switch (scheme) {
            case 'gpt-3.5':
            case 'gpt-4':
                // Approximate GPT tokenization: 1 token ≈ 4 chars (English), 1.5 words
                tokens = Math.ceil(text.length / 4);
                break;
            case 'claude':
                // Claude: 1 token ≈ 5 chars
                tokens = Math.ceil(text.length / 5);
                break;
            case 'simple':
            default:
                // Fallback: words * 1.3
                const words = text.split(/\s+/).filter(word => word.length > 0).length;
                tokens = Math.floor(words * 1.3);
        }
        // Language-specific adjustment (Python, JS, etc. tend to have shorter tokens)
        if (language) {
            const lang = language.toLowerCase();
            if (lang === 'python' || lang === 'javascript' || lang === 'typescript') {
                tokens = Math.floor(tokens * 0.95);
            }
            else if (lang === 'markdown' || lang === 'html') {
                tokens = Math.floor(tokens * 1.05);
            }
        }
        return this.humanizeNumber(tokens);
    }
    rawTokenCount(text, scheme = 'gpt-3.5', language) {
        let tokens = 0;
        switch (scheme) {
            case 'gpt-3.5':
            case 'gpt-4':
                tokens = Math.ceil(text.length / 4);
                break;
            case 'claude':
                tokens = Math.ceil(text.length / 5);
                break;
            case 'simple':
            default:
                const words = text.split(/\s+/).filter(word => word.length > 0).length;
                tokens = Math.floor(words * 1.3);
        }
        if (language) {
            const lang = language.toLowerCase();
            if (lang === 'python' || lang === 'javascript' || lang === 'typescript') {
                tokens = Math.floor(tokens * 0.95);
            }
            else if (lang === 'markdown' || lang === 'html') {
                tokens = Math.floor(tokens * 1.05);
            }
        }
        return tokens;
    }
    budgetSuggestion(tokens, maxTokens) {
        if (tokens > maxTokens) {
            return `⚠️ Exceeds token budget (${tokens} / ${maxTokens})`;
        }
        else if (tokens > maxTokens * 0.9) {
            return `⚠️ Near token limit (${tokens} / ${maxTokens})`;
        }
        else {
            return `✅ Within token budget (${tokens} / ${maxTokens})`;
        }
    }
    humanizeNumber(num) {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        else {
            return num.toString();
        }
    }
}
exports.TokenEstimator = TokenEstimator;
//# sourceMappingURL=tokens.js.map