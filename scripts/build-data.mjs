import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "source.md");
const outputPath = path.join(root, "data", "sentences.js");

const scenes = [
  {
    id: "opening",
    en: "First Words",
    zh: "开口第一句",
    note: "从最简单的回应开始，让嘴巴先动起来。",
  },
  {
    id: "people",
    en: "People & Self",
    zh: "认识彼此",
    note: "介绍自己，也自然地了解别人。",
  },
  {
    id: "home",
    en: "Home & Habits",
    zh: "居家日常",
    note: "把每天都在发生的动作说清楚。",
  },
  {
    id: "outside",
    en: "On the Move",
    zh: "出行与能力",
    note: "问路、出门，以及你能够做到的事。",
  },
  {
    id: "table",
    en: "Food & Shopping",
    zh: "餐厅与购物",
    note: "点单、结账、挑选，生活里的高频场景。",
  },
  {
    id: "work",
    en: "Work & Time",
    zh: "工作与时间",
    note: "安排日程，也说明正在忙什么。",
  },
  {
    id: "memory",
    en: "Past & Plans",
    zh: "过去与计划",
    note: "讲昨天发生的事，说明接下来要做什么。",
  },
  {
    id: "goals",
    en: "Goals & Feelings",
    zh: "愿望与感受",
    note: "表达目标、担忧，以及真实的内心状态。",
  },
  {
    id: "opinion",
    en: "Opinions",
    zh: "观点与情绪",
    note: "给出判断，补充理由，让表达更有层次。",
  },
  {
    id: "story",
    en: "Links & Stories",
    zh: "连句与故事",
    note: "从短句走向连贯叙述，把英语真正用起来。",
  },
];

const raw = await readFile(sourcePath, "utf8");
const lines = raw
  .split(/\r?\n/)
  .slice(2)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !line.startsWith("需要我帮你"));

if (lines.length !== 1000) {
  throw new Error(`Expected 1000 sentences, found ${lines.length}.`);
}

const sentences = lines.map((line, index) => {
  const firstChinese = line.search(/[\u3400-\u9fff]/);
  if (firstChinese < 1) {
    throw new Error(`Could not split source line ${index + 1}: ${line}`);
  }

  const en = line
    .slice(0, firstChinese)
    .trim()
    .replaceAll("\\.", ".")
    .replaceAll("\\!", "!")
    .replaceAll("\\?", "?");
  const zh = line.slice(firstChinese).trim();

  if (!en || !zh) {
    throw new Error(`Empty sentence or translation on line ${index + 1}.`);
  }

  const scene = scenes[Math.floor(index / 100)];
  const wordCount = en.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)?.length ?? 0;

  return {
    id: index + 1,
    en,
    zh,
    scene: scene.id,
    words: wordCount,
  };
});

const payload = `// Generated from data/source.md by scripts/build-data.mjs\nwindow.REFLEX_SCENES = ${JSON.stringify(scenes, null, 2)};\nwindow.REFLEX_SENTENCES = ${JSON.stringify(sentences, null, 2)};\n`;

await writeFile(outputPath, payload, "utf8");

const sceneCounts = Object.fromEntries(
  scenes.map((scene) => [
    scene.zh,
    sentences.filter((sentence) => sentence.scene === scene.id).length,
  ]),
);

console.log(`Built ${sentences.length} sentences in ${scenes.length} scenes.`);
console.log(sceneCounts);
