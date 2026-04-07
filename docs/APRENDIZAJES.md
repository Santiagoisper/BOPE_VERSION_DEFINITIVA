# APRENDIZAJES

## Caso: PatientServices.APP + CX/CC + Gateway Prebiller

Fecha: 2026-03-22

### 1. Publicar antes de delegar

- No delegar trabajo a CC si la base de CX existe solo en local.
- Antes del handoff, CX debe:
  - crear rama visible en GitHub
  - pushear commits
  - pasar rama + commit exactos
- Si esto no se hace, CC puede concluir correctamente que "no existe" la base, aunque exista en local.

### 2. Fuente de verdad unica

- Cuando hay varias ramas vivas, definir una sola fuente de verdad operativa.
- En este caso la referencia correcta fue:
  - primero `cx/gateway-foundation`
  - despues `main` una vez consolidada la linea CX + CC
- Todo diff, contador, contrato o handoff debe leerse contra esa referencia unica.

### 3. No confiar en estados remotos sin fetch

- Si un agente dice que `origin/main` apunta a otro commit, primero validar con:
  - `git fetch origin`
  - `git log --oneline --decorate -3 origin/main`
- Mucha confusion vino de refs remotas viejas, no de codigo roto.

### 4. No reconstruir contrato si ya existe

- Si CX ya consolidó capa API, generated modules, hooks base y docs, CC no debe rehacer contrato.
- CC consume la capa existente.
- CX consolida contrato y transporte.
- CC construye UI y consumo sobre esa base.

### 5. El backend vivo no siempre es una fuente estable

- El Swagger del gateway puede dar `503`.
- Un modulo puntual puede devolver `500` aunque el resto del gateway exista.
- Conclusión:
  - si ya hay artefactos generados validados, no regenerar en caliente por reflejo
  - primero usar la base publicada
  - solo regenerar cuando el backend este sano

### 6. El discovery OIDC puede estar mal y aun asi la SPA puede ser correcta

- El discovery de `identity.hc.alpha-cr.com` devolvió `issuer: "null"`.
- Eso es una inconsistencia del IdP, no del frontend.
- Decisión válida:
  - usar el discovery real
  - respetar callbacks confirmados por el dueño del sistema
  - blindar metadata para no depender del `issuer` roto

### 7. No usar comandos destructivos como primera opcion

- Para alinear ramas, preferir:
  - `git fetch`
  - `git switch`
  - `git rebase`
  - `git cherry-pick`
- No recomendar `git reset --hard` como paso normal de handoff.
- Solo usar rewrite de historia o force push cuando la decision de fuente canonica ya fue tomada.

### 8. Separar claramente responsabilidades

- CX:
  - arquitectura
  - auth
  - gateway
  - contratos
  - base tecnica
- CC:
  - hooks de consumo
  - UI
  - pantallas reales
  - estado loading/error/empty

### 9. Contadores e inventarios deben salir de archivos canonicos

- Si hay `gatewayManifest`, el numero de modulos y endpoints sale de ahi.
- No recalcular a mano.
- No copiar valores viejos en textos o handoffs.
- En este caso el valor correcto fue:
  - `24 modulos`
  - `607 endpoints`

### 10. Mejor una demo real y acotada que una grande e inventada

- Para mostrar avance a un stakeholder:
  - usar pocos endpoints reales
  - mostrar loading/error/empty state
  - reportar gaps reales
  - no inventar flujos solo para "llenar" la app
- Esto fue mejor que forzar `pricelists` sin un list-all limpio.

## Caso: PatientServices.APP — Setup inicial y optimización de bundle

Fecha: 2026-03-22

### 11. Vite + React + OIDC: decisiones de setup que ahorran rework

- Crear la app con `npm create vite@latest PatientServices.APP -- --template react-ts`.
- Fijar puerto con `port: 3000` y `strictPort: true` en `vite.config.ts` desde el inicio — evita que el IdP rechace callbacks por puerto distinto.
- Usar `react-oidc-context` sobre `oidc-client-ts` directamente: encapsula el provider y expone `useAuth()` en cualquier componente sin boilerplate.
- Hardcodear defaults en código (`clientId`, `discoveryUrl`, `redirectUri`) y sobreescribir con `.env` — el proyecto corre sin configuración extra en dev.

### 12. OIDC con metadata explícita como blindaje ante IdP inestables

- Si el discovery endpoint puede devolver valores rotos (como `issuer: "null"`), pasar `metadata` explícita en el config de `AuthProvider`.
- Esto desacopla el frontend del estado del IdP en dev: la SPA sabe cómo autenticar aunque el discovery falle.
- Los endpoints críticos a blindar: `authorization_endpoint`, `token_endpoint`, `end_session_endpoint`.

### 13. Bundle size: lazy loading en el router como primera medida

- Un bundle único con `oidc-client-ts` supera los 500 KB y dispara el warning de Vite.
- Solución: convertir todos los imports de páginas en `React.lazy()` + `Suspense` en el router.
- Resultado obtenido: chunk principal bajó de **519 KB → 298 KB**. WorkspacePage (que carga los módulos generados del gateway) quedó como chunk separado de 208 KB que solo carga al navegar a `/workspace`.
- No es urgente en early stage pero conviene aplicarlo antes de que el número de páginas crezca.

### 14. Gateway client generado desde Swagger: separar transporte de consumo

- Generar módulos tipados desde el Swagger del backend con `openapi-typescript`.
- El `HttpClient` maneja baseUrl, bearer token, headers y serialización — las páginas y hooks solo llaman métodos tipados.
- Esto permite que cuando el backend agregue métodos, el front solo regenere tipos sin tocar lógica de auth ni transporte.
- Patrón: `useApiClient()` → `useGatewayApi()` → hooks de dominio (`useSpecialties`, etc.) → páginas.

## Regla operativa derivada

Antes de pasar de CX a CC:

1. `build` limpio
2. rama publicada
3. commit exacto informado
4. fuente de verdad definida
5. contrato base ya consolidado
6. handoff con restricciones explicitas

Si alguno de esos 6 puntos falta, el handoff no esta listo.
