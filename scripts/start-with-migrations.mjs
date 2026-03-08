import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

run("npx", ["prisma", "migrate", "deploy"]);
run("npx", ["next", "start"]);
