# bope-cli

CLI global para usar `bope` como comando universal desde cualquier carpeta y preparar contexto operativo BOPE para Claude Code.

## Que es
`bope-cli` detecta contexto git, carga configuracion global desde `~/.bope/` y genera un prompt de bootstrap operativo para pegar en Claude Code.

## Instalacion local
```bash
cd bope-cli
npm install
npm run build
npm link
```

Nota Windows: si `npm link` falla con `EPERM` por symlink, abrí la terminal como Administrador.

## Comandos
- `bope`: alias amigable de `bope bootstrap`.
- `bope init`: crea `~/.bope/` con config y prompts base.
- `bope doctor`: diagnostico de herramientas, BOPE y contexto git.
- `bope bootstrap`: genera e imprime prompt BOPE para Claude Code.
- `bope claude`: ejecuta bootstrap, guarda prompt temporal/local e intenta abrir `claude`.
- Manejo de rutas con espacios: usa `child_process.execFile` (sin shell), por lo que `git` y paths con espacios se manejan correctamente.

## Flags utiles
- `bope init --force`: sobrescribe archivos existentes en `~/.bope/`.
- `bope bootstrap --write`: guarda prompt en `.bope-bootstrap.txt`.
- `bope claude --write`: idem anterior + intento de abrir Claude.

## Ejemplo real de salida (`bope bootstrap`)
```text
# BOPE Bootstrap Prompt

- Repo: BOPE_VERSION_DEFINITIVA
- Branch: main
- Repo root: C:\Users\Santiago\source\repos\Santiagoisper\BOPE_VERSION_DEFINITIVA
- Working dir actual: C:\Users\Santiago\source\repos\Santiagoisper\BOPE_VERSION_DEFINITIVA
- Perfil BOPE global: default

## Reglas Operativas BOPE (obligatorias)
1. JOHN RAMBO es el orquestador principal.
2. Arquitectura centralized-by-default.
...
```

## Uso con Claude Code
1. Ejecuta `bope claude` dentro del repo.
2. El CLI muestra el prompt final y guarda copia temporal.
3. Si `claude` abre, pega el prompt manualmente (no se usan APIs inexistentes).
4. Si `claude` no esta en PATH, el CLI te lo informa claramente.

## Desarrollo
```bash
npm run dev
npm run build
npm run link-global
```

## Estructura
```text
bope-cli/
  package.json
  tsconfig.json
  README.md
  .gitignore
  bin/
    bope.js
  src/
    index.ts
    commands/
      init.ts
      doctor.ts
      bootstrap.ts
      claude.ts
    lib/
      config.ts
      git.ts
      prompt.ts
      system.ts
      fs.ts
    templates/
      constitution.md
      bootstrap.md
      rambo.md
      mission-implement.md
      mission-close.md
```
