import * as vscode from "vscode";

interface ActionItem {
  label: string;
  icon: string;
  command: string;
  description: string;
}

const actions: ActionItem[] = [
  {
    label: "Login / Add Team",
    icon: "sign-in",
    command: "concourse.login",
    description: "Connect to a Concourse team",
  },
  {
    label: "Logout / Remove Team",
    icon: "sign-out",
    command: "concourse.logout",
    description: "Disconnect from a team",
  },
  {
    label: "Set Pipeline",
    icon: "cloud-upload",
    command: "concourse.setPipeline",
    description: "Deploy current YAML as pipeline",
  },
  {
    label: "Quick Deploy",
    icon: "rocket",
    command: "concourse.quickDeploy",
    description: "Redeploy to last used target",
  },
  {
    label: "Diff with Concourse",
    icon: "diff",
    command: "concourse.diffPipeline",
    description: "Compare local vs remote pipeline",
  },
  {
    label: "New Pipeline from Template",
    icon: "new-file",
    command: "concourse.newPipeline",
    description: "Create pipeline from a template",
  },
  {
    label: "Trigger Job",
    icon: "play",
    command: "concourse.triggerJob",
    description: "Start a job manually",
  },
  {
    label: "Refresh",
    icon: "refresh",
    command: "concourse.refresh",
    description: "Refresh pipelines and builds",
  },
];

class ActionTreeItem extends vscode.TreeItem {
  constructor(action: ActionItem) {
    super(action.label, vscode.TreeItemCollapsibleState.None);
    this.description = action.description;
    this.iconPath = new vscode.ThemeIcon(action.icon);
    this.command = {
      command: action.command,
      title: action.label,
    };
  }
}

export class ActionsProvider implements vscode.TreeDataProvider<ActionTreeItem> {
  getTreeItem(element: ActionTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(): Promise<ActionTreeItem[]> {
    return actions.map((a) => new ActionTreeItem(a));
  }
}
