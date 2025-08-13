"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_IGNORE_PATTERNS = exports.LANGUAGE_MAP = exports.CONFIG_FILE_NAMES = exports.CODE_EXTENSIONS_SET = exports.TEXT_EXTENSIONS_SET = exports.BINARY_EXTENSIONS_SET = exports.EXCLUDED_EXTENSIONS_SET = void 0;
// Centralized constants for Code Injest
exports.EXCLUDED_EXTENSIONS_SET = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff', '.svg',
    '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpg', '.mpeg', '.3gp',
    '.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.wma',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.odp', '.rtf',
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.jar', '.war',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.obj', '.o', '.a', '.lib',
]);
exports.BINARY_EXTENSIONS_SET = new Set(exports.EXCLUDED_EXTENSIONS_SET);
exports.TEXT_EXTENSIONS_SET = new Set([
    '.txt', '.md', '.rst', '.json', '.xml', '.yml', '.yaml', '.toml',
    '.ini', '.cfg', '.conf', '.log', '.csv', '.tsv', '.html', '.htm',
    '.css', '.scss', '.sass', '.less', '.svg'
]);
exports.CODE_EXTENSIONS_SET = new Set([
    '.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.c', '.h', '.cpp', '.cc',
    '.cxx', '.hpp', '.hh', '.cs', '.swift', '.php', '.sql', '.rb', '.go',
    '.kt', '.r', '.dart', '.rs', '.vue', '.svelte'
]);
exports.CONFIG_FILE_NAMES = [
    'package.json', 'pyproject.toml', 'go.mod', 'cargo.toml', 'gemfile',
    'requirements.txt', 'pipfile', 'makefile', 'dockerfile', 'procfile',
    '.gitignore', '.gitingestignore', '.gitkeep', '.editorconfig',
    '.prettierrc', '.eslintrc', '.npmrc', '.yarnrc', '.python-version'
];
exports.LANGUAGE_MAP = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    py: 'python', java: 'java', c: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    cs: 'csharp', php: 'php', rb: 'ruby', go: 'go', rs: 'rust', swift: 'swift',
    kt: 'kotlin', dart: 'dart', json: 'json', xml: 'xml', html: 'html',
    css: 'css', scss: 'scss', yml: 'yaml', yaml: 'yaml', md: 'markdown',
    sh: 'bash', sql: 'sql'
};
exports.DEFAULT_IGNORE_PATTERNS = [
    'node_modules/', 'dist/', 'build/', 'target/', 'out/',
    '.next/', '.nuxt/', '.venv/', 'venv/', '.idea/', '.vscode/',
    'pycache/', '.pytest_cache/', 'coverage/', 'logs/', '*.log',
    'site-packages/', '.DS_Store', 'Thumbs.db'
];
//# sourceMappingURL=constants.js.map