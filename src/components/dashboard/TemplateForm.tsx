import { useEffect, useMemo, useState } from 'react'
import type { Template, TemplateField, GenType, FieldOption } from '../../types'
import { tierCanAccess } from '../../types'
import { supabase } from '../../lib/supabase'
import { useLearningMode } from '../../contexts/LearningModeContext'

// ─── Tooltip content — universal fields ─────────────────────────────────────
const FIELD_TOOLTIPS: Record<string, string> = {
  prompt:              'The main description of what you want to generate. Be specific — include subject, setting, and mood. The more detail, the better the result.',
  style:               'The broad visual category for the output. Each style activates a different internal rendering mode in the model.',
  lighting:            'The dominant light source and quality in the scene. Golden hour adds warmth and drama. Volumetric adds god rays. Studio is clean and commercial.',
  lens:                'The focal length changes perspective and depth of field. 85mm is flattering for portraits. 14mm is dramatic for landscapes. Anamorphic gives a cinematic movie look.',
  depth_of_field:      'How much of the scene is in sharp focus. Shallow = blurry background, subject pops. Deep = everything sharp — good for landscapes and architecture.',
  composition:         'How the subject is framed in the image. Rule of thirds feels natural. Dutch angle creates tension. Aerial gives a god\'s-eye view.',
  mood:                'Emotional tone injected into the prompt. Select multiple to layer feelings. These become descriptive phrases like "epic, grand scale, awe-inspiring."',
  color_palette:       'Dominant color temperature and saturation. These are injected as descriptive phrases — "warm color palette, amber and orange tones."',
  time_of_day:         'Time of day affects light quality dramatically. Golden hour and blue hour are the most cinematic. Midday is harsh and high-contrast.',
  weather:             'Environmental atmosphere. Fog adds mystery, storm clouds add drama, rain creates wet reflective surfaces.',
  camera_medium:       'The physical recording medium to emulate. 35mm film adds grain and warmth. VHS gives a retro lo-fi look. Digital is clean and modern.',
  quality:             'Technical quality descriptors appended to the prompt. "Highly detailed" pushes the model to render fine textures and crisp edges.',
  additional_details:  'Anything extra you want added to the final prompt — appended verbatim after all other fields.',
  aspect_ratio:        'The shape of the output. Square for social media. 16:9 for presentations and thumbnails. 9:16 for mobile Stories. 21:9 for cinematic ultra-wide.',
  resolution:          'Output image resolution. Higher = more detail but slower. Start at 1K, go to 4K if you need to print large or crop heavily.',
  num_images:          'How many variations to generate in one shot. More options to pick from, but costs more credits per generation.',
  output_format:       'JPEG is smaller and loads faster. PNG is lossless — best for logos, design work, or anything with fine edges. WebP is a good middle ground.',
  seed:                'A number that locks in the randomness. Same seed + same prompt = same result every time. Great for iterating on a composition you like.',
  guidance_scale:      'How strictly the model follows your prompt. Low (1–3) = loose and creative. High (7+) = literal and precise. 3.5 is a solid default.',
  steps:               'How many refinement passes the model makes. More steps = more detail and coherence, but slower. 28 is the sweet spot for most use cases.',
  thinking_level:      'Enables Gemini\'s internal reasoning before generating. "High" is significantly better at complex scenes, text in images, and spatial relationships.',
  enable_web_search:   'Lets the model search the web before generating. Useful for current brands, logos, real places, or anything needing up-to-date visual reference.',
  safety_tolerance:    'How strict the content filter is. 1 = very restrictive. 6 = most permissive. Default (4) works for most creative work.',
  duration:            'How long the generated video will be. Longer clips cost more credits and take longer to render.',
  model:               'Pin to a specific model checkpoint. "Latest" always gives you the newest version. Pinning is useful if you need consistent results over time.',
  camera_movement:     'The physical camera motion during the shot. Zoom in creates tension. Orbit creates a cinematic 3D feel. Static keeps the frame locked off.',
  camera_motion:       'The physical camera motion during the shot. Zoom in creates tension. Orbit creates a cinematic 3D feel. Static keeps the frame locked off.',
  negative_prompt:     'Describe what you do NOT want in the output. Common values: blurry, low quality, watermark, extra limbs, distorted face.',
  source_image:        'The input image this model will use as a reference, starting point, or first frame. The closer your source is to what you want, the better.',
  strength:            'How much the model transforms the source image. 0.1 = barely changes it. 1.0 = completely reimagines it using your prompt.',
}

interface CustomOption {
  id: string
  field_id: string
  label: string
  prompt_text: string
}

