import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { config } from "dotenv";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";

config({ path: ".env.local" });

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  console.error("Reset cancelado: no se permite resetear DB en production.");
  process.exit(1);
}

const sql = postgres(requireEnv("DATABASE_URL"), {
  prepare: false,
  ssl: "require",
});

main().catch(async (error) => {
  console.error("Reset fallido", error);
  await sql.end();
  process.exit(1);
});

async function main() {
  await confirmReset();

  try {
    await sql`drop schema if exists drizzle cascade`;
    await sql`drop schema if exists public cascade`;
    await sql`create schema public`;
    await sql`grant all on schema public to public`;

    for (const role of ["postgres", "anon", "authenticated", "service_role"]) {
      if (await roleExists(role)) {
        await sql.unsafe(`grant usage on schema public to ${role}`);
        await sql.unsafe(`grant all on schema public to ${role}`);
        await sql.unsafe(`alter default privileges in schema public grant all on tables to ${role}`);
        await sql.unsafe(`alter default privileges in schema public grant all on functions to ${role}`);
        await sql.unsafe(`alter default privileges in schema public grant all on sequences to ${role}`);
      }
    }

    console.log("DB dev reseteada. Proximo paso: npm run db:migrate");
  } finally {
    await sql.end();
  }
}

async function roleExists(role: string) {
  const rows = await sql`select 1 from pg_roles where rolname = ${role} limit 1`;
  return rows.length > 0;
}

async function confirmReset() {
  if (!input.isTTY || !output.isTTY) {
    throw new Error("Reset cancelado: la confirmacion requiere una terminal interactiva.");
  }

  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(
      "Esto borra completamente el schema public de la DB en DATABASE_URL. Escribi RESET DEV DB para confirmar: ",
    );

    if (answer !== "RESET DEV DB") {
      throw new Error("Reset cancelado: confirmacion incorrecta.");
    }
  } finally {
    rl.close();
  }
}
