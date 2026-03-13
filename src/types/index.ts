export type GenType = 'txt2img' | 'img2img' | 'multi_img2img' | 'txt2vid' | 'img2vid' | 'vid2vid'

export type FieldType = 'textarea' | 'text' | 'number' | 'range' | 'pill_select' | 'select' | 'multi_select' | 'style_picker' | 'image_upload' | 'note'

export interface FieldOption {
  value: string
  label: string
  preview?: string | null
}

export interface TemplateField {
  id: string
  label: string
  type: FieldType
  required?: boolean
  ai_assist?: boolean
  placeholder?: string
  hint?: string
  tooltip?: string
  options?: FieldOption[]
}

export interface Model {
  id: string
  slug: string
  name: string
  provider: string
  description: string
  logo_url: string | null
  supported_gen_types: GenType[]
  min_tier: string
  is_active: boolean
  coming_soon: boolean
  sort_order: number
}

export interface Template {
  id: string
  model_id: string
  gen_type: GenType
  name: string
  description: string
  fields: TemplateField[]
}

export interface UserProject {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  project_id: string | null
  prompt_id: string | null
  model_id: string | null
  gen_type: string | null
  url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export const GEN_TYPE_LABELS: Record<GenType, string> = {
  txt2img: 'Text → Image',
  img2img: 'Image → Image',
  multi_img2img: 'Multi Image → Image',
  txt2vid: 'Text → Video',
  img2vid: 'Image → Video',
  vid2vid: 'Video → Video',
}

export const TIER_ORDER = ['newbie', 'creator', 'studio', 'pro']

export function tierCanAccess(userTier: string, modelTier: string) {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(modelTier)
}
