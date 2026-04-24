# Contributing

## Development Setup

```bash
git clone https://github.com/samuelBarreto/concourse-fly-vscode.git
cd concourse-fly-vscode
npm install
npm run compile
```

## Running Locally

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. The extension will be active in the new window

## Project Structure

```
src/
├── extension.ts           # Entry point, registers providers and commands
├── fly.ts                 # Wrapper around the fly CLI
├── teams.ts               # Multi-team state management
├── commands.ts            # All VS Code commands
└── providers/
    ├── treeView.ts        # Pipelines and Builds tree views (multi-team)
    └── templates.ts       # Pipeline templates tree view
```

## Key Concepts

- **Teams**: Each login creates a team entry stored in `globalState`. Teams are identified by `name` + `target`.
- **Targets**: Each team has a fly target. All fly commands are routed through the correct target.
- **Tree Views**: Pipelines and Builds are grouped by team. Templates are global.

## Adding a New Template

Edit `src/providers/templates.ts` and add a new entry to the `templates` array:

```typescript
{
  name: "My Template",
  description: "What it does",
  content: `yaml content here`,
}
```

## Adding a New Command

1. Add the command to `package.json` under `contributes.commands`
2. Add menu entries if needed under `contributes.menus`
3. Register the handler in `src/commands.ts`

## Building

```bash
npm run compile        # TypeScript compilation
vsce package           # Create .vsix package
vsce publish           # Publish to Marketplace
```

## Testing

```bash
# Run in Extension Development Host
F5 in VS Code

# Manual testing checklist:
# - Login to a team (browser + basic)
# - Login to a second team
# - View pipelines grouped by team
# - Trigger a job
# - View build logs
# - Intercept a container
# - Deploy a template
# - Logout from one team
# - Verify other team still works
```