interface Props {
  template: Template
  genType: GenType
  onSubmit: (values: Record<string, unknown>) => void
  submitting: boolean
  initialValues?: Record<string, unknown>
  userTier?: string
  modelMinTier?: string
  // First-run tour callbacks
  onTourSubjectTyped?: () => void
  onTourAiAssistClicked?: () => void
  onTourAiSuggestionReceived?: () => void
  onTourAiSuggestionAccepted?: () => void
}

const CUSTOM_SUPPORTED = ['select', 'multi_select', 'style_picker']
const CUSTOM_EXCLUDED_FIELDS = ['size', 'quality']

// Fields that are passed as separate API params — not injected into the prompt string
const API_PARAM_FIELDS = new Set([
  'aspect_ratio', 'resolution', 'num_images', 'output_format', 'seed',
  'steps', 'guidance_scale', 'thinking_level', 'enable_web_search',
  'safety_tolerance', 'duration', 'model', 'source_image',
])

// Maps mirroring the edge function's buildPrompt logic
const STYLE_MAP: Record<string, string> = {
  photorealistic: 'photorealistic photography, hyperrealistic',
  cinematic: 'cinematic film still, anamorphic lens, movie lighting',
  digital_art: 'digital art, concept art, highly detailed illustration',
  oil_painting: 'oil painting, brush strokes, textured canvas',
  watercolor: 'watercolor painting, soft washes, paper texture',
  pencil_sketch: 'pencil sketch, graphite drawing, fine linework',
  '3d_render': '3D render, CGI, octane render, ray tracing',
  anime: 'anime style, cel shaded, vibrant colors',
}
const LIGHTING_MAP: Record<string, string> = {
  golden_hour: 'golden hour lighting, warm sunlight, long shadows',
  blue_hour: 'blue hour, deep blue twilight, cool tones',
  studio: 'studio lighting, three-point lighting, clean and sharp',
  neon: 'neon lighting, cyberpunk glow, colorful reflections',
  dramatic: 'dramatic chiaroscuro lighting, high contrast shadows',
  soft: 'soft diffused lighting, even illumination, no harsh shadows',
  backlit: 'backlit, rim light, silhouette, glowing edges',
  volumetric: 'volumetric light, god rays, atmospheric haze',
  overcast: 'overcast sky, flat even lighting, muted shadows',
  night: 'nighttime, dark atmosphere, artificial light sources',
}
const MOOD_MAP: Record<string, string> = {
  epic: 'epic, grand scale, awe-inspiring',
  serene: 'serene, peaceful, tranquil',
  mysterious: 'mysterious, enigmatic, atmospheric',
  melancholic: 'melancholic, somber, contemplative',
  tense: 'tense, ominous, foreboding',
  whimsical: 'whimsical, playful, fantastical',
  dark: 'dark, moody, brooding',
  vibrant: 'vibrant, energetic, lively',
}
const LENS_MAP: Record<string, string> = {
  '85mm': '85mm portrait lens, shallow depth of field, subject separation',
  '50mm': '50mm standard lens, natural perspective',
  '24mm': '24mm wide angle lens, environmental context',
  '14mm': '14mm ultra-wide lens, dramatic perspective distortion',
  macro: 'macro lens, extreme close-up, fine detail',
  fisheye: 'fisheye lens, 180° field of view, curved distortion',
  anamorphic: 'anamorphic lens, cinematic widescreen, oval bokeh, lens flares',
  telephoto: '200mm telephoto lens, compressed perspective, distant subject',
  tilt_shift: 'tilt-shift lens, selective focus, miniature effect',
}
const DOF_MAP: Record<string, string> = {
  shallow: 'shallow depth of field, soft creamy bokeh background',
  medium: 'medium depth of field, subject sharp, background softly blurred',
  deep: 'deep depth of field, everything in sharp focus',
  tilt_shift: 'tilt-shift focus, selective plane of focus',
}
const COMPOSITION_MAP: Record<string, string> = {
  close_up: 'close-up shot, face or subject fills frame',
  medium_shot: 'medium shot, waist up',
  wide_shot: 'wide establishing shot, full environment visible',
  aerial: "aerial bird's eye view, looking straight down",
  macro: 'extreme macro close-up, microscopic detail',
  worms_eye: "worm's eye view, looking sharply upward",
  rule_of_thirds: 'rule of thirds composition, subject off-center',
  symmetrical: 'perfectly symmetrical composition, centered',
  dutch_angle: 'dutch angle, tilted camera, tension and unease',
  over_shoulder: 'over-the-shoulder shot',
  pov: 'first-person POV shot',
}
const TIME_MAP: Record<string, string> = {
  dawn: 'just before sunrise, soft pink and purple sky',
  morning: 'early morning, fresh light, long soft shadows',
  midday: 'harsh midday sun, high contrast, bleached highlights',
  afternoon: 'warm afternoon light, golden cast',
  dusk: 'dusk, orange and purple sky, fading light',
  blue_hour: 'blue hour, deep twilight, electric blue atmosphere',
  night: 'night, dark sky, artificial light sources',
  golden_hour: 'golden hour, warm glowing sun just above horizon',
}
const WEATHER_MAP: Record<string, string> = {
  clear: 'clear blue sky, bright crisp light',
  overcast: 'overcast sky, flat even diffused light',
  foggy: 'heavy fog, mysterious haze, reduced visibility',
  rainy: 'rain, wet reflective surfaces, dramatic atmosphere',
  stormy: 'storm clouds, lightning, dramatic dark sky',
  snowy: 'snowfall, cold white atmosphere, muted tones',
  dusty: 'dusty hazy atmosphere, desert heat shimmer',
  partly_cloudy: 'partly cloudy, dramatic cloud shadows',
}
const MEDIUM_MAP: Record<string, string> = {
  digital: 'digital photography, clean sharp image',
  '35mm_film': '35mm film, natural grain, warm color rendition',
  medium_format: 'medium format photography, rich tonal range, ultra detailed',
  polaroid: 'polaroid instant film, faded colors, soft vignette',
  daguerreotype: 'daguerreotype, antique silver, historical photographic process',
  vhs: 'VHS analog video, scan lines, lo-fi aesthetic',
  super8: 'Super 8 film, vintage grain, warm flickering look',
  infrared: 'infrared photography, glowing foliage, dark skies, ethereal',
}
const COLOR_MAP: Record<string, string> = {
  warm: 'warm color palette, amber and orange tones',
  cool: 'cool color palette, blue and teal tones',
  monochrome: 'monochromatic color scheme',
  vibrant: 'vibrant saturated colors, high chroma',
  muted: 'muted desaturated colors, faded palette',
  pastel: 'soft pastel colors, gentle hues',
  dark: 'dark moody palette, deep shadows',
  neon: 'neon color palette, electric hues',
  earthy: 'earthy natural tones, browns and greens',
  golden: 'golden warm tones, amber and honey',
}
const QUALITY_MAP: Record<string, string> = {
  highly_detailed: 'highly detailed',
  '8k': '8K resolution',
  sharp_focus: 'sharp focus, crisp',
  professional: 'professional photography',
  award_winning: 'award winning',
  intricate: 'intricate details, fine textures',
}

