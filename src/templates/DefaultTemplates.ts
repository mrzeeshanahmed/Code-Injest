// Built-in templates for Code Ingest
export const DefaultTemplates = {
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
