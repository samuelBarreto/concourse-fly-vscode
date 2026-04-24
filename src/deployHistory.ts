import * as vscode from "vscode";

export interface DeployEntry {
  filePath: string;
  pipelineName: string;
  teamName: string;
  target: string;
  lastDeployed: number;
}

const HISTORY_KEY = "concourse.deployHistory";

export function getDeployHistory(context: vscode.ExtensionContext, filePath: string): DeployEntry | undefined {
  const history = context.globalState.get<DeployEntry[]>(HISTORY_KEY, []);
  return history.find((h) => h.filePath === filePath);
}

export async function saveDeployHistory(context: vscode.ExtensionContext, entry: DeployEntry): Promise<void> {
  const history = context.globalState.get<DeployEntry[]>(HISTORY_KEY, []);
  const existing = history.findIndex((h) => h.filePath === entry.filePath);
  if (existing >= 0) {
    history[existing] = entry;
  } else {
    history.push(entry);
  }
  await context.globalState.update(HISTORY_KEY, history);
}