// Recraft style values are sent as API params, not injected into the prompt
const RECRAFT_STYLES = new Set(['realistic_image', 'digital_illustration', 'vector_illustration', 'icon', 'any'])
function isRecraftStyle(val: string) {
  if (!val) return false
  return RECRAFT_STYLES.has(val)
}

function buildLivePrompt(values: Record<string, unknown>): string {
  const parts: string[] = []
  if (values.prompt) parts.push(String(values.prompt).trim())
  if (values.subject) parts.push(String(values.subject).trim())

  const style = values.style as string | undefined
  // Recraft styles are API params, not prompt injections
  if (style && !isRecraftStyle(style)) {
    if (STYLE_MAP[style]) parts.push(STYLE_MAP[style])
    else if (style.trim()) parts.push(style.trim())
  }

  const lighting = values.lighting as string | undefined
  if (lighting && LIGHTING_MAP[lighting]) parts.push(LIGHTING_MAP[lighting])

  const lens = values.lens as string | undefined
  if (lens && LENS_MAP[lens]) parts.push(LENS_MAP[lens])

  const dof = values.depth_of_field as string | undefined
  if (dof && DOF_MAP[dof]) parts.push(DOF_MAP[dof])

  const composition = values.composition as string | undefined
  if (composition && COMPOSITION_MAP[composition]) parts.push(COMPOSITION_MAP[composition])

  const timeOfDay = values.time_of_day as string | undefined
  if (timeOfDay && TIME_MAP[timeOfDay]) parts.push(TIME_MAP[timeOfDay])

  const weather = values.weather as string | undefined
  if (weather && WEATHER_MAP[weather]) parts.push(WEATHER_MAP[weather])

  const medium = values.camera_medium as string | undefined
  if (medium && MEDIUM_MAP[medium]) parts.push(MEDIUM_MAP[medium])

  const mood = values.mood as string[] | undefined
  if (Array.isArray(mood) && mood.length > 0)
    parts.push(mood.map((m) => MOOD_MAP[m] ?? m).join(', '))

  const colorPalette = values.color_palette as string[] | undefined
  if (Array.isArray(colorPalette) && colorPalette.length > 0)
    parts.push(colorPalette.map((c) => COLOR_MAP[c] ?? c).join(', '))

  const quality = values.quality as string[] | undefined
  if (Array.isArray(quality) && quality.length > 0)
    parts.push(quality.map((q) => QUALITY_MAP[q] ?? q).join(', '))

  if (values.additional_details) parts.push(String(values.additional_details).trim())

  return parts.filter(Boolean).join(', ')
}

