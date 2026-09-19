import { ImageResponse } from 'next/og';

export const alt = 'NOVA/MARKET technology marketplace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#020617',
          color: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 64,
          fontWeight: 800,
          letterSpacing: '-2px',
        }}
      >
        NOVA<span style={{ color: '#60a5fa' }}>/</span>MARKET
      </div>
    ),
    size
  );
}
