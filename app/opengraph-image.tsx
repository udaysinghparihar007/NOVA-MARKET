import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'NOVA/MARKET technology marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', right: '-80px', top: '-120px', width: '520px', height: '520px', borderRadius: '999px', background: '#2563eb', opacity: 0.35, filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: 56, fontWeight: 800, letterSpacing: '-2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 82, height: 82, borderRadius: 24, background: '#2563eb' }}>N/</div>
          <span>NOVA<span style={{ color: '#60a5fa' }}>/</span>MARKET</span>
        </div>
        <div style={{ marginTop: 34, maxWidth: 760, fontSize: 38, lineHeight: 1.15, color: '#cbd5e1' }}>
          Considered technology for the way you live and work.
        </div>
        <div style={{ marginTop: 34, fontSize: 22, color: '#94a3b8' }}>
          Smartphones · Computing · Audio
        </div>
      </div>
    ),
    size
  );
}
