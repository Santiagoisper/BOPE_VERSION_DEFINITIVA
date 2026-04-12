const fs = require('fs')
const path = require('path')

const [, , missionId, missionDate] = process.argv

if (!missionId || !missionDate) {
  console.error(
    'Usage: node scripts/close-codex-mission.js <MISSION_ID> <YYYY-MM-DD>'
  )
  process.exit(1)
}

const repoRoot = path.resolve(__dirname, '..')
const codexLogsDir = path.join(repoRoot, 'codex-logs')
const missionsDir = path.join(codexLogsDir, 'missions')

const roster = [
  {
    key: 'SANTIAGO',
    missionName: 'SANTIAGO',
    recordsName: 'SANTIAGO',
    dossierName: 'SANTIAGO ISBERT PERLENDER',
    orderName: 'SANTIAGO ISBERT PERLENDER',
    file: 'SANTIAGO-ISBERT-PERLENDER.md',
    medalText: 'sin condecoraciones',
  },
  {
    key: 'JOHN',
    missionName: 'JOHN RAMBO',
    recordsName: 'JOHN RAMBO',
    dossierName: 'JOHN RAMBO',
    orderName: 'JOHN · RAMBO',
    file: 'JOHN-JAMES-RAMBO.md',
    medalText: 'Navy Cross',
  },
  {
    key: 'PIXEL',
    missionName: 'PIXEL FRONT',
    recordsName: 'PIXEL',
    dossierName: 'PIXEL FRONT',
    orderName: 'PIXEL · FRONT',
    file: 'ADRIA-FERRER-SOLER.md',
    medalText: 'sin condecoraciones',
  },
  {
    key: 'FORGE',
    missionName: 'FORGE',
    recordsName: 'FORGE',
    dossierName: 'FORGE BACK',
    orderName: 'FORGE · BACK',
    file: 'ARBEN-DERVISHI-KOLA.md',
    medalText: 'Bronze Star',
  },
  {
    key: 'HOUSE',
    missionName: 'HOUSE',
    recordsName: 'HOUSE',
    dossierName: 'HOUSE DOCTOR',
    orderName: 'HOUSE · DOCTOR',
    file: 'WILLIAM-ARTHUR-HARGREAVES.md',
    medalText: 'Good Conduct Medal',
  },
  {
    key: 'MARCO',
    missionName: 'MARCO AURELIO',
    recordsName: 'MARCO AURELIO',
    dossierName: 'MARCO AURELIO HERALD',
    orderName: 'MARCO AURELIO · HERALD',
    file: 'MARCO-AURELIO-DE-ALMEIDA.md',
    medalText: 'sin condecoraciones',
  },
  {
    key: 'WINSTON',
    missionName: 'WINSTON',
    recordsName: 'WINSTON',
    dossierName: 'WINSTON SCRIBE',
    orderName: 'WINSTON · SCRIBE',
    file: 'WINSTON-ALASTAIR-MACLEOD.md',
    medalText: 'Commendation Medal',
  },
  {
    key: 'CERBERUS',
    missionName: 'CERBERUS',
    recordsName: 'CERBERUS',
    dossierName: 'CERBERUS GUARDIAN',
    orderName: 'CERBERUS · GUARDIAN',
    file: 'ELIAS-NATHAN-MERCER.md',
    medalText: 'Combat Action Ribbon',
  },
  {
    key: 'NEXUS',
    missionName: 'NEXUS',
    recordsName: 'NEXUS',
    dossierName: 'NEXUS WIRE',
    orderName: 'NEXUS · WIRE',
    file: 'DARIUS-WEI-TAN.md',
    medalText: 'Meritorious Service',
  },
  {
    key: 'BLADE',
    missionName: 'BLADE',
    recordsName: 'BLADE',
    dossierName: 'BLADE KILLER',
    orderName: 'BLADE · KILLER',
    file: 'NIKOLA-VUKOVIC.md',
    medalText: 'sin condecoraciones',
  },
  {
    key: 'SICARIO',
    missionName: 'SICARIO LOCO',
    recordsName: 'SICARIO | LOCO',
    dossierName: 'SICARIO LOCO',
    orderName: 'SICARIO · LOCO',
    file: 'MATEO-ESTEBAN-SALAZAR.md',
    medalText: 'Purple Heart',
  },
]

const rosterByMissionName = new Map(
  roster.map((entry) => [entry.missionName, entry])
)

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content)
}

