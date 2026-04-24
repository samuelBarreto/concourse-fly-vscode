import { execFile } from "child_process";
import * as vscode from "vscode";

export interface Pipeline {
  id: number;
  name: string;
  paused: boolean;
  team_name: string;
}

export interface Job {
  id: number;
  name: string;
  pipeline_name: string;
  team_name: string;
  finished_build?: Build;
  next_build?: Build;
}

export interface Build {
  id: number;
  name: string;
  job_name: string;
  pipeline_name: string;
  team_name: string;
  status: string;
  start_time?: number;
  end_time?: number;
}

export function getFlyPath(): string {
  return vscode.workspace.getConfiguration("concourse").get("flyPath", "fly");
}

export function getTarget(): string {
  return vscode.workspace.getConfiguration("concourse").get("target", "");
}

export function exec(args: string[], target?: string): Promise<string> {
  const flyPath = getFlyPath();
  const t = target || getTarget();

  if (!t) {
    throw new Error("No Concourse target configured.");
  }

  const fullArgs = ["-t", t, ...args];

  return new Promise((resolve, reject) => {
    execFile(flyPath, fullArgs, { maxBuffer: 10 * 1024 * 1024 }, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

export async function login(url: string, username: string, password: string, target: string, skipTls?: boolean, caCert?: string, team?: string): Promise<string> {
  const flyPath = getFlyPath();

  const args = ["-t", target, "login", "-c", url, "-u", username, "-p", password];
  if (skipTls) {
    args.push("-k", "--insecure");
  }
  if (caCert) {
    args.push("--ca-cert", caCert);
  }
  if (team) {
    args.push("-n", team);
  }

  return new Promise((resolve, reject) => {
    execFile(
      flyPath,
      args,
      (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

export function loginBrowserArgs(url: string, target: string, skipTls?: boolean, caCert?: string, team?: string): string[] {
  const flyPath = getFlyPath();
  const args = [flyPath, "-t", target, "login", "-c", url];
  if (skipTls) {
    args.push("-k", "--insecure");
  }
  if (caCert) {
    args.push("--ca-cert", caCert);
  }
  if (team) {
    args.push("-n", team);
  }
  return args;
}

export async function logout(target: string): Promise<string> {
  return exec(["logout"], target);
}

export async function getPipelines(target: string): Promise<Pipeline[]> {
  const output = await exec(["pipelines", "--json"], target);
  return JSON.parse(output);
}

export async function getJobs(pipelineName: string, target: string): Promise<Job[]> {
  const output = await exec(["jobs", "-p", pipelineName, "--json"], target);
  return JSON.parse(output);
}

export async function getBuilds(target: string, count: number = 25): Promise<Build[]> {
  const output = await exec(["builds", "--json", "-c", count.toString()], target);
  return JSON.parse(output);
}

export async function triggerJob(pipelineName: string, jobName: string, target: string): Promise<string> {
  return exec(["trigger-job", "-j", `${pipelineName}/${jobName}`], target);
}

export async function setPipeline(pipelineName: string, configPath: string, target: string): Promise<string> {
  return exec(["set-pipeline", "-p", pipelineName, "-c", configPath, "--non-interactive"], target);
}

export async function unpausePipeline(pipelineName: string, target: string): Promise<string> {
  return exec(["unpause-pipeline", "-p", pipelineName], target);
}

export async function pausePipeline(pipelineName: string, target: string): Promise<string> {
  return exec(["pause-pipeline", "-p", pipelineName], target);
}

export async function getBuildLogs(buildId: number, target: string): Promise<string> {
  return exec(["watch", "-b", buildId.toString()], target);
}

export async function getPipelineConfig(pipelineName: string, target: string): Promise<string> {
  return exec(["get-pipeline", "-p", pipelineName], target);
}

export async function getJobConfig(pipelineName: string, jobName: string, target: string): Promise<string> {
  const output = await exec(["get-pipeline", "-p", pipelineName, "--json"], target);
  const pipeline = JSON.parse(output);
  const job = pipeline.jobs?.find((j: any) => j.name === jobName);
  if (!job) {
    throw new Error(`Job '${jobName}' not found in pipeline '${pipelineName}'`);
  }
  return jsonToYaml(job, 0);
}

function jsonToYaml(obj: any, indent: number): string {
  const pad = "  ".repeat(indent);
  if (obj === null || obj === undefined) { return "null"; }
  if (typeof obj === "string") { return obj.includes("\n") ? `|\n${obj.split("\n").map(l => pad + "  " + l).join("\n")}` : obj; }
  if (typeof obj === "number" || typeof obj === "boolean") { return String(obj); }
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === "object" && item !== null) {
        const lines = jsonToYaml(item, indent + 1).split("\n");
        return `${pad}- ${lines[0].trim()}\n${lines.slice(1).join("\n")}`;
      }
      return `${pad}- ${item}`;
    }).join("\n");
  }
  return Object.entries(obj).map(([key, val]) => {
    if (typeof val === "object" && val !== null) {
      return `${pad}${key}:\n${jsonToYaml(val, indent + 1)}`;
    }
    return `${pad}${key}: ${jsonToYaml(val, indent)}`;
  }).join("\n");
}

export function interceptBuild(buildId: number, target: string): string[] {
  const flyPath = getFlyPath();
  return [flyPath, "-t", target, "intercept", "-b", buildId.toString()];
}

export function interceptJob(pipelineName: string, jobName: string, target: string): string[] {
  const flyPath = getFlyPath();
  return [flyPath, "-t", target, "intercept", "-j", `${pipelineName}/${jobName}`];
}

export async function diffPipeline(pipelineName: string, configPath: string, target: string): Promise<string> {
  try {
    return await exec(["set-pipeline", "-p", pipelineName, "-c", configPath, "--diff", "--check-creds"], target);
  } catch (error: any) {
    // fly set-pipeline --diff returns exit code 1 when there are changes
    if (error.message) {
      return error.message;
    }
    throw error;
  }
}
