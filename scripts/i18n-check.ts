import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "src");
const LOCALES = ["ru", "kk"] as const;
const CALLS = new Set(["t", "tx", "tr", "msg"]);
const DATA_FIELDS = new Set(["summary", "campusLife", "note", "coverage", "notes", "label", "city", "country", "region", "department", "field", "degree", "selectiveNote"]);
const DATA_FILES = ["lib/data/universities.ts", "lib/data/scholarships.ts", "lib/data/professors.ts"];
const EXTRA_KEYS = ["high", "medium", "low", "Dream", "Target", "Safety", "Within budget", "Stretch", "Needs aid", "Needs verification", "Exceptional", "Strong", "Competitive", "Developing", "Not enough data", "public", "private", "urban", "suburban", "rural", "small", "large", "university", "government", "merit", "need", "merit and need", "undergraduate", "graduate", "both", "Full need met", "Limited", "None"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === "i18n" && dir.endsWith("lib") ? [] : walk(path);
    return /\.(tsx?|mts)$/.test(entry) ? [path] : [];
  });
}

function literals(node: ts.Node): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
  if (ts.isConditionalExpression(node)) return [...literals(node.whenTrue), ...literals(node.whenFalse)];
  if (ts.isParenthesizedExpression(node)) return literals(node.expression);
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) return [...literals(node.left), ...literals(node.right)];
  return [];
}

const keys = new Set<string>(EXTRA_KEYS);

for (const file of walk(SRC)) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const isData = DATA_FILES.some((d) => file.endsWith(d));
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CALLS.has(node.expression.text) && node.arguments[0]) {
      literals(node.arguments[0]).forEach((k) => k.trim() && keys.add(k));
    }
    if (isData && ts.isPropertyAssignment(node) && DATA_FIELDS.has(node.name.getText(source))) {
      literals(node.initializer).forEach((k) => /[A-Za-z]/.test(k) && keys.add(k));
    }
    if (isData && ts.isPropertyAssignment(node) && node.name.getText(source) === "tests" && ts.isArrayLiteralExpression(node.initializer)) {
      node.initializer.elements.forEach((e) => literals(e).forEach((k) => keys.add(k)));
    }
    if (isData && ts.isPropertyAssignment(node) && node.name.getText(source) === "areas" && ts.isArrayLiteralExpression(node.initializer)) {
      node.initializer.elements.forEach((e) => literals(e).forEach((k) => keys.add(k)));
    }
    if (isData && ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const noteIndex: Record<string, number[]> = { reported: [2], unverified: [2], unavailable: [1], deadline: [0], professor: [3] };
      (noteIndex[node.expression.text] ?? []).forEach((i) => node.arguments[i] && literals(node.arguments[i]).forEach((k) => /[A-Za-z]{3,}/.test(k) && keys.add(k)));
      if (node.expression.text === "professor" && node.arguments[4] && ts.isArrayLiteralExpression(node.arguments[4])) {
        node.arguments[4].elements.forEach((e) => literals(e).forEach((k) => keys.add(k)));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

let missingTotal = 0;
for (const locale of LOCALES) {
  const path = join(SRC, "lib", "i18n", `${locale}.json`);
  const dictionary = JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  const missing = [...keys].filter((k) => !(k in dictionary)).sort();
  const unused = Object.keys(dictionary).filter((k) => !keys.has(k));
  missingTotal += missing.length;
  console.log(`${locale}: ${keys.size - missing.length}/${keys.size} translated, ${missing.length} missing, ${unused.length} unused`);
  if (process.argv.includes("--dump")) writeFileSync(join(ROOT, `i18n-missing-${locale}.json`), JSON.stringify(Object.fromEntries(missing.map((k) => [k, ""])), null, 2));
}

if (missingTotal && process.argv.includes("--strict")) process.exit(1);
