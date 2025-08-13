// Template processor for Code Digest
export class CustomTemplateEngine {
  static render(template: string, context: Record<string, any>): string {
    return template.replace(/{{(\w+)}}/g, (_, key) => context[key] ?? '');
  }
}
