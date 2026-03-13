-- ── Flux Schnell — add lens, DOF, composition, color, time, weather, medium ──
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone wolf standing on a mountain ridge at sunset, ancient pine forest below..."},
  {"id":"style","label":"Style","type":"style_picker","options":[
    {"value":"photorealistic","label":"Photo"},{"value":"cinematic","label":"Cinematic"},
    {"value":"digital_art","label":"Digital Art"},{"value":"oil_painting","label":"Oil Paint"},
    {"value":"watercolor","label":"Watercolor"},{"value":"pencil_sketch","label":"Sketch"},
    {"value":"3d_render","label":"3D Render"},{"value":"anime","label":"Anime"}
  ]},
  {"id":"lighting","label":"Lighting","type":"select","options":[
    {"value":"golden_hour","label":"Golden Hour"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"studio","label":"Studio"},{"value":"neon","label":"Neon / Cyberpunk"},
    {"value":"dramatic","label":"Dramatic"},{"value":"soft","label":"Soft / Diffused"},
    {"value":"backlit","label":"Backlit"},{"value":"volumetric","label":"Volumetric / God Rays"},
    {"value":"overcast","label":"Overcast"},{"value":"night","label":"Night"}
  ]},
  {"id":"lens","label":"Lens","type":"select","options":[
    {"value":"85mm","label":"85mm — Portrait"},{"value":"50mm","label":"50mm — Standard"},
    {"value":"24mm","label":"24mm — Wide Angle"},{"value":"14mm","label":"14mm — Ultra Wide"},
    {"value":"macro","label":"Macro"},{"value":"fisheye","label":"Fisheye"},
    {"value":"anamorphic","label":"Anamorphic"},{"value":"telephoto","label":"Telephoto 200mm"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"depth_of_field","label":"Depth of Field","type":"select","options":[
    {"value":"shallow","label":"Shallow — Bokeh Background"},
    {"value":"medium","label":"Medium — Subject Sharp"},
    {"value":"deep","label":"Deep — Everything in Focus"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"composition","label":"Composition","type":"select","options":[
    {"value":"close_up","label":"Close-up"},{"value":"medium_shot","label":"Medium Shot"},
    {"value":"wide_shot","label":"Wide Shot"},{"value":"aerial","label":"Aerial / Bird''s Eye"},
    {"value":"macro","label":"Macro / Extreme Close-up"},{"value":"worms_eye","label":"Worm''s Eye"},
    {"value":"rule_of_thirds","label":"Rule of Thirds"},{"value":"symmetrical","label":"Symmetrical"},
    {"value":"dutch_angle","label":"Dutch Angle"},{"value":"pov","label":"POV"}
  ]},
  {"id":"mood","label":"Mood","type":"multi_select","options":[
    {"value":"epic","label":"Epic"},{"value":"serene","label":"Serene"},
    {"value":"mysterious","label":"Mysterious"},{"value":"melancholic","label":"Melancholic"},
    {"value":"tense","label":"Tense"},{"value":"whimsical","label":"Whimsical"},
    {"value":"dark","label":"Dark"},{"value":"vibrant","label":"Vibrant"}
  ]},
  {"id":"color_palette","label":"Color Palette","type":"multi_select","options":[
    {"value":"warm","label":"Warm"},{"value":"cool","label":"Cool"},
    {"value":"monochrome","label":"Monochrome"},{"value":"vibrant","label":"Vibrant"},
    {"value":"muted","label":"Muted"},{"value":"pastel","label":"Pastel"},
    {"value":"dark","label":"Dark / Moody"},{"value":"neon","label":"Neon"},
    {"value":"earthy","label":"Earthy"},{"value":"golden","label":"Golden"}
  ]},
  {"id":"time_of_day","label":"Time of Day","type":"select","options":[
    {"value":"dawn","label":"Dawn"},{"value":"morning","label":"Morning"},
    {"value":"midday","label":"Midday"},{"value":"afternoon","label":"Afternoon"},
    {"value":"dusk","label":"Dusk"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"night","label":"Night"},{"value":"golden_hour","label":"Golden Hour"}
  ]},
  {"id":"weather","label":"Weather / Atmosphere","type":"select","options":[
    {"value":"clear","label":"Clear"},{"value":"overcast","label":"Overcast"},
    {"value":"foggy","label":"Foggy"},{"value":"rainy","label":"Rainy"},
    {"value":"stormy","label":"Stormy"},{"value":"snowy","label":"Snowy"},
    {"value":"dusty","label":"Dusty / Hazy"},{"value":"partly_cloudy","label":"Partly Cloudy"}
  ]},
  {"id":"camera_medium","label":"Camera / Medium","type":"select","options":[
    {"value":"digital","label":"Digital — Clean & Sharp"},
    {"value":"35mm_film","label":"35mm Film — Grain & Warmth"},
    {"value":"medium_format","label":"Medium Format — Rich Detail"},
    {"value":"polaroid","label":"Polaroid — Faded & Nostalgic"},
    {"value":"daguerreotype","label":"Daguerreotype — Antique"},
    {"value":"vhs","label":"VHS — Lo-fi Analog"},
    {"value":"super8","label":"Super 8 — Vintage"},
    {"value":"infrared","label":"Infrared — Ethereal"}
  ]},
  {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
    {"value":"highly_detailed","label":"Highly Detailed"},{"value":"8k","label":"8K"},
    {"value":"sharp_focus","label":"Sharp Focus"},{"value":"professional","label":"Professional"},
    {"value":"award_winning","label":"Award Winning"},{"value":"intricate","label":"Intricate"}
  ]},
  {"id":"steps","label":"Steps","type":"select","hint":"More steps = slightly better quality, slower generation","options":[
    {"value":"4","label":"Fast (4 steps)"},{"value":"8","label":"Balanced (8 steps)"},{"value":"12","label":"Quality (12 steps)"}
  ]},
  {"id":"num_images","label":"# of Images","type":"select","options":[
    {"value":"1","label":"1 image"},{"value":"2","label":"2 images"},{"value":"4","label":"4 images"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How closely to follow your prompt","options":[
    {"value":"2","label":"2 — Very Creative"},{"value":"3.5","label":"3.5 — Default"},
    {"value":"6","label":"6 — Balanced"},{"value":"10","label":"10 — Prompt-Adherent"},
    {"value":"15","label":"15 — Very Literal"}
  ]},
  {"id":"output_format","label":"Output Format","type":"select","options":[
    {"value":"jpeg","label":"JPEG (smaller file)"},{"value":"png","label":"PNG (lossless)"}
  ]},
  {"id":"acceleration","label":"Acceleration","type":"select","hint":"Speed boost — may slightly affect quality","options":[
    {"value":"none","label":"None (default)"},{"value":"regular","label":"Regular"},{"value":"high","label":"High"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'flux-schnell') AND gen_type = 'txt2img';


-- ── Flux Dev txt2img — same enrichment ───────────────────────────────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone wolf standing on a mountain ridge at sunset, ancient pine forest below..."},
  {"id":"style","label":"Style","type":"style_picker","options":[
    {"value":"photorealistic","label":"Photo"},{"value":"cinematic","label":"Cinematic"},
    {"value":"digital_art","label":"Digital Art"},{"value":"oil_painting","label":"Oil Paint"},
    {"value":"watercolor","label":"Watercolor"},{"value":"pencil_sketch","label":"Sketch"},
    {"value":"3d_render","label":"3D Render"},{"value":"anime","label":"Anime"}
  ]},
  {"id":"lighting","label":"Lighting","type":"select","options":[
    {"value":"golden_hour","label":"Golden Hour"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"studio","label":"Studio"},{"value":"neon","label":"Neon / Cyberpunk"},
    {"value":"dramatic","label":"Dramatic"},{"value":"soft","label":"Soft / Diffused"},
    {"value":"backlit","label":"Backlit"},{"value":"volumetric","label":"Volumetric / God Rays"},
    {"value":"overcast","label":"Overcast"},{"value":"night","label":"Night"}
  ]},
  {"id":"lens","label":"Lens","type":"select","options":[
    {"value":"85mm","label":"85mm — Portrait"},{"value":"50mm","label":"50mm — Standard"},
    {"value":"24mm","label":"24mm — Wide Angle"},{"value":"14mm","label":"14mm — Ultra Wide"},
    {"value":"macro","label":"Macro"},{"value":"fisheye","label":"Fisheye"},
    {"value":"anamorphic","label":"Anamorphic"},{"value":"telephoto","label":"Telephoto 200mm"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"depth_of_field","label":"Depth of Field","type":"select","options":[
    {"value":"shallow","label":"Shallow — Bokeh Background"},
    {"value":"medium","label":"Medium — Subject Sharp"},
    {"value":"deep","label":"Deep — Everything in Focus"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"composition","label":"Composition","type":"select","options":[
    {"value":"close_up","label":"Close-up"},{"value":"medium_shot","label":"Medium Shot"},
    {"value":"wide_shot","label":"Wide Shot"},{"value":"aerial","label":"Aerial / Bird''s Eye"},
    {"value":"macro","label":"Macro / Extreme Close-up"},{"value":"worms_eye","label":"Worm''s Eye"},
    {"value":"rule_of_thirds","label":"Rule of Thirds"},{"value":"symmetrical","label":"Symmetrical"},
    {"value":"dutch_angle","label":"Dutch Angle"},{"value":"pov","label":"POV"}
  ]},
  {"id":"mood","label":"Mood","type":"multi_select","options":[
    {"value":"epic","label":"Epic"},{"value":"serene","label":"Serene"},
    {"value":"mysterious","label":"Mysterious"},{"value":"melancholic","label":"Melancholic"},
    {"value":"tense","label":"Tense"},{"value":"whimsical","label":"Whimsical"},
    {"value":"dark","label":"Dark"},{"value":"vibrant","label":"Vibrant"}
  ]},
  {"id":"color_palette","label":"Color Palette","type":"multi_select","options":[
    {"value":"warm","label":"Warm"},{"value":"cool","label":"Cool"},
    {"value":"monochrome","label":"Monochrome"},{"value":"vibrant","label":"Vibrant"},
    {"value":"muted","label":"Muted"},{"value":"pastel","label":"Pastel"},
    {"value":"dark","label":"Dark / Moody"},{"value":"neon","label":"Neon"},
    {"value":"earthy","label":"Earthy"},{"value":"golden","label":"Golden"}
  ]},
  {"id":"time_of_day","label":"Time of Day","type":"select","options":[
    {"value":"dawn","label":"Dawn"},{"value":"morning","label":"Morning"},
    {"value":"midday","label":"Midday"},{"value":"afternoon","label":"Afternoon"},
    {"value":"dusk","label":"Dusk"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"night","label":"Night"},{"value":"golden_hour","label":"Golden Hour"}
  ]},
  {"id":"weather","label":"Weather / Atmosphere","type":"select","options":[
    {"value":"clear","label":"Clear"},{"value":"overcast","label":"Overcast"},
    {"value":"foggy","label":"Foggy"},{"value":"rainy","label":"Rainy"},
    {"value":"stormy","label":"Stormy"},{"value":"snowy","label":"Snowy"},
    {"value":"dusty","label":"Dusty / Hazy"},{"value":"partly_cloudy","label":"Partly Cloudy"}
  ]},
  {"id":"camera_medium","label":"Camera / Medium","type":"select","options":[
    {"value":"digital","label":"Digital — Clean & Sharp"},
    {"value":"35mm_film","label":"35mm Film — Grain & Warmth"},
    {"value":"medium_format","label":"Medium Format — Rich Detail"},
    {"value":"polaroid","label":"Polaroid — Faded & Nostalgic"},
    {"value":"daguerreotype","label":"Daguerreotype — Antique"},
    {"value":"vhs","label":"VHS — Lo-fi Analog"},
    {"value":"super8","label":"Super 8 — Vintage"},
    {"value":"infrared","label":"Infrared — Ethereal"}
  ]},
  {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
    {"value":"highly_detailed","label":"Highly Detailed"},{"value":"8k","label":"8K"},
    {"value":"sharp_focus","label":"Sharp Focus"},{"value":"professional","label":"Professional"},
    {"value":"award_winning","label":"Award Winning"},{"value":"intricate","label":"Intricate"}
  ]},
  {"id":"steps","label":"Steps","type":"select","hint":"More steps = better quality, slower generation","options":[
    {"value":"10","label":"Draft (10 steps)"},{"value":"20","label":"Balanced (20 steps)"},
    {"value":"30","label":"Quality (30 steps)"},{"value":"50","label":"Max (50 steps)"}
  ]},
  {"id":"num_images","label":"# of Images","type":"select","options":[
    {"value":"1","label":"1 image"},{"value":"2","label":"2 images"},{"value":"4","label":"4 images"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How closely to follow your prompt","options":[
    {"value":"2","label":"2 — Very Creative"},{"value":"3.5","label":"3.5 — Default"},
    {"value":"6","label":"6 — Balanced"},{"value":"10","label":"10 — Prompt-Adherent"},
    {"value":"15","label":"15 — Very Literal"}
  ]},
  {"id":"output_format","label":"Output Format","type":"select","options":[
    {"value":"jpeg","label":"JPEG (smaller file)"},{"value":"png","label":"PNG (lossless)"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'flux-dev') AND gen_type = 'txt2img';


-- ── Flux Pro txt2img — same enrichment ───────────────────────────────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone wolf standing on a mountain ridge at sunset, ancient pine forest below..."},
  {"id":"style","label":"Style","type":"style_picker","options":[
    {"value":"photorealistic","label":"Photo"},{"value":"cinematic","label":"Cinematic"},
    {"value":"digital_art","label":"Digital Art"},{"value":"oil_painting","label":"Oil Paint"},
    {"value":"watercolor","label":"Watercolor"},{"value":"pencil_sketch","label":"Sketch"},
    {"value":"3d_render","label":"3D Render"},{"value":"anime","label":"Anime"}
  ]},
  {"id":"lighting","label":"Lighting","type":"select","options":[
    {"value":"golden_hour","label":"Golden Hour"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"studio","label":"Studio"},{"value":"neon","label":"Neon / Cyberpunk"},
    {"value":"dramatic","label":"Dramatic"},{"value":"soft","label":"Soft / Diffused"},
    {"value":"backlit","label":"Backlit"},{"value":"volumetric","label":"Volumetric / God Rays"},
    {"value":"overcast","label":"Overcast"},{"value":"night","label":"Night"}
  ]},
  {"id":"lens","label":"Lens","type":"select","options":[
    {"value":"85mm","label":"85mm — Portrait"},{"value":"50mm","label":"50mm — Standard"},
    {"value":"24mm","label":"24mm — Wide Angle"},{"value":"14mm","label":"14mm — Ultra Wide"},
    {"value":"macro","label":"Macro"},{"value":"fisheye","label":"Fisheye"},
    {"value":"anamorphic","label":"Anamorphic"},{"value":"telephoto","label":"Telephoto 200mm"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"depth_of_field","label":"Depth of Field","type":"select","options":[
    {"value":"shallow","label":"Shallow — Bokeh Background"},
    {"value":"medium","label":"Medium — Subject Sharp"},
    {"value":"deep","label":"Deep — Everything in Focus"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"composition","label":"Composition","type":"select","options":[
    {"value":"close_up","label":"Close-up"},{"value":"medium_shot","label":"Medium Shot"},
    {"value":"wide_shot","label":"Wide Shot"},{"value":"aerial","label":"Aerial / Bird''s Eye"},
    {"value":"macro","label":"Macro / Extreme Close-up"},{"value":"worms_eye","label":"Worm''s Eye"},
    {"value":"rule_of_thirds","label":"Rule of Thirds"},{"value":"symmetrical","label":"Symmetrical"},
    {"value":"dutch_angle","label":"Dutch Angle"},{"value":"pov","label":"POV"}
  ]},
  {"id":"mood","label":"Mood","type":"multi_select","options":[
    {"value":"epic","label":"Epic"},{"value":"serene","label":"Serene"},
    {"value":"mysterious","label":"Mysterious"},{"value":"melancholic","label":"Melancholic"},
    {"value":"tense","label":"Tense"},{"value":"whimsical","label":"Whimsical"},
    {"value":"dark","label":"Dark"},{"value":"vibrant","label":"Vibrant"}
  ]},
  {"id":"color_palette","label":"Color Palette","type":"multi_select","options":[
    {"value":"warm","label":"Warm"},{"value":"cool","label":"Cool"},
    {"value":"monochrome","label":"Monochrome"},{"value":"vibrant","label":"Vibrant"},
    {"value":"muted","label":"Muted"},{"value":"pastel","label":"Pastel"},
    {"value":"dark","label":"Dark / Moody"},{"value":"neon","label":"Neon"},
    {"value":"earthy","label":"Earthy"},{"value":"golden","label":"Golden"}
  ]},
  {"id":"time_of_day","label":"Time of Day","type":"select","options":[
    {"value":"dawn","label":"Dawn"},{"value":"morning","label":"Morning"},
    {"value":"midday","label":"Midday"},{"value":"afternoon","label":"Afternoon"},
    {"value":"dusk","label":"Dusk"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"night","label":"Night"},{"value":"golden_hour","label":"Golden Hour"}
  ]},
  {"id":"weather","label":"Weather / Atmosphere","type":"select","options":[
    {"value":"clear","label":"Clear"},{"value":"overcast","label":"Overcast"},
    {"value":"foggy","label":"Foggy"},{"value":"rainy","label":"Rainy"},
    {"value":"stormy","label":"Stormy"},{"value":"snowy","label":"Snowy"},
    {"value":"dusty","label":"Dusty / Hazy"},{"value":"partly_cloudy","label":"Partly Cloudy"}
  ]},
  {"id":"camera_medium","label":"Camera / Medium","type":"select","options":[
    {"value":"digital","label":"Digital — Clean & Sharp"},
    {"value":"35mm_film","label":"35mm Film — Grain & Warmth"},
    {"value":"medium_format","label":"Medium Format — Rich Detail"},
    {"value":"polaroid","label":"Polaroid — Faded & Nostalgic"},
    {"value":"daguerreotype","label":"Daguerreotype — Antique"},
    {"value":"vhs","label":"VHS — Lo-fi Analog"},
    {"value":"super8","label":"Super 8 — Vintage"},
    {"value":"infrared","label":"Infrared — Ethereal"}
  ]},
  {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
    {"value":"highly_detailed","label":"Highly Detailed"},{"value":"8k","label":"8K"},
    {"value":"sharp_focus","label":"Sharp Focus"},{"value":"professional","label":"Professional"},
    {"value":"award_winning","label":"Award Winning"},{"value":"intricate","label":"Intricate"}
  ]},
  {"id":"steps","label":"Steps","type":"select","hint":"More steps = better quality, slower generation","options":[
    {"value":"15","label":"Draft (15 steps)"},{"value":"28","label":"Balanced (28 steps)"},
    {"value":"40","label":"Quality (40 steps)"},{"value":"50","label":"Max (50 steps)"}
  ]},
  {"id":"num_images","label":"# of Images","type":"select","options":[
    {"value":"1","label":"1 image"},{"value":"2","label":"2 images"},{"value":"4","label":"4 images"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How closely to follow your prompt (1–10)","options":[
    {"value":"2","label":"2 — Creative"},{"value":"3.5","label":"3.5 — Default"},
    {"value":"5","label":"5 — Balanced"},{"value":"7","label":"7 — Literal"},
    {"value":"10","label":"10 — Very Literal"}
  ]},
  {"id":"output_format","label":"Output Format","type":"select","options":[
    {"value":"jpeg","label":"JPEG (smaller file)"},{"value":"png","label":"PNG (lossless)"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'flux-pro') AND gen_type = 'txt2img';


-- ── Flux Pro Ultra txt2img — same + raw mode ──────────────────────────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An aerial view of a volcanic island at sunrise, turquoise ocean, dramatic clouds..."},
  {"id":"style","label":"Style","type":"style_picker","options":[
    {"value":"photorealistic","label":"Photo"},{"value":"cinematic","label":"Cinematic"},
    {"value":"digital_art","label":"Digital Art"},{"value":"oil_painting","label":"Oil Paint"},
    {"value":"watercolor","label":"Watercolor"},{"value":"pencil_sketch","label":"Sketch"},
    {"value":"3d_render","label":"3D Render"},{"value":"anime","label":"Anime"}
  ]},
  {"id":"lighting","label":"Lighting","type":"select","options":[
    {"value":"golden_hour","label":"Golden Hour"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"studio","label":"Studio"},{"value":"neon","label":"Neon / Cyberpunk"},
    {"value":"dramatic","label":"Dramatic"},{"value":"soft","label":"Soft / Diffused"},
    {"value":"backlit","label":"Backlit"},{"value":"volumetric","label":"Volumetric / God Rays"},
    {"value":"overcast","label":"Overcast"},{"value":"night","label":"Night"}
  ]},
  {"id":"lens","label":"Lens","type":"select","options":[
    {"value":"85mm","label":"85mm — Portrait"},{"value":"50mm","label":"50mm — Standard"},
    {"value":"24mm","label":"24mm — Wide Angle"},{"value":"14mm","label":"14mm — Ultra Wide"},
    {"value":"macro","label":"Macro"},{"value":"fisheye","label":"Fisheye"},
    {"value":"anamorphic","label":"Anamorphic"},{"value":"telephoto","label":"Telephoto 200mm"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"depth_of_field","label":"Depth of Field","type":"select","options":[
    {"value":"shallow","label":"Shallow — Bokeh Background"},
    {"value":"medium","label":"Medium — Subject Sharp"},
    {"value":"deep","label":"Deep — Everything in Focus"},
    {"value":"tilt_shift","label":"Tilt-Shift"}
  ]},
  {"id":"composition","label":"Composition","type":"select","options":[
    {"value":"close_up","label":"Close-up"},{"value":"medium_shot","label":"Medium Shot"},
    {"value":"wide_shot","label":"Wide Shot"},{"value":"aerial","label":"Aerial / Bird''s Eye"},
    {"value":"macro","label":"Macro / Extreme Close-up"},{"value":"worms_eye","label":"Worm''s Eye"},
    {"value":"rule_of_thirds","label":"Rule of Thirds"},{"value":"symmetrical","label":"Symmetrical"},
    {"value":"dutch_angle","label":"Dutch Angle"},{"value":"pov","label":"POV"}
  ]},
  {"id":"mood","label":"Mood","type":"multi_select","options":[
    {"value":"epic","label":"Epic"},{"value":"serene","label":"Serene"},
    {"value":"mysterious","label":"Mysterious"},{"value":"melancholic","label":"Melancholic"},
    {"value":"tense","label":"Tense"},{"value":"whimsical","label":"Whimsical"},
    {"value":"dark","label":"Dark"},{"value":"vibrant","label":"Vibrant"}
  ]},
  {"id":"color_palette","label":"Color Palette","type":"multi_select","options":[
    {"value":"warm","label":"Warm"},{"value":"cool","label":"Cool"},
    {"value":"monochrome","label":"Monochrome"},{"value":"vibrant","label":"Vibrant"},
    {"value":"muted","label":"Muted"},{"value":"pastel","label":"Pastel"},
    {"value":"dark","label":"Dark / Moody"},{"value":"neon","label":"Neon"},
    {"value":"earthy","label":"Earthy"},{"value":"golden","label":"Golden"}
  ]},
  {"id":"time_of_day","label":"Time of Day","type":"select","options":[
    {"value":"dawn","label":"Dawn"},{"value":"morning","label":"Morning"},
    {"value":"midday","label":"Midday"},{"value":"afternoon","label":"Afternoon"},
    {"value":"dusk","label":"Dusk"},{"value":"blue_hour","label":"Blue Hour"},
    {"value":"night","label":"Night"},{"value":"golden_hour","label":"Golden Hour"}
  ]},
  {"id":"weather","label":"Weather / Atmosphere","type":"select","options":[
    {"value":"clear","label":"Clear"},{"value":"overcast","label":"Overcast"},
    {"value":"foggy","label":"Foggy"},{"value":"rainy","label":"Rainy"},
    {"value":"stormy","label":"Stormy"},{"value":"snowy","label":"Snowy"},
    {"value":"dusty","label":"Dusty / Hazy"},{"value":"partly_cloudy","label":"Partly Cloudy"}
  ]},
  {"id":"camera_medium","label":"Camera / Medium","type":"select","options":[
    {"value":"digital","label":"Digital — Clean & Sharp"},
    {"value":"35mm_film","label":"35mm Film — Grain & Warmth"},
    {"value":"medium_format","label":"Medium Format — Rich Detail"},
    {"value":"polaroid","label":"Polaroid — Faded & Nostalgic"},
    {"value":"daguerreotype","label":"Daguerreotype — Antique"},
    {"value":"vhs","label":"VHS — Lo-fi Analog"},
    {"value":"super8","label":"Super 8 — Vintage"},
    {"value":"infrared","label":"Infrared — Ethereal"}
  ]},
  {"id":"raw","label":"Raw Mode","type":"select","hint":"Raw mode skips post-processing for a more natural, photographic look","options":[
    {"value":"false","label":"Off (default)"},{"value":"true","label":"On — Natural / Photographic"}
  ]},
  {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
    {"value":"highly_detailed","label":"Highly Detailed"},{"value":"8k","label":"8K"},
    {"value":"sharp_focus","label":"Sharp Focus"},{"value":"professional","label":"Professional"},
    {"value":"award_winning","label":"Award Winning"},{"value":"intricate","label":"Intricate"}
  ]},
  {"id":"num_images","label":"# of Images","type":"select","options":[
    {"value":"1","label":"1 image"},{"value":"2","label":"2 images"},{"value":"4","label":"4 images"}
  ]},
  {"id":"output_format","label":"Output Format","type":"select","options":[
    {"value":"jpeg","label":"JPEG (smaller file)"},{"value":"png","label":"PNG (lossless)"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'flux-pro-ultra') AND gen_type = 'txt2img';


-- ── Kling txt2vid — add camera movement, style, subject focus ────────────────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone surfer riding a massive wave at golden hour, slow motion, cinematic..."},
  {"id":"style","label":"Visual Style","type":"style_picker","options":[
    {"value":"cinematic","label":"Cinematic"},{"value":"photorealistic","label":"Photorealistic"},
    {"value":"anime","label":"Anime"},{"value":"3d_render","label":"3D / CGI"},
    {"value":"digital_art","label":"Digital Art"},{"value":"documentary","label":"Documentary"}
  ]},
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
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark, low quality, static, no motion..."},
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
WHERE model_id = (SELECT id FROM models WHERE slug = 'kling') AND gen_type = 'txt2vid';


-- ── Kling img2vid — add camera movement, cfg_scale ───────────────────────────
UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"The image you want to animate. Works best with clear subjects and defined compositions."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","ai_assist":true,"placeholder":"Camera slowly zooms in, subject turns to face the camera, hair blowing in wind..."},
  {"id":"camera_movement","label":"Camera Movement","type":"select","hint":"Defines how the camera moves while the scene animates","options":[
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


-- ── Luma Dream Machine txt2vid — add camera motion, resolution, duration ─────
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A tranquil forest stream in autumn, leaves drifting in the water, soft morning light..."},
  {"id":"style","label":"Visual Style","type":"style_picker","options":[
    {"value":"cinematic","label":"Cinematic"},{"value":"photorealistic","label":"Photorealistic"},
    {"value":"anime","label":"Anime"},{"value":"3d_render","label":"3D / CGI"},
    {"value":"digital_art","label":"Digital Art"},{"value":"documentary","label":"Documentary"}
  ]},
  {"id":"camera_motion","label":"Camera Motion","type":"select","hint":"Luma handles camera motion through the prompt — this adds the right language automatically","options":[
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
    {"value":"3:4","label":"3:4 — Portrait"},
    {"value":"21:9","label":"21:9 — Cinematic Ultrawide"},
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
  {"id":"loop","label":"Loop","type":"select","hint":"Generate a seamlessly looping video — great for backgrounds and social media","options":[
    {"value":"false","label":"No"},
    {"value":"true","label":"Yes — Seamless Loop"}
  ]}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma') AND gen_type = 'txt2vid';


-- ── Luma Dream Machine img2vid — add camera motion, resolution, duration ─────
UPDATE templates SET fields = '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Luma excels at animating scenes with clear subjects, depth, and lighting. Still images with natural perspective work best."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The camera slowly pulls back, revealing the full landscape, clouds drift overhead..."},
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
