import * as vscode from "vscode";
import * as path from "path";
import { getDeployHistory, DeployEntry } from "../deployHistory";

export class PipelineCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    // Only show for YAML files
    if (document.languageId !== "yaml") {
      return [];
    }

    // Check if it looks like a Concourse pipeline (has jobs: or resources:)
    const text = document.getText();
    if (!text.match(/^(jobs|resources):/m)) {
      return [];
    }

    const range = new vscode.Range(0, 0, 0, 0);
    const lenses: vscode.CodeLens[] = [];

    const pipelineName = path.basename(document.fileName, path.extname(document.fileName));
    const history = getDeployHistory(this.context, document.fileName);

    if (history) {
      // Has been deployed before — show quick deploy
      lenses.push(
        new vscode.CodeLens(range, {
          title: `$(rocket) Deploy "${pipelineName}" to ${history.teamName} (${history.target})`,
          command: "concourse.quickDeploy",
          arguments: [document],
        })
      );
      lenses.push(
        new vscode.CodeLens(range, {
          title: "$(diff) Diff with Concourse",
          command: "concourse.diffPipeline",
          arguments: [document],
        })
      );
    } else {
      // First time — show deploy with team picker
      lenses.push(
        new vscode.CodeLens(range, {
          title: `$(cloud-upload) Deploy "${pipelineName}" to Concourse`,
          command: "concourse.setPipeline",
          arguments: [],
        })
      );
    }

    return lenses;
  }
}
