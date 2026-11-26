import { CappingArm } from './CappingArm'
import './FillingStation.css'

type FillingStationProps = {
  bottlePresent: boolean | null
  valveOpen: boolean | null
  conveyorPosition: number | null
  cappingProgress: number | null
  bottleCapped: boolean | null
  fillPercent: number | null
  transferPhase: number | null
  placeProgress: number | null
}

const fillerX = 400
const spacing = 146
const capperX = fillerX - spacing / 2
const boxX = 139
const bottleOutline = 'M-10 0h20v19l12 13v55q0 7-7 7h-30q-7 0-7-7V32l12-13z'

function Bottle({ x, y = 176, level = 0, capped = false }: {
  x: number
  y?: number
  level?: number
  capped?: boolean
}) {
  return (
    <g className="station-motion" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <path d={bottleOutline} fill="#112d43" stroke="#7bc7ef" strokeWidth="2" />
      <g clipPath="url(#bottle-interior)">
        <rect className="water-level" x="-22" y="0" width="44" height="70"
          style={{ transform: `translateY(${94 - level * 0.7}px)` }} fill="url(#water-gradient)" />
        <path d="M-14 34v48" stroke="#c1eaff" opacity=".28" strokeWidth="3" strokeLinecap="round" />
      </g>
      {capped && <rect x="-12" y="-5" width="24" height="8" rx="2" fill="#ffc461" />}
    </g>
  )
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function FillingStation({
  bottlePresent, valveOpen, conveyorPosition, cappingProgress, bottleCapped,
  fillPercent, transferPhase, placeProgress,
}: FillingStationProps) {
  const pitch = (conveyorPosition ?? 0) / 100
  const first = Math.floor(pitch)
  const flowing = bottlePresent === true && valveOpen === true
  const transporting = transferPhase != null && transferPhase > 0
  const placing = transferPhase === 3 && placeProgress !== null
  const placement = (placeProgress ?? 0) / 100
  const capStroke = 1 - Math.abs((cappingProgress ?? 0) / 50 - 1)
  const armX = placing ? capperX + (boxX - capperX) * clamp((placement - 0.27) / 0.43) : capperX
  const lift = clamp((placement - 0.14) / 0.13)
  const lower = clamp((placement - 0.7) / 0.18)
  const loadY = 176 - 50 * lift + 87 * lower
  const armY = placing
    ? (placement < 0.14 ? 116 + 55 * clamp(placement / 0.14) : loadY - 5 - 66 * clamp((placement - 0.88) / 0.12))
    : 116 + 55 * capStroke
  const bottleIds = conveyorPosition === null
    ? bottlePresent === true ? [first] : []
    : Array.from({ length: 7 }, (_, offset) => first + offset)

  return (
    <svg className="machine" viewBox="0 0 1250 400" role="img" aria-label="Water filling, capping and packing line">
      <defs>
        <clipPath id="bottle-interior"><path d={bottleOutline} /></clipPath>
        <clipPath id="conveyor-window"><rect x="250" y="165" width="936" height="110" /></clipPath>
        <linearGradient id="water-gradient" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#55d8fd" /><stop offset="1" stopColor="#1674d2" />
        </linearGradient>
        <pattern id="factory-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="#26394d" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1250" height="400" rx="10" fill="#0c1726" />
      <rect width="1250" height="400" rx="10" fill="url(#factory-grid)" opacity=".55" />
      <path d="M45 327h1160" stroke="#2c4056" strokeWidth="2" />

      <g fill="#273a50" stroke="#60758e" strokeWidth="2">
        <rect x="111" y="45" width="250" height="20" rx="5" />
        <path d="M115 65v215m240-215v215" fill="none" strokeWidth="8" />
        <rect x="352" y="93" width="96" height="45" rx="8" />
        <path d="M390 138h20v18l-6 8h-8l-6-8z" />
        <path d="M414 93V68h47" fill="none" stroke="#508fae" strokeWidth="10" />
        <rect x="458" y="42" width="84" height="54" rx="12" />
        <rect x="278" y="275" width="916" height="30" rx="13" />
        <path d="M313 305v22m817-22v22" strokeWidth="10" />
      </g>
      <path d="M298 290h878" stroke="#6c849d" strokeWidth="14" strokeDasharray="1 24"
        strokeDashoffset={-pitch * spacing} />
      <circle cx="430" cy="113" r="5" fill={flowing ? '#49dda4' : '#64748b'} />
      <path d="M80 246h119l-13 75H93z" fill="#574332" stroke="#ad8255" strokeWidth="2" />

      <g clipPath="url(#conveyor-window)">
        {bottleIds.map(id => {
          if (id === first && (placing || transferPhase === 4)) return null
          return <Bottle key={id} x={fillerX + (id - pitch) * spacing}
            level={id === first ? transporting ? 100 : fillPercent ?? 0 : 0}
            capped={id === first && (bottleCapped === true || (transporting && (cappingProgress ?? 0) >= 50))} />
        })}
      </g>
      {flowing && (
        <g className="fill-stream" aria-hidden="true">
          <path className="fill-stream__jet" d={`M400 164V${266 - (fillPercent ?? 0) * 0.7}`} />
          <path className="fill-stream__highlights" d={`M400 164V${266 - (fillPercent ?? 0) * 0.7}`} />
        </g>
      )}
      {placing && placement < 0.88 && <Bottle x={armX} y={loadY} level={100} capped />}
      <CappingArm x={armX} y={armY} progress={cappingProgress}
        capInGripper={transferPhase === 2 && (cappingProgress ?? 0) < 50} />
      <path d="M80 249h119l-13 72H93z" fill="#896646" stroke="#c69a65" strokeWidth="2" />
      <path d="M112 280h56" stroke="#d3ad7d" strokeWidth="3" />

      <g fill="#b4c4d6" fontSize="13" fontWeight="600" textAnchor="middle">
        <text x={boxX} y="360">COLLECTION</text>
        <text x={capperX} y="360">CAP &amp; PICK</text>
        <text x={fillerX} y="360">{fillPercent === null ? 'WATER FILLER' : `WATER FILL · ${fillPercent}%`}</text>
        <text x="985" y="360">← INFEED</text>
      </g>
    </svg>
  )
}
