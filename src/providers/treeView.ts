import * as vscode from "vscode";
import * as fly from "../fly";
import { TeamConfig, getTeams } from "../teams";

// Team node (top level)
export class TeamTreeItem extends vscode.TreeItem {
  constructor(public readonly team: TeamConfig) {
    super(team.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.tooltip = `Target: ${team.target} | Team: ${team.name}`;
    this.description = team.target;
    this.contextValue = "team";
    this.iconPath = new vscode.ThemeIcon("organization");
  }
}

// Pipeline node (under team)
export class PipelineTreeItem extends vscode.TreeItem {
  constructor(
    public readonly pipeline: fly.Pipeline,
    public readonly target: string,
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

// Job node (under pipeline)
export class JobTreeItem extends vscode.TreeItem {
  constructor(public readonly job: fly.Job, public readonly target: string) {
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

// Pipeline provider with team grouping
export class PipelineProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const teams = getTeams(this.context);

    if (!element) {
      // Top level: show teams + "Add Team" item
      if (teams.length === 0) {
        const addItem = new vscode.TreeItem("Add Team...", vscode.TreeItemCollapsibleState.None);
        addItem.command = { command: "concourse.login", title: "Add Team" };
        addItem.iconPath = new vscode.ThemeIcon("add");
        return [addItem];
      }
      const items: vscode.TreeItem[] = teams.map((t) => new TeamTreeItem(t));
      const addItem = new vscode.TreeItem("Add Team...", vscode.TreeItemCollapsibleState.None);
      addItem.command = { command: "concourse.login", title: "Add Team" };
      addItem.iconPath = new vscode.ThemeIcon("add");
      items.push(addItem);
      return items;
    }

    if (element instanceof TeamTreeItem) {
      try {
        const pipelines = await fly.getPipelines(element.team.target);
        const teamPipelines = pipelines.filter((p) => p.team_name === element.team.name);
        return teamPipelines.map(
          (p) => new PipelineTreeItem(p, element.team.target, vscode.TreeItemCollapsibleState.Collapsed)
        );
      } catch (error: any) {
        return [new vscode.TreeItem(`Error: ${error.message}`)];
      }
    }

    if (element instanceof PipelineTreeItem) {
      try {
        const jobs = await fly.getJobs(element.pipeline.name, element.target);
        return jobs.map((j) => new JobTreeItem(j, element.target));
      } catch (error: any) {
        return [new vscode.TreeItem(`Error: ${error.message}`)];
      }
    }

    return [];
  }
}

// Build tree item
export class BuildTreeItem extends vscode.TreeItem {
  constructor(public readonly build: fly.Build, public readonly target: string) {
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

// Team node for builds
export class BuildTeamTreeItem extends vscode.TreeItem {
  constructor(public readonly team: TeamConfig) {
    super(team.name, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = team.target;
    this.contextValue = "build-team";
    this.iconPath = new vscode.ThemeIcon("organization");
  }
}

// Build provider with team grouping
export class BuildProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    const teams = getTeams(this.context);

    if (!element) {
      if (teams.length === 0) { return []; }
      return teams.map((t) => new BuildTeamTreeItem(t));
    }

    if (element instanceof BuildTeamTreeItem) {
      try {
        const builds = await fly.getBuilds(element.team.target, 25);
        const teamBuilds = builds.filter((b) => b.team_name === element.team.name);
        return teamBuilds.map((b) => new BuildTreeItem(b, element.team.target));
      } catch {
        return [new vscode.TreeItem("Failed to fetch builds")];
      }
    }

    return [];
  }
}
