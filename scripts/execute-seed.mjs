import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');

// Parse .env.local manually
const envFile = fs.readFileSync(envPath, 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
  }
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function runSeed() {
  try {
    const seedPath = path.join(__dirname, '..', 'seed-comprehensive-course.sql');
    const query = fs.readFileSync(seedPath, 'utf8');
    
    console.log("Executing seed script...");
    await sql.unsafe(query);
    console.log("Seed script executed successfully!");
    
  } catch (error) {
    console.error("Error executing seed script:", error);
  } finally {
    await sql.end();
  }
}

runSeed();
