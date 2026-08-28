/**
 * Cross-platform entry for `npm run backend`.
 */
const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";

const child = isWin
  ? spawn(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "backend-dev.ps1")],
      { cwd: root, stdio: "inherit", shell: false },
    )
  : spawn("bash", [path.join(__dirname, "backend-dev.sh")], {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });

child.on("exit", (code) => process.exit(code ?? 0));
