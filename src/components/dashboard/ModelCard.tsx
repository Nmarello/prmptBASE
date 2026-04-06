import React, { useState } from 'react'
import type { Model, GenType } from '../../types'
import { tierCanAccess, GEN_TYPE_LABELS } from '../../types'

type ModelStatus = 'active' | 'add' | 'next-month' | 'upgrade' | 'coming-soon'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
  comingSoon?: boolean
  rendering?: boolean
  latestRenderUrl?: string
  latestRenderIsVideo?: boolean
  dataTour?: string
  modelStatus?: ModelStatus
  upgradeTier?: string
  onAdd?: () => void
  onUpgrade?: () => void
  borderColor?: string
}

const MODEL_ART: Record<string, { gradient: string; initial: string }> = {
  'dalle':              { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
  'flux-schnell':       { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
  'flux-dev':           { gradient: 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)', initial: 'FD' },
  'flux-pro':           { gradient: 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)', initial: 'FP' },
  'flux-pro-ultra':     { gradient: 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)', initial: 'FU' },
  'flux-dev-img2img':   { gradient: 'linear-gradient(145deg,#004d26,#00a550,#57cc99)', initial: 'F2' },
  'flux-kontext-pro':   { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)', initial: 'FK' },
  'recraft-v4-pro':     { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)', initial: 'RV' },
  'nano-banana':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
  'nano-banana-edit':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NE' },
  'kling':              { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'kling-txt2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'kling-img2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'luma':               { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'luma-txt2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'luma-img2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'minimax-txt2vid':    { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
  'sora':               { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  'sora2':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  'cs-ideogram':        { gradient: 'linear-gradient(145deg,#1a0040,#5500cc,#aa44ff)', initial: 'ID' },
  'cs-runway':          { gradient: 'linear-gradient(145deg,#001a00,#004400,#00aa44)', initial: 'R4' },
  'cs-pika':            { gradient: 'linear-gradient(145deg,#00001a,#000066,#0033cc)', initial: 'PK' },
  'cs-veo3':            { gradient: 'linear-gradient(145deg,#0a1a00,#1a4400,#2a8800)', initial: 'V3' },
  // New active models
  'ideogram-v3':        { gradient: 'linear-gradient(145deg,#1a0040,#5500cc,#aa44ff)', initial: 'ID' },
  'hidream-fast':       { gradient: 'linear-gradient(145deg,#002233,#005577,#00aabb)', initial: 'HF' },
  'hidream-full':       { gradient: 'linear-gradient(145deg,#001a33,#003d66,#0077cc)', initial: 'HD' },
  'hidream-full-i2i':   { gradient: 'linear-gradient(145deg,#001a33,#003d66,#0077cc)', initial: 'HI' },
  'gpt-image-1':        { gradient: 'linear-gradient(145deg,#0d1a0d,#1a4d1a,#22aa22)', initial: 'G1' },
  'pika':               { gradient: 'linear-gradient(145deg,#00001a,#000066,#0033cc)', initial: 'PK' },
  'runway':             { gradient: 'linear-gradient(145deg,#001a00,#004400,#00aa44)', initial: 'RW' },
  'ltx-video':          { gradient: 'linear-gradient(145deg,#1a0a2e,#4a1a8c,#7c3aed)', initial: 'LX' },
  'hunyuan-video':      { gradient: 'linear-gradient(145deg,#0a1628,#0d3b6e,#1e6bb8)', initial: 'HY' },
  'wan-21-txt2vid':     { gradient: 'linear-gradient(145deg,#0d1f0d,#1a4d1a,#2d8a2d)', initial: 'WN' },
  'minimax':            { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
  // Coming soon
  'flux2-pro':          { gradient: 'linear-gradient(145deg,#00004d,#001aff,#4466ff)', initial: 'F2' },
  'flux-kontext-dev':   { gradient: 'linear-gradient(145deg,#110022,#330099,#6633cc)', initial: 'KD' },
  'recraft-v3':         { gradient: 'linear-gradient(145deg,#2d1200,#7a3500,#cc6600)', initial: 'R3' },
  'seedream-45':        { gradient: 'linear-gradient(145deg,#0a001a,#330055,#770099)', initial: 'SD' },
  'sd35-medium':        { gradient: 'linear-gradient(145deg,#001133,#003388,#0055cc)', initial: 'S3' },
  'seedance-1-pro':         { gradient: 'linear-gradient(145deg,#1a0a00,#663300,#cc6600)', initial: 'SC' },
  'seedance-1-pro-txt2vid': { gradient: 'linear-gradient(145deg,#1a0a00,#663300,#cc6600)', initial: 'SC' },
  'seedance-2':             { gradient: 'linear-gradient(145deg,#0d0a1a,#3d1a66,#8833cc)', initial: 'S2' },
  // Vid2vid coming soon
  'kling-o1-edit':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KE' },
  'kling-o1-reference': { gradient: 'linear-gradient(145deg,#3d0030,#990055,#cc3377)', initial: 'KR' },
  'luma-modify':        { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LM' },
  // Coming soon — Text → Image
  'flux2-max':              { gradient: 'linear-gradient(145deg,#050a1a,#0a1f4d,#1a4dcc)', initial: 'FM' },
  'flux-kontext-max':       { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#6622ee)', initial: 'KM' },
  'recraft-v4':             { gradient: 'linear-gradient(145deg,#3d1a00,#cc6600,#ff9900)', initial: 'R4' },
  'ideogram-v2':            { gradient: 'linear-gradient(145deg,#001a1a,#006666,#00cccc)', initial: 'I2' },
  'imagen-4-ultra':         { gradient: 'linear-gradient(145deg,#001a00,#005500,#00aa44)', initial: 'IU' },
  'imagen-4-fast':          { gradient: 'linear-gradient(145deg,#001a00,#004400,#00cc66)', initial: 'IF' },
  'gpt-image-1.5':          { gradient: 'linear-gradient(145deg,#1a0a00,#6b2d00,#10a37f)', initial: 'G5' },
  'seedream-4':             { gradient: 'linear-gradient(145deg,#0d0033,#3300cc,#6644ff)', initial: 'S4' },
  'seedream-5-lite':        { gradient: 'linear-gradient(145deg,#0d0033,#2200aa,#5533ff)', initial: 'SL' },
  // Coming soon — Text → Video
  'sora2-pro':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#5555aa)', initial: 'SP' },
  'veo-3':                  { gradient: 'linear-gradient(145deg,#001a00,#005522,#00aa55)', initial: 'V3' },
  'veo-3-fast':             { gradient: 'linear-gradient(145deg,#001a00,#004d1a,#00cc66)', initial: 'VF' },
  'veo-3.1':                { gradient: 'linear-gradient(145deg,#001a00,#006633,#00bb44)', initial: 'V3' },
  'kling-v2.5-turbo':       { gradient: 'linear-gradient(145deg,#4a0040,#aa0055,#ff3388)', initial: 'KT' },
  'kling-v3':               { gradient: 'linear-gradient(145deg,#4a0040,#880044,#dd2277)', initial: 'K3' },
  'wan-2.5-t2v':            { gradient: 'linear-gradient(145deg,#1a1a00,#555500,#aaaa00)', initial: 'W5' },
  'minimax-video':          { gradient: 'linear-gradient(145deg,#002b36,#006060,#00bbaa)', initial: 'MV' },
  'gen-4.5':                { gradient: 'linear-gradient(145deg,#0d0d0d,#1a3333,#2d7a7a)', initial: 'G4' },
  'pixverse-v5':            { gradient: 'linear-gradient(145deg,#1a001a,#660066,#cc44cc)', initial: 'PV' },
  // Coming soon — Edit / Upscale
  'flux-fill-pro':          { gradient: 'linear-gradient(145deg,#003566,#0060cc,#33aaff)', initial: 'FF' },
  'bria-eraser':            { gradient: 'linear-gradient(145deg,#1a0000,#660000,#cc2222)', initial: 'BE' },
  'bria-genfill':           { gradient: 'linear-gradient(145deg,#1a0000,#880000,#dd3333)', initial: 'BG' },
  'bria-expand':            { gradient: 'linear-gradient(145deg,#1a0000,#770011,#cc1144)', initial: 'BX' },
  'recraft-crisp-upscale':  { gradient: 'linear-gradient(145deg,#3d1a00,#994400,#dd8800)', initial: 'RC' },
  'recraft-creative-upscale':{ gradient: 'linear-gradient(145deg,#3d1a00,#7a3300,#cc7700)', initial: 'RU' },
  'google-upscaler':        { gradient: 'linear-gradient(145deg,#001a00,#004400,#009933)', initial: 'GU' },
  'flux2-klein':            { gradient: 'linear-gradient(145deg,#003566,#0077cc,#33bbff)', initial: 'FK' },
  'qwen-image-2-pro':       { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#7722ee)', initial: 'QI' },
  'hailuo-2.3':             { gradient: 'linear-gradient(145deg,#002b36,#008888,#00ccbb)', initial: 'H3' },
  'hunyuan-video-1.5':      { gradient: 'linear-gradient(145deg,#00001a,#0d0d80,#4444dd)', initial: 'HV' },
  'nano-banana-pro':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NP' },
  // Motion control / animate
  'kling-v2.6-motion':      { gradient: 'linear-gradient(145deg,#3d0030,#990055,#ff2277)', initial: 'KM' },
  'wan-2.2-animate':        { gradient: 'linear-gradient(145deg,#0d2d0d,#1a6b1a,#33cc33)', initial: 'WA' },
}
const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }

const slugBrandLabels: Record<string, string> = {
  'dalle':            'OpenAI',
  'sora':             'OpenAI',
  'sora2':            'OpenAI',
  'flux-schnell':     'Black Forest Labs',
  'flux-dev':         'Black Forest Labs',
  'flux-pro':         'Black Forest Labs',
  'flux-pro-ultra':   'Black Forest Labs',
  'flux-dev-img2img': 'Black Forest Labs',
  'flux-kontext-pro': 'Black Forest Labs',
  'recraft-v4-pro':   'Recraft',
  'nano-banana':      'Google',
  'nano-banana-edit': 'Google',
  'kling':            'Kuaishou',
  'kling-txt2vid':    'Kuaishou',
  'kling-img2vid':    'Kuaishou',
  'luma':             'Luma AI',
  'luma-txt2vid':     'Luma AI',
  'luma-img2vid':     'Luma AI',
  'minimax-txt2vid':  'MiniMax',
  'ideogram-v3':      'Ideogram',
  'hidream-fast':     'HiDream',
  'hidream-full':     'HiDream',
  'gpt-image-1':      'OpenAI',
  'flux2-pro':        'Black Forest Labs',
  'flux-kontext-dev': 'Black Forest Labs',
  'recraft-v3':       'Recraft',
  'seedream-45':      'ByteDance',
  'sd35-medium':      'Stability AI',
  'seedance-1-pro':           'ByteDance',
  'seedance-1-pro-txt2vid':   'ByteDance',
  'seedance-2':               'ByteDance',
  'kling-o1-edit':    'Kuaishou',
  'kling-o1-reference': 'Kuaishou',
  'luma-modify':      'Luma AI',
  'flux2-max':                'Black Forest Labs',
  'flux-kontext-max':         'Black Forest Labs',
  'flux-fill-pro':            'Black Forest Labs',
  'recraft-v4':               'Recraft',
  'recraft-crisp-upscale':    'Recraft',
  'recraft-creative-upscale': 'Recraft',
  'ideogram-v2':              'Ideogram',
  'imagen-4-ultra':           'Google',
  'imagen-4-fast':            'Google',
  'google-upscaler':          'Google',
  'gpt-image-1.5':            'OpenAI',
  'sora2-pro':                'OpenAI',
  'seedream-4':               'ByteDance',
  'seedream-5-lite':          'ByteDance',
  'veo-3':                    'Google',
  'veo-3-fast':               'Google',
  'veo-3.1':                  'Google',
  'kling-v2.5-turbo':         'Kuaishou',
  'kling-v3':                 'Kuaishou',
  'wan-2.5-t2v':              'Alibaba',
  'minimax-video':            'MiniMax',
  'gen-4.5':                  'Runway',
  'pixverse-v5':              'PixVerse',
  'bria-eraser':              'Bria',
  'bria-genfill':             'Bria',
  'bria-expand':              'Bria',
  'flux2-klein':              'Black Forest Labs',
  'qwen-image-2-pro':         'Alibaba',
  'hailuo-2.3':               'MiniMax',
  'hunyuan-video-1.5':        'Tencent',
  'kling-v2.6-motion':        'Kuaishou',
  'wan-2.2-animate':          'Alibaba',
}

// Supabase image transform — resize for card thumbnails (320px = 2x card width for retina)
function thumbUrl(url: string, width = 320): string {
  if (!url) return url
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=' + width + '&format=webp&quality=60&resize=contain'
  }
  return url
}

export default function ModelCard({ model, userTier, selected, onClick, comingSoon: comingSoonProp, rendering, latestRenderUrl, latestRenderIsVideo, dataTour, modelStatus, upgradeTier, onAdd, onUpgrade, borderColor }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const accessible = tierCanAccess(userTier, model.min_tier)
  const comingSoon = comingSoonProp || modelStatus === 'coming-soon' || false
  const art = MODEL_ART[model.slug] ?? DEFAULT_ART
  const maker = slugBrandLabels[model.slug] ?? model.provider
  const isVideo = model.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid' || g === 'vid2vid')
  const typeLabel = isVideo ? 'VIDEO' : 'IMAGE'
  const hasUserImage = !!latestRenderUrl

  const effectiveStatus = modelStatus ?? (comingSoon ? 'coming-soon' : accessible ? 'active' : 'upgrade')

  function handleClick() {
    if (effectiveStatus === 'coming-soon') return
    if (effectiveStatus === 'upgrade') { onUpgrade?.(); return }
    if (effectiveStatus === 'add') { onAdd?.(); return }
    if (effectiveStatus === 'next-month') return
    onClick()
  }

  const STATUS_LABEL: Partial<Record<ModelStatus, string>> = {
    'add':        'Add to Your Account',
    'next-month': 'Select for Next Month',
    'upgrade':    upgradeTier ? `Upgrade to ${upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)}` : 'Upgrade to Access',
  }

  return (
    <button
      onClick={handleClick}
      data-tour={dataTour}
      style={{ width: '230px', flexShrink: 0, background: 'var(--pv-surface)', ...(borderColor ? { borderColor } : {}) }}
      className={`group relative text-left rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 ${
        comingSoon
          ? 'opacity-40 cursor-not-allowed border-[var(--pv-border)]'
          : effectiveStatus === 'next-month'
          ? 'opacity-60 cursor-default border-[var(--pv-border)]'
          : selected
          ? 'border-[var(--pv-accent)] shadow-lg cursor-pointer'
          : 'border-[var(--pv-border)] hover:-translate-y-0.5 hover:shadow-md hover:border-transparent cursor-pointer'
      }`}
    >
      {/* Art header */}
      <div
        className="relative overflow-hidden"
        style={{ height: '148px' }}
        onMouseEnter={e => { const v = e.currentTarget.querySelector('video'); if (v) v.play() }}
        onMouseLeave={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = 0 } }}
      >

        {/* Background */}
        {hasUserImage ? (
          <>
            {latestRenderIsVideo ? (
              <video
                src={latestRenderUrl}
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={thumbUrl(latestRenderUrl!)}
                alt=""
                loading="lazy"
                decoding="async"
                onLoad={() => setImgLoaded(true)}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {/* Option D skeleton — shown until image loads */}
            {!imgLoaded && !latestRenderIsVideo && (
              <div className="absolute inset-0" style={{ background: 'var(--pv-surface2)' }}>
                {/* Corner brackets */}
                {([
                  { top: 6, left: 6,    borderTop: '2px solid white', borderLeft:  '2px solid white' },
                  { top: 6, right: 6,   borderTop: '2px solid white', borderRight: '2px solid white' },
                  { bottom: 6, left: 6,  borderBottom: '2px solid white', borderLeft:  '2px solid white' },
                  { bottom: 6, right: 6, borderBottom: '2px solid white', borderRight: '2px solid white' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 16, height: 16, opacity: 0.22, ...s }} />
                ))}
                {/* Centered PV logo */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.22 }}>
                  <svg width={40} height={40} viewBox="0 0 782.7 783.64" style={{ display: 'block' }}>
                    <polygon fillRule="evenodd" fill="white" points="497.7 457.59 673.63 281.67 391.96 0 0 391.98 304.38 696.38 304.7 696.38 391.96 783.64 454.47 721.4 307.39 574.04 307.05 574.04 124.99 391.98 391.96 125.03 548.61 281.69 435.21 395.09 497.7 457.59" />
                    <polygon fillRule="evenodd" fill="white" points="499.94 548.65 720.2 328.67 782.7 391.16 499.96 673.64 218.29 391.98 280.78 329.5 499.94 548.65" />
                  </svg>
                </div>
                <div className="pv-skeleton-shimmer" />
              </div>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0) 50%,rgba(0,0,0,0.28) 100%)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: art.gradient }} />
            {/* Noise */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", opacity:0.5, mixBlendMode:'overlay' as const }} />
            {/* Decorative circles */}
            <span className="absolute rounded-full pointer-events-none" style={{ width:120, height:120, top:-30, right:-20, background:'rgba(255,255,255,0.12)' }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width:60, height:60, bottom:-10, left:20, background:'rgba(255,255,255,0.08)' }} />
            {/* Watermark initial */}
            <div className="absolute select-none pointer-events-none" style={{ bottom:'-12px', right:'-2px', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'88px', fontWeight:800, color:'rgba(255,255,255,0.11)', lineHeight:1, letterSpacing:'-0.06em' }}>
              {art.initial}
            </div>
          </>
        )}

        {/* Rendering LED */}
        {rendering && (
          <div className="absolute z-20" style={{ top:10, left:10, width:10, height:10, borderRadius:'50%', background:'#ff3b30', animation:'ledPulse 1.4s ease-in-out infinite' }} />
        )}

        {/* Type badge — top right */}
        {!comingSoon && (
          <div className="absolute top-2.5 right-2.5 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded z-10" style={{ background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.92)' }}>
            {typeLabel}
          </div>
        )}

        {/* Coming soon */}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background:'rgba(0,0,0,0.2)', backdropFilter:'blur(2px)' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)' }}>
              Coming Soon
            </span>
          </div>
        )}

        {/* Hover CTA */}
        {!comingSoon && effectiveStatus !== 'next-month' && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <span className="text-[12.5px] font-bold px-4 py-1.5 rounded-full" style={{
              background: effectiveStatus === 'upgrade' ? '#f59e0b' : effectiveStatus === 'add' ? 'var(--pv-accent)' : '#fff',
              color: effectiveStatus === 'upgrade' || effectiveStatus === 'add' ? '#fff' : '#18140e',
            }}>
              {effectiveStatus === 'upgrade'
                ? (upgradeTier ? `Upgrade to ${upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)} →` : 'Upgrade to Access →')
                : effectiveStatus === 'add'
                ? 'Add to Your Account →'
                : 'Use this model →'
              }
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3.5 flex flex-col flex-1">
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'14px', fontWeight:800, color:'var(--pv-text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          {model.name}
        </div>
        <div style={{ fontSize:'11.5px', color:'var(--pv-text3)', marginTop:'4px' }}>{maker}</div>
        {/* Fixed 3-line height so all cards are uniform */}
        <div style={{ fontSize:'12px', color:'var(--pv-text2)', lineHeight:1.45, marginTop:'6px', minHeight:'calc(1.45em * 3)' }} className="line-clamp-3">
          {model.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-auto pt-3">
          {model.supported_gen_types.map(gt => {
            const pillStyle = gt.startsWith('txt')
              ? { background:'rgba(251,191,36,0.13)', color:'#f59e0b', border:'1px solid rgba(251,191,36,0.28)' }
              : gt.startsWith('img')
              ? { background:'rgba(52,211,153,0.13)', color:'#10b981', border:'1px solid rgba(52,211,153,0.28)' }
              : gt.startsWith('vid')
              ? { background:'rgba(96,165,250,0.13)', color:'#60a5fa', border:'1px solid rgba(96,165,250,0.28)' }
              : { background:'var(--pv-surface2)', color:'var(--pv-text2)', border:'1px solid var(--pv-border)' }
            return (
              <span key={gt} style={{ fontSize:'10.5px', fontWeight:600, padding:'2px 7px', borderRadius:'5px', ...pillStyle }}>
                {GEN_TYPE_LABELS[gt as GenType] ?? gt}
              </span>
            )
          })}
        </div>

        {/* Status label */}
        {effectiveStatus !== 'active' && effectiveStatus !== 'coming-soon' && STATUS_LABEL[effectiveStatus] && (
          <div style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 6,
            textAlign: 'center',
            background: effectiveStatus === 'upgrade'
              ? 'rgba(245,158,11,0.12)'
              : effectiveStatus === 'add'
              ? 'rgba(var(--pv-accent-rgb,0,113,227),0.1)'
              : 'var(--pv-surface2)',
            color: effectiveStatus === 'upgrade'
              ? '#f59e0b'
              : effectiveStatus === 'add'
              ? 'var(--pv-accent)'
              : 'var(--pv-text3)',
            border: '1px solid ' + (effectiveStatus === 'upgrade'
              ? 'rgba(245,158,11,0.25)'
              : effectiveStatus === 'add'
              ? 'rgba(var(--pv-accent-rgb,0,113,227),0.2)'
              : 'var(--pv-border)'),
          }}>
            {STATUS_LABEL[effectiveStatus]}
          </div>
        )}
      </div>
    </button>
  )
}
