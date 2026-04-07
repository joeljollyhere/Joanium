# Joanium Documentation

This folder explains how the current Joanium codebase is put together, how the product behaves, where data lives, and which files you should touch when extending or changing specific parts of the app.

## Recommended Reading Order

1. [Architecture.md](Architecture.md) for the mental model and runtime flow.
2. [Features.md](Features.md) for the current product surface and capability map.
3. [Data-And-Persistence.md](Data-And-Persistence.md) for storage layout and local-first behavior.
4. [Extension-Guide.md](Extension-Guide.md) for adding features, engines, pages, IPC, and services.
5. [Where-To-Change-What.md](Where-To-Change-What.md) for day-to-day maintenance and targeted edits.
6. [Development-Workflow.md](Development-Workflow.md) for scripts, packaging, and contributor workflow.

## If You Want To...

| Goal                                         | Read this first                                    |
| -------------------------------------------- | -------------------------------------------------- |
| Understand how the app boots                 | [Architecture.md](Architecture.md)                 |
| Understand what the product already supports | [Features.md](Features.md)                         |
| Find where user data is stored               | [Data-And-Persistence.md](Data-And-Persistence.md) |
| Add a new integration or feature             | [Extension-Guide.md](Extension-Guide.md)           |
| Change a specific page or subsystem          | [Where-To-Change-What.md](Where-To-Change-What.md) |
| Build, audit, or package the app             | [Development-Workflow.md](Development-Workflow.md) |

## Core Takeaways

- Joanium is not organized around one monolithic app file. It is assembled through workspace discovery.
- The main process boot layer lives in `Packages/Main`.
- Long-lived background behavior lives in feature engines under `Packages/Features`.
- Integration and capability definitions live in `Packages/Capabilities`.
- User-facing pages live in `Packages/Pages`.
- The renderer shell that mounts those pages lives in `Packages/Renderer`.
- Shared contracts and low-level helpers live in `Packages/System`.

## A Fast Mental Model

Think of Joanium as five layers:

1. Electron boot and process plumbing.
2. Discovery and composition.
3. Long-lived engines and services.
4. Renderer pages and shared UI.
5. Local-first data, markdown libraries, and prompt context.

Once that clicks, the rest of the repo becomes much easier to navigate.
