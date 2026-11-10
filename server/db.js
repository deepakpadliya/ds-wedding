import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 });
export const db = client.db(process.env.DB_NAME);
export const connect = () => client.connect();
export const close = () => client.close();
export const ping = () => db.command({ ping: 1 });

export async function ensureIndexes() {
  const specs = [
    ["wedding_guests", { mobileNumber: 1 }, { name: "mobile_number_unique", unique: true }],
    ["wedding_guests", { createdAt: -1 }, { name: "created_at_desc" }],
    ["wedding_events", { id: 1 }, { name: "event_id_unique", unique: true }],
    ["wedding_settings", { key: 1 }, { name: "settings_key_unique", unique: true }],
    ["gallery_photos", { id: 1 }, { name: "photo_id_unique", unique: true }],
    ["gallery_photos", { createdAt: -1 }, { name: "photo_created_desc" }],
    ["gallery_video_chunks", { videoId: 1, index: 1 }, { name: "video_chunk_unique", unique: true }],
    ["admin_users", { email: 1 }, { name: "email_unique", unique: true }],
    ["login_attempts", { expiresAt: 1 }, { name: "expires_at_ttl", expireAfterSeconds: 0 }],
  ];
  for (const [col, keys, opts] of specs) {
    try { await db.collection(col).createIndex(keys, opts); }
    catch (e) { console.error(`ensureIndexes(${col}.${opts.name}):`, e.message); }
  }
}
