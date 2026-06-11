import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = path.resolve(SOURCE_DIR, "..");
export const MIGRATIONS_DIR = path.join(PACKAGE_ROOT, "db", "migrations");
export const DATA_DIR = path.join(PACKAGE_ROOT, "data");

