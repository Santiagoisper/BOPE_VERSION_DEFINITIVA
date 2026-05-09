import "../loadEnv.js";
import { migrateDatabase } from "../migrations.js";

try {
  await migrateDatabase();
  console.log("BOPE Command Center migrations applied.");
} catch (error) {
  console.error("BOPE Command Center migrations failed.");
  console.error(error);
  process.exitCode = 1;
}
