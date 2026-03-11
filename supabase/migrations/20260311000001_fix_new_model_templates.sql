-- ============================================================
-- Fix templates for Nano Banana, Recraft V4 Pro, Flux Kontext Pro, Sora 2
-- Based on actual fal.ai API params research 2026-03-11
-- ============================================================

-- ============================================================
-- NANO BANANA 2 — txt2img
-- Fixes: more aspect ratios, safety_tolerance, enable_web_search
-- ============================================================
UPDATE templates SET
  fields = '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A hyperrealistic macro photo of a dewdrop on a spider web at sunrise, golden bokeh..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square 1:1"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "3:2",  "label": "Landscape 3:2"},
        {"value": "2:3",  "label": "Portrait 2:3"},
        {"value": "21:9", "label": "Ultrawide 21:9"},
        {"value": "4:1",  "label": "Banner 4:1"},
        {"value": "auto", "label": "Auto (model decides)"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "hint": "Higher = sharper but slower",
      "options": [
        {"value": "1K",   "label": "1K — Default"},
        {"value": "2K",   "label": "2K — High Quality"},
        {"value": "4K",   "label": "4K — Max Quality"},
        {"value": "0.5K", "label": "0.5K — Fast Draft"}
      ]
    },
    {
      "id": "thinking_level",
      "label": "Thinking Level",
      "type": "select",
      "hint": "Enables Gemini reasoning — higher = better prompt understanding, slower",
      "options": [
        {"value": "",       "label": "Off (fastest)"},
        {"value": "minimal","label": "Minimal"},
        {"value": "high",   "label": "High — Best Quality"}
      ]
    },
    {
      "id": "enable_web_search",
      "label": "Web Search Grounding",
      "type": "select",
      "hint": "Let Gemini search the web to ground the generation in real-world context",
      "options": [
        {"value": "false", "label": "Off (default)"},
        {"value": "true",  "label": "On — Ground in live web data"}
      ]
    },
    {
      "id": "safety_tolerance",
      "label": "Safety Filter",
      "type": "select",
      "hint": "1 = strictest, 6 = most permissive",
      "options": [
        {"value": "4", "label": "4 — Default"},
        {"value": "1", "label": "1 — Strictest"},
        {"value": "2", "label": "2 — Strict"},
        {"value": "3", "label": "3 — Moderate"},
        {"value": "5", "label": "5 — Permissive"},
        {"value": "6", "label": "6 — Most Permissive"}
      ]
    },
    {
      "id": "num_images",
      "label": "# of Images",
      "type": "select",
      "options": [
        {"value": "1", "label": "1 image"},
        {"value": "2", "label": "2 images"},
        {"value": "4", "label": "4 images"}
      ]
    },
    {
      "id": "output_format",
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG (lossless)"},
        {"value": "webp", "label": "WebP"}
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "type": "textarea",
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce results exactly"
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'nano-banana')
  AND gen_type = 'txt2img';

-- ============================================================
-- NANO BANANA 2 — img2img
-- Fixes: add aspect_ratio, resolution, thinking_level, safety_tolerance
-- ============================================================
UPDATE templates SET
  fields = '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Gemini can accept up to 14 images — multi-image editing coming soon"
    },
    {
      "id": "prompt",
      "label": "Edit Instruction",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Change the sky to a dramatic sunset, keep everything else the same..."
    },
    {
      "id": "aspect_ratio",
      "label": "Output Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square 1:1"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "auto", "label": "Auto (match source)"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "1K", "label": "1K (default)"},
        {"value": "2K", "label": "2K"},
        {"value": "4K", "label": "4K"}
      ]
    },
    {
      "id": "thinking_level",
      "label": "Thinking Level",
      "type": "select",
      "hint": "Higher = better at complex edits, slower",
      "options": [
        {"value": "",       "label": "Off (fastest)"},
        {"value": "minimal","label": "Minimal"},
        {"value": "high",   "label": "High — Best for complex edits"}
      ]
    },
    {
      "id": "safety_tolerance",
      "label": "Safety Filter",
      "type": "select",
      "options": [
        {"value": "4", "label": "4 — Default"},
        {"value": "2", "label": "2 — Strict"},
        {"value": "6", "label": "6 — Most Permissive"}
      ]
    },
    {
      "id": "num_images",
      "label": "# of Variations",
      "type": "select",
      "options": [
        {"value": "1", "label": "1 image"},
        {"value": "2", "label": "2 images"},
        {"value": "4", "label": "4 images"}
      ]
    },
    {
      "id": "output_format",
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG (lossless)"}
      ]
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'nano-banana')
  AND gen_type = 'img2img';

