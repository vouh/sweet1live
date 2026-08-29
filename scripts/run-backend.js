/**
 * Cross-platform backend launcher — one command for setup and daily dev.
 */
const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";
const script = isWin ? "backend-dev.ps1" : "backend-dev.sh";

const child = isWin
  ? spawn(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, script)],
      { cwd: root, stdio: "inherit", shell: false },
    )
  : spawn("bash", [path.join(__dirname, script)], { cwd: root, stdio: "inherit", shell: false });

child.on("exit", (code) => process.exit(code ?? 0));
