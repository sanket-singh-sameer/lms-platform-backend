import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.AUTH_SERVICE_POSTGRE_URL;

if (!dbUrl) {
    throw new Error(
        "Missing DB URL. Set AUTH_SERVICE_POSTGRES_URL (or AUTH_SERVICE_POSTGRE_URL) in apps/auth-service/.env"
    );
}

const sql = neon(dbUrl);

export default sql;