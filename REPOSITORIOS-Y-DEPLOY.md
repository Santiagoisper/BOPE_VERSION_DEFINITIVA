# Repositorios y Deploy

Estado canonico consolidado al 3 de abril de 2026.

## Fuente de verdad

- carpeta canonica: `BOPE VERSION DEFINITIVA`
- repo GitHub canonico: `https://github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA.git`
- rama canonica: `main`
- bootstrap Codex: `CODEX.md`
- bootstrap Claude: `.claude/CLAUDE.md`

## Mapa del terreno

### `BOPE VERSION DEFINITIVA`

Rol:

- producto operativo real de BOPE
- contiene frontend `apps/bope-command-center`
- contiene backend `apps/bope-command-center-server`
- contiene doctrina local autosuficiente para Codex y Claude

Estado Git:

- repo git activo
- remoto `origin` configurado a GitHub

Estado deploy:

- sin `.vercel/project.json` local
- sin `vercel.json` local
- frontend preparado para backend remoto por `BOPE_COMMAND_CENTER_API_URL`
- backend preparado para `healthz`, migraciones y Postgres Neon

Decision:

- unico frente productivo valido

### `PRUEBA`

Rol:

- sandbox tecnico
- conserva un artefacto estatico `artifacts/bope-command-center`
- util para demos, exploracion visual o deploy rapido en Vercel sin backend real

Estado Git:

- repo git activo
- remoto `origin` configurado a `https://github.com/Santiagoisper/PRUEBA.git`

Estado deploy:

- sin `.vercel/project.json` local
- sin `vercel.json` local
- el artefacto documenta deploy manual en Vercel con root `artifacts/bope-command-center`

Decision:

- no usar como fuente de verdad
- conservar como sandbox y referencia historica del frontend estatico

### `BOPE 2026`

Rol:

- archivo/laboratorio de exploracion para BOPE con APIs
- no define el presente operativo del batallon

Estado Git:

- sin repo git propio detectado en la raiz

Estado deploy:

- sin configuracion local de Vercel detectada en la raiz

Decision:

- conservar como laboratorio historico
- no iniciar trabajo productivo nuevo aqui

## Regla de migracion

Si algo de `PRUEBA` o `BOPE 2026` vale la pena:

1. se toma como referencia
2. se reimplementa o porta en `BOPE VERSION DEFINITIVA`
3. se registra el cambio en el repo canonico
4. se versiona y se sube desde el repo canonico

## Pendiente real

Falta enlazar formalmente el deploy real con el repo canonico. Para cerrar esa brecha hace falta:

1. identificar el proyecto Vercel vivo
2. persistir el link local con `.vercel/project.json` o documentacion equivalente
3. dejar asentado si el deploy corresponde al frontend solo o al sistema completo
