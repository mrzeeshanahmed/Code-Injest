
import * as vscode from 'vscode';
import * as path from 'path';
import { RepositoryScanner, FileMetadata } from '../core/RepositoryScanner';
import { FilterEngine, FilteringOptions } from '../core/FilterEngine';
import { TreeBuilder } from './tree';
import { BinaryDetector } from './binary';
import { TokenEstimator } from './tokens';
import * as fs from 'fs';
import {
	EXCLUDED_EXTENSIONS_SET,
	BINARY_EXTENSIONS_SET,
	TEXT_EXTENSIONS_SET,
	CODE_EXTENSIONS_SET,
	CONFIG_FILE_NAMES,
	LANGUAGE_MAP
} from './constants';
import { promisify } from 'util';
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export class DigestGenerator {
	private config: vscode.WorkspaceConfiguration;
	private workspaceRoot: string;
	private treeBuilder: TreeBuilder;
	private binaryDetector: BinaryDetector;
	private tokenEstimator: TokenEstimator;
	private scanner: RepositoryScanner;
	private filterEngine: FilterEngine;

	constructor() {
		this.config = vscode.workspace.getConfiguration('codeDigest');
		this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
		this.treeBuilder = new TreeBuilder();
		this.binaryDetector = new BinaryDetector();
		this.tokenEstimator = new TokenEstimator();
		this.scanner = new RepositoryScanner(this.workspaceRoot);
		this.filterEngine = new FilterEngine(this.getFilteringOptions());
	}

	async generateDigest(): Promise<void> {
		if (!this.workspaceRoot) {
			vscode.window.showErrorMessage('Please open a workspace folder first.');
			return;
		}
		const nonFatalErrors: string[] = [];
		try {
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Generating Code Digest",
				cancellable: false
			}, async (progress) => {
				progress.report({ increment: 0, message: "Scanning files..." });
				this.config = vscode.workspace.getConfiguration('codeDigest');
				this.filterEngine = new FilterEngine(this.getFilteringOptions());
				const allFiles: FileMetadata[] = await this.scanner.scan({
					maxDepth: this.config.get<number>('maxDepth', 20),
					skipDirs: this.config.get<string[]>('skipDirectories', ['node_modules', '.git'])
				});
				progress.report({ increment: 20, message: "Filtering files..." });
				let filteredFiles: FileMetadata[] = this.filterEngine.filter(allFiles) as FileMetadata[];
				// Apply includedExtensions allowlist if present
				const includedExtensions: string[] = this.config.get<string[]>('includedExtensions', []);
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
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error occurred';
			vscode.window.showErrorMessage(`Failed to generate digest: ${message}`);
		}
	}

	private getFilteringOptions(): FilteringOptions {
		return {
			suggestedIncludes: [],
			suggestedExcludes: [],
			includePatterns: this.config.get<string[]>('additionalIncludeGlobs', []),
			excludePatterns: this.config.get<string[]>('additionalExcludeGlobs', []),
			maxFileSize: this.config.get<number>('maxFileSizeKB', 10240) * 1024,
			maxDepth: this.config.get<number>('maxDepth', 20),
			skipDirectories: this.config.get<string[]>('skipDirectories', ['node_modules', '.git'])
		};
	}

	private async processFiles(files: FileMetadata[], nonFatalErrors: string[]): Promise<{ summary: string; tree: string; content: string; warnings: string[] }> {
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
		const contentBlocks: string[] = [];
		let processedCount = 0;
		for (const file of files) {
			try {
				const block = await this.processFileContent(file, nonFatalErrors);
				if (block) {
					contentBlocks.push(block);
					processedCount++;
				}
			} catch (err) {
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

	private async processFileContent(file: FileMetadata, nonFatalErrors: string[]): Promise<string> {
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
			const includeBinary = this.config.get<boolean>('includeBinary', false);
			let contentText: string;
			if (isBinary && !includeBinary) {
				contentText = '[Binary file]';
			} else if (isBinary && includeBinary) {
				try {
					contentText = buffer.toString('utf8');
				} catch {
					contentText = `Content (base64):\n${buffer.toString('base64')}`;
				}
			} else {
				contentText = buffer.toString('utf8');
			}
			// Apply markdown code fences if enabled and output is .md
			const outputFileName = this.config.get<string>('outputFileName', 'digest.txt');
			const useCodeFences = this.config.get<boolean>('markdownCodeFences', false) && 
								 outputFileName.toLowerCase().endsWith('.md');
			if (useCodeFences && !isBinary) {
				const ext = path.extname(file.path).slice(1);
				const language = LANGUAGE_MAP[ext] || '';
				contentText = `\`\`\`${language}\n${contentText}\n\`\`\``;
			}
			return [
				separator,
				`FILE: ${file.path}`,
				separator,
				contentText,
				''
			].join('\n');
		} catch (error) {
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

	private getLanguageForExtension(ext: string): string {
	return LANGUAGE_MAP[ext.toLowerCase()] || '';
	}

	private async writeDigest(summary: string, tree: string, content: string, warnings?: string[]): Promise<string> {
		const outputFileName = this.config.get<string>('outputFileName', 'digest.txt');
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
			fullContent += '\n\nWarnings:\n' + warnings.map((w: string) => '- ' + w).join('\n');
		}
		await writeFile(outputPath, fullContent, 'utf8');
		return outputPath;
	}
}
