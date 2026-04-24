import * as vscode from "vscode";
import { PipelineProvider, BuildProvider } from "./providers/treeView";
import { TemplateProvider, PipelineTemplate } from "./providers/templates";
import { registerCommands } from "./commands";

export function activate(context: vscode.ExtensionContext) {
  const pipelineProvider = new PipelineProvider(context);
  const buildProvider = new BuildProvider(context);
  const templateProvider = new TemplateProvider();

  vscode.window.registerTreeDataProvider("concoursePipelines", pipelineProvider);
  vscode.window.registerTreeDataProvider("concourseBuilds", buildProvider);
  vscode.window.registerTreeDataProvider("concourseTemplates", templateProvider);

  const refreshAll = () => {
    pipelineProvider.refresh();
    buildProvider.refresh();
  };

  registerCommands(context, refreshAll);

  // Apply template command
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

  // Deploy template command
  context.subscriptions.push(
    vscode.commands.registerCommand("concourse.deployTemplate", async (item: any) => {
      const template: PipelineTemplate = item?.template;
      if (!template) { return; }

      const { getTeams } = await import("./teams");
      const teams = getTeams(context);
      if (teams.length === 0) {
        vscode.window.showWarningMessage("Login to a team first");
        return;
      }

      const pickedTeam = await vscode.window.showQuickPick(
        teams.map((t) => ({ label: `${t.name} (${t.target})`, team: t })),
        { placeHolder: "Select team to deploy to" }
      );
      if (!pickedTeam) { return; }

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
        await fly.setPipeline(name, tmpFile, pickedTeam.team.target);
        await fly.unpausePipeline(name, pickedTeam.team.target);
        vscode.window.showInformationMessage(`Pipeline "${name}" deployed to team '${pickedTeam.team.name}'!`);
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

  // Status bar
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
  statusBar.command = "concourse.login";

  function updateStatusBar() {
    const { getTeams } = require("./teams");
    const teams = getTeams(context);
    if (teams.length > 0) {
      statusBar.text = `$(cloud) Concourse: ${teams.length} team(s)`;
    } else {
      statusBar.text = "$(cloud) Concourse: not connected";
    }
    statusBar.show();
  }

  updateStatusBar();
  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("concourse")) {
      updateStatusBar();
      refreshAll();
    }
  });

  // Refresh status bar when teams change
  const originalRefresh = refreshAll;
  const refreshWithStatus = () => {
    originalRefresh();
    updateStatusBar();
  };

  context.subscriptions.push(statusBar);
}

export function deactivate() {}
