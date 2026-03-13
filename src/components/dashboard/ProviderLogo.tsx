// White line-art provider logos for model icon buttons

interface Props {
  slug: string
  size?: number
}

// Map slug → provider key
const SLUG_PROVIDER: Record<string, string> = {
  'dalle':                   'openai',
  'gpt-image-1':             'openai',
  'sora':                    'openai',
  'sora2':                   'openai',
  'sora2-img2vid':           'openai',
  'flux-schnell':            'bfl',
  'flux-dev':                'bfl',
  'flux-pro':                'bfl',
  'flux-pro-ultra':          'bfl',
  'flux-dev-img2img':        'bfl',
  'flux-kontext-pro':        'bfl',
  'flux-kontext-dev':        'bfl',
  'flux2-pro':               'bfl',
  'recraft-v4-pro':          'recraft',
  'recraft-v3':              'recraft',
  'nano-banana':             'google',
  'nano-banana-edit':        'google',
  'imagen-4.0-generate-001': 'google',
  'veo-2.0-generate-001':    'google',
  'cs-veo3':                 'google',
  'kling':                   'kling',
  'kling-txt2vid':           'kling',
  'kling-img2vid':           'kling',
  'luma':                    'luma',
  'luma-txt2vid':            'luma',
  'luma-img2vid':            'luma',
  'minimax-txt2vid':         'minimax',
  'ideogram-v3':             'ideogram',
  'cs-ideogram':             'ideogram',
  'hidream-fast':            'hidream',
  'hidream-full':            'hidream',
  'seedream-45':             'bytedance',
  'seedance-1-pro':          'bytedance',
  'sd35-medium':             'stability',
  'cs-midjourney':           'midjourney',
  'cs-firefly':              'firefly',
  'cs-runway':               'runway',
  'cs-pika':                 'pika',
}

function OpenAILogo({ size }: { size: number }) {
  // OpenAI bloom — 6-petal rotating asterisk
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3.5C16 3.5 19.5 8.5 19.5 13C19.5 13 24.5 10.5 28.5 12C28.5 12 26 17.5 22 19.5C22 19.5 25.5 24 24 28C24 28 18.5 26.5 16 23C16 23 13.5 26.5 8 28C8 28 6.5 24 10 19.5C10 19.5 6 17.5 3.5 12C3.5 12 7.5 10.5 12.5 13C12.5 13 12.5 8.5 16 3.5Z"
        stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      <circle cx="16" cy="16" r="3" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function BFLLogo({ size }: { size: number }) {
  // FLUX — two overlapping rotated squares
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="9" y="9" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5" transform="rotate(0 9 9)" fill="none" />
      <rect x="13" y="13" width="10" height="10" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
      <rect x="7" y="7" width="14" height="14" rx="2" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" transform="rotate(45 16 16)" />
    </svg>
  )
}

function GoogleLogo({ size }: { size: number }) {
  // Stylised G
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M27 16.3C27 15.6 26.94 14.93 26.83 14.28H16.24V18.08H22.26C21.99 19.47 21.2 20.64 20.01 21.42V23.89H23.62C25.75 21.93 27 19.38 27 16.3Z"
        stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none"
      />
      <path
        d="M16.24 26.27C19.26 26.27 21.8 25.27 23.62 23.89L20.01 21.42C19.01 22.09 17.74 22.49 16.24 22.49C13.33 22.49 10.86 20.52 9.97 17.87H6.24V20.41C8.05 24.01 11.87 26.27 16.24 26.27Z"
        stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none"
      />
      <path
        d="M9.97 17.87C9.74 17.2 9.62 16.48 9.62 15.73C9.62 14.98 9.74 14.26 9.97 13.59V11.05H6.24C5.45 12.62 5 14.37 5 16.23C5 18.09 5.45 19.84 6.24 21.41L9.97 18.87V17.87Z"
        stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none"
      />
      <path
        d="M16.24 8.97C17.88 8.97 19.35 9.55 20.51 10.68L23.71 7.48C21.8 5.69 19.26 4.6 16.24 4.6C11.87 4.6 8.05 6.86 6.24 10.46L9.97 12.99C10.86 10.35 13.33 8.97 16.24 8.97Z"
        stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none"
      />
    </svg>
  )
}

function LumaLogo({ size }: { size: number }) {
  // Luma — circle with 8 radiating lines (lens/star)
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180
    const inner = 6, outer = 11
    const x1 = 16 + Math.cos(angle) * inner
    const y1 = 16 + Math.sin(angle) * inner
    const x2 = 16 + Math.cos(angle) * outer
    const y2 = 16 + Math.sin(angle) * outer
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  })
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="4.5" stroke="white" strokeWidth="1.5" fill="none" />
      {rays}
    </svg>
  )
}

