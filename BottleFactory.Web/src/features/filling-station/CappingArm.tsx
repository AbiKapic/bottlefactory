type CappingArmProps = {
  x: number
  y: number
  progress: number | null
  capInGripper: boolean
}

export function CappingArm({ x, y, progress, capInGripper }: CappingArmProps) {
  return (
    <g opacity={progress === null ? 0.45 : 1}>
      <g className="station-motion" style={{ transform: `translateX(${x}px)` }}>
        <rect x="-24" y="43" width="48" height="24" rx="6" fill="#a27933" stroke="#f6c871" />
        <path d={`M0 67V${y}`} stroke="#8e9db1" strokeWidth="9" />
        <g className="station-motion" style={{ transform: `translateY(${y}px)` }}>
          <path d="M-15 7v-8h30v8M-15 7h6m18 0h6" fill="none" stroke="#ffc96a" strokeWidth="4" />
          {capInGripper && <rect x="-9" y="4" width="18" height="5" rx="2" fill="#fbba54" />}
        </g>
      </g>
    </g>
  )
}
