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
exports.DigestGenerator = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const RepositoryScanner_1 = require("../core/RepositoryScanner");
const FilterEngine_1 = require("../core/FilterEngine");
const tree_1 = require("./tree");
const binary_1 = require("./binary");
const tokens_1 = require("./tokens");
const fs = __importStar(require("fs"));
const constants_1 = require("./constants");
const util_1 = require("util");
const readFile = (0, util_1.promisify)(fs.readFile);
const writeFile = (0, util_1.promisify)(fs.writeFile);
class DigestGenerator {
    constructor() {
        this.config = vscode.workspace.getConfiguration('codeDigest');
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.treeBuilder = new tree_1.TreeBuilder();
        this.binaryDetector = new binary_1.BinaryDetector();
        this.tokenEstimator = new tokens_1.TokenEstimator();
        this.scanner = new RepositoryScanner_1.RepositoryScanner(this.workspaceRoot);
        this.filterEngine = new FilterEngine_1.FilterEngine(this.getFilteringOptions());
    }
    async generateDigest() {
        if (!this.workspaceRoot) {
            vscode.window.showErrorMessage('Please open a workspace folder first.');
            return;
        }
        const nonFatalErrors = [];
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating Code Digest",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Scanning files..." });
                this.config = vscode.workspace.getConfiguration('codeDigest');
                this.filterEngine = new FilterEngine_1.FilterEngine(this.getFilteringOptions());
                const allFiles = await this.scanner.scan({
                    maxDepth: this.config.get('maxDepth', 20),
                    skipDirs: this.config.get('skipDirectories', ['node_modules', '.git'])
                });
                progress.report({ increment: 20, message: "Filtering files..." });
                let filteredFiles = this.filterEngine.filter(allFiles);
                // Apply includedExtensions allowlist if present
                const includedExtensions = this.config.get('includedExtensions', []);
                if (includedExtensions && includedExtensions.length > 0) {
                    const allowed = new Set(includedExtensions.map(e => e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()));
                    filteredFiles = filteredFiles.filter(f => allowed.has(path.extname(f.path).toLowerCase()));
                }
                progress.report({ increment: 40, message: "Processing content..." });
                const { summary, tree, content, warnings } = await this.processFiles(filteredFiles, nonFatalErrors);
                progress.report({ increment: 80, message: "Writing digest file..." });
                const outputPath = await this.writeDigest(summary, tree, content, warnings);
                progress.report({ increment: 100, message: "Complete!" });
                const doc = await vscode.workspace.openTextDocument(outputPath);
                await vscode.window.showTextDocument(doc);
                let infoMsg = `Code digest generated: ${path.basename(outputPath)}`;
                if (warnings && warnings.length > 0) {
                    infoMsg += ` (Completed with warnings: ${warnings.length})`;
                }
                vscode.window.showInformationMessage(infoMsg);
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to generate digest: ${message}`);
        }
    }
    getFilteringOptions() {
        return {
            suggestedIncludes: [],
            suggestedExcludes: [],
            includePatterns: this.config.get('additionalIncludeGlobs', []),
            excludePatterns: this.config.get('additionalExcludeGlobs', []),
            maxFileSize: this.config.get('maxFileSizeKB', 10240) * 1024,
            maxDepth: this.config.get('maxDepth', 20),
            skipDirectories: this.config.get('skipDirectories', ['node_modules', '.git'])
        };
    }
    async processFiles(files, nonFatalErrors) {
        const rootName = path.basename(this.workspaceRoot);
        const timestamp = new Date().toISOString();
        // Map FileMetadata to tree entry type for tree builder
        const treeEntries = files.map(f => ({
            relativePath: path.relative(this.workspaceRoot, f.path).replace(/\\/g, '/'),
            fullPath: f.path,
            isSymlink: f.isSymlink || false,
            symlinkTarget: f.symlinkTarget
        }));
        const tree = this.treeBuilder.buildTree(treeEntries, rootName);
        const contentBlocks = [];
        let processedCount = 0;
        for (const file of files) {
            try {
                const block = await this.processFileContent(file, nonFatalErrors);
                if (block) {
                    contentBlocks.push(block);
                    processedCount++;
                }
            }
            catch (err) {
                nonFatalErrors.push(`processFileContent failed: ${file.path} -> ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        }
        const content = contentBlocks.join('\n');
        const fullText = tree + '\n' + content;
        const tokenEstimate = this.tokenEstimator.estimate(fullText);
        const summary = [
            `Directory: ${rootName}`,
            `Files analyzed: ${processedCount}`,
            `Generated: ${timestamp}`,
            `Estimated tokens: ${tokenEstimate}`
        ].join('\n');
        // Deduplicate warnings
        const warnings = Array.from(new Set(nonFatalErrors));
        return { summary, tree, content, warnings };
    }
    async processFileContent(file, nonFatalErrors) {
        const separator = '='.repeat(48);
        if (file.isSymlink) {
            // Symlink block only
            return [
                separator,
                `SYMLINK: ${file.path}`,
                separator,
                file.symlinkTarget ? `Target: ${file.symlinkTarget}` : 'Target: (unresolved)',
                ''
            ].join('\n');
        }
        try {
            // Read file
            const buffer = await readFile(file.path);
            // Check if binary
            const isBinary = this.binaryDetector.isBinary(buffer);
            const includeBinary = this.config.get('includeBinary', false);
            let contentText;
            if (isBinary && !includeBinary) {
                contentText = '[Binary file]';
            }
            else if (isBinary && includeBinary) {
                try {
                    contentText = buffer.toString('utf8');
                }
                catch {
                    contentText = `Content (base64):\n${buffer.toString('base64')}`;
                }
            }
            else {
                contentText = buffer.toString('utf8');
            }
            // Apply markdown code fences if enabled and output is .md
            const outputFileName = this.config.get('outputFileName', 'digest.txt');
            const useCodeFences = this.config.get('markdownCodeFences', false) &&
                outputFileName.toLowerCase().endsWith('.md');
            if (useCodeFences && !isBinary) {
                const ext = path.extname(file.path).slice(1);
                const language = constants_1.LANGUAGE_MAP[ext] || '';
                contentText = `\`\`\`${language}\n${contentText}\n\`\`\``;
            }
            return [
                separator,
                `FILE: ${file.path}`,
                separator,
                contentText,
                ''
            ].join('\n');
        }
        catch (error) {
            nonFatalErrors.push(`readFile failed: ${file.path} -> ${error instanceof Error ? error.message : 'Unknown error'}`);
            return [
                separator,
                `FILE: ${file.path}`,
                separator,
                `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
                ''
            ].join('\n');
        }
    }
    getLanguageForExtension(ext) {
        return constants_1.LANGUAGE_MAP[ext.toLowerCase()] || '';
    }
    async writeDigest(summary, tree, content, warnings) {
        const outputFileName = this.config.get('outputFileName', 'digest.txt');
        const outputPath = path.join(this.workspaceRoot, outputFileName);
        let fullContent = [
            summary,
            '',
            tree,
            '',
            content
        ].join('\n');
        // Append warnings section if any
        if (warnings && warnings.length > 0) {
            fullContent += '\n\nWarnings:\n' + warnings.map((w) => '- ' + w).join('\n');
        }
        await writeFile(outputPath, fullContent, 'utf8');
        return outputPath;
    }
}
exports.DigestGenerator = DigestGenerator;
//# sourceMappingURL=DigestGenerator.js.map