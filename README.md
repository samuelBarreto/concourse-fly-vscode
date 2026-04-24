# Concourse Fly Integration

Manage Concourse CI directly from VS Code. Browse pipelines and jobs across multiple teams, trigger builds, view logs, intercept containers, deploy pipeline templates — all without leaving your editor. Powered by the fly CLI.

---

## Features

### 🏢 Multi-Team Support

Login to multiple teams across different Concourse instances. Each team appears as a top-level node with its pipelines grouped underneath.

```
Pipelines
├── 🏢 main (ci)                    [🚪 Logout]
│   ├── hello                        [👁] [⏸]
│   │   └── say-hello                [▶] [>_] [👁]
│   └── my-app
├── 🏢 dev-team (ci)                [🚪 Logout]
│   └── staging
├── 🏢 ops (prod)                   [🚪 Logout]
│   └── monitoring
└── ➕ Add Team...

Recent Builds
├── 🏢 main (ci)
│   ├── #5 hello/hello ✅
│   └── #4 hello/hello ❌
└── 🏢 dev-team (ci)
    └── #3 staging/deploy ✅
```

### 🔧 Sidebar Panel

Three views in the Concourse activity bar:

#### Pipelines

| Action | Icon | Description |
|--------|------|-------------|
| View YAML | 👁 | Fetch and display the pipeline config |
| Pause | ⏸ | Pause a running pipeline |
| Unpause | ▶ | Unpause a paused pipeline |
| Logout | 🚪 | Remove team from sidebar |

#### Jobs (inside each pipeline)

| Action | Icon | Description |
|--------|------|-------------|
| Trigger | ▶ | Start the job |
| Intercept | >_ | Open a shell inside the job's container |
| View YAML | 👁 | View the job config in isolation |

#### Recent Builds (grouped by team)

| Action | Icon | Description |
|--------|------|-------------|
| View Logs | 📋 | Open build output in the editor |
| Intercept | >_ | Open a shell inside the build's container |

#### Templates

| Template | Description |
|----------|-------------|
| Hello World | Simple job that prints hello world |
| Git Resource | Clone a repo and run tests |
| Time Triggered | Job that runs on a schedule |
| Docker Build | Build and push a Docker image |
| Multi-Job Pipeline | Build, test and deploy stages |

| Action | Icon | Description |
|--------|------|-------------|
| View | 📄 | Opens the YAML for editing |
| Deploy | 🚀 | Select team, creates pipeline and unpauses it |

---

### 📝 Editor Integration

| Button | When | Description |
|--------|------|-------------|
| Set Pipeline | YAML file is open | Select team and deploy |
| New Template | Always visible | Open a pipeline template |

---

### 📊 Status Bar

Shows the number of connected teams. Click to add a new team.

### 🔄 Auto-refresh

Pipelines and builds refresh automatically every 30 seconds.

---

## Requirements

- [fly CLI](https://concourse-ci.org) installed
- A running Concourse instance

---

## Setup

### Adding a Team

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
8. Enter team name (e.g. `main`, `dev-team`, `ops`)
9. If using Username & Password, enter your credentials

Repeat for each team you want to manage.

### Removing a Team

- Click the 🚪 logout icon next to the team name in the sidebar
- Or: Command Palette → **Concourse: Logout** → select team

### Manual Configuration

```json
{
  "concourse.url": "http://localhost:8080",
  "concourse.flyPath": "C:\\concourse\\fly.exe",
  "concourse.skipTls": false,
  "concourse.caCert": ""
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `concourse.url` | Concourse URL | `""` |
| `concourse.flyPath` | Path to fly binary | `"fly"` |
| `concourse.skipTls` | Skip TLS verification | `false` |
| `concourse.caCert` | Path to CA certificate | `""` |

---

## Commands

| Command | Description |
|---------|-------------|
| `Concourse: Login` | Add a new team (browser or basic auth) |
| `Concourse: Logout` | Remove a team |
| `Concourse: Set Pipeline` | Select team and deploy current YAML |
| `Concourse: Trigger Job` | Start a job |
| `Concourse: Pause Pipeline` | Pause a pipeline |
| `Concourse: Unpause Pipeline` | Unpause a pipeline |
| `Concourse: View Build Logs` | Open build output in the editor |
| `Concourse: View Pipeline YAML` | Fetch and display a pipeline's config |
| `Concourse: View Job YAML` | Fetch and display a single job's config |
| `Concourse: Intercept Build` | Open a shell inside a build's container |
| `Concourse: Intercept Job` | Open a shell inside a job's container |
| `Concourse: New Pipeline from Template` | Create a pipeline from a template |
| `Concourse: Deploy Template` | Select team and deploy template |
| `Concourse: Refresh` | Refresh all teams, pipelines and builds |

---

## License

MIT
