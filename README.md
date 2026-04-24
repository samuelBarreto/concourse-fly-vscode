# Concourse Fly Integration

Manage Concourse CI directly from VS Code. Browse pipelines and jobs, trigger builds, view logs, intercept containers, deploy pipeline templates — all without leaving your editor. Powered by the fly CLI.

---

## Features

### 🔧 Sidebar Panel

Three views in the Concourse activity bar:

#### Pipelines

Browse all pipelines and their jobs with inline actions:

| Action | Icon | Description |
|--------|------|-------------|
| View YAML | 👁 | Fetch and display the pipeline config |
| Pause | ⏸ | Pause a running pipeline |
| Unpause | ▶ | Unpause a paused pipeline |

#### Jobs (inside each pipeline)

| Action | Icon | Description |
|--------|------|-------------|
| Trigger | ▶ | Start the job |
| Intercept | >_ | Open a shell inside the job's container |
| View YAML | 👁 | View the job config in isolation |

#### Recent Builds

Last 25 builds across all pipelines:

| Action | Icon | Description |
|--------|------|-------------|
| View Logs | 📋 | Open build output in the editor |
| Intercept | >_ | Open a shell inside the build's container |

#### Templates

Ready-to-use pipeline templates:

| Template | Description |
|----------|-------------|
| Hello World | Simple job that prints hello world |
| Git Resource | Clone a repo and run tests |
| Time Triggered | Job that runs on a schedule |
| Docker Build | Build and push a Docker image |
| Multi-Job Pipeline | Build, test and deploy stages |

Each template has two actions:

| Action | Icon | Description |
|--------|------|-------------|
| View | 📄 | Opens the YAML for editing |
| Deploy | 🚀 | Creates the pipeline and unpauses it |

---

### 📝 Editor Integration

| Button | When | Description |
|--------|------|-------------|
| Set Pipeline | YAML file is open | Deploy the current file as a pipeline |
| New Template | Always visible | Open a pipeline template |

---

### 📊 Status Bar

Shows the current fly target at the bottom of the window. Click to log in.

### 🔄 Auto-refresh

Pipelines and builds refresh automatically every 30 seconds.

---

## Requirements

- [fly CLI](https://concourse-ci.org) installed
- A running Concourse instance

---

## Setup

### Interactive Login

1. Open Command Palette (`Ctrl+Shift+P`) → **Concourse: Login**
2. Select the `fly` binary on your machine (first time only)
3. Choose login method:
   - **🌐 Browser login** — for OAuth/SSO authentication (opens browser)
   - **🔑 Username & Password** — for local user credentials
4. Enter your Concourse URL (e.g. `http://localhost:8080`)
5. Enter a target name (e.g. `ci`)
6. Choose TLS configuration:
   - **No** — default TLS verification
   - **Yes (insecure, skip TLS verification)** — for self-signed certs or local dev
7. If TLS is not skipped, optionally select a custom CA certificate (`.pem` / `.crt`)
8. Enter team name (leave empty for default `main`)
9. If using Username & Password, enter your credentials

### Logout

Open Command Palette (`Ctrl+Shift+P`) → **Concourse: Logout** or click the sign-out icon in the Pipelines panel.

### Manual Configuration

Add to your VS Code / Kiro settings:

```json
{
  "concourse.target": "ci",
  "concourse.url": "http://localhost:8080",
  "concourse.flyPath": "C:\\concourse\\fly.exe",
  "concourse.skipTls": false,
  "concourse.caCert": ""
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `concourse.target` | Fly target name | `""` |
| `concourse.url` | Concourse URL | `""` |
| `concourse.flyPath` | Path to fly binary | `"fly"` |
| `concourse.skipTls` | Skip TLS verification | `false` |
| `concourse.caCert` | Path to CA certificate | `""` |

---

## Commands

| Command | Description |
|---------|-------------|
| `Concourse: Login` | Authenticate with a Concourse instance (browser or basic) |
| `Concourse: Logout` | Log out from the current target |
| `Concourse: Set Pipeline` | Deploy the current YAML file as a pipeline |
| `Concourse: Trigger Job` | Start a job |
| `Concourse: Pause Pipeline` | Pause a pipeline |
| `Concourse: Unpause Pipeline` | Unpause a pipeline |
| `Concourse: View Build Logs` | Open build output in the editor |
| `Concourse: View Pipeline YAML` | Fetch and display a pipeline's config |
| `Concourse: View Job YAML` | Fetch and display a single job's config |
| `Concourse: Intercept Build` | Open a shell inside a build's container |
| `Concourse: Intercept Job` | Open a shell inside a job's container |
| `Concourse: New Pipeline from Template` | Create a pipeline from a template |
| `Concourse: Deploy Template` | Deploy a template directly to Concourse |
| `Concourse: Refresh` | Refresh pipelines and builds |

---

## License

MIT
