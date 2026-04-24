# Changelog

All notable changes to the Concourse Fly Integration extension.

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
