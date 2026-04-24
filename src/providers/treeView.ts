import * as vscode from "vscode";
import * as fly from "../fly";

export class PipelineTreeItem extends vscode.TreeItem {
  constructor(
    public readonly pipeline: fly.Pipeline,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(pipeline.name, collapsibleState);
    this.tooltip = `${pipeline.team_name}/${pipeline.name}`;
    this.contextValue = pipeline.paused ? "pipeline-paused" : "pipeline-active";
    this.iconPath = new vscode.ThemeIcon(
      pipeline.paused ? "debug-pause" : "pass",
      pipeline.paused
        ? new vscode.ThemeColor("charts.yellow")
        : new vscode.ThemeColor("charts.green")
    );
  }
}

export class JobTreeItem extends vscode.TreeItem {
  constructor(public readonly job: fly.Job) {
    super(job.name, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "job";

    const status = job.finished_build?.status || "pending";
    const iconMap: Record<string, { icon: string; color: string }> = {
      succeeded: { icon: "pass", color: "charts.green" },
      failed: { icon: "error", color: "charts.red" },
      errored: { icon: "warning", color: "charts.orange" },
      aborted: { icon: "circle-slash", color: "charts.yellow" },
      pending: { icon: "clock", color: "charts.blue" },
    };

    const { icon, color } = iconMap[status] || iconMap.pending;
    this.iconPath = new vscode.ThemeIcon(icon, new vscode.ThemeColor(color));
    this.tooltip = `${job.pipeline_name}/${job.name} — ${status}`;
  }
}

export class PipelineProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const target = vscode.workspace.getConfiguration("concourse").get("target", "");
    if (!target) {
      return [new vscode.TreeItem("Set concourse.target in settings")];
    }

    try {
      if (!element) {
        const pipelines = await fly.getPipelines();
        return pipelines.map(
          (p) => new PipelineTreeItem(p, vscode.TreeItemCollapsibleState.Collapsed)
        );
      }

      if (element instanceof PipelineTreeItem) {
        const jobs = await fly.getJobs(element.pipeline.name);
        return jobs.map((j) => new JobTreeItem(j));
      }
    } catch (error: any) {
      return [new vscode.TreeItem(`Error: ${error.message}`)];
    }

    return [];
  }
}

export class BuildTreeItem extends vscode.TreeItem {
  constructor(public readonly build: fly.Build) {
    super(
      `#${build.name} ${build.pipeline_name}/${build.job_name}`,
      vscode.TreeItemCollapsibleState.None
    );
    this.contextValue = "build";

    const iconMap: Record<string, { icon: string; color: string }> = {
      succeeded: { icon: "pass", color: "charts.green" },
      failed: { icon: "error", color: "charts.red" },
      errored: { icon: "warning", color: "charts.orange" },
      aborted: { icon: "circle-slash", color: "charts.yellow" },
      started: { icon: "loading~spin", color: "charts.blue" },
      pending: { icon: "clock", color: "charts.blue" },
    };

    const { icon, color } = iconMap[build.status] || iconMap.pending;
    this.iconPath = new vscode.ThemeIcon(icon, new vscode.ThemeColor(color));
    this.tooltip = `Build #${build.name} — ${build.status}`;
  }
}

export class BuildProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const target = vscode.workspace.getConfiguration("concourse").get("target", "");
    if (!target) {
      return [];
    }

    try {
      const builds = await fly.getBuilds(25);
      return builds.map((b) => new BuildTreeItem(b));
    } catch {
      return [new vscode.TreeItem("Failed to fetch builds")];
    }
  }
}
