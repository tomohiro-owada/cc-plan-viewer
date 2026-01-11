# Claude Code Todo Viewer

A real-time desktop application for visualizing and tracking Claude Code's todo progress across multiple sessions.

![Claude Code Todo Viewer](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Electron](https://img.shields.io/badge/Electron-39-blue)

## Overview

Claude Code Todo Viewer is an Electron-based desktop app that monitors `~/.claude/todos/` directory and displays real-time progress of Claude Code's task management. Perfect for developers who want to keep track of AI-assisted coding tasks running in the background.

## Features

- **Real-time Updates** - Automatically detects and displays todo changes as they happen
- **Multi-session Support** - View multiple sessions side-by-side in columns
- **Parallel Task Visualization** - Shows concurrent tasks in a special parallel view
- **Project Identification** - Automatically identifies which project directory each session belongs to
- **Sound Notifications** - Audio feedback when tasks complete (customizable per session)
- **Always on Top** - Stays visible while you work
- **Collapsible Sidebar** - Minimize the session list when not needed
- **Auto-open New Sessions** - New todo sessions automatically appear as columns
- **Dark Theme** - Easy on the eyes

## Screenshots

*Coming soon*

## Download

Download the latest release for your platform:

- [**macOS (Apple Silicon)**](../../releases/latest) - `.dmg` file
- [**Windows**](../../releases/latest) - `.exe` installer
- [**Linux**](../../releases/latest) - `.AppImage` file

Or visit the [Releases page](../../releases) for all versions.

## Installation

### From Release (Recommended)

1. Download the appropriate file for your platform from [Releases](../../releases)
2. Install or run the application:
   - **macOS**: Open the `.dmg` and drag to Applications
   - **Windows**: Run the `.exe` installer
   - **Linux**: Make the `.AppImage` executable and run it

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/cc-plan-viewer.git
cd cc-plan-viewer

# Install dependencies
npm install

# Run the app
npm start
```

## Usage

1. **Launch the app** - It will automatically scan `~/.claude/todos/` for active sessions
2. **Click a session** in the sidebar to open it as a column
3. **View multiple sessions** by clicking additional sessions
4. **Close columns** by clicking the X button or clicking the session again
5. **Collapse sidebar** using the toggle button on the left edge
6. **Configure sounds** by clicking the speaker icon on each column

### Sound Settings

Each column can have individual sound settings:
- **Mute/Unmute** - Toggle sound for that session
- **Default sound** - Uses built-in notification sounds
- **Custom sound** - Select your own audio file (mp3, wav, ogg, m4a, aac)

### Keyboard Shortcuts

- `Cmd+R` / `Ctrl+R` - Refresh the view

## How It Works

Claude Code stores todo information in JSON files at `~/.claude/todos/`. This app:

1. Watches the directory for changes using Node.js `fs.watch`
2. Parses JSON files to extract todo items and their status
3. Maps session IDs to project directories via `~/.claude/projects/`
4. Updates the UI in real-time when changes are detected

## Requirements

- **Claude Code** must be installed and have been used at least once
- **Operating System**: macOS (Apple Silicon), Windows 10+, or Linux

## Development

```bash
# Install dependencies
npm install

# Run in development
npm start

# Build for current platform
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for use with [Claude Code](https://claude.ai/claude-code) by Anthropic
- Powered by [Electron](https://www.electronjs.org/)
