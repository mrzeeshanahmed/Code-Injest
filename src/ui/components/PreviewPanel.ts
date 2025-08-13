// Real-time preview panel for Code Digest
import * as vscode from 'vscode';

export class PreviewPanel {
  render(content: string): string {
    // Placeholder: return HTML for previewing digest content
    return `<div class="preview-panel">
      <h3>Digest Preview</h3>
      <pre>${content}</pre>
    </div>`;
  }
}
