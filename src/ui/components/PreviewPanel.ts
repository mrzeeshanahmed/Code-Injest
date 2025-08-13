// Real-time preview panel for Code Ingest
import * as vscode from 'vscode';

export class PreviewPanel {
  render(content: string): string {
  // Placeholder: return HTML for previewing ingest content
    return `<div class="preview-panel">
  <h3>Ingest Preview</h3>
      <pre>${content}</pre>
    </div>`;
  }
}
