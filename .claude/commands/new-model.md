Scaffold a new model in prmptVAULT: $ARGUMENTS

$ARGUMENTS should include: slug, display name, provider, description, gen type (txt2img/txt2vid/img2img/img2vid/edit/upscale), min tier (newbie/creator/studio), and whether it's coming_soon or active.

Steps:
1. Create a new migration file in `supabase/migrations/` with the next sequential timestamp. Insert the model into the `models` table and `model_status` table.

2. In `src/pages/Dashboard.tsx`, add the slug to `MODEL_ART_MAP` with an appropriate gradient and 2-letter initial. Follow the color conventions: OpenAI = dark navy/slate, Google = green, Black Forest Labs = blue, ByteDance = purple, Kuaishou/Kling = pink/magenta, Lightricks = blue, Alibaba/WAN = yellow, Tencent = deep blue, Runway = dark teal, MiniMax = teal, Recraft = orange, Bria = red, PixVerse = purple.

3. Add the slug to `SLUG_BRAND_MAP` with the correct provider string.

4. If it's a video model, add a timing hint to the `RENDER_HINTS` object in the spinner section.
   If it's an image model that goes through `generate-replicate` (slow), add a timing hint to `IMAGE_HINTS`.

5. If it's active (not coming_soon), also add the slug to the appropriate routing set (`REPLICATE_SLUGS`, `DIRECT_API_SLUGS`, etc.) and implement the `buildInput` function in `supabase/functions/generate-replicate/index.ts` or the appropriate edge function.

Report what was created/changed.
