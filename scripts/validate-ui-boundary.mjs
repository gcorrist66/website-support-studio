import fs from "node:fs";
import path from "node:path";

const sourceDirs = [
  path.join(process.cwd(), "src", "components"),
  path.join(process.cwd(), "src", "ui"),
];

const importSupabase = /\bfrom\s+['"]@?supabase\/supabase-js['"]/i;
const supabaseUsage = /\bsupabase\./i;
const sendCommsPhrases = /customer communication|send to customer|send customer|delivery|email to customer/i;
const disabledPhasePhrases = /Not active in Phase 4(B|C)/i;
const activeMutationPhrases = /\bsend\b|\bapprove\b|\bclose\b/i;

function walkFiles(dir, acc = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, acc);
      continue;
    }

    if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      continue;
    }

    acc.push(fullPath);
  }
  return acc;
}

function hasRouteLikeFolders(files) {
  return files.filter((file) => /[\\/](app|pages)[\\/]api[\\/]/.test(file) || /[\\/]routes[\\/]/.test(file));
}

function hasSupabaseUsage(files) {
  return files.filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    return importSupabase.test(text) || supabaseUsage.test(text);
  });
}

function hasForbiddenSendLabels(files) {
  return files.filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    const buttonBlocks = text.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];

    return buttonBlocks.some((block) => {
      const normalized = block.toLowerCase();
      const hasDisabled = /\bdisabled\b/.test(normalized);
      if (hasDisabled) {
        return false;
      }

      return sendCommsPhrases.test(normalized);
    });
  });
}

function hasDisabledLanguage(files) {
  return files.some((file) => {
    const text = fs.readFileSync(file, "utf8");
    return /disabled/i.test(text) && disabledPhasePhrases.test(text);
  });
}

function hasActiveMutationButtons(files) {
  return files.filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    const buttonBlocks = text.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi) || [];

    return buttonBlocks.some((block) => {
      const normalized = block.toLowerCase();
      const hasDisabled = /\bdisabled\b/.test(normalized);
      const hasActionWord = activeMutationPhrases.test(normalized);
      return hasActionWord && !hasDisabled;
    });
  });
}

function usesMockData(files) {
  return files.some((file) => /mockData/.test(file));
}

function main() {
  const files = sourceDirs.flatMap((dir) => walkFiles(dir, []));

  const checks = [];

  const routeLike = hasRouteLikeFolders(files);
  checks.push({
    name: "no API route-like files or folders under UI boundary",
    passed: routeLike.length === 0,
    detail: routeLike.length === 0 ? "no route-like path found" : routeLike.join(", "),
  });

  const supabaseFiles = hasSupabaseUsage(files);
  checks.push({
    name: "no live Supabase reads/writes in UI files",
    passed: supabaseFiles.length === 0,
    detail: supabaseFiles.length === 0 ? "no Supabase client usage found" : supabaseFiles.join(", "),
  });

  const sendLabelFiles = hasForbiddenSendLabels(files);
  checks.push({
    name: "no active customer send labels in UI placeholders",
    passed: sendLabelFiles.length === 0,
    detail: sendLabelFiles.length === 0 ? "none detected" : sendLabelFiles.join(", "),
  });

  const hasDisabled = hasDisabledLanguage(files);
  checks.push({
    name: "disabled action language exists",
    passed: hasDisabled,
    detail: hasDisabled ? "found disabled action language in UI" : "missing disabled action language",
  });

  const activeMutationButtons = hasActiveMutationButtons(files);
  checks.push({
    name: "no active send/approve/close buttons",
    passed: activeMutationButtons.length === 0,
    detail:
      activeMutationButtons.length === 0
        ? "no active mutation-oriented buttons detected"
        : activeMutationButtons.join(", "),
  });

  const mockUsed = usesMockData(files);
  checks.push({
    name: "mock data source is used",
    passed: mockUsed,
    detail: mockUsed ? "mock data imports used" : "mock data imports not detected",
  });

  const failed = checks.filter((check) => !check.passed);
  if (failed.length > 0) {
    console.log(JSON.stringify({ status: "fail", checks, failures: failed }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify({ status: "pass", checks }, null, 2));
}

main();
