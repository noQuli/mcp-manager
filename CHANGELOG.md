# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-18

### Added

- Live streaming catalog from the official MCP registry (5 000+ servers)
- Cursor-based pagination with `catalog:progress` IPC events — no UI freeze
- Infinite scroll in the catalog view (48 cards per page)
- Server-side name search with 300 ms debounce
- Duplicate server deduplication during registry sync
- One-click install for npm (`npx`), PyPI (`uvx`), Docker, and remote servers
- Automatic mapping of registry environment variables to install parameters
- Category inference from server name/description
- Secure secret storage via `electron-store`
- Atomic config file writes with automatic backups
- Multi-client support: VS Code, Cursor, Claude Desktop, Gemini CLI
- "Open Config File" button in sidebar
- `catalog:refresh` guard — concurrent refreshes are no-ops
- Offline fallback — catalog cached to `resources/catalog.json`
