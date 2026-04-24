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

function getFlyPath(): string {
  return vscode.workspace.getConfiguration("concourse").get("flyPath", "fly");
}

function getTarget(): string {
  return vscode.workspace.getConfiguration("concourse").get("target", "");
}

function exec(args: string[]): Promise<string> {
  const flyPath = getFlyPath();
  const target = getTarget();

  if (!target) {
    throw new Error("No Concourse target configured. Set concourse.target in settings.");
  }

  const fullArgs = ["-t", target, ...args];

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

export async function login(url: string, username: string, password: string): Promise<string> {
  const flyPath = getFlyPath();
  const target = getTarget();

  return new Promise((resolve, reject) => {
    execFile(
      flyPath,
      ["-t", target, "login", "-c", url, "-u", username, "-p", password],
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

export async function getPipelines(): Promise<Pipeline[]> {
  const output = await exec(["pipelines", "--json"]);
  return JSON.parse(output);
}

export async function getJobs(pipelineName: string): Promise<Job[]> {
  const output = await exec(["jobs", "-p", pipelineName, "--json"]);
  return JSON.parse(output);
}

export async function getBuilds(count: number = 25): Promise<Build[]> {
  const output = await exec(["builds", "--json", "-c", count.toString()]);
  return JSON.parse(output);
}

export async function triggerJob(pipelineName: string, jobName: string): Promise<string> {
  return exec(["trigger-job", "-j", `${pipelineName}/${jobName}`]);
}

export async function setPipeline(pipelineName: string, configPath: string): Promise<string> {
  return exec(["set-pipeline", "-p", pipelineName, "-c", configPath, "--non-interactive"]);
}

export async function unpausePipeline(pipelineName: string): Promise<string> {
  return exec(["unpause-pipeline", "-p", pipelineName]);
}

export async function pausePipeline(pipelineName: string): Promise<string> {
  return exec(["pause-pipeline", "-p", pipelineName]);
}

export async function getBuildLogs(buildId: number): Promise<string> {
  return exec(["watch", "-b", buildId.toString()]);
}

export async function getPipelineConfig(pipelineName: string): Promise<string> {
  return exec(["get-pipeline", "-p", pipelineName]);
}

export async function getJobConfig(pipelineName: string, jobName: string): Promise<string> {
  const output = await exec(["get-pipeline", "-p", pipelineName, "--json"]);
  const pipeline = JSON.parse(output);
  const job = pipeline.jobs?.find((j: any) => j.name === jobName);
  if (!job) {
    throw new Error(`Job '${jobName}' not found in pipeline '${pipelineName}'`);
  }
  // Convert back to YAML-like format
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

export function interceptBuild(buildId: number): string[] {
  const flyPath = getFlyPath();
  const target = getTarget();
  return [flyPath, "-t", target, "intercept", "-b", buildId.toString()];
}

export function interceptJob(pipelineName: string, jobName: string, stepName?: string): string[] {
  const flyPath = getFlyPath();
  const target = getTarget();
  const args = [flyPath, "-t", target, "intercept", "-j", `${pipelineName}/${jobName}`];
  if (stepName) {
    args.push("-s", stepName);
  }
  return args;
}
