import * as vscode from "vscode";
import * as fly from "./fly";
import { PipelineTreeItem, JobTreeItem, BuildTreeItem } from "./providers/treeView";

export function registerCommands(
  context: vscode.ExtensionContext,
  refreshAll: () => void
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("concourse.login", async () => {
      const config = vscode.workspace.getConfiguration("concourse");

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

      let url = config.get<string>("url", "");
      if (!url) {
        url = await vscode.window.showInputBox({
          prompt: "Concourse URL",
          placeHolder: "http://localhost:8080",
        }) || "";
        if (!url) { return; }
        await config.update("url", url, vscode.ConfigurationTarget.Global);
      }

      let target = config.get<string>("target", "");
      if (!target) {
        target = await vscode.window.showInputBox({
          prompt: "Target name",
          placeHolder: "ci",
        }) || "";
        if (!target) { return; }
        await config.update("target", target, vscode.ConfigurationTarget.Global);
      }

      const username = await vscode.window.showInputBox({ prompt: "Username" }) || "";
      const password = await vscode.window.showInputBox({ prompt: "Password", password: true }) || "";

      if (!username || !password) { return; }

      try {
        await fly.login(url, username, password);
        vscode.window.showInformationMessage(`Logged in to ${url} as ${username}`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Login failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.setPipeline", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("Open a pipeline YAML file first");
        return;
      }

      const filePath = editor.document.fileName;
      const name = await vscode.window.showInputBox({
        prompt: "Pipeline name",
        placeHolder: "my-pipeline",
      });

      if (!name) { return; }

      try {
        await fly.setPipeline(name, filePath);
        vscode.window.showInformationMessage(`Pipeline '${name}' set successfully`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Set pipeline failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.triggerJob", async (item?: JobTreeItem) => {
      let pipelineName: string;
      let jobName: string;

      if (item) {
        pipelineName = item.job.pipeline_name;
        jobName = item.job.name;
      } else {
        pipelineName = await vscode.window.showInputBox({ prompt: "Pipeline name" }) || "";
        jobName = await vscode.window.showInputBox({ prompt: "Job name" }) || "";
        if (!pipelineName || !jobName) { return; }
      }

      try {
        await fly.triggerJob(pipelineName, jobName);
        vscode.window.showInformationMessage(`Triggered ${pipelineName}/${jobName}`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Trigger failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.unpausePipeline", async (item?: PipelineTreeItem) => {
      const name = item?.pipeline.name
        || await vscode.window.showInputBox({ prompt: "Pipeline name" }) || "";
      if (!name) { return; }

      try {
        await fly.unpausePipeline(name);
        vscode.window.showInformationMessage(`Unpaused pipeline '${name}'`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Unpause failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.pausePipeline", async (item?: PipelineTreeItem) => {
      const name = item?.pipeline.name
        || await vscode.window.showInputBox({ prompt: "Pipeline name" }) || "";
      if (!name) { return; }

      try {
        await fly.pausePipeline(name);
        vscode.window.showInformationMessage(`Paused pipeline '${name}'`);
        refreshAll();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Pause failed: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.viewBuildLogs", async (item?: BuildTreeItem) => {
      if (!item) { return; }

      try {
        const logs = await fly.getBuildLogs(item.build.id);
        const doc = await vscode.workspace.openTextDocument({
          content: logs,
          language: "log",
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to fetch logs: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.refresh", () => {
      refreshAll();
    }),

    vscode.commands.registerCommand("concourse.viewPipelineYaml", async (item?: PipelineTreeItem) => {
      const name = item?.pipeline.name
        || await vscode.window.showInputBox({ prompt: "Pipeline name" }) || "";
      if (!name) { return; }

      try {
        const yaml = await fly.getPipelineConfig(name);
        const doc = await vscode.workspace.openTextDocument({
          content: yaml,
          language: "yaml",
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get pipeline: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.interceptBuild", async (item?: BuildTreeItem) => {
      if (!item) { return; }

      const args = fly.interceptBuild(item.build.id);
      const terminal = vscode.window.createTerminal(`Intercept #${item.build.name}`);
      terminal.show();
      terminal.sendText(args.join(" "));
    }),

    vscode.commands.registerCommand("concourse.interceptJob", async (item?: JobTreeItem) => {
      if (!item) { return; }

      const args = fly.interceptJob(item.job.pipeline_name, item.job.name);
      const terminal = vscode.window.createTerminal(`Intercept ${item.job.pipeline_name}/${item.job.name}`);
      terminal.show();
      terminal.sendText(args.join(" "));
    }),

    vscode.commands.registerCommand("concourse.viewJobYaml", async (item?: JobTreeItem) => {
      if (!item) { return; }

      try {
        const yaml = await fly.getJobConfig(item.job.pipeline_name, item.job.name);
        const doc = await vscode.workspace.openTextDocument({
          content: yaml,
          language: "yaml",
        });
        await vscode.window.showTextDocument(doc, { preview: true });
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to get job config: ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("concourse.newPipeline", async () => {
      const templates: Record<string, string> = {
        "Hello World": `jobs:
- name: hello
  plan:
  - task: say-hello
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: alpine }
      run:
        path: echo
        args: ["hello world"]
`,
        "Git Resource": `resources:
- name: my-repo
  type: git
  source:
    uri: https://github.com/user/repo.git
    branch: main

jobs:
- name: test
  plan:
  - get: my-repo
    trigger: true
  - task: run-tests
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: node }
      inputs:
      - name: my-repo
      run:
        path: sh
        args:
        - -c
        - |
          cd my-repo
          npm install
          npm test
`,
        "Time Triggered": `resources:
- name: every-5m
  type: time
  source:
    interval: 5m

jobs:
- name: recurring-job
  plan:
  - get: every-5m
    trigger: true
  - task: do-something
    config:
      platform: linux
      image_resource:
        type: registry-image
        source: { repository: alpine }
      run:
        path: echo
        args: ["running on schedule"]
`,
      };

      const picked = await vscode.window.showQuickPick(Object.keys(templates), {
        placeHolder: "Select a pipeline template",
      });

      if (!picked) { return; }

      const doc = await vscode.workspace.openTextDocument({
        content: templates[picked],
        language: "yaml",
      });
      await vscode.window.showTextDocument(doc);
    })
  );
}
