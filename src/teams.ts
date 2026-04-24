import * as vscode from "vscode";

export interface TeamConfig {
  name: string;
  target: string;
}

const TEAMS_KEY = "concourse.teams";

export function getTeams(context: vscode.ExtensionContext): TeamConfig[] {
  return context.globalState.get<TeamConfig[]>(TEAMS_KEY, []);
}

export async function addTeam(context: vscode.ExtensionContext, team: TeamConfig): Promise<void> {
  const teams = getTeams(context);
  const existing = teams.findIndex((t) => t.name === team.name && t.target === team.target);
  if (existing >= 0) {
    teams[existing] = team;
  } else {
    teams.push(team);
  }
  await context.globalState.update(TEAMS_KEY, teams);
}

export async function removeTeam(context: vscode.ExtensionContext, teamName: string, target: string): Promise<void> {
  const teams = getTeams(context).filter((t) => !(t.name === teamName && t.target === target));
  await context.globalState.update(TEAMS_KEY, teams);
}
