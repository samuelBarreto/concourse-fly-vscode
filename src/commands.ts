import * as vscode from "vscode";
import * as path from "path";
import * as fly from "./fly";
import { addTeam, getTeams, removeTeam } from "./teams";
import { getDeployHistory, saveDeployHistory } from "./deployHistory";
import { PipelineTreeItem, JobTreeItem, BuildTreeItem, TeamTreeItem } from "./providers/treeView";

export function registerCommands(
  context: vscode.ExtensionContext,
  refreshAll: () => void
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("concourse.login", async () => {
      const config = vscode.workspace.getConfiguration("concourse");

      // 1. Select fly binary
      let flyPath = config.get<string>("flyPath", "fly");
      if (flyPath === "fly") {
        const picked = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          title: "Select fly binary",
          filters: { "Executable": ["exe", "*"] },
        });
        if (picked && picked.length > 0) {
          flyPath = picked[0].fsPath;
          await config.update("flyPath", flyPath, vscode.ConfigurationTarget.Global);
        } else {
          return;
        }
      }

      // 2. Login method
      const loginMethod = await vscode.window.showQuickPick(
        [
          { label: "$(globe) Browser login", description: "Opens browser for OAuth/SSO authentication", value: "browser" },
          { label: "$(key) Username & Password", description: "Login with local user credentials", value: "basic" },
        ],
        { placeHolder: "How do you want to log in?" }
      );
      if (!loginMethod) { return; }

      // 3. Concourse URL
      let url = config.get<string>("url", "");
      if (!url) {
        url = await vscode.window.showInputBox({
          prompt: "Concourse URL",
          placeHolder: "http://localhost:8080",
        }) || "";
        if (!url) { return; }
        await config.update("url", url, vscode.ConfigurationTarget.Global);
      }

      // 4. Target name
      const target = await vscode.window.showInputBox({
        prompt: "Target name",
        placeHolder: "ci",
      }) || "";
      if (!target) { return; }
      await config.update("target", target, vscode.ConfigurationTarget.Global);

      // 5. TLS config
      const tlsOption = await vscode.window.showQuickPick(
        ["No", "Yes (insecure, skip TLS verification)"],
        { placeHolder: "Skip TLS verification?" }
      );
      if (!tlsOption) { return; }

      const skipTls = tlsOption.startsWith("Yes");
      let caCert: string | undefined;

      if (!skipTls) {
        const useCaCert = await vscode.window.showQuickPick(
          ["No", "Yes"],
          { placeHolder: "Use custom CA certificate?" }
        );
        if (useCaCert === "Yes") {
          const picked = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            title: "Select CA certificate file",
            filters: { "Certificate": ["pem", "crt", "cert", "*"] },
          });
          if (picked && picked.length > 0) {
            caCert = picked[0].fsPath;
          }
        }
      }

      // 6. Team name
      const team = await vscode.window.showInputBox({
        prompt: "Team name",
        placeHolder: "main",
        value: "main",
      }) || "main";

      // 7. Execute login
      if (loginMethod.value === "browser") {
        const args = fly.loginBrowserArgs(url, target, skipTls, caCert, team);
        const terminal = vscode.window.createTerminal("Concourse Login");
        terminal.show();
        terminal.sendText(args.join(" "));
        vscode.window.showInformationMessage("Complete the login in your browser, then the terminal will confirm.");
        await addTeam(context, { name: team, target });
        setTimeout(refreshAll, 10000);
      } else {
        const username = await vscode.window.showInputBox({ prompt: "Username" }) || "";
        const password = await vscode.window.showInputBox({ prompt: "Password", password: true }) || "";
        if (!username || !password) { return; }

        try {
          await fly.login(url, username, password, target, skipTls, caCert, team);
          await addTeam(context, { name: team, target });
          vscode.window.showInformationMessage(`Logged in to ${url} as ${username} (team: ${team})`);
          refreshAll();
        } catch (error: any) {
          vscode.window.showErrorMessage(`Login failed: ${error.message}`);
        }
      }
    }),

    vscode.commands.registerCommand("concourse.logout", async (item?: TeamTreeItem) => {
      let teamName: string;
      let target: string;

      if (item) {
        teamName = item.team.name;
        target = item.team.target;
      } else {
        const teams = getTeams(context);
        if (teams.length === 0) {
          vscode.window.showWarningMessage("No teams logged in");
          return;
        }
        const picked = await vscode.window.showQuickPick(
          teams.map((t) => ({ label: `${t.name} (${t.target})`, team: t })),
          { placeHolder: "Select team to logout" }
        );
        if (!picked) { return; }
        teamName = picked.team.name;
        target = picked.team.target;
      }

      try {
        await fly.logout(target);
        await removeTeam(context, teamName, target);
        vscode.window.showInformationMessage(`Logged out from team '${teamName}'`);
        refreshAll();
      } catch (error: any) {
        // Remove from list even if fly logout fails
        await removeTeam(context, teamName, target);
        refreshAll();
      }
    }),

    vscode.commands.registerCommand("concourse.setPipeline", async (uri?: vscode.Uri) => {
      let filePath: string;
      let defaultName: string;

      if (uri) {
        filePath = uri.fsPath;
        defaultName = path.basename(filePath, path.extname(filePath));
      } else {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showWarningMessage("Open a pipeline YAML file first");
          return;
        }
        filePath = editor.document.fileName;
        defaultName = path.basename(filePath, path.extname(filePath));
      }

      const teams = getTeams(context);
      if (teams.length === 0) {
        vscode.window.showWarningMessage("Login to a team first");
        return;
      }

      const picked = await vscode.window.showQuickPick(
        teams.map((t) => ({ label: `${t.name} (${t.target})`, team: t })),
        { placeHolder: "Select team to deploy to" }
      );
      if (!picked) { return; }

      const name = await vscode.window.showInputBox({
        prompt: "Pipeline name",
        placeHolder: defaultName,
        value: defaultName,
      });
      if (!name) { return; }

      try {
        await fly.setPipeline(name, filePath, picked.team.target);
        await saveDeployHistory(context, {
          filePath,
          pipelineName: name,
          teamName: picked.team.name,
          target: picked.team.target,
          lastDeployed: Date.now(),
        });
        vscode.window.showInformationMessage(`Pipeline '${name}' set on team '${picked.team.name}'`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Set pipeline failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.triggerJob", async (item?: JobTreeItem) => {
      if (!item) { return; }
      try {
        await fly.triggerJob(item.job.pipeline_name, item.job.name, item.target);
        vscode.window.showInformationMessage(`Triggered ${item.job.pipeline_name}/${item.job.name}`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Trigger failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.unpausePipeline", async (item?: PipelineTreeItem) => {
      if (!item) { return; }
      try {
        await fly.unpausePipeline(item.pipeline.name, item.target);
        vscode.window.showInformationMessage(`Unpaused pipeline '${item.pipeline.name}'`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Unpause failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.pausePipeline", async (item?: PipelineTreeItem) => {
      if (!item) { return; }
      try {
        await fly.pausePipeline(item.pipeline.name, item.target);
        vscode.window.showInformationMessage(`Paused pipeline '${item.pipeline.name}'`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Pause failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.viewBuildLogs", async (item?: BuildTreeItem) => {
      if (!item) { return; }
      try {
        const logs = await fly.getBuildLogs(item.build.id, item.target);
        const doc = await vscode.workspace.openTextDocument({ content: logs, language: "log" });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to fetch logs: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.viewPipelineYaml", async (item?: PipelineTreeItem) => {
      if (!item) { return; }
      try {
        const yaml = await fly.getPipelineConfig(item.pipeline.name, item.target);
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
          const fileName = `${item.pipeline.name}.yml`;
          const defaultUri = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName);
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri,
            filters: { "YAML": ["yml", "yaml"] },
            title: `Save pipeline "${item.pipeline.name}"`,
          });
          if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(yaml));
            const doc = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`Pipeline saved to ${vscode.workspace.asRelativePath(saveUri)}`);
            return;
          }
        }

        const doc = await vscode.workspace.openTextDocument({ content: yaml, language: "yaml" });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get pipeline: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.viewJobYaml", async (item?: JobTreeItem) => {
      if (!item) { return; }
      try {
        const yaml = await fly.getJobConfig(item.job.pipeline_name, item.job.name, item.target);
        const workspaceFolders = vscode.workspace.workspaceFolders;

        if (workspaceFolders && workspaceFolders.length > 0) {
          const fileName = `${item.job.pipeline_name}-${item.job.name}.yml`;
          const defaultUri = vscode.Uri.joinPath(workspaceFolders[0].uri, fileName);
          const saveUri = await vscode.window.showSaveDialog({
            defaultUri,
            filters: { "YAML": ["yml", "yaml"] },
            title: `Save job "${item.job.pipeline_name}/${item.job.name}"`,
          });
          if (saveUri) {
            await vscode.workspace.fs.writeFile(saveUri, Buffer.from(yaml));
            const doc = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`Job saved to ${vscode.workspace.asRelativePath(saveUri)}`);
            return;
          }
        }

        const doc = await vscode.workspace.openTextDocument({ content: yaml, language: "yaml" });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get job config: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.interceptBuild", async (item?: BuildTreeItem) => {
      if (!item) { return; }
      const args = fly.interceptBuild(item.build.id, item.target);
      const terminal = vscode.window.createTerminal(`Intercept #${item.build.name}`);
      terminal.show();
      terminal.sendText(args.join(" "));
    }),

    vscode.commands.registerCommand("concourse.interceptJob", async (item?: JobTreeItem) => {
      if (!item) { return; }
      const args = fly.interceptJob(item.job.pipeline_name, item.job.name, item.target);
      const terminal = vscode.window.createTerminal(`Intercept ${item.job.pipeline_name}/${item.job.name}`);
      terminal.show();
      terminal.sendText(args.join(" "));
    }),

    vscode.commands.registerCommand("concourse.quickDeploy", async (document?: vscode.TextDocument) => {
      const doc = document || vscode.window.activeTextEditor?.document;
      if (!doc) { return; }

      const history = getDeployHistory(context, doc.fileName);
      if (!history) {
        vscode.commands.executeCommand("concourse.setPipeline");
        return;
      }

      const confirm = await vscode.window.showQuickPick(
        ["Yes", "No"],
        { placeHolder: `Deploy "${history.pipelineName}" to ${history.teamName} (${history.target})?` }
      );
      if (confirm !== "Yes") { return; }

      try {
        await fly.setPipeline(history.pipelineName, doc.fileName, history.target);
        await saveDeployHistory(context, { ...history, lastDeployed: Date.now() });
        vscode.window.showInformationMessage(`Pipeline '${history.pipelineName}' updated on ${history.teamName}`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Deploy failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.diffPipeline", async (document?: vscode.TextDocument) => {
      const doc = document || vscode.window.activeTextEditor?.document;
      if (!doc) { return; }

      const history = getDeployHistory(context, doc.fileName);
      if (!history) {
        vscode.window.showWarningMessage("No deploy history for this file. Deploy it first.");
        return;
      }

      try {
        // Get current config from Concourse
        const remoteYaml = await fly.getPipelineConfig(history.pipelineName, history.target);

        // Create temp file with remote content
        const remoteDoc = await vscode.workspace.openTextDocument({
          content: remoteYaml,
          language: "yaml",
        });

        // Show diff
        await vscode.commands.executeCommand(
          "vscode.diff",
          remoteDoc.uri,
          doc.uri,
          `${history.pipelineName} (Concourse) ↔ ${path.basename(doc.fileName)} (Local)`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`Diff failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.refresh", () => {
      refreshAll();
    }),

    vscode.commands.registerCommand("concourse.newPipeline", async () => {
      const { templates } = await import("./providers/templates");
      const picked = await vscode.window.showQuickPick(
        templates.map((t) => ({ label: t.name, description: t.description, template: t })),
        { placeHolder: "Select a pipeline template" }
      );
      if (!picked) { return; }

      const doc = await vscode.workspace.openTextDocument({
        content: picked.template.content,
        language: "yaml",
      });
      await vscode.window.showTextDocument(doc);
    })
  );
}
