#!/usr/bin/env node
import('../dist/index.js').catch((error) => {
  console.error('[bope] Error fatal al cargar el CLI. ¿Ejecutaste `npm run build`?');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
});