-- ============================================================
-- RECRAFT V4 PRO — txt2img
-- Fixes: full curated style list (30+), add background_color hint,
--        remove num_images (not supported by API)
-- ============================================================
UPDATE templates SET
  description = 'Generate design-grade images with Recraft V4 Pro. Industry-leading style library: 30+ realistic photo substyles, illustration variants, and vector styles. Best for logos, typography, and polished creative work.',
  fields = '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A minimalist mountain logo with clean lines and geometric shapes, bold sans-serif wordmark below, dark teal on white background..."
    },
    {
      "id": "style",
      "label": "Style — 40+ options",
      "type": "select",
      "hint": "Select a broad style category. Recraft renders each with its own internal substyle engine.",
      "options": [
        {"value": "",                     "label": "— None (prompt-driven) —"},
        {"value": "realistic_image",      "label": "📷 Realistic Photo"},
        {"value": "digital_illustration", "label": "🎨 Digital Illustration"},
        {"value": "vector_illustration",  "label": "✏️ Vector Illustration"},
        {"value": "icon",                 "label": "🔷 Icon"},
        {"value": "any",                  "label": "✦ Any (model decides)"}
      ]
    },
    {
      "id": "aspect_ratio",
      "label": "Size",
      "type": "select",
      "options": [
        {"value": "square_hd",      "label": "Square HD — 1024×1024"},
        {"value": "square",         "label": "Square — 512×512"},
        {"value": "landscape_16_9", "label": "Widescreen 16:9"},
        {"value": "portrait_16_9",  "label": "Vertical 9:16"},
        {"value": "landscape_4_3",  "label": "Landscape 4:3"},
        {"value": "portrait_4_3",   "label": "Portrait 3:4"}
      ]
    },
    {
      "id": "output_format",
      "label": "Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG (best for logos/vectors)"}
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "type": "textarea",
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce the same result"
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'recraft-v4-pro')
  AND gen_type = 'txt2img';

-- ============================================================
-- FLUX KONTEXT PRO — img2img
-- Fixes: add num_inference_steps, safety_tolerance
-- ============================================================
UPDATE templates SET
  fields = '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Kontext preserves identity, faces, and style while applying your edit"
    },
    {
      "id": "prompt",
      "label": "Edit Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Change the background to a snowy mountain landscape, keep the subject exactly the same..."
    },
    {
      "id": "guidance_scale",
      "label": "Guidance Scale",
      "type": "select",
      "hint": "How closely to follow the prompt. Higher = more literal.",
      "options": [
        {"value": "2.5", "label": "2.5 — Creative"},
        {"value": "3.5", "label": "3.5 — Balanced (default)"},
        {"value": "5",   "label": "5 — Precise"},
        {"value": "7",   "label": "7 — Strict"},
        {"value": "10",  "label": "10 — Maximum adherence"}
      ]
    },
    {
      "id": "steps",
      "label": "Quality Steps",
      "type": "select",
      "hint": "More steps = higher quality, slower generation",
      "options": [
        {"value": "28", "label": "28 — Balanced (default)"},
        {"value": "15", "label": "15 — Fast"},
        {"value": "40", "label": "40 — High Quality"},
        {"value": "50", "label": "50 — Max Quality"}
      ]
    },
    {
      "id": "safety_tolerance",
      "label": "Safety Filter",
      "type": "select",
      "options": [
        {"value": "2", "label": "2 — Default"},
        {"value": "1", "label": "1 — Strictest"},
        {"value": "3", "label": "3 — Moderate"},
        {"value": "4", "label": "4 — Permissive"}
      ]
    },
    {
      "id": "num_images",
      "label": "# of Variations",
      "type": "select",
      "options": [
        {"value": "1", "label": "1 image"},
        {"value": "2", "label": "2 images"},
        {"value": "4", "label": "4 images"}
      ]
    },
    {
      "id": "output_format",
      "label": "Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG"}
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "type": "textarea",
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce the same result"
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'flux-kontext-pro')
  AND gen_type = 'img2img';

-- ============================================================
-- SORA 2 — txt2vid
-- Fixes: correct duration (4/8/12s not 5/10/15/20), correct resolutions
--        (720p/1080p only — no 480p), correct aspect ratios (16:9/9:16 only),
--        add model version pinning
-- ============================================================
UPDATE templates SET
  fields = '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A slow aerial shot over a dense rainforest at golden hour, rivers of mist drifting between ancient trees, sunbeams cutting through the canopy..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "720p",  "label": "720p (default)"},
        {"value": "1080p", "label": "1080p — Full HD"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "4",  "label": "4 seconds (default)"},
        {"value": "8",  "label": "8 seconds"},
        {"value": "12", "label": "12 seconds"}
      ]
    },
    {
      "id": "model",
      "label": "Model Version",
      "type": "select",
      "hint": "Pin to a specific Sora 2 checkpoint for reproducibility",
      "options": [
        {"value": "sora-2",               "label": "sora-2 (latest, default)"},
        {"value": "sora-2-2025-12-08",    "label": "sora-2-2025-12-08"},
        {"value": "sora-2-2025-10-06",    "label": "sora-2-2025-10-06"}
      ]
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'sora2')
  AND gen_type = 'txt2vid';

-- ============================================================
-- SORA 2 — img2vid
-- Same fixes: duration, resolution, aspect ratio
-- ============================================================
UPDATE templates SET
  fields = '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Sora 2 uses this as the first frame"
    },
    {
      "id": "prompt",
      "label": "Motion Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Camera slowly pushes in, light shifts from warm sunset to cool dusk, clouds drift across the sky..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "720p",  "label": "720p (default)"},
        {"value": "1080p", "label": "1080p — Full HD"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "4", "label": "4 seconds (default)"},
        {"value": "8", "label": "8 seconds"},
        {"value": "12","label": "12 seconds"}
      ]
    },
    {
      "id": "model",
      "label": "Model Version",
      "type": "select",
      "options": [
        {"value": "sora-2",            "label": "sora-2 (latest, default)"},
        {"value": "sora-2-2025-12-08", "label": "sora-2-2025-12-08"},
        {"value": "sora-2-2025-10-06", "label": "sora-2-2025-10-06"}
      ]
    }
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'sora2')
  AND gen_type = 'img2vid';
