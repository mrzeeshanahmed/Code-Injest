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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const SidebarProvider_1 = require("./panels/SidebarProvider");
const DigestGenerator_1 = require("./utils/DigestGenerator");
function activate(context) {
    const sidebarProvider = new SidebarProvider_1.SidebarProvider(context.extensionUri);
    const ingestGenerator = new DigestGenerator_1.IngestGenerator();
    // Register sidebar view
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('codeIngest.view', sidebarProvider));
    // Register command
    const generateCommand = vscode.commands.registerCommand('codeIngest.create', async () => {
        await ingestGenerator.generateIngest();
    });
    context.subscriptions.push(generateCommand);
    // Listen for messages from sidebar
    sidebarProvider.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'generate':
                await ingestGenerator.generateIngest();
                // Notify webview to reset UI after digest generation
                sidebarProvider.postMessage({
                    command: 'complete',
                    fileCount: 0, // Optionally pass actual file count, outputPath, tokenEstimate
                    outputPath: '',
                    tokenEstimate: 0
                });
                break;
            case 'updateSetting':
                await vscode.workspace.getConfiguration('codeIngest').update(message.key, message.value, vscode.ConfigurationTarget.Workspace);
                break;
            case 'refreshExtension':
                // Re-send settings and refresh sidebar only if _view is defined
                if (sidebarProvider['_view']) {
                    await sidebarProvider['resolveWebviewView'](sidebarProvider['_view'], { state: undefined }, {});
                }
                break;
        }
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map