import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import DrizzleConfig from "../drizzle.config.ts";

const db = drizzle(process.env.DATABASE_URL!, DrizzleConfig);

export default db;