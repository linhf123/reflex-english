import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "coca-source.csv");
const outputPath = path.join(root, "data", "coca-5000.js");

const bands = [
  { id: "core", zh: "核心 500", en: "Core", min: 1, max: 500 },
  { id: "daily", zh: "日常高频", en: "Daily", min: 501, max: 1000 },
  { id: "everyday", zh: "常用表达", en: "Everyday", min: 1001, max: 2000 },
  { id: "working", zh: "工作认知", en: "Working", min: 2001, max: 3000 },
  { id: "advanced", zh: "进阶阅读", en: "Advanced", min: 3001, max: 4000 },
  { id: "extended", zh: "扩展词汇", en: "Extended", min: 4001, max: 5000 },
];

const registers = [
  { id: "blog", zh: "博客", en: "Blog", column: "blogPM" },
  { id: "web", zh: "网页", en: "Web", column: "webPM" },
  { id: "tvm", zh: "电视电影", en: "TV / Movie", column: "TVMPM" },
  { id: "spoken", zh: "口语", en: "Spoken", column: "spokPM" },
  { id: "fiction", zh: "小说", en: "Fiction", column: "ficPM" },
  { id: "magazine", zh: "杂志", en: "Magazine", column: "magPM" },
  { id: "news", zh: "新闻", en: "News", column: "newsPM" },
  { id: "academic", zh: "学术", en: "Academic", column: "acadPM" },
];

const posLabels = {
  n: { zh: "名词", en: "Noun" },
  v: { zh: "动词", en: "Verb" },
  j: { zh: "形容词", en: "Adjective" },
  r: { zh: "副词", en: "Adverb" },
  i: { zh: "介词", en: "Preposition" },
  p: { zh: "代词", en: "Pronoun" },
  c: { zh: "连词", en: "Conjunction" },
  d: { zh: "限定词", en: "Determiner" },
  m: { zh: "数词", en: "Number" },
  u: { zh: "助动词", en: "Auxiliary" },
  a: { zh: "冠词", en: "Article" },
  t: { zh: "不定式", en: "Infinitive marker" },
  x: { zh: "否定词", en: "Negation" },
  e: { zh: "存在词", en: "Existential" },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows.filter((items) => items.some(Boolean));
}

const source = (await readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "");
const [header, ...rows] = parseCsv(source);
const columns = Object.fromEntries(header.map((name, index) => [name, index]));
const selectedRows = rows.slice(0, 5000);

if (selectedRows.length !== 5000) {
  throw new Error(`Expected 5000 ranked entries, found ${selectedRows.length}.`);
}

const maxRange = Math.max(...selectedRows.map((row) => Number(row[columns.range]) || 0));
const number = (row, key, digits = null) => {
  const value = Number(row[columns[key]]);
  return digits === null ? value : Number(value.toFixed(digits));
};

const words = selectedRows.map((row) => {
  const rank = number(row, "rank");
  const rawDispersion = number(row, "disp");
  const dispersion =
    rawDispersion >= 0 && rawDispersion <= 1.05
      ? Number(Math.min(1, rawDispersion).toFixed(3))
      : null;
  const band = bands.find((item) => rank >= item.min && rank <= item.max) || bands.at(-1);
  const registersMap = Object.fromEntries(
    registers.map((register) => [
      register.id,
      number(row, register.column, 2),
    ]),
  );
  const topRegister = registers.reduce(
    (best, register) =>
      registersMap[register.id] > registersMap[best.id] ? register : best,
    registers[0],
  ).id;

  return {
    rank,
    word: row[columns.lemma],
    pos: row[columns.PoS],
    frequency: number(row, "freq"),
    perMillion: number(row, "perMil", 2),
    capitalization: number(row, "%caps", 2),
    coverage: Number(((number(row, "range") / maxRange) * 100).toFixed(2)),
    dispersion,
    band: band.id,
    topRegister,
    registers: registersMap,
  };
});

const uniqueLemmas = new Set(words.map((entry) => entry.word)).size;
const payload = `// Generated from data/coca-source.csv by scripts/build-coca-data.mjs\nwindow.COCA_META = ${JSON.stringify(
  {
    total: words.length,
    uniqueLemmas,
    bands,
    registers,
    posLabels,
    source: "https://github.com/brucewlee/COCA-WordFrequency",
    corpus: "https://www.wordfrequency.info/",
  },
  null,
  2,
)};\nwindow.COCA_WORDS = ${JSON.stringify(words)};\n`;

await writeFile(outputPath, payload, "utf8");
console.log(`Built ${words.length} COCA entries (${uniqueLemmas} unique lemmas).`);
console.log(`Output: ${(Buffer.byteLength(payload) / 1024).toFixed(0)} KB`);
