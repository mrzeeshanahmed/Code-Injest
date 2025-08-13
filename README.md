# Code Ingest VS Code Extension

Code Ingest is a Visual Studio Code extension that generates a prompt-friendly ingest of your local workspace. The ingest includes a directory tree, per-file content blocks, and summary information, making it easy to share or analyze your codebase.

## Features
 Sidebar UI for configuration and ingest generation
 Directory tree view of your workspace
 Select file extensions to export
 Exclude binary, image, video, and document files
 Output ingest as `.txt` or `.md` file
 Saves ingest to workspace root and opens it automatically
 Works entirely locally (no cloud dependencies)

## Installation

1. **Clone the repository:**
	```sh
	git clone https://github.com/mrzeeshanahmed/code-ingest.git
	cd code-ingest
	```

2. **Install dependencies:**
	```sh
	npm install
	```

3. **Compile the extension:**
	```sh
	npm run compile
	```

4. **Launch in VS Code:**
	- Open the folder in VS Code (`File > Open Folder...`).
	- Press `F5` to start the Extension Development Host.
		- The Code Ingest sidebar will appear in the Activity Bar.

## Usage

1. **Open the Code Ingest sidebar** from the Activity Bar.
2. **Configure options:**
	- Enter the output filename (without extension).
	- Choose `.txt` or `.md` for the output file type.
	- Select which file extensions to include.
	- Adjust other options as needed (respect .gitignore, include dotfiles, etc.).
3. **Click "Generate Ingest"** to create the ingest file.
4. The ingest will be saved to your workspace root and opened automatically.
5. Use the **Refresh Extension** button to reload the sidebar if needed.

## Requirements
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [VS Code](https://code.visualstudio.com/) (v1.85.0 or newer recommended)

## Development
- Source code is in the `src/` folder.
- Webview assets are in `src/webview/`.
- Utility logic is in `src/utils/`.
- Build output is in the `out/` folder.

## Contributing
Pull requests and issues are welcome! Please open an issue for bugs or feature requests.

## License
MIT

---

**Quick Start:**
1. Clone repo
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` in VS Code
5. Use the sidebar to generate your ingest!
### Curated Mode (Default)

