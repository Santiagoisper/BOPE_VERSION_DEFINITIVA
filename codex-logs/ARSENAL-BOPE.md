# ARSENAL BOPE

Banco canonico de herramientas CLI, API y servicio autorizadas para esta capa.

## Regla de gasto

- primero se usa lo ya disponible, gratis o de costo marginal
- lo pago entra solo si ahorra trabajo humano real o desbloquea una mision critica
- no se duplican herramientas caras para el mismo frente
- si una herramienta no esta asentada aqui, no forma parte del arsenal oficial

## Arsenal base

| Herramienta | Tipo | Costo | Uso principal | Efectivos autorizados | Observaciones |
|---|---|---|---|---|---|
| `OpenAI / Codex API` | IA de codigo y texto | pago controlado | codigo, refactor, tests, documentacion | `JOHN RAMBO`, `FORGE BACK`, `NEXUS WIRE`, `PIXEL FRONT`, `HOUSE DOCTOR` | arma principal; usar con economia |
| `Git CLI` | versionado | bajo | diff, commit, ramas, rollback | `JOHN RAMBO`, `FORGE BACK`, `WINSTON SCRIBE`, `HOUSE DOCTOR`, `NEXUS WIRE` | base obligatoria |
| `GitHub CLI (gh)` | repos y PRs | bajo | PRs, issues, releases, actividad | `FORGE BACK`, `WINSTON SCRIBE`, `HOUSE DOCTOR` | trazabilidad y cierre |
| `curl` | HTTP cliente | bajo | APIs, healthchecks, recon defensivo | `HOUSE DOCTOR`, `NEXUS WIRE`, `CERBERUS GUARDIAN`, `BLADE KILLER` | sonda simple y barata |
| `Vercel CLI` | deploy y logs | bajo si ya existe stack | deploy, preview, rollback, logs | `FORGE BACK`, `NEXUS WIRE`, `PIXEL FRONT` | se activa solo en frentes Vercel |
| `psql` | DB cliente | bajo | consultas, validacion, SQL real | `FORGE BACK`, `NEXUS WIRE`, `HOUSE DOCTOR` | preferido para DB directa |
| `Node/TS scripts` | automatizacion | bajo | jobs, validaciones, simulacros, saneamiento | `FORGE BACK`, `NEXUS WIRE`, `HOUSE DOCTOR`, `JOHN RAMBO` | fuerza flexible del batallon |
| `k6` | carga | bajo | stress, latencia, humo de carga | `HOUSE DOCTOR`, `NEXUS WIRE` | no usar de rutina |
| `jq` | parseo JSON | bajo | filtrar, transformar y leer respuestas | `HOUSE DOCTOR`, `NEXUS WIRE`, `WINSTON SCRIBE` | multiplicador de `curl` |
| `rg` | busqueda de codigo | bajo | busqueda rapida en repos | todo tecnico | herramienta de arranque |
| `fd` | busqueda de archivos | bajo | localizar archivos rapido | `FORGE BACK`, `WINSTON SCRIBE`, `HOUSE DOCTOR`, `NEXUS WIRE` | apoyo a inspeccion |
| `Playwright` | UI y navegador | medio controlado | smoke, UI real, capturas, flujos criticos | `PIXEL FRONT`, `HOUSE DOCTOR` | usar cuando UI real importa |
| `pdftotext` | PDF | bajo | extraer texto y revisar PDFs | `HOUSE DOCTOR`, `WINSTON SCRIBE`, `FORGE BACK` | lectura barata de PDF |
| `qpdf` | PDF | bajo | sanear, inspeccionar y reempaquetar PDF | `HOUSE DOCTOR`, `FORGE BACK` | util para diagnostico |
| `openssl` | crypto y TLS | bajo | hashes, certificados, debugging TLS | `CERBERUS GUARDIAN`, `FORGE BACK`, `NEXUS WIRE` | arma de perimetro |

## Arsenal intermedio

Se activa solo si ya existe en el stack del proyecto.

