const { execFileSync } = require("child_process");
const fs = require("fs");

let command = "";
const firstArg = process.argv[2];
if (firstArg && fs.existsSync(firstArg)) {
  command = fs.readFileSync(firstArg, "utf8");
} else {
  command = process.argv.slice(2).join(" ");
}

const b64 = Buffer.from(command).toString("base64");
const remoteCmd = `echo ${b64} | base64 -d | bash`;

try {
  const stdout = execFileSync("ssh", [
    "-i", "C:\\Users\\Admin\\.ssh\\id_ed25519_antigravity",
    "-o", "StrictHostKeyChecking=no",
    "root@179.197.88.186",
    remoteCmd
  ], { encoding: "utf8" });
  process.stdout.write(stdout);
} catch (err) {
  if (err.stdout) process.stdout.write(err.stdout);
  if (err.stderr) process.stderr.write(err.stderr);
  process.exit(err.status || 1);
}
