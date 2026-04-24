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
```

### 🔮 Smart Deploy with CodeLens

YAML files that look like Concourse pipelines get inline CodeLens actions:

**First deploy:**
```yaml
▶ Deploy "hello" to Concourse

jobs:
- name: hello
```

**After first deploy:**
```yaml
🚀 Deploy "hello" to main (ci)
📊 Diff with Concourse

jobs:
- name: hello
```

- Pipeline name auto-detected from filename
- Remembers last team and target for each file
- Diff shows local vs remote side-by-side

### ⚡ Quick Actions Panel

All common actions in one place in the sidebar:

```
Quick Actions
├── 🔑 Login / Add Team
├── 🚪 Logout / Remove Team
├── ☁️  Set Pipeline
├── 🚀 Quick Deploy
├── 📊 Diff with Concourse
├── 📄 New Pipeline from Template
├── ▶  Trigger Job
└── 🔄 Refresh
```

### 🖱️ Right-Click Context Menu

Right-click on any YAML file (in editor or explorer):

- **Set Pipeline** — deploy to a team
- **Quick Deploy** — redeploy to last target
- **Diff with Concourse** — compare local vs remote
- **New Pipeline from Template** — create from template

### 🔧 Sidebar Panel

#### Pipelines

| Action | Icon | Description |
|--------|------|-------------|
| View YAML | 👁 | Save pipeline config to workspace |
| Pause | ⏸ | Pause a running pipeline |
| Unpause | ▶ | Unpause a paused pipeline |
| Logout | 🚪 | Remove team |

#### Jobs

| Action | Icon | Description |
|--------|------|-------------|
| Trigger | ▶ | Start the job |
| Intercept | >_ | Shell into the container |
| View YAML | 👁 | Save job config to workspace |

#### Recent Builds (grouped by team)

| Action | Icon | Description |
|--------|------|-------------|
| View Logs | 📋 | Open build output |
| Intercept | >_ | Shell into the container |

#### Templates

| Template | Description |
|----------|-------------|
| Hello World | Simple hello world job |
| Git Resource | Clone repo and run tests |
| Time Triggered | Scheduled job |
| Docker Build | Build and push image |
| Multi-Job Pipeline | Build, test and deploy |

### 📊 Status Bar

Shows connected teams count. Click to add a new team.

### 🔄 Auto-refresh

Updates every 30 seconds.

---

## Requirements

- [fly CLI](https://concourse-ci.org) installed
- A running Concourse instance

---

## Setup

### Adding a Team

1. Command Palette → **Concourse: Login** (or click in Quick Actions)
2. Select fly binary (first time only)
3. Choose: **Browser login** or **Username & Password**
4. Enter Concourse URL, target name
5. TLS: skip verification or select CA certificate
6. Enter team name
7. Enter credentials (if basic auth)

### Removing a Team

Click 🚪 next to team name, or Quick Actions → Logout.

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
| `Concourse: Set Pipeline` | Deploy YAML (auto-names from filename) |
| `Concourse: Quick Deploy` | Redeploy to last target (one click) |
| `Concourse: Diff with Concourse` | Side-by-side diff local vs remote |
| `Concourse: Trigger Job` | Start a job |
| `Concourse: Pause Pipeline` | Pause a pipeline |
| `Concourse: Unpause Pipeline` | Unpause a pipeline |
| `Concourse: View Build Logs` | Open build output |
| `Concourse: View Pipeline YAML` | Save pipeline config |
| `Concourse: View Job YAML` | Save job config |
| `Concourse: Intercept Build` | Shell into build container |
| `Concourse: Intercept Job` | Shell into job container |
| `Concourse: New Pipeline from Template` | Create from template |
| `Concourse: Deploy Template` | Deploy template to team |
| `Concourse: Refresh` | Refresh all data |

---

## License

MIT
