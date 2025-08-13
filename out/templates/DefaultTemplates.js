"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTemplates = void 0;
// Built-in templates for Code Ingest
exports.DefaultTemplates = {
    summary: `Directory: {{directory}}
Files analyzed: {{fileCount}}
Generated: {{timestamp}}
Estimated tokens: {{tokenEstimate}}`,
    file: `==== {{filePath}} ====
{{content}}`,
    directory: `Directory: {{directory}}
{{tree}}`,
    header: `# Code Ingest Report\n`,
    footer: `\n--- End of Ingest ---`
};
//# sourceMappingURL=DefaultTemplates.js.map