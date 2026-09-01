# ORCA Browser

<p align="center">
  <img src="assets/orca-logo-light.svg" width="90" alt="ORCA Logo">
</p>

<h1 align="center">ORCA Browser</h1>

<p align="center">
  <strong>More tabs. Less memory.</strong>
</p>

<p align="center">
  A desktop browser built with Electron, React, TypeScript and Chromium, focused on intelligent tab and memory management.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#download">Download</a> •
  <a href="#development">Development</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## About

ORCA is a Chromium-based desktop browser designed around one simple idea:

> **Your tabs shouldn't have to consume all your memory.**

Modern browsers can consume significant system resources when many tabs are open. ORCA approaches this problem with a dedicated **Memory Engine** that monitors tab activity and manages inactive tabs to reduce unnecessary memory usage.

ORCA is currently being developed for Windows, with future platform support being explored.

---

## Features

### Memory Engine

ORCA continuously monitors browser memory usage and tab activity.

The Memory Engine categorizes tabs into different memory states:

- **Surface** — Active tabs currently being used
- **Shallow** — Inactive but readily available tabs
- **Deep** — Suspended tabs with their RAM released
- **Abyss** — Archived tabs stored for later restoration

The goal is simple:

**Keep useful tabs available while reducing unnecessary memory usage.**

---

### Smart Tab Management

ORCA is designed to make having many tabs open more practical.

Features include:

- Tab suspension
- Tab restoration
- Activity-based memory management
- Multiple tab states
- Session restoration
- Active tab tracking

---

### Workspaces

Organize your browsing into separate workspaces.

For example:

```text
Personal
Research
Development
## Trademark

"ORCA" and the ORCA logo are associated with the ORCA Browser project and are not granted under the software license. Forks and derivative projects may use and modify the source code under the terms of the MIT License, but should not use the ORCA name or logo in a way that suggests they are the official ORCA Browser project.
