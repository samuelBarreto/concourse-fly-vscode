import * as vscode from "vscode";
import { PipelineProvider, BuildProvider } from "./providers/treeView";
import { TemplateProvider, PipelineTemplate } from "./providers/templates";
import { registerCommands } from "./commands";

export function activate(context: vscode.ExtensionContext) {
  const pipelineProvider = new PipelineProvider();
  const buildProvider = new BuildProvider();
  const templateProvider = new TemplateProvider();

  vscode.window.registerTreeDataProvider("concoursePipelines", pipelineProvider);
  vscode.window.registerTreeDataProvider("concourseBuilds", buildProvider);
  vscode.window.registerTreeDataProvider("concourseTemplates", templateProvider);

  const refreshAll = () => {
    pipelineProvider.refresh();
    buildProvider.refresh();
  };

  registerCommands(context, refreshAll);

  // Apply template command — opens a new YAML file with the template content
  context.subscriptions.push(
    vscode.commands.registerCommand("concourse.applyTemplate", async (template: PipelineTemplate) => {
      const doc = await vscode.workspace.openTextDocument({
        content: template.content,
        language: "yaml",
      });
      await vscode.window.showTextDocument(doc);
      vscode.window.showInformationMessage(
        `Template "${template.name}" loaded. Save as pipeline.yml and use "Concourse: Set Pipeline" to deploy.`
      );
    })
  );

  // Deploy template command — saves to temp file and runs set-pipeline
  context.subscriptions.push(
    vscode.commands.registerCommand("concourse.deployTemplate", async (item: any) => {
      const template: PipelineTemplate = item?.template;
      if (!template) { return; }

      const name = await vscode.window.showInputBox({
        prompt: "Pipeline name",
        placeHolder: template.name.toLowerCase().replace(/\s+/g, "-"),
        value: template.name.toLowerCase().replace(/\s+/g, "-"),
      });
      if (!name) { return; }

      const fs = await import("fs");
      const os = await import("os");
      const path = await import("path");
      const tmpFile = path.join(os.tmpdir(), `concourse-${name}.yml`);
      fs.writeFileSync(tmpFile, template.content);

      try {
        const fly = await import("./fly");
        await fly.setPipeline(name, tmpFile);
        await fly.unpausePipeline(name);
        vscode.window.showInformationMessage(`Pipeline "${name}" deployed and unpaused!`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Deploy failed: ${error.message}`);
      } finally {
        fs.unlinkSync(tmpFile);
      }
    })
  );

  // Auto-refresh every 30 seconds
  const interval = setInterval(refreshAll, 30000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  // Status bar item showing the current target
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBar.command = "concourse.login";

  function updateStatusBar() {
    const target = vscode.workspace.getConfiguration("concourse").get("target", "");
    if (target) {
      statusBar.text = `$(cloud) Concourse: ${target}`;
      statusBar.show();
    } else {
      statusBar.text = "$(cloud) Concourse: not configured";
      statusBar.show();
    }
  }

  updateStatusBar();
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("concourse")) {
      updateStatusBar();
      refreshAll();
    }
  });

  context.subscriptions.push(statusBar);
}

export function deactivate() {}
