// Postgres local para desenvolvimento, sem Docker/Supabase.
// Roda um Postgres embutido (PGlite) falando o protocolo wire na porta 5432,
// para o Prisma/dashboard conectarem como em um Postgres normal.
//
// Uso:  npm run db:local   (deixe rodando em um terminal)
// Depois, em outro terminal:  npm run db:push && npm run db:seed && npm run dev
//
// A URL correspondente (já é o padrão do .env.example):
//   postgresql://postgres:postgres@127.0.0.1:5432/postgres?connection_limit=1&pgbouncer=true
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.PGDATA_DIR || join(here, "..", ".pgdata");

const db = await PGlite.create(dataDir);
await db.waitReady;

const server = new PGLiteSocketServer({ db, port: 5432, host: "127.0.0.1" });
await server.start();
console.log(`🐘  Postgres local (PGlite) em 127.0.0.1:5432  ·  dados: ${dataDir}`);
console.log("   Pare com Ctrl+C.");

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
