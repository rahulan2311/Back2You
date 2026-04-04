const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const checks = [];
let failed = false;

function addCheck(ok, label, detail = "") {
  checks.push({ ok, label, detail });
  if (!ok) {
    failed = true;
  }
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function parseEnvExample(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=")[0].trim());
}

function printSummary() {
  for (const check of checks) {
    const status = check.ok ? "PASS" : "FAIL";
    const suffix = check.detail ? ` - ${check.detail}` : "";
    console.log(`[${status}] ${check.label}${suffix}`);
  }

  if (failed) {
    console.error("\nDeployment validation failed.");
    process.exit(1);
  }

  console.log("\nDeployment validation passed.");
}

async function checkHealth() {
  const healthUrl = process.env.HEALTHCHECK_URL || "http://127.0.0.1:5000/api/health";

  try {
    const response = await fetch(healthUrl);
    if (!response.ok) {
      addCheck(false, "Health endpoint responds", `${healthUrl} returned ${response.status}`);
      return;
    }

    const data = await response.json();
    addCheck(Boolean(data && data.success), "Health endpoint responds", healthUrl);
  } catch (error) {
    addCheck(false, "Health endpoint responds", `${healthUrl} unreachable`);
  }
}

async function main() {
  addCheck(fileExists("frontend/index.html"), "Frontend entry exists", "frontend/index.html");
  addCheck(fileExists("backend/src/server.js"), "Backend entry exists", "backend/src/server.js");
  addCheck(fileExists("netlify.toml"), "Netlify config exists", "netlify.toml");
  addCheck(fileExists("backend/vercel.json"), "Vercel config exists", "backend/vercel.json");
  addCheck(fileExists("backend/.env.example"), "Development env example exists", "backend/.env.example");
  addCheck(fileExists("backend/.env.production.example"), "Production env example exists", "backend/.env.production.example");

  if (fileExists("backend/.env.example")) {
    const devEnvKeys = parseEnvExample(path.join(backendDir, ".env.example"));
    const requiredDevKeys = ["PORT", "NODE_ENV", "MONGO_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "CLIENT_URL", "CLIENT_URLS"];
    for (const key of requiredDevKeys) {
      addCheck(devEnvKeys.includes(key), `Dev env example includes ${key}`);
    }
  }

  if (fileExists("backend/.env.production.example")) {
    const prodEnvKeys = parseEnvExample(path.join(backendDir, ".env.production.example"));
    const requiredProdKeys = ["PORT", "NODE_ENV", "MONGO_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "CLIENT_URL", "CLIENT_URLS"];
    for (const key of requiredProdKeys) {
      addCheck(prodEnvKeys.includes(key), `Prod env example includes ${key}`);
    }
  }

  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  addCheck(Boolean(rootPackageJson.scripts && rootPackageJson.scripts.dev), "Root dev script exists");
  addCheck(Boolean(rootPackageJson.scripts && rootPackageJson.scripts["validate:deploy"]), "Root deploy validation script exists");

  const backendPackageJson = JSON.parse(fs.readFileSync(path.join(backendDir, "package.json"), "utf8"));
  addCheck(Boolean(backendPackageJson.scripts && backendPackageJson.scripts.start), "Backend start script exists");

  await checkHealth();
  printSummary();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
