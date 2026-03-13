-- ── 1. Add CogVideoX model ────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'cogvideox',
  'CogVideoX 5B',
  'fal.ai',
  'Zhipu AI open video model. Controllable inference steps, guidance scale, and FPS — more technical control than any other video model on the platform.',
  ARRAY['txt2vid','img2vid'],
  'studio',
  33,
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order,
  coming_soon = EXCLUDED.coming_soon,
  is_active = EXCLUDED.is_active;

-- CogVideoX txt2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'CogVideoX 5B — Text to Video',
  'Generate video from a text prompt with full control over quality, adherence, and frame rate. Great for technical users who want to dial in results.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A majestic eagle soaring over a snow-capped mountain range, golden hour light, camera tracking from below..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"low quality, worst quality, deformed, distorted, blurry, jittery, motion smear..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Widescreen (default)"},
      {"value":"9:16","label":"9:16 — Vertical"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Portrait"},
      {"value":"1:1","label":"1:1 — Square HD"}
    ]},
    {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"More steps = better quality, longer generation time. Default is 50.","options":[
      {"value":"20","label":"20 — Fast (draft)"},
      {"value":"30","label":"30 — Balanced"},
      {"value":"50","label":"50 — Quality (default)"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How strictly to follow your prompt. Higher = more literal, lower = more creative.","options":[
      {"value":"3","label":"3 — Very Creative"},
      {"value":"5","label":"5 — Balanced"},
      {"value":"7","label":"7 — Adherent (default)"},
      {"value":"10","label":"10 — Strict"},
      {"value":"15","label":"15 — Very Strict"}
    ]},
    {"id":"export_fps","label":"Frame Rate (FPS)","type":"select","hint":"Higher FPS = smoother motion, larger file","options":[
      {"value":"8","label":"8 FPS — Cinematic / Lo-fi"},
      {"value":"16","label":"16 FPS — Default"},
      {"value":"24","label":"24 FPS — Film standard"},
      {"value":"30","label":"30 FPS — Smooth"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce the same result exactly"}
  ]'::jsonb
FROM models m WHERE m.slug = 'cogvideox'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- CogVideoX img2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'CogVideoX 5B — Image to Video',
  'Animate a still image with full control over quality, guidance, and FPS.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to animate. 768×512 resolution recommended for best results."},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Camera slowly pushes forward, subject turns toward the light, background subtly animates..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"low quality, worst quality, deformed, distorted, blurry, morphing faces..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Widescreen (default)"},
      {"value":"9:16","label":"9:16 — Vertical"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Portrait"},
      {"value":"1:1","label":"1:1 — Square HD"}
    ]},
    {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"More steps = better quality, longer generation time.","options":[
      {"value":"20","label":"20 — Fast (draft)"},
      {"value":"30","label":"30 — Balanced"},
      {"value":"50","label":"50 — Quality (default)"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How strictly to follow your prompt.","options":[
      {"value":"3","label":"3 — Very Creative"},
      {"value":"5","label":"5 — Balanced"},
      {"value":"7","label":"7 — Adherent (default)"},
      {"value":"10","label":"10 — Strict"}
    ]},
    {"id":"export_fps","label":"Frame Rate (FPS)","type":"select","hint":"Higher FPS = smoother motion","options":[
      {"value":"8","label":"8 FPS — Cinematic / Lo-fi"},
      {"value":"16","label":"16 FPS — Default"},
      {"value":"24","label":"24 FPS — Film standard"},
      {"value":"30","label":"30 FPS — Smooth"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models m WHERE m.slug = 'cogvideox'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── 2. Runway is not available on fal.ai — move to coming soon ────────────────
UPDATE models SET coming_soon = true, is_active = false
WHERE slug = 'runway';


-- ── 3. Pika — add resolution + seed ──────────────────────────────────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic drone shot flying over a misty mountain valley at dawn, golden rays breaking through the clouds..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"ugly, low quality, watermark, static, no motion, blurry..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"1:1","label":"1:1 — Square"},
    {"value":"4:5","label":"4:5 — Instagram Portrait"},
    {"value":"5:4","label":"5:4 — Instagram Landscape"},
    {"value":"3:2","label":"3:2 — Classic Film"},
    {"value":"2:3","label":"2:3 — Tall Portrait"}
  ]},
  {"id":"resolution","label":"Resolution","type":"select","hint":"1080p takes longer but delivers higher quality output","options":[
    {"value":"720p","label":"720p — Fast (default)"},
    {"value":"1080p","label":"1080p — High Quality"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce the same video"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'pika') AND gen_type = 'txt2vid';

UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the first frame. Pika will animate it according to your prompt."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Subject slowly turns toward the camera, background blurs into motion, hair blowing gently..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"low quality, watermark, distorted, morphing..."},
  {"id":"resolution","label":"Resolution","type":"select","hint":"1080p takes longer but delivers higher quality output","options":[
    {"value":"720p","label":"720p — Fast (default)"},
    {"value":"1080p","label":"1080p — High Quality"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'pika') AND gen_type = 'img2vid';


-- ── 4. LTX Video — add num_inference_steps, guidance_scale, seed ─────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A golden retriever runs across an open meadow at sunrise, tall grass catching the light, slow motion..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, inconsistent motion, blurry, jittery, distorted..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Widescreen (default)"},
    {"value":"9:16","label":"9:16 — Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"Default is 30. Bump to 40+ for noticeably better quality.","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Default"},
    {"value":"40","label":"40 — Better Quality"},
    {"value":"50","label":"50 — Max Quality"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"3–5 = creative / natural, 5–7 = follows prompt strictly","options":[
    {"value":"2","label":"2 — Very Creative"},
    {"value":"3","label":"3 — Default"},
    {"value":"5","label":"5 — Balanced"},
    {"value":"7","label":"7 — Strict"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-video') AND gen_type = 'txt2vid';

UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate. LTX works best with clear, well-lit subjects."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Gentle breeze, soft camera drift to the right, sunlight shifts, clouds move slowly overhead..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing, distorted, static..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Widescreen (default)"},
    {"value":"9:16","label":"9:16 — Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"Bump to 40+ for noticeably better quality.","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Default"},
    {"value":"40","label":"40 — Better Quality"},
    {"value":"50","label":"50 — Max Quality"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"3–5 = creative / natural, 5–7 = follows prompt strictly","options":[
    {"value":"2","label":"2 — Very Creative"},
    {"value":"3","label":"3 — Default"},
    {"value":"5","label":"5 — Balanced"},
    {"value":"7","label":"7 — Strict"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-video') AND gen_type = 'img2vid';


-- ── 5. Kling img2vid — add tail_image_url (end frame) ────────────────────────
UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"The image to animate. Works best with clear subjects and defined compositions."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","ai_assist":true,"placeholder":"Camera slowly zooms in, subject turns to face the camera, hair blowing gently in wind..."},
  {"id":"tail_image_url","label":"End Frame URL (optional)","type":"textarea","placeholder":"https://... (optional — paste a URL for the final frame)","hint":"Kling can interpolate from your source image to a target end frame. Paste a public image URL."},
  {"id":"camera_movement","label":"Camera Movement","type":"select","hint":"Controls how the camera moves through the scene","options":[
    {"value":"none","label":"None — Static Camera"},
    {"value":"zoom_in","label":"Zoom In"},
    {"value":"zoom_out","label":"Zoom Out"},
    {"value":"pan_left","label":"Pan Left"},
    {"value":"pan_right","label":"Pan Right"},
    {"value":"tilt_up","label":"Tilt Up"},
    {"value":"tilt_down","label":"Tilt Down"},
    {"value":"move_left","label":"Move Left (Truck)"},
    {"value":"move_right","label":"Move Right (Truck)"},
    {"value":"move_up","label":"Move Up (Pedestal)"},
    {"value":"move_down","label":"Move Down (Pedestal)"}
  ]},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark, distorted faces, unnatural motion..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"}
  ]},
  {"id":"cfg_scale","label":"Prompt Adherence","type":"select","hint":"How closely Kling follows your prompt vs. being creative","options":[
    {"value":"0.3","label":"0.3 — Creative / Loose"},
    {"value":"0.5","label":"0.5 — Default"},
    {"value":"0.7","label":"0.7 — Adherent"},
    {"value":"1.0","label":"1.0 — Strict"}
  ]}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'kling') AND gen_type = 'img2vid';


-- ── 6. Luma img2vid — add end_image_url ──────────────────────────────────────
UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Luma excels at animating scenes with clear subjects, depth, and natural lighting."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The camera slowly pulls back, revealing the full landscape, clouds drift overhead..."},
  {"id":"end_image_url","label":"End Frame URL (optional)","type":"textarea","placeholder":"https://... (optional — paste a URL to blend into as the final frame)","hint":"Luma can smoothly transition from your source image to a target end frame. Paste a public image URL."},
  {"id":"camera_motion","label":"Camera Motion","type":"select","hint":"Adds camera movement language to your prompt automatically","options":[
    {"value":"none","label":"None — Let Luma decide"},
    {"value":"static","label":"Static — No camera movement"},
    {"value":"zoom_in","label":"Slow Zoom In"},
    {"value":"zoom_out","label":"Slow Zoom Out"},
    {"value":"pan_left","label":"Pan Left"},
    {"value":"pan_right","label":"Pan Right"},
    {"value":"push_in","label":"Push In — Camera moves toward subject"},
    {"value":"pull_out","label":"Pull Out — Camera moves away"},
    {"value":"orbit_left","label":"Orbit Left — Circle subject"},
    {"value":"orbit_right","label":"Orbit Right — Circle subject"},
    {"value":"crane_up","label":"Crane Up — Rising shot"},
    {"value":"crane_down","label":"Crane Down — Descending shot"},
    {"value":"handheld","label":"Handheld — Natural slight shake"},
    {"value":"dolly","label":"Dolly — Smooth tracking shot"}
  ]},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"4:3","label":"4:3 — Standard"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"resolution","label":"Resolution","type":"select","hint":"Higher resolution = longer processing time","options":[
    {"value":"540p","label":"540p — Fast"},
    {"value":"720p","label":"720p — Balanced"},
    {"value":"1080p","label":"1080p — High Quality"}
  ]},
  {"id":"duration","label":"Duration","type":"select","hint":"9s is automatically reduced to 5s at 1080p resolution","options":[
    {"value":"5s","label":"5 seconds"},
    {"value":"9s","label":"9 seconds"}
  ]},
  {"id":"loop","label":"Loop","type":"select","hint":"Generate a seamlessly looping video","options":[
    {"value":"false","label":"No"},
    {"value":"true","label":"Yes — Seamless Loop"}
  ]}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma') AND gen_type = 'img2vid';
