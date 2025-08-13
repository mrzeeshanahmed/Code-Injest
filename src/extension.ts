import * as vscode from 'vscode';
import { SidebarProvider } from './panels/SidebarProvider';
import { IngestGenerator } from './utils/DigestGenerator';

export function activate(context: vscode.ExtensionContext) {
    const sidebarProvider = new SidebarProvider(context.extensionUri);
    const ingestGenerator = new IngestGenerator();

    // Register sidebar view
    context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('codeIngest.view', sidebarProvider)
    );

    // Register command
    const generateCommand = vscode.commands.registerCommand('codeIngest.create', async () => {
        await ingestGenerator.generateIngest();
    });

    context.subscriptions.push(generateCommand);

    // Listen for messages from sidebar
    sidebarProvider.onDidReceiveMessage(async (message: any) => {
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
                await vscode.workspace.getConfiguration('codeIngest').update(
                    message.key,
                    message.value,
                    vscode.ConfigurationTarget.Workspace
                );
                break;
            case 'refreshExtension':
                // Re-send settings and refresh sidebar only if _view is defined
                if (sidebarProvider['_view']) {
                    await sidebarProvider['resolveWebviewView'](
                        sidebarProvider['_view'],
                        { state: undefined },
                        {} as vscode.CancellationToken
                    );
                }
                break;
        }
    });
}

export function deactivate() {}