// ─── Add Custom Option form ─────────────────────────────────────────────────

function AddCustomForm({ fieldId, onSave, onCancel }: {
  fieldId: string
  onSave: (opt: CustomOption) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [promptText, setPromptText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!label.trim() || !promptText.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase
      .from('user_custom_options')
      .insert({ user_id: user.id, field_id: fieldId, label: label.trim(), prompt_text: promptText.trim() })
      .select()
      .single()
    setSaving(false)
    if (!error && data) onSave(data as CustomOption)
  }

  return (
    <div className="mt-3 p-3 rounded-xl space-y-2" style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)' }}>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Name (e.g. Cyberpunk Neon)"
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
        className="w-full border rounded-lg px-3 py-2 text-sm pv-placeholder focus:outline-none focus:border-sky-500/50"
      />
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Describe it for the AI (e.g. cyberpunk neon aesthetic with rain-slicked streets)"
        rows={2}
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
        className="w-full border rounded-lg px-3 py-2 text-sm pv-placeholder focus:outline-none focus:border-sky-500/50 resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs hover:opacity-80 transition-opacity cursor-pointer" style={{ color: 'var(--pv-text2)' }}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !label.trim() || !promptText.trim()}
          className="px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-all cursor-pointer"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ─── Single field renderer ───────────────────────────────────────────────────

function FieldInput({ field, value, onChange, customOptions, onAddOwn }: {
  field: TemplateField
  value: unknown
  onChange: (val: unknown) => void
  customOptions: FieldOption[]
  onAddOwn?: () => void
}) {
  const allOptions = [...(field.options ?? []), ...customOptions]

  if (field.type === 'textarea') {
    return (
      <div>
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
          className="w-full border rounded-xl px-4 py-3 text-sm pv-placeholder focus:outline-none focus:border-sky-500/50 resize-none"
        />
        {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'select') {
    // Auto-convert dimension options with different aspect ratios to visual pill picker
    const opts = field.options ?? []
    const DIM_PATTERN = /^(\d+)x(\d+)$/i
    const KNOWN_DIMS: Record<string, [number, number]> = {
      square_hd: [1024, 1024], square: [512, 512],
      portrait_4_3: [768, 1024], portrait_16_9: [576, 1024],
      landscape_4_3: [1024, 768], landscape_16_9: [1024, 576],
    }
    const parsedDims = opts.map(o => {
      const m = o.value.match(DIM_PATTERN)
      if (m) return [Number(m[1]), Number(m[2])] as [number, number]
      if (KNOWN_DIMS[o.value]) return KNOWN_DIMS[o.value]
      return null
    })
    const allDims = parsedDims.every(d => d !== null) && opts.length > 0
    if (allDims) {
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
      const ratios = parsedDims.map(d => { const g = gcd(d![0], d![1]); return `${d![0]/g}:${d![1]/g}` })
      const differentRatios = new Set(ratios).size > 1
      if (differentRatios) {
        const selected = (value as string) ?? ''
        const gcd2 = (a: number, b: number): number => b === 0 ? a : gcd2(b, a % b)
        return (
          <div>
            <div className="flex gap-2">
              {opts.map((opt, i) => {
                const active = selected === opt.value
                const [w, h] = parsedDims[i]!
                const scale = 30 / Math.max(w, h)
                const pw = Math.round(w * scale)
                const ph = Math.round(h * scale)
                const g = gcd2(w, h)
                const ratioLabel = `${w/g}:${h/g}`
                return (
                  <button key={opt.value} type="button" onClick={() => onChange(active ? '' : opt.value)} className="flex flex-col items-center gap-1.5 cursor-pointer flex-1">
                    <div
                      className={`rounded-[4px] transition-all ${active ? 'border-2' : 'border'}`}
                      style={{ width: pw + 6, height: ph + 6, borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)', background: active ? 'rgba(0,80,255,0.08)' : 'var(--pv-surface2)' }}
                    />
                    <span className="text-[11px] font-medium" style={{ color: active ? 'var(--pv-accent)' : 'var(--pv-text3)' }}>{ratioLabel}</span>
                  </button>
                )
              })}
            </div>
            {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
          </div>
        )
      }
    }

    return (
      <div>
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
          className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/50 cursor-pointer"
        >
          <option value="">Auto</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
          {customOptions.length > 0 && (
            <>
              <option disabled>── My custom ──</option>
              {customOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>★ {opt.label}</option>
              ))}
            </>
          )}
        </select>
        {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'multi_select') {
    const selected = (value as string[]) ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const active = selected.includes(opt.value)
          const isCustom = customOptions.some((c) => c.value === opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                active ? 'bg-[rgba(0,113,227,0.08)] border-[rgba(0,113,227,0.4)] text-[#0071e3]' : ''
              }`}
              style={active ? undefined : { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: isCustom ? 'var(--pv-text)' : 'var(--pv-text2)' }}
            >
              {isCustom && <span className="mr-1" style={{ color: 'var(--pv-accent)' }}>★</span>}{opt.label}
            </button>
          )
        })}
        {onAddOwn && (
          <button
            type="button"
            onClick={onAddOwn}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer hover:opacity-80"
            style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', borderStyle: 'dashed', color: 'var(--pv-text3)' }}
          >
            + Add your own
          </button>
        )}
      </div>
    )
  }

  if (field.type === 'style_picker') {
    const selected = (value as string) ?? ''
    return (
      <div className="grid grid-cols-3 gap-2">
        {allOptions.map((opt) => {
          const active = selected === opt.value
          const isCustom = customOptions.some((c) => c.value === opt.value)
          const chars = [...opt.label]
          const hasEmoji = chars[0] && chars[0].codePointAt(0)! > 255
          const emoji = hasEmoji ? chars[0] : (isCustom ? '★' : null)
          const text = hasEmoji ? opt.label.slice(chars[0].length).trim() : opt.label
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? '' : opt.value)}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all cursor-pointer ${
                active ? 'bg-[rgba(0,113,227,0.08)] border-[rgba(0,113,227,0.4)] text-[#0071e3]' : ''
              }`}
              style={active ? undefined : { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: isCustom ? 'var(--pv-text)' : 'var(--pv-text2)' }}
            >
              {emoji && <span className="text-xl leading-none">{emoji}</span>}
              <span className="text-[11px] font-medium leading-tight">{text}</span>
            </button>
          )
        })}
        {onAddOwn && (
          <button
            type="button"
            onClick={onAddOwn}
            className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border transition-all cursor-pointer hover:opacity-80"
            style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', borderStyle: 'dashed', color: 'var(--pv-text3)' }}
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-[11px] font-medium leading-tight">Add your own</span>
          </button>
        )}
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <div>
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
          className="w-full border rounded-xl px-4 py-3 text-sm pv-placeholder focus:outline-none focus:border-sky-500/50"
        />
        {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div>
        <input
          type="number"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
          className="w-full border rounded-xl px-4 py-3 text-sm pv-placeholder focus:outline-none focus:border-sky-500/50"
        />
        {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'range') {
    const min = field.options?.find(o => o.value === 'min')?.label ? Number(field.options.find(o => o.value === 'min')!.label) : 1
    const max = field.options?.find(o => o.value === 'max')?.label ? Number(field.options.find(o => o.value === 'max')!.label) : 10
    const step = field.options?.find(o => o.value === 'step')?.label ? Number(field.options.find(o => o.value === 'step')!.label) : 0.5
    const numVal = value != null && value !== '' ? Number(value) : (min + max) / 2
    return (
      <div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numVal}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-semibold w-10 text-right" style={{ color: 'var(--pv-accent)' }}>
            {numVal}
          </span>
        </div>
        {field.hint && <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'pill_select') {
    const selected = (value as string) ?? ''
    const ASPECT_SHAPES: Record<string, { w: number; h: number }> = {
      '1:1': { w: 28, h: 28 }, '16:9': { w: 36, h: 20 }, '9:16': { w: 20, h: 36 },
      '4:3': { w: 32, h: 24 }, '3:4': { w: 24, h: 32 }, '3:2': { w: 33, h: 22 },
      '2:3': { w: 22, h: 33 }, '21:9': { w: 40, h: 17 },
    }
    return (
      <div className="flex flex-wrap gap-3">
        {(field.options ?? []).map((opt) => {
          const active = selected === opt.value
          const shape = ASPECT_SHAPES[opt.value] ?? { w: 28, h: 28 }
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? '' : opt.value)}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
            >
              <div
                className={`rounded-[4px] transition-all ${active ? 'border-2' : 'border'}`}
                style={{
                  width: shape.w + 8, height: shape.h + 8,
                  borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)',
                  background: active ? 'rgba(0,80,255,0.08)' : 'var(--pv-surface2)',
                }}
              />
              <span className="text-[11px] font-medium" style={{ color: active ? 'var(--pv-accent)' : 'var(--pv-text3)' }}>
                {opt.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'image_upload') {
    const preview = value as string | undefined
    const MAX_MB = 20
    const MAX_BYTES = MAX_MB * 1024 * 1024
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (!file) return
      setUploadError(null)

      if (file.size > MAX_BYTES) {
        setUploadError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${MAX_MB}MB. Please resize or compress it first.`)
        e.target.value = ''
        return
      }

      setUploading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `uploads/${user?.id ?? 'anon'}/${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('assets').upload(path, file, { contentType: file.type, upsert: false })
        if (error) throw new Error(error.message)
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)
        onChange(publicUrl)
      } catch (err) {
        setUploadError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    }

    return (
      <div>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={handleImageFile}
          />
          {preview ? (
            <div className="relative group">
              <img src={preview} alt="Source" className="rounded-xl w-full max-h-48 object-cover border border-white/10" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <span className="text-sm text-white font-medium">{uploading ? 'Uploading…' : 'Click to change'}</span>
              </div>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${uploading ? 'opacity-60' : 'hover:border-sky-500/50'}`} style={{ borderColor: 'var(--pv-border)' }}>
              {uploading ? (
                <>
                  <div className="w-6 h-6 rounded-full mx-auto mb-2 pv-spin" style={{ border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--pv-text2)' }}>Uploading…</p>
                </>
              ) : (
                <>
                  <svg className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--pv-text3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5}/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21"/></svg>
                  <p className="text-sm font-medium" style={{ color: 'var(--pv-text2)' }}>Click to upload image</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pv-text3)' }}>PNG, JPG, WEBP · Max {MAX_MB}MB</p>
                </>
              )}
            </div>
          )}
        </label>
        {uploadError && (
          <p className="text-xs mt-1.5 font-medium" style={{ color: '#c0392b' }}>{uploadError}</p>
        )}
        {!uploadError && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--pv-text3)' }}>Max {MAX_MB}MB · uploaded directly to storage</p>
        )}
        {field.hint && <p className="text-xs mt-0.5" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>}
      </div>
    )
  }

  return null
}

// ─── Live Prompt Panel ───────────────────────────────────────────────────────

function LivePromptPanel({
  fields,
  values,
  livePrompt,
  isEdited,
  onChange,
  onReset,
}: {
  fields: TemplateField[]
  values: Record<string, unknown>
  livePrompt: string
  isEdited: boolean
  onChange: (v: string) => void
  onReset: () => void
}) {
  // Collect API params that have values set (non-prompt fields)
  const apiParams = fields.filter((f) =>
    API_PARAM_FIELDS.has(f.id) && values[f.id] != null && values[f.id] !== '' &&
    f.type !== 'image_upload'
  )

  // Recraft style is also an API param
  const recraftStyleField = fields.find((f) => f.id === 'style')
  const recraftStyleVal = values['style'] as string | undefined
  const isRecraftStyleParam = recraftStyleVal && isRecraftStyle(recraftStyleVal)
  const recraftStyleLabel = recraftStyleField?.options?.find((o) => o.value === recraftStyleVal)?.label

  const charCount = livePrompt.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--pv-text)' }}>Live Prompt</span>
          {isEdited && (
            <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-full font-medium">
              edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--pv-text3)' }}>{charCount} chars</span>
          {isEdited && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs hover:opacity-80 transition-opacity cursor-pointer"
              style={{ color: 'var(--pv-text2)' }}
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Editable prompt textarea */}
      <textarea
        value={livePrompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Fill in the fields on the left to build your prompt…"
        style={isEdited ? undefined : { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
        className={`flex-1 min-h-[120px] w-full border rounded-xl px-4 py-3 text-sm focus:outline-none resize-none leading-relaxed font-mono transition-colors ${
          isEdited
            ? 'border-amber-300 focus:border-amber-400 bg-amber-50 dark:bg-amber-50/10 text-[#1d1d1f] dark:text-white'
            : 'focus:border-sky-500/50'
        }`}
      />

      <p className="text-xs mt-2 mb-4" style={{ color: 'var(--pv-text3)' }}>
        This is the exact prompt sent to the model. Edit freely — your changes override the auto-build.
      </p>

      {/* API params section */}
      {(apiParams.length > 0 || isRecraftStyleParam) && (
        <div className="rounded-xl p-3" style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--pv-text3)' }}>
            Also sending as parameters
          </p>
          <div className="flex flex-wrap gap-1.5">
            {isRecraftStyleParam && recraftStyleLabel && (
              <span style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }} className="inline-flex items-center gap-1 border rounded-lg px-2.5 py-1 text-xs">
                <span style={{ color: 'var(--pv-text3)' }}>style</span>
                <span style={{ color: 'var(--pv-text3)' }}>·</span>
                <span className="font-medium">{recraftStyleLabel}</span>
              </span>
            )}
            {apiParams.map((f) => {
              const val = values[f.id]
              const label = f.options?.find((o) => o.value === String(val))?.label ?? String(val)
              return (
                <span key={f.id} style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }} className="inline-flex items-center gap-1 border rounded-lg px-2.5 py-1 text-xs">
                  <span style={{ color: 'var(--pv-text3)' }}>{f.label.replace(/ —.*$/, '')}</span>
                  <span style={{ color: 'var(--pv-text3)' }}>·</span>
                  <span className="font-medium">{label}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main form ───────────────────────────────────────────────────────────────

export default function TemplateForm({ template, genType: _genType, onSubmit, submitting, initialValues, userTier, modelMinTier, onTourSubjectTyped, onTourAiAssistClicked, onTourAiSuggestionReceived, onTourAiSuggestionAccepted }: Props) {
  const { mode: learningMode } = useLearningMode()
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {})
  const [customOptions, setCustomOptions] = useState<Record<string, FieldOption[]>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [assisting, setAssisting] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState<{ fieldId: string; suggestion: string } | null>(null)
  const [tooltipOpen, setTooltipOpen] = useState<string | null>(null)
  const [livePromptOverride, setLivePromptOverride] = useState<string | null>(null)

  const autoPrompt = useMemo(() => buildLivePrompt(values), [values])
  const livePrompt = livePromptOverride ?? autoPrompt
  const isEdited = livePromptOverride !== null

  // When auto prompt changes, clear override if user hasn't touched it
  // (We don't auto-clear — user must click Reset to go back to auto)

  async function handleAiAssist(fieldId: string) {
    setAssisting(fieldId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_token: session?.access_token ?? null,
            field_id: fieldId,
            field_label: template.fields.find((f) => f.id === fieldId)?.label ?? fieldId,
            current_value: values[fieldId] ?? '',
            form_values: values,
          }),
        }
      )
      const data = await res.json()
      if (data.suggestion) {
        setAiSuggestion({ fieldId, suggestion: data.suggestion })
        if (fieldId === 'subject') onTourAiSuggestionReceived?.()
      }
    } finally {
      setAssisting(null)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_custom_options')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!data) return
          const grouped: Record<string, FieldOption[]> = {}
          for (const row of data as CustomOption[]) {
            if (!grouped[row.field_id]) grouped[row.field_id] = []
            grouped[row.field_id].push({ label: row.label, value: row.prompt_text })
          }
          setCustomOptions(grouped)
        })
    })
  }, [])

  function set(id: string, val: unknown) {
    setValues((prev) => ({ ...prev, [id]: val }))
    if (id === 'subject' && val && String(val).trim().length > 0) onTourSubjectTyped?.()
  }

  function handleCustomSaved(fieldId: string, opt: CustomOption) {
    setCustomOptions((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] ?? []), { label: opt.label, value: opt.prompt_text }],
    }))
    setAddingTo(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // If user edited the live prompt, override the prompt field
    const submitValues = isEdited
      ? { ...values, prompt: livePrompt }
      : values
    onSubmit(submitValues)
  }

  function renderField(field: TemplateField) {
    const fieldCustomOpts = customOptions[field.id] ?? []
    const showAddButton = CUSTOM_SUPPORTED.includes(field.type) && !CUSTOM_EXCLUDED_FIELDS.includes(field.id)
    const tooltipText = FIELD_TOOLTIPS[field.id] ?? field.tooltip
    const showTooltips = learningMode === 'tooltips'
    const isTooltipOpen = tooltipOpen === field.id

    return (
      <div key={field.id} data-tour={field.id === 'subject' ? 'field-subject' : undefined}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--pv-text2)' }}>
              {field.label}
            </label>
            {/* Tooltip ℹ️ icon — only in tooltips mode */}
            {showTooltips && tooltipText && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setTooltipOpen(field.id)}
                  onMouseLeave={() => setTooltipOpen(null)}
                  style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text2)' }}
                  className="w-4 h-4 rounded-full hover:bg-sky-500/20 hover:text-sky-400 flex items-center justify-center transition-all cursor-default text-[10px] font-bold leading-none"
                  tabIndex={-1}
                >
                  i
                </button>
                {isTooltipOpen && (
                  <div style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }} className="absolute left-0 top-full mt-1.5 w-64 border rounded-xl p-3 shadow-2xl z-50 animate-fade-in pointer-events-none">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--pv-text2)' }}>{tooltipText}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {field.ai_assist && (
              <button
                type="button"
                data-tour={field.id === 'subject' ? 'ai-assist-subject' : undefined}
                onClick={() => { handleAiAssist(field.id); if (field.id === 'subject') onTourAiAssistClicked?.() }}
                disabled={assisting === field.id}
                className="text-xs disabled:opacity-40 flex items-center gap-1 transition-opacity hover:opacity-70 cursor-pointer"
                style={{ color: 'var(--pv-accent)' }}
              >
                {assisting === field.id ? 'Thinking…' : 'AI assist'}
              </button>
            )}
            {showAddButton && field.type === 'select' && (
              <button
                type="button"
                onClick={() => setAddingTo(addingTo === field.id ? null : field.id)}
                className="text-xs transition-opacity hover:opacity-70 flex items-center gap-1 cursor-pointer"
                style={{ color: 'var(--pv-text3)' }}
              >
                + Add option
              </button>
            )}
          </div>
        </div>
        <FieldInput
          field={field}
          value={values[field.id]}
          onChange={(v) => set(field.id, v)}
          customOptions={fieldCustomOpts}
          onAddOwn={showAddButton && (field.type === 'style_picker' || field.type === 'multi_select')
            ? () => setAddingTo(addingTo === field.id ? null : field.id)
            : undefined}
        />
        {aiSuggestion?.fieldId === field.id && (
          <div data-tour={field.id === 'subject' ? 'ai-suggestion-subject' : undefined} className="mt-2 rounded-xl border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-500/8 overflow-hidden">
            <div className="px-3 py-2 border-b border-sky-200 dark:border-sky-500/25 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">AI Suggestion</span>
            </div>
            <p className="px-3 py-2.5 text-sm text-[#1d1d1f] dark:text-white leading-relaxed whitespace-pre-wrap">
              {aiSuggestion.suggestion}
            </p>
            <div className="px-3 py-2 border-t border-sky-200 dark:border-sky-500/25 flex gap-2">
              <button
                type="button"
                onClick={() => { set(field.id, aiSuggestion.suggestion); setAiSuggestion(null); if (field.id === 'subject') onTourAiSuggestionAccepted?.() }}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => setAiSuggestion(null)}
                style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium hover:opacity-80 transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {addingTo === field.id && (
          <AddCustomForm
            fieldId={field.id}
            onSave={(opt) => handleCustomSaved(field.id, opt)}
            onCancel={() => setAddingTo(null)}
          />
        )}
      </div>
    )
  }

  const canGenerate = !userTier || !modelMinTier || tierCanAccess(userTier, modelMinTier)

  return (
    <form onSubmit={handleSubmit}>
      {/* Single column layout */}
      <div data-tour="template-form" className="space-y-5">
        {template.fields.map((field) => renderField(field))}

        {/* Live prompt below fields */}
        <div data-tour="live-prompt">
          <LivePromptPanel
            fields={template.fields}
            values={values}
            livePrompt={livePrompt}
            isEdited={isEdited}
            onChange={(v) => setLivePromptOverride(v)}
            onReset={() => setLivePromptOverride(null)}
          />
        </div>

        {/* Generate button at bottom */}
        <div className="pt-1">
          {canGenerate ? (
            <button
              type="submit"
              data-tour="generate-btn"
              disabled={submitting}
              className="w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all cursor-pointer"
              style={{ background: 'var(--pv-text)', color: 'var(--pv-bg)' }}
            >
              {submitting ? 'Generating…' : 'Generate →'}
            </button>
          ) : (
            <div className="space-y-2">
              <a
                href="/pricing"
                className="block w-full py-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl font-semibold text-sm text-center transition-all"
              >
                Upgrade to {modelMinTier} to generate →
              </a>
              <p className="text-center text-xs" style={{ color: 'var(--pv-text3)' }}>You can still explore and fill out the template</p>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}
