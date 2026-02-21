# Contributing to MCP Installer

Thank you for your interest in contributing! Here's everything you need to get started.

## Development Setup

```bash
git clone https://github.com/your-username/mcp-manager.git
cd mcp-manager
npm install
npm run dev
```

## Project Layout

| Path            | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| `src/main/`     | Electron main process — services and IPC handlers     |
| `src/preload/`  | Context-bridge (safe IPC surface exposed to renderer) |
| `src/renderer/` | React UI                                              |
| `src/types/`    | Shared TypeScript interfaces                          |
| `resources/`    | Static assets bundled with the app                    |
| `tests/`        | Vitest unit tests                                     |

## Workflow

1. **Fork** the repo and create a branch from `master`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes, keeping commits focused and descriptive.
3. Run the full check suite before pushing:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
4. Open a **Pull Request** — fill in the PR template.

## Coding Conventions

- TypeScript everywhere — no `any` unless unavoidable.
- All IPC handlers return `IpcResponse<T>` — never throw across IPC.
- New services go in `src/main/services/`, new IPC handlers in `src/main/ipc/`, and must be registered in `src/main/index.ts`.
- Expose new IPC calls in both `src/preload/index.ts` **and** `src/preload/index.d.ts`.
- Keep UI components in `src/renderer/src/components/` (reusable) or under the relevant `features/` folder.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add category filter to catalog view
fix: prevent double registry fetch on startup
chore: bump electron to 29.1
```

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:

- OS and version
- Steps to reproduce
- Expected vs actual behaviour
- Relevant logs from DevTools console

## Suggesting Features

Open an issue using the **Feature Request** template.

## License

By contributing you agree that your contributions will be licensed under the [MIT License](LICENSE).
