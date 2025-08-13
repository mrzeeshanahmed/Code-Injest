// Settings management for Code Digest
import * as vscode from 'vscode';

export class ConfigManager {
  static get<T>(key: string, defaultValue?: T): T {
    return vscode.workspace.getConfiguration('codeDigest').get<T>(key, defaultValue as T);
  }
  static set<T>(key: string, value: T): Thenable<void> {
    return vscode.workspace.getConfiguration('codeDigest').update(key, value, vscode.ConfigurationTarget.Workspace);
  }
}
