#!/usr/bin/env node

// Kills any process listening on this app's dev ports, then starts `pnpm dev`.
// Used by `npm restart` / `pnpm restart` at the repo root.

const { execSync, spawn } = require("node:child_process");

const PORTS = [3000, 3001, 4000];

function killPort(port) {
  try {
    if (process.platform === "win32") {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of output.split("\n")) {
        const match = line.trim().match(/LISTENING\s+(\d+)\s*$/);
        if (match) pids.add(match[1]);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          console.log(`Killed PID ${pid} on port ${port}`);
        } catch {
          // process already gone
        }
      }
    } else {
      const output = execSync(`lsof -ti tcp:${port}`, { encoding: "utf8" }).trim();
      if (output) {
        for (const pid of output.split("\n")) {
          try {
            execSync(`kill -9 ${pid}`);
            console.log(`Killed PID ${pid} on port ${port}`);
          } catch {
            // process already gone
          }
        }
      }
    }
  } catch {
    // no process listening on this port
  }
}

console.log(`Stopping any process on ports: ${PORTS.join(", ")}`);
for (const port of PORTS) killPort(port);

console.log("\nStarting dev servers (pnpm dev)...\n");
const child = spawn("pnpm", ["dev"], { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
