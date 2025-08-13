// Enhanced token counting for Code Digest
export class TokenEstimator {
  estimate(text: string): number {
    // Simple heuristic: tokens ≈ words * 1.3
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    return Math.floor(words * 1.3);
  }
}
