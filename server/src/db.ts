import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;
console.log(connectionString)
const client = postgres(connectionString);
export const db = drizzle(client);
