# Changelog

All notable changes to the Concourse Fly Integration extension.

## [0.4.0] - 2026-04-24

### Added
- Quick Actions panel in the sidebar with all common actions in one place
- Right-click context menu on YAML files (editor and explorer)
- Right-click context menu options: Set Pipeline, Quick Deploy, Diff, New Template
- Set Pipeline now accepts file URI from explorer context menu

### Changed
- Set Pipeline works from both editor and file explorer right-click

## [0.3.0] - 2026-04-24

### Added
- CodeLens on YAML files: "Deploy to Concourse" and "Diff with Concourse" inline actions
- Quick Deploy: one-click redeploy to the last used team/target
- Diff view: side-by-side comparison of local YAML vs what's on Concourse
- Auto pipeline naming: uses the filename as pipeline name (`hello.yml` → `hello`)
- Deploy history: remembers the last team and target for each file
- View Pipeline/Job YAML now saves to workspace with proper filename
- Templates now save to workspace via Save As dialog

### Changed
- Set Pipeline now pre-fills pipeline name from filename
- CodeLens only appears on YAML files containing `jobs:` or `resources:`

## [0.2.0] - 2026-04-24

### Added
- Multi-team support: login to N teams across different Concourse instances
- Pipelines grouped by team in the sidebar
- Recent Builds grouped by team
- "Add Team..." button in the Pipelines panel
- Logout per team (inline button or command palette picker)
- Deploy template now asks which team to deploy to
- Set Pipeline now asks which team to deploy to
- Status bar shows number of connected teams
- Teams persisted in extension global state

### Changed
- All fly commands now route through the correct target per team
- Login flow always asks for target name (supports multiple targets)
- Logout shows team picker when multiple teams are connected

### Breaking
- Previous single-target configuration replaced by multi-team model
- Teams need to be re-added after updating to this version

## [0.1.6] - 2026-04-23

### Added
- Team name field during login (both browser and basic auth)
- Logout command (`Concourse: Logout`)
- Logout button (sign-out icon) in the Pipelines panel toolbar

### Changed
- Login flow now asks for team name before credentials

## [0.1.5] - 2026-04-23

### Added
- Browser login option (OAuth/SSO) — opens browser for authentication
- Insecure mode (`-k --insecure`) for self-signed certificates
- Custom CA certificate support during login
- View job YAML in isolation from the pipeline
- Intercept build containers (shell access via terminal)
- Intercept job containers (shell access via terminal)
- Deploy template directly to Concourse with one click (set-pipeline + unpause)
- TLS configuration step in login flow

### Changed
- Login flow now asks for login method first (Browser or Username/Password)
- Fly binary path is selected via file picker on first login

## [0.1.4] - 2026-04-22

### Added
- View pipeline YAML button (eye icon) on each pipeline
- Templates view in sidebar with 5 ready-to-use templates
- Editor toolbar buttons for Set Pipeline and New Template

## [0.1.3] - 2026-04-22

### Added
- Pipeline templates: Hello World, Git Resource, Time Triggered, Docker Build, Multi-Job Pipeline
- New Pipeline from Template command (Command Palette + Quick Pick)

## [0.1.2] - 2026-04-21

### Added
- Fly binary path configuration via file picker during login
- Status bar showing current fly target

## [0.1.1] - 2026-04-21

### Added
- View build logs in the editor
- Pause and unpause pipelines from the tree view
- Auto-refresh every 30 seconds

## [0.1.0] - 2026-04-20

### Added
- Initial release
- Sidebar panel with Pipelines and Recent Builds views
- Login with username and password
- Set pipeline from current YAML file
- Trigger jobs from the tree view
- Concourse activity bar icon
