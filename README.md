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
└── ➕ Add Team...

Recent Builds
├── 🏢 main (ci)
│   ├── #5 hello/hello ✅
│   └── #4 hello/hello ❌
└── 🏢 dev-team (ci)
    └── #3 staging/deploy ✅
```

### � Smart Deploy with CodeLens

YAML files that look like Concourse pipelines get inline CodeLens actions:

**First deploy:**
```yaml
▶ Deploy "hello" to Concourse          ← picks team, uses filename as pipeline name

jobs:
- name: hello
  ...
```

**After first deploy:**
```yaml
🚀 Deploy "hello" to main (ci)         ← one-click redeploy to same target
📊 Diff with Concourse                  ← side-by-side diff (local vs remote)

jobs:
- name: hello
  ...
```

- Pipeline name is auto-detected from the filename (`hello.yml` → `hello`)
- Remembers the last team and target for each file
- Diff shows what changed before you apply

### 🔧 Sidebar Panel

#### Pipelines

| Action | Icon | Description |
|--------|------|-------------|
| View YAML | 👁 | Fetch and save pipeline config to workspace |
| Pause | ⏸ | Pause a running pipeline |
| Unpause | ▶ | Unpause a paused pipeline |
| Logout | 🚪 | Remove team from sidebar |

#### Jobs

| Action | Icon | Description |
|--------|------|-------------|
| Trigger | ▶ | Start the job |
| Intercept | >_ | Open a shell inside the job's container |
| View YAML | 👁 | Save job config to workspace |

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
| View | 📄 | Save template to workspace |
| Deploy | 🚀 | Select team, creates pipeline and unpauses it |

---

### 📝 Editor Integration

| Button | When | Description |
|--------|------|-------------|
| Set Pipeline | YAML file is open | Select team and deploy |
| New Template | Always visible | Open a pipeline template |

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
   - **🌐 Browser login** — for OAuth/SSO authentication
   - **🔑 Username & Password** — for local user credentials
4. Enter your Concourse URL
5. Enter a target name
6. Choose TLS configuration:
   - **No** — default TLS verification
   - **Yes (insecure)** — skip TLS for self-signed certs
7. Optionally select a custom CA certificate
8. Enter team name
9. Enter credentials (if using basic auth)

Repeat for each team.

### Removing a Team

Click 🚪 next to the team name, or Command Palette → **Concourse: Logout**.

### Manual Configuration

```json
{
  "concourse.url": "http://localhost:8080",
  "concourse.flyPath": "C:\\concourse\\fly.exe",
  "concourse.skipTls": false,
  "concourse.caCert": ""
}
```

---

## Commands

| Command | Description |
|---------|-------------|
| `Concourse: Login` | Add a new team |
| `Concourse: Logout` | Remove a team |
| `Concourse: Set Pipeline` | Deploy current YAML (picks team, auto-names pipeline) |
| `Concourse: Quick Deploy` | Redeploy to last used team (one click) |
| `Concourse: Diff with Concourse` | Side-by-side diff of local vs remote pipeline |
| `Concourse: Trigger Job` | Start a job |
| `Concourse: Pause Pipeline` | Pause a pipeline |
| `Concourse: Unpause Pipeline` | Unpause a pipeline |
| `Concourse: View Build Logs` | Open build output |
| `Concourse: View Pipeline YAML` | Save pipeline config to workspace |
| `Concourse: View Job YAML` | Save job config to workspace |
| `Concourse: Intercept Build` | Shell into a build's container |
| `Concourse: Intercept Job` | Shell into a job's container |
| `Concourse: New Pipeline from Template` | Create from template |
| `Concourse: Deploy Template` | Deploy template to a team |
| `Concourse: Refresh` | Refresh all data |

---

## License

MIT
