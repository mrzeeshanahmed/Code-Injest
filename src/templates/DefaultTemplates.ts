// Built-in templates for Code Digest
export const DefaultTemplates = {
  summary: `Directory: {{directory}}
Files analyzed: {{fileCount}}
Generated: {{timestamp}}
Estimated tokens: {{tokenEstimate}}`,
  file: `==== {{filePath}} ====
{{content}}`,
  directory: `Directory: {{directory}}
{{tree}}`,
  header: `# Code Digest Report\n`,
  footer: `\n--- End of Digest ---`
};
