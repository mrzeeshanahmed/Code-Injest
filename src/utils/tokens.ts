
export type TokenScheme = 'gpt-3.5' | 'gpt-4' | 'claude' | 'simple';

export class TokenEstimator {
    estimate(text: string, scheme: TokenScheme = 'gpt-3.5', language?: string): string {
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
            } else if (lang === 'markdown' || lang === 'html') {
                tokens = Math.floor(tokens * 1.05);
            }
        }

        return this.humanizeNumber(tokens);
    }

    rawTokenCount(text: string, scheme: TokenScheme = 'gpt-3.5', language?: string): number {
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
            } else if (lang === 'markdown' || lang === 'html') {
                tokens = Math.floor(tokens * 1.05);
            }
        }
        return tokens;
    }

    budgetSuggestion(tokens: number, maxTokens: number): string {
        if (tokens > maxTokens) {
            return `⚠️ Exceeds token budget (${tokens} / ${maxTokens})`;
        } else if (tokens > maxTokens * 0.9) {
            return `⚠️ Near token limit (${tokens} / ${maxTokens})`;
        } else {
            return `✅ Within token budget (${tokens} / ${maxTokens})`;
        }
    }

    private humanizeNumber(num: number): string {
        if (num >= 1_000_000) {
            return `${(num / 1_000_000).toFixed(1)}M`;
        } else if (num >= 1_000) {
            return `${(num / 1_000).toFixed(1)}k`;
        } else {
            return num.toString();
        }
    }
}
