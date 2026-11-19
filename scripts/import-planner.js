// One-off: load data/planner-seed.json (converted from the Excel workbook) into the planner.
//   node scripts/import-planner.js            -> refuses if the planner already has data
//   node scripts/import-planner.js --replace  -> wipes the planner sections in the file, then imports
import "dotenv/config";
import fs from "node:fs";
import { MongoClient } from "mongodb";
import { KINDS, clean } from "../server/planner.js";

const file = new URL("../data/planner-seed.json", import.meta.url);
const seed = JSON.parse(fs.readFileSync(file, "utf8"));
const client = new MongoClient(process.env.MONGO_URL);
await client.connect();
const col = client.db(process.env.DB_NAME).collection("planner_items");
const existing = await col.countDocuments();
if (existing && !process.argv.includes("--replace")) {
  console.error(`Planner already has ${existing} records. Re-run with --replace to overwrite those sections.`);
  process.exit(1);
}
const kinds = Object.keys(seed);
if (existing) await col.deleteMany({ kind: { $in: kinds } });
const now = Date.now();
let total = 0;
for (const kind of kinds) {
  if (!Object.hasOwn(KINDS, kind)) throw new Error(`Unknown kind in seed: ${kind}`);
  // createdAt keeps the sheet's row order for sections that sort by it
  const docs = seed[kind].map((row, i) => ({ id: crypto.randomUUID(), kind, ...clean(kind, row), createdAt: new Date(now + i), updatedAt: new Date(now + i) }));
  if (docs.length) await col.insertMany(docs);
  console.log(`${kind.padEnd(12)} ${docs.length}`);
  total += docs.length;
}
console.log(`Imported ${total} records into ${process.env.DB_NAME}.planner_items`);
await client.close();
