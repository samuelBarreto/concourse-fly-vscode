# Concourse Fly Integration for VS Code

Manage Concourse CI pipelines, jobs and builds directly from VS Code.

## Features

### Sidebar Panel

Three views in the Concourse activity bar:

**Pipelines** — browse all pipelines and their jobs
- View pipeline YAML (eye icon)
- Pause / Unpause pipelines
- Trigger jobs
- View job YAML config
- Intercept job containers (open shell)

**Recent Builds** — last 25 builds across all pipelines
- View build logs
- Intercept build containers (open shell)

**Templates** — ready-to-use pipeline templates
- Hello World — simple job that prints hello world
- Git Resource — clone a repo and run tests
- Time Triggered — job that runs on a schedule
- Docker Build — build and push a Docker image
- Multi-Job Pipeline — build, test and deploy stages

Each template has two actions:
- **View** — opens the YAML for editing
- **Deploy** — creates the pipeline and unpauses it in one click

### Editor Integration

- **Set Pipeline button** — appears in the editor toolbar when a YAML file is open
- **New Pipeline from Template** — available in the editor toolbar and command palette

### Status Bar

Shows the current fly target at the bottom of the window. Click to log in.

### Auto-refresh

Pipelines and builds refresh automatically every 30 seconds.

## Requirements

- [fly CLI](https://concourse-ci.org) installed
- A running Concourse instance

## Setup

1. Install the extension
2. Open Command Palette (`Ctrl+Shift+P`) → `Concourse: Login`
3. Select the fly binary on your machine
4. Enter your Concourse URL, target name, username and password
5. The sidebar will populate with your pipelines

Or configure manually in settings:

```json
{
  "concourse.target": "ci",
  "concourse.url": "http://localhost:8080",
  "concourse.flyPath": "C:\\concourse\\fly.exe"
}
```

## Commands

| Command | Description |
|---|---|
| `Concourse: Login` | Authenticate with a Concourse instance |
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

## Inline Actions

### Pipelines
| Icon | Action |
|---|---|
| $(eye) | View pipeline YAML |
| $(debug-pause) | Pause pipeline |
| $(debug-start) | Unpause pipeline |

### Jobs
| Icon | Action |
|---|---|
| $(play) | Trigger job |
| $(terminal) | Intercept (shell into container) |
| $(eye) | View job YAML |

### Builds
| Icon | Action |
|---|---|
| $(output) | View build logs |
| $(terminal) | Intercept (shell into container) |

### Templates
| Icon | Action |
|---|---|
| $(new-file) | View template YAML |
| $(rocket) | Deploy template to Concourse |

## License

MIT
