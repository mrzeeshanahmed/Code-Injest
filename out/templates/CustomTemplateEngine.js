"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTemplateEngine = void 0;
// Template processor for Code Ingest
class CustomTemplateEngine {
    static render(template, context) {
        return template.replace(/{{(\w+)}}/g, (_, key) => context[key] ?? '');
    }
}
exports.CustomTemplateEngine = CustomTemplateEngine;
//# sourceMappingURL=CustomTemplateEngine.js.map