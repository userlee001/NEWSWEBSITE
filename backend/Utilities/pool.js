import pg from "pg";

const { Pool } = pg;
export const pool = new Pool({
    max: 20,
    connectionString: process.env.DATABASE_URL
});