function parseMission(content, fileName) {
  const id = fileName.replace(/\.md$/, '')
  const titleMatch = content.match(/## Titulo\s+([\s\S]*?)\n## /)
  const resultMatch = content.match(/## Resultado\s+([\s\S]*?)\n## /)
  const deployedMatch =
    content.match(/## Efectivos desplegados\s+([\s\S]*?)(?:\n## |\s*$)/) ||
    content.match(/## Actores asignados\s+([\s\S]*?)(?:\n## |\s*$)/)
  const title = titleMatch ? titleMatch[1].trim().replace(/\r/g, '') : id
  const result = resultMatch
    ? resultMatch[1].trim().replace(/\r/g, ' ').replace(/\s+/g, ' ')
    : ''
  const deployed = deployedMatch
    ? deployedMatch[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^- /, '').replace(/`/g, '').trim())
    : []

  return { id, title, result, deployed }
}

function missionOrder(id) {
  const match = id.match(/(\d+)$/)
  return match ? Number(match[1]) : -1
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const missionFiles = fs
  .readdirSync(missionsDir)
  .filter((file) => /^BOPE-CODEX-\d{4}-\d{3}\.md$/.test(file))
  .sort((a, b) => missionOrder(a) - missionOrder(b))

const missions = missionFiles.map((file) =>
  parseMission(read(path.join(missionsDir, file)), file)
)

const latestMission = missions[missions.length - 1]

if (!latestMission || latestMission.id !== missionId) {
  console.error(`Latest mission file does not match ${missionId}`)
  process.exit(1)
}

const existingRecords = read(path.join(codexLogsDir, 'RECORDS.md'))
const summaryRows = existingRecords
  .split('\n')
  .filter((line) => /^\| `.+` \|/.test(line))

const summaryMap = new Map()
for (const line of summaryRows) {
  const parts = line
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 7) continue
  const name = parts[0].replace(/`/g, '')
  summaryMap.set(name, {
    name,
    missions: parts[1],
    lastMission: parts[2].replace(/`/g, ''),
    date: parts[3].replace(/`/g, ''),
    lines: parts[4],
    medals: parts[5].replace(/`/g, ''),
    sanctions: parts[6].replace(/`/g, ''),
  })
}

const updatedSummary = roster.map((entry) => {
  const previous = summaryMap.get(entry.recordsName)
  const isDeployedInCurrentMission = latestMission.deployed.some(
    (deployedName) => rosterByMissionName.get(deployedName)?.key === entry.key
  )
  const alreadyClosedOnCurrentMission = previous?.lastMission === missionId
  const missionCount = previous
    ? Number(previous.missions) +
      (isDeployedInCurrentMission && !alreadyClosedOnCurrentMission ? 1 : 0)
    : isDeployedInCurrentMission
    ? 1
    : 0
  const lastMissionId = isDeployedInCurrentMission
    ? missionId
    : previous
    ? previous.lastMission
    : '-'
  const date = isDeployedInCurrentMission
    ? missionDate
    : previous
    ? previous.date
    : '-'

  return {
    ...entry,
    missions: missionCount,
    lastMission: lastMissionId,
    date,
    lines: previous ? previous.lines : '0',
    medals: previous ? previous.medals : entry.medalText,
    sanctions: previous ? previous.sanctions : 'ninguna',
  }
})

const updatedMisiones = [
  '# MISIONES - CODEX',
  '',
  'Indice de misiones BOPE ejecutadas bajo Codex.',
  '',
  ...missions.map(
    (mission) =>
      `- ${mission.id} | ${mission.title} | cerrada | ${mission.result}`
  ),
  '',
].join('\n')
write(path.join(codexLogsDir, 'MISIONES.md'), updatedMisiones)

const misionActivaPath = path.join(codexLogsDir, 'MISION-ACTIVA.md')
let misionActiva = read(misionActivaPath)
misionActiva = misionActiva.replace(
  /- Mision: `[^`]+`/,
  `- Mision: \`${latestMission.id}\``
)
misionActiva = misionActiva.replace(
  /- Fecha: `[^`]+`/,
  `- Fecha: \`${missionDate}\``
)
misionActiva = misionActiva.replace(
  /- Resumen: `[^`]+`/,
  `- Resumen: \`${latestMission.result}\``
)
write(misionActivaPath, misionActiva)

const recordsHeader = [
  '# RECORDS BOPE - CODEX',
  '',
  'Fuente canonica de records y huella historica del batallon en la capa `Codex`.',
  '',
  '## Regla',
  '',
  '- `WINSTON` actualiza este archivo al cierre de cada mision con apoyo de `git diff --stat`',
  '- `misiones` refleja operaciones asentadas en esta capa',
  '- `lineas aprox.` es una cifra doctrinal orientativa para memoria operativa, no contabilidad exacta',
  '- toda medalla o sancion asentada aqui debe coincidir con `ORDEN-DE-BATALLA` y el legajo del soldado',
  '',
  '## Tabla maestra',
  '',
  '| Soldado | Misiones | Ultima mision | Fecha | Lineas aprox. | Medallas | Sanciones |',
  '|---|---:|---|---|---:|---|---|',
]

const recordsTable = updatedSummary.map(
  (row) =>
    `| \`${row.recordsName}\` | ${row.missions} | \`${row.lastMission}\` | \`${row.date}\` | ${row.lines} | \`${row.medals}\` | \`${row.sanctions}\` |`
)

const detailStart = existingRecords.indexOf('## Detalle por soldado')
const existingDetails = detailStart >= 0 ? existingRecords.slice(detailStart) : ''
write(
  path.join(codexLogsDir, 'RECORDS.md'),
  [...recordsHeader, ...recordsTable, '', existingDetails.trimStart(), ''].join(
    '\n'
  )
)

const countsByRecordsName = new Map(
  updatedSummary.map((row) => [row.recordsName, row.missions])
)

const cuadroPath = path.join(codexLogsDir, 'CUADRO-DE-HONOR.md')
let cuadro = read(cuadroPath)
cuadro = cuadro.replace(
  /\| `JOHN RAMBO` \| \d+ \|/,
  `| \`JOHN RAMBO\` | ${countsByRecordsName.get('JOHN RAMBO')} |`
)
cuadro = cuadro.replace(
  /\| `WINSTON` \| \d+ \|/,
  `| \`WINSTON\` | ${countsByRecordsName.get('WINSTON')} |`
)
cuadro = cuadro.replace(
  /Ganador: JOHN RAMBO\n   Operaciones: \d+/,
  `Ganador: JOHN RAMBO\n   Operaciones: ${countsByRecordsName.get('JOHN RAMBO')}`
)
cuadro = cuadro.replace(
  /Ganador: WINSTON\n   Operaciones: \d+/,
  `Ganador: WINSTON\n   Operaciones: ${countsByRecordsName.get('WINSTON')}`
)
write(cuadroPath, cuadro)

const dossierPath = path.join(codexLogsDir, 'DOSSIER-GENERAL-BOPE.md')
let dossier = read(dossierPath)
for (const row of updatedSummary) {
  const fileName = row.file
  const matcher = new RegExp(
    '\\| `' +
      escapeRegExp(row.dossierName) +
      '` \\|([^\\n]*?)\\| `\\d+` \\| `' +
      escapeRegExp(row.medals) +
      '` \\| \\[[^\\]]+\\]\\(personnel\\/[A-Z\\-]+\\.md\\) \\|'
  )
  dossier = dossier.replace(
    matcher,
    `| \`${row.dossierName}\` |$1| \`${row.missions}\` | \`${row.medals}\` | [${fileName}](personnel/${fileName}) |`
  )
}
write(dossierPath, dossier)

const fichasPath = path.join(codexLogsDir, 'FICHAS-OPERATIVAS-BOPE.md')
let fichas = read(fichasPath)
fichas = fichas.replace(
  /Misión:\s+BOPE-CODEX-\d{4}-\d{3}/,
  `Misión:  ${latestMission.id}`
)
fichas = fichas.replace(/Fecha:\s+\d{4}-\d{2}-\d{2}/, `Fecha:   ${missionDate}`)
fichas = fichas.replace(
  /Resumen: .+/,
  `Resumen: ${latestMission.result}`
)
write(fichasPath, fichas)

const ranking = updatedSummary
  .filter((row) => row.recordsName !== 'SANTIAGO')
  .sort((a, b) => b.missions - a.missions || a.recordsName.localeCompare(b.recordsName))

const positionByKey = new Map()
ranking.forEach((row, index) => {
  positionByKey.set(row.key, index + 1)
})

for (const row of updatedSummary) {
  const personnelPath = path.join(codexLogsDir, 'personnel', row.file)
  if (!fs.existsSync(personnelPath)) continue
  let personnel = read(personnelPath)
  personnel = personnel.replace(
    /- Operaciones acumuladas en capa Codex: `\d+`/,
    `- Operaciones acumuladas en capa Codex: \`${row.missions}\``
  )
  if (row.key !== 'SANTIAGO') {
    personnel = personnel.replace(
      /- Posicion actual en `RECORDS\.md`: `#[^`]+`/,
      `- Posicion actual en \`RECORDS.md\`: \`#${positionByKey.get(row.key)}\``
    )
  }
  write(personnelPath, personnel)
}

const detailWarnings = []
for (const deployedName of latestMission.deployed) {
  const soldier = rosterByMissionName.get(deployedName)
  if (!soldier) continue
  const heading = `### ${soldier.recordsName}`
  const start = existingRecords.indexOf(heading)
  const next = existingRecords.indexOf('\n### ', start + heading.length)
  const section =
    start >= 0
      ? existingRecords.slice(start, next >= 0 ? next : existingRecords.length)
      : ''
  if (!section.includes(latestMission.id)) {
    detailWarnings.push(
      `RECORDS detail missing ${latestMission.id} for ${soldier.recordsName}`
    )
  }
}

if (detailWarnings.length > 0) {
  console.warn(detailWarnings.join('\n'))
}

console.log(`Codex mission closure synchronized for ${latestMission.id}`)