| Herramienta | Tipo | Costo | Uso principal | Efectivos autorizados | Observaciones |
|---|---|---|---|---|---|
| `Sentry CLI` | observabilidad | medio | errores, releases, sourcemaps | `HOUSE DOCTOR`, `WINSTON SCRIBE` | solo si Sentry ya existe |
| `Neon tooling` | Postgres serverless | medio | ramas DB, snapshots, clones | `FORGE BACK`, `NEXUS WIRE`, `HOUSE DOCTOR` | no activar si DB no vive ahi |
| `Supabase CLI` | BaaS | medio | migraciones, auth, logs, storage | `FORGE BACK`, `NEXUS WIRE` | solo para stacks Supabase |
| `logs agregados` | observabilidad | variable | patrones de falla y tendencias | `HOUSE DOCTOR`, `WINSTON SCRIBE` | Loki, ELK u homologo |
| `WAF / IAM APIs` | seguridad | variable | reglas, rate limit, accesos, rotacion | `CERBERUS GUARDIAN` | mando defensivo |
| `analytics API` | analitica | variable | funnels, eventos, comportamiento real | `PIXEL FRONT`, `NEXUS WIRE`, `SANTIAGO` | usar si ya existe telemetria |
| `csvkit / xlsx tooling` | datos | bajo | exportes, auditorias, reportes | `WINSTON SCRIBE`, `HOUSE DOCTOR`, `NEXUS WIRE` | soporte administrativo y tecnico |

## Arsenal de reserva

Entra solo con necesidad expresa. No activar por defecto.

| Herramienta | Tipo | Costo | Uso principal | Efectivos autorizados | Observaciones |
|---|---|---|---|---|---|
| `Aider` | agente CLI git-native | medio | refactors grandes y coherentes | `FORGE BACK`, `NEXUS WIRE` | usar si simplifica cambios amplios |
| `Cline` o similar | orquestador BYO-model | medio | flujos complejos de edicion | `FORGE BACK` | no es arma base |
| `n8n CLI / GitOps` | automatizacion | medio | coser servicios y workflows | `NEXUS WIRE`, `FORGE BACK` | solo si la integracion lo exige |
| `artillery` / `locust` | carga | medio | alternativa a `k6` | `HOUSE DOCTOR`, `NEXUS WIRE` | usar solo si `k6` no alcanza |
| `pdfcpu` o `mutool` | PDF | medio | operaciones PDF mas finas | `HOUSE DOCTOR`, `FORGE BACK`, `WINSTON SCRIBE` | reserva avanzada para PDF |

## Matriz de empleo rapido

- `FORGE BACK`: `Git`, `gh`, `psql`, `Node/TS`, `Vercel CLI`, `rg`, `fd`, `Playwright` si ayuda, arsenal DB del stack
- `NEXUS WIRE`: `Codex API`, `curl`, `jq`, `psql`, `Node/TS`, `k6`, integraciones y deploy cuando aplique
- `PIXEL FRONT`: `Codex API`, `Vercel CLI`, `Playwright`, analytics si existe
- `HOUSE DOCTOR`: `curl`, `jq`, `k6`, `Playwright`, `Sentry CLI`, `pdftotext`, `qpdf`, logs agregados
- `WINSTON SCRIBE`: `Git`, `gh`, `jq`, `pdftotext`, reportes, logs y trazabilidad
- `CERBERUS GUARDIAN`: `curl`, `openssl`, `WAF / IAM APIs`
- `BLADE KILLER`: `curl` y carga defensiva puntual para reconocimiento tecnico; sin autonomia doctrinal sobre el arsenal
- `SICARIO LOCO`: `Codex API` y fuerza bruta de codigo solo bajo orden expresa
- `JOHN RAMBO`: decide despliegue, no necesita portar todas las armas al mismo tiempo

## Veredicto de mando

- el arsenal base cubre casi todo sin inflar gasto
- el arsenal intermedio vive atado al stack real, no al deseo
- el arsenal de reserva queda bloqueado hasta necesidad concreta
- la doctrina correcta es pocas armas bien elegidas, no veinte herramientas abiertas a la vez
