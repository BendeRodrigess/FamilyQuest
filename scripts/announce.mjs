// Публікація новини про FamilyQuest.
//
// Адмін-панелі навмисно немає: вона означала б нову роль у базі, нові
// захищені маршрути й нову поверхню для помилок авторизації — заради
// кількох новин на рік. Доступ по SSH у власника сервера вже є, і він
// надійніший за будь-яку форму у вебі.
//
// Працює напряму через `pg`, а не через Prisma: згенерований клієнт —
// це TypeScript-джерела, які звичайний Node без збірки не імпортує.
//
// Приклад:
//   npm run announce -- --category=FIX --audience=ALL \
//     --title="🛠 Виправлення" --body="Виправлено час дедлайну."

import { randomBytes } from "node:crypto";

import "dotenv/config";
import { Client } from "pg";

const CATEGORIES = ["FEATURE", "FIX", "UPDATE", "IMPORTANT"];
const AUDIENCES = ["ALL", "PARENTS", "CHILDREN"];

const USAGE = `
Публікація новини FamilyQuest.

  npm run announce -- --category=<КАТЕГОРІЯ> --audience=<АУДИТОРІЯ> \\
                      --title="Заголовок" --body="Текст" [--href=/шлях] \\
                      [--at="2026-10-01T09:00"] [--draft]

  --category   ${CATEGORIES.join(" | ")}
  --audience   ${AUDIENCES.join(" | ")}          (типово ALL)
  --title      заголовок, до 120 символів (емодзі дає категорія)
  --body       текст, до 1000 символів
  --href       куди веде натискання, внутрішній шлях на кшталт /child/tasks
  --at         відкладена публікація: локальний час або ISO зі зсувом
  --draft      зберегти чернеткою — її не побачить ніхто

Без --at і без --draft новина публікується одразу.
`.trim();

function parseArgs(argv) {
  const args = {};

  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, ...rest] = raw.slice(2).split("=");
    args[key] = rest.length > 0 ? rest.join("=") : "true";
  }

  return args;
}

function fail(message) {
  console.error(`✖ ${message}\n`);
  console.error(USAGE);
  process.exit(1);
}

/**
 * Момент у тому вигляді, в якому його зберігає Prisma.
 *
 * Колонка — `timestamp without time zone`, і Prisma кладе туди настінний
 * час UTC. А node-pg, отримавши об'єкт Date, записав би настінний час
 * **процесу**: із Києва туди потрапило б 11:25 замість 08:25, і новина
 * вважалася б неопублікованою ще три години. Тому переводимо самі.
 */
function utcWallClock(date) {
  return date.toISOString().replace("T", " ").replace("Z", "");
}

/**
 * Ідентифікатор у тому ж форматі, що й решта бази: cuid v1 — літера «c»,
 * час, лічильник, відбиток машини й випадковий хвіст. Prisma генерує його
 * на боці застосунку, тому в чистому SQL його треба зробити самому.
 */
let counter = Math.floor(Math.random() * 1_000_000);
const fingerprint = randomBytes(2).toString("hex");

function cuid() {
  const time = Date.now().toString(36);
  const count = (counter++ % 1_679_616).toString(36).padStart(4, "0");
  const random = randomBytes(4).toString("hex");
  return `c${time}${count}${fingerprint}${random}`.slice(0, 25);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(USAGE);
  process.exit(0);
}

const category = (args.category ?? "").toUpperCase();
const audience = (args.audience ?? "ALL").toUpperCase();
const title = (args.title ?? "").trim();
const body = (args.body ?? "").trim();
const href = (args.href ?? "").trim() || null;

if (!CATEGORIES.includes(category)) {
  fail(`--category має бути одним із: ${CATEGORIES.join(", ")}`);
}
if (!AUDIENCES.includes(audience)) {
  fail(`--audience має бути одним із: ${AUDIENCES.join(", ")}`);
}
if (title.length < 2 || title.length > 120) fail("--title: від 2 до 120 символів");
if (body.length < 2 || body.length > 1000) fail("--body: від 2 до 1000 символів");
if (href && !href.startsWith("/")) fail("--href має бути внутрішнім шляхом, що починається з «/»");

// Поведінка однозначна: чернетка тільки за явним --draft, відкладена
// публікація тільки за явним --at, у решті випадків — одразу.
const draft = args.draft === "true";
if (draft && args.at) fail("--draft і --at разом не мають сенсу: оберіть щось одне");

let publishedAt = null;
if (!draft) {
  if (args.at) {
    const at = new Date(args.at);
    if (Number.isNaN(at.getTime())) fail(`--at: не вдалося зрозуміти дату «${args.at}»`);
    publishedAt = at;
  } else {
    publishedAt = new Date();
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) fail("Не задано DATABASE_URL");

const client = new Client({ connectionString });
await client.connect();

const id = cuid();

await client.query(
  `insert into "Announcement" (id, category, audience, title, body, href, "publishedAt", "createdAt")
   values ($1, $2, $3, $4, $5, $6, $7, now())`,
  [id, category, audience, title, body, href, publishedAt && utcWallClock(publishedAt)],
);

await client.end();

const status = draft
  ? "чернетка — користувачі не бачать"
  : publishedAt.getTime() > Date.now()
    ? `заплановано на ${publishedAt.toISOString()}`
    : "опубліковано";

console.log(`
✔ Новину збережено

  id         ${id}
  категорія  ${category}
  аудиторія  ${audience}
  статус     ${status}
  заголовок  ${title}
`);
