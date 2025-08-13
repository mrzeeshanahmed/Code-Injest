"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../utils/constants");
const tree_1 = require("../utils/tree");
const pathMod = __importStar(require("path"));
class SidebarProvider {
    constructor(extensionUri) {
        this._onDidReceiveMessage = new vscode.EventEmitter();
        this.onDidReceiveMessage = this._onDidReceiveMessage.event;
        this._extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'src', 'webview')
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage((message) => {
            this._onDidReceiveMessage.fire(message);
        }, undefined);
        // Send current settings to webview
        this._updateWebviewSettings();
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('codeIngest')) {
                this._updateWebviewSettings();
            }
        });
    }
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
    async _updateWebviewSettings() {
        const config = vscode.workspace.getConfiguration('codeIngest');
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        let tree = '';
        let extensions = [];
        if (workspaceFolder) {
            try {
                const fg = await Promise.resolve().then(() => __importStar(require('fast-glob')));
                const files = await fg.default(["**/*.*"], { cwd: workspaceFolder, dot: true, onlyFiles: true });
                const fileEntries = files.map((f) => ({ relativePath: f, fullPath: pathMod.join(workspaceFolder, f), isSymlink: false }));
                tree = new tree_1.TreeBuilder().buildTree(fileEntries, pathMod.basename(workspaceFolder));
                extensions = Array.from(new Set(files.map(f => {
                    const ext = pathMod.extname(f).toLowerCase();
                    return ext.startsWith('.') ? ext.slice(1) : '';
                }).filter(e => e && !constants_1.EXCLUDED_EXTENSIONS_SET.has('.' + e))));
                extensions = extensions.sort();
            }
            catch (err) {
                tree = 'Error building tree';
                extensions = [];
            }
        }
        this.postMessage({
            command: 'updateSettings',
            settings: {
                outputFileName: config.get('outputFileName'),
                respectGitignore: config.get('respectGitignore'),
                includeDotfiles: config.get('includeDotfiles'),
                includeGitDir: config.get('includeGitDir'),
                maxFileSizeKB: config.get('maxFileSizeKB'),
                includeBinary: config.get('includeBinary'),
                additionalIncludeGlobs: config.get('additionalIncludeGlobs'),
                additionalExcludeGlobs: config.get('additionalExcludeGlobs'),
                markdownCodeFences: config.get('markdownCodeFences'),
                tree,
                extensions
            }
        });
    }
    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'styles.css'));
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="${styleUri}" rel="stylesheet">
<title>Code Ingest</title>
</head>
<body>
<div class="container">
<h2>Create Code Ingest</h2>
<p class="subtitle">Gitingest-style local ingest</p>
<form id="ingestForm">
<button type="button" id="refreshBtn" class="refresh-btn">🔄 Refresh Extension</button>
<div class="form-group">
<label for="outputFileName">Output File:</label>
<input type="text" id="outputFileName" placeholder="ingest">
<div class="ext-choice">
    <label><input type="checkbox" id="extTxt" checked> .txt</label>
    <label><input type="checkbox" id="extMd"> .md</label>
</div>
</div>
<div class="form-group">
<label>Directory Tree:</label>
<div id="treeBox" class="tree-box"><pre id="treeContent"></pre></div>
</div>
<div class="form-group">
<label>File Extensions to Export:</label>
<div id="extCheckboxes" class="ext-checkboxes"></div>
</div>
<div class="form-group">
<label><input type="checkbox" id="respectGitignore"> Respect .gitignore</label>
</div>
<div class="form-group">
<label><input type="checkbox" id="includeDotfiles"> Include dotfiles</label>
</div>
<div class="form-group">
<label><input type="checkbox" id="includeGitDir"> Include .git directory</label>
<small class="warning">⚠️ May include sensitive data and large files</small>
</div>
<div class="form-group">
<label for="maxFileSizeKB">Max file size (KB):</label>
<input type="number" id="maxFileSizeKB" min="1" max="102400">
</div>
<div class="form-group">
<label><input type="checkbox" id="includeBinary"> Include binary files</label>
<small class="warning">⚠️ May produce very large output</small>
</div>
<div class="form-group">
<label for="additionalIncludeGlobs">Additional include patterns:</label>
<textarea id="additionalIncludeGlobs" placeholder="*.config&#10;**/*.yml" rows="2"></textarea>
<small>One glob pattern per line</small>
</div>
<div class="form-group">
<label for="additionalExcludeGlobs">Additional exclude patterns:</label>
<textarea id="additionalExcludeGlobs" placeholder="*.temp&#10;cache/**" rows="2"></textarea>
<small>One glob pattern per line</small>
</div>
<div class="form-group">
<label><input type="checkbox" id="markdownCodeFences"> Use markdown code fences</label>
<small>Only applies to .md output files</small>
</div>
<button type="button" id="generateBtn" class="generate-btn">Generate Ingest</button>
</form>
<div id="progress" class="progress hidden">
<div class="spinner"></div>
<span id="progressText">Generating ingest...</span>
</div>
<div id="results" class="results hidden">
<h3>Results</h3>
<div id="result"></div>
</div>
</div>
<script src="${scriptUri}"></script>
</body>
</html>`;
    }
}
exports.SidebarProvider = SidebarProvider;
//# sourceMappingURL=SidebarProvider.js.map