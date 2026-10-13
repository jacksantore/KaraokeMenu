// Gera uma cópia consistente do banco (segura mesmo com o app gravando, graças ao WAL)
// e mantém só as N mais recentes.
//
// Uso: node scripts/backup.mjs   (DATABASE_PATH, BACKUP_DIR e BACKUP_KEEP opcionais)
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "karaoke.db");
const dir = process.env.BACKUP_DIR ?? path.join(path.dirname(dbPath), "backups");
const keep = Number(process.env.BACKUP_KEEP ?? 30);

mkdirSync(dir, { recursive: true });
const target = path.join(dir, `karaoke-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);

const db = new DatabaseSync(dbPath);
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();
console.log(`Backup criado: ${target}`);

const old = readdirSync(dir)
  .filter((f) => f.startsWith("karaoke-") && f.endsWith(".db"))
  .sort()
  .slice(0, -keep);
for (const f of old) unlinkSync(path.join(dir, f));
if (old.length) console.log(`Removidos ${old.length} backup(s) antigo(s).`);
