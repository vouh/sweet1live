/**
 * One command: API + Stripe webhooks + Next.js dev server.
 */
const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const isWin = process.platform === "win32";
const script = path.join(__dirname, isWin ? "dev-stack.ps1" : "dev-stack.sh");

const child = isWin
  ? spawn(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
      { cwd: root, stdio: "inherit", shell: false },
    )
  : spawn("bash", [script], { cwd: root, stdio: "inherit", shell: false });

child.on("exit", (code) => process.exit(code ?? 0));
