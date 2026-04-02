# Contributing to Joanium

Thanks for your interest in contributing to Joanium. This document covers the basics.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/Joanium.git
   cd Joanium
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

```bash
# Run in dev mode
npm run dev

# Lint
npm run lint

# Build
npm run build
```

## Project Structure

- `Packages/Main/` - Electron main process, IPC, window management
- `Packages/Renderer/` - UI shell, pages, shared state
- `Packages/Features/` - Feature modules (Agents, Automation, Channels, Connectors, MCP, Skills)
- `Packages/System/` - System prompt and app-level logic
- `Data/` - Local runtime data (gitignored)
- `Config/` - App configuration
- `Skills/` - Skill definitions
- `Personas/` - Persona definitions

## Pull Requests

- Keep PRs focused on a single change
- Write a clear description of what your PR does and why
- Make sure `npm run lint` passes before submitting
- Reference any related issues

## Code Style

- Follow the existing code conventions in the project
- Use ES modules (`"type": "module"`)
- No trailing semicolons unless the existing code uses them
- Keep functions small and focused

## Reporting Issues

- Use the issue templates if available
- Include steps to reproduce
- Include your OS, Node.js version, and Joanium version

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
