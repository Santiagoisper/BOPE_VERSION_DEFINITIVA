/**
 * Validación de variables de entorno críticas al arranque del servidor.
 * Se debe llamar antes de cualquier inicialización de base de datos o servicios.
 */

const REQUIRED_VARS = [
  "BOPE_COMMAND_CENTER_DATABASE_URL",
  "JWT_SECRET",
] as const;

/**
 * Verifica que las variables de entorno críticas estén presentes en `process.env`.
 * Si alguna falta, imprime un mensaje descriptivo con la lista de variables faltantes
 * y termina el proceso con código de salida 1.
 */
export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((varName) => !process.env[varName]);

  if (missing.length === 0) {
    return;
  }

  console.error("❌ ERROR: Faltan variables de entorno críticas para iniciar el servidor.");
  console.error("");
  console.error("Variables faltantes:");
  for (const varName of missing) {
    console.error(`  - ${varName}`);
  }
  console.error("");
  console.error("Configurá estas variables en el archivo .env o en el entorno antes de iniciar el servidor.");
  console.error("Consultá apps/bope-command-center-server/.env.example para ver todas las variables disponibles.");

  process.exit(1);
}