function KlingLogo({ size }: { size: number }) {
  // Kling — stylised K
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="10" y1="7" x2="10" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 16 L23 7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 16 L23 25" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MinimaxLogo({ size }: { size: number }) {
  // MiniMax — M letterform
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M5 24 L5 8 L13 20 L16 16 L19 20 L27 8 L27 24" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function RecraftLogo({ size }: { size: number }) {
  // Recraft — stylised R
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M10 25 L10 7 L19 7 C22.31 7 25 9.69 25 13 C25 16.31 22.31 19 19 19 L10 19" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M17 19 L25 25" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IdeogramLogo({ size }: { size: number }) {
  // Ideogram — I with serifs + small bubble (text-in-image concept)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="16" y1="7" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="7" x2="21" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="22" x2="21" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="22" cy="26" r="3" stroke="white" strokeWidth="1.4" fill="none" />
      <line x1="20" y1="23" x2="18" y2="21" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function HiDreamLogo({ size }: { size: number }) {
  // HiDream — H + small sparkle
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <line x1="9" y1="7" x2="9" y2="24" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="23" y1="7" x2="23" y2="24" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="15.5" x2="23" y2="15.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      {/* sparkle */}
      <path d="M27 7 L27.7 9 L29.7 9.7 L27.7 10.4 L27 12.4 L26.3 10.4 L24.3 9.7 L26.3 9Z" fill="white" opacity="0.8" />
    </svg>
  )
}

function ByteDanceLogo({ size }: { size: number }) {
  // ByteDance — abstract note/spark mark (TikTok parent)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M18 6 C18 6 24 8 24 14 C24 14 27 12 29 13 C29 13 28 18 24 19 C24 19 26 22 25 25 C25 25 21 24 19 21 C19 21 17 24 13 25 C13 25 11 22 13 19 C13 19 9 18 8 13 C8 13 10 12 13 14 C13 14 13 8 18 6Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function StabilityLogo({ size }: { size: number }) {
  // Stability AI — abstract grid of dots
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {[9, 16, 23].map(x =>
        [9, 16, 23].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={x === 16 && y === 16 ? 2.5 : 1.8} fill="white" opacity={x === 16 && y === 16 ? 1 : 0.6} />
        ))
      )}
    </svg>
  )
}

function MidjourneyLogo({ size }: { size: number }) {
  // Midjourney — abstract sailing boat (their icon)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 5 L27 25 L5 25 Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M16 5 L16 25" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function FireflyLogo({ size }: { size: number }) {
  // Adobe Firefly — stylised spark/flame
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 4 C16 4 22 10 20 17 C20 17 25 14 27 16 C27 16 24 22 18 24 C18 24 20 28 16 28 C12 28 14 24 14 24 C8 22 5 16 5 16 C7 14 12 17 12 17 C10 10 16 4 16 4Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function RunwayLogo({ size }: { size: number }) {
  // Runway — play button in a rounded rect (video-first brand)
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="5" y="7" width="22" height="18" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
      <path d="M13 11.5 L22 16 L13 20.5 Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function PikaLogo({ size }: { size: number }) {
  // Pika — lightning bolt
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M19 4 L10 17 L15 17 L13 28 L22 15 L17 15 Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function FallbackLogo({ size, initial }: { size: number; initial: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">
        {initial}
      </text>
    </svg>
  )
}

export default function ProviderLogo({ slug, size = 28 }: Props) {
  const provider = SLUG_PROVIDER[slug] ?? 'unknown'
  switch (provider) {
    case 'openai':    return <OpenAILogo size={size} />
    case 'bfl':       return <BFLLogo size={size} />
    case 'google':    return <GoogleLogo size={size} />
    case 'luma':      return <LumaLogo size={size} />
    case 'kling':     return <KlingLogo size={size} />
    case 'minimax':   return <MinimaxLogo size={size} />
    case 'recraft':   return <RecraftLogo size={size} />
    case 'ideogram':  return <IdeogramLogo size={size} />
    case 'hidream':   return <HiDreamLogo size={size} />
    case 'bytedance': return <ByteDanceLogo size={size} />
    case 'stability': return <StabilityLogo size={size} />
    case 'midjourney':return <MidjourneyLogo size={size} />
    case 'firefly':   return <FireflyLogo size={size} />
    case 'runway':    return <RunwayLogo size={size} />
    case 'pika':      return <PikaLogo size={size} />
    default: {
      const art = slug?.slice(0,2).toUpperCase() ?? '??'
      return <FallbackLogo size={size} initial={art} />
    }
  }
}
