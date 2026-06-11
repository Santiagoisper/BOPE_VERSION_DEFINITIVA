/**
 * Validación de variables de entorno críticas al arranque del servidor.
 * Se debe llamar antes de cualquier inicialización de base de datos o servicios.
 */

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Verifica que las variables de entorno críticas estén presentes en `process.env`.
 * Si alguna falta, imprime un mensaje descriptivo con la lista de variables faltantes
 * y termina el proceso con código de salida 1.
 */
export function validateEnv(): void {
  const missing: string[] = [];

  if (!process.env.BOPE_COMMAND_CENTER_DATABASE_URL && !process.env.DATABASE_URL) {
    missing.push("BOPE_COMMAND_CENTER_DATABASE_URL or DATABASE_URL");
  }

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  const jwtSecret = process.env.JWT_SECRET ?? "";
  const weakJwtSecret =
    Boolean(jwtSecret) &&
    (jwtSecret.length < MIN_JWT_SECRET_LENGTH || jwtSecret === "change-me-use-a-long-random-secret-at-least-32-chars");

  if (missing.length > 0) {
    console.error("ERROR: Faltan variables de entorno criticas para iniciar el servidor.");
    console.error("");
    console.error("Variables faltantes:");
    for (const varName of missing) {
      console.error(`  - ${varName}`);
    }
    console.error("");
    console.error("Configuralas en el archivo .env o en el entorno antes de iniciar el servidor.");
    console.error("Consulta apps/bope-command-center-server/.env.example para ver todas las variables disponibles.");
    process.exit(1);
    return;
  }

  if (weakJwtSecret) {
    console.error("ERROR: JWT_SECRET no es suficientemente fuerte.");
    console.error(`Debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres y no usar el valor de ejemplo.`);
    process.exit(1);
  }
}
