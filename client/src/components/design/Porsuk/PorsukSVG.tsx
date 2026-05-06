import type { PorsukPose } from './poses';

const C = {
  furBase:   'oklch(0.62 0.05 65)',
  furLight:  'oklch(0.74 0.045 70)',
  furDark:   'oklch(0.38 0.04 50)',
  furDarker: 'oklch(0.25 0.03 45)',
  white:     'oklch(0.96 0.005 80)',
  pink:      'oklch(0.72 0.13 20)',
  pinkSoft:  'oklch(0.85 0.06 25)',
  eye:       'oklch(0.82 0.16 110)',
  eyeRim:    'oklch(0.25 0.02 60)',
  pupil:     'oklch(0.10 0 0)',
  whisker:   'oklch(0.92 0.005 70)',
  shadow:    'oklch(0.25 0.02 60)',
};

function SleepZs() {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <text key={i} x={68 + i * 4} y={28 - i * 8} fontSize={10 - i * 2}
          fill={C.shadow} fontWeight="700"
          style={{ animation: `porsuk-zfloat 2.5s ease-in-out infinite ${i * 0.4}s`, opacity: 0.7 }}
        >z</text>
      ))}
    </g>
  );
}

function Hearts() {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <text key={i} x={20 + i * 25} y={20 - (i % 2) * 6} fontSize="10"
          style={{ animation: `porsuk-zfloat 1.8s ease-in-out infinite ${i * 0.3}s`, opacity: 0.85 }}
        >💚</text>
      ))}
    </g>
  );
}

function Confetti() {
  const pieces = [
    { x: 15, y: 10, c: 'var(--accent-green)' },
    { x: 30, y: 5,  c: 'var(--owner-yigit)'  },
    { x: 50, y: 12, c: 'var(--owner-arzu)'   },
    { x: 70, y: 6,  c: 'var(--owner-ev)'     },
    { x: 85, y: 14, c: 'var(--cat-eglence)'  },
  ];
  return (
    <g>
      {pieces.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width="3" height="6" fill={p.c}
          style={{ animation: `porsuk-zfloat 1.5s ease-out infinite ${i * 0.2}s`, transformOrigin: 'center' }}
        />
      ))}
    </g>
  );
}

function BodyStripes({ y }: { y: number }) {
  return (
    <g opacity="0.85">
      <path d={`M 35 ${y - 16} Q 50 ${y - 18}, 70 ${y - 12}`} stroke={C.furDark} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <path d={`M 38 ${y - 14} Q 38 ${y - 8}, 38 ${y - 4}`}  stroke={C.furDark} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M 45 ${y - 15} Q 45 ${y - 8}, 45 ${y - 3}`}  stroke={C.furDark} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M 52 ${y - 15} Q 52 ${y - 8}, 52 ${y - 3}`}  stroke={C.furDark} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M 59 ${y - 15} Q 59 ${y - 9}, 59 ${y - 4}`}  stroke={C.furDark} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M 66 ${y - 14} Q 66 ${y - 9}, 66 ${y - 5}`}  stroke={C.furDark} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d={`M 72 ${y - 12} Q 72 ${y - 8}, 72 ${y - 5}`}  stroke={C.furDark} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </g>
  );
}

function HeadMarkings({ angry }: { angry: boolean }) {
  return (
    <g>
      <path d="M 25 33 L 27 38 M 28 32 L 29 38 M 32 32 L 32 38 M 35 32 L 34 38 M 38 33 L 36 38"
        stroke={C.furDark} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 21 40 L 17 42" stroke={C.furDark} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 21 44 L 17 46" stroke={C.furDark} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 43 40 L 47 42" stroke={C.furDark} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 43 44 L 47 46" stroke={C.furDark} strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      {angry ? (
        <>
          <path d="M 22 39 L 28 38" stroke={C.furDark} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <path d="M 36 38 L 42 39" stroke={C.furDark} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d="M 23 41 Q 26 40, 29 41" stroke={C.furDark} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M 35 41 Q 38 40, 41 41" stroke={C.furDark} strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7"/>
        </>
      )}
    </g>
  );
}

function TailRings({ isFurious }: { isFurious: boolean }) {
  if (isFurious) {
    return (
      <g opacity="0.9">
        <path d="M 80 50 L 84 48" stroke={C.furDark} strokeWidth="2" strokeLinecap="round"/>
        <path d="M 84 38 L 88 36" stroke={C.furDark} strokeWidth="2" strokeLinecap="round"/>
        <path d="M 86 26 L 90 24" stroke={C.furDark} strokeWidth="2" strokeLinecap="round"/>
      </g>
    );
  }
  return (
    <g opacity="0.9">
      <path d="M 80 54 L 86 52" stroke={C.furDark} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 84 44 L 90 42" stroke={C.furDark} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M 84 32 L 88 30" stroke={C.furDark} strokeWidth="1.8" strokeLinecap="round"/>
    </g>
  );
}

interface PorsukSVGProps {
  pose: PorsukPose;
  mood?: string | null;
  mobile?: boolean;
  size?: number;
  anger: number;
}

export function PorsukSVG({ pose, mood, mobile, size = 120, anger }: PorsukSVGProps) {
  const w = mobile ? 80 : size;

  const isSleeping    = pose === 'sleeping' || pose === 'curled-sleeping';
  const isCelebrating = pose === 'celebrating' || pose === 'happy-dance';
  const isSad         = pose === 'sad' || pose === 'worried';
  const isSurprised   = pose === 'surprised' || pose === 'reacting';
  const isWaving      = pose === 'waving';
  const isRunning     = pose === 'running';
  const isSit         = pose === 'sit' || pose === 'sitting' || pose === 'sitting-relaxed';
  const isAngry       = anger >= 3;
  const isFurious     = anger >= 4;

  const eyeRy = isSleeping ? 0.5 : (isAngry ? 1.6 : (isSurprised ? 4 : 3.2));
  const eyeRx = isAngry ? 1.8 : 2.6;
  const earBack = isSad || isFurious;

  const bodyY  = isSleeping ? 70 : (isSit ? 64 : 62);
  const bodyRy = isSleeping ? 14 : 20;

  const tailPath = isFurious
    ? 'M 76 60 Q 92 48, 90 26 Q 89 14, 80 16'
    : isSad
      ? 'M 76 62 Q 88 70, 92 80'
      : 'M 76 60 Q 88 50, 86 32 Q 85 22, 78 22';

  const isWalking = pose === 'walking' || pose === 'running';
  const dur  = isRunning ? '0.36s' : '0.7s';
  const animA = isWalking ? `porsuk-leg-A ${dur} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite` : 'none';
  const animB = isWalking ? `porsuk-leg-B ${dur} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite` : 'none';

  return (
    <svg width={w} height={w} viewBox="0 0 100 100"
      style={{
        filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.45)) drop-shadow(0 0 8px rgba(255,255,255,0.08))',
        transform: isFurious ? 'scaleX(-1)' : 'none',
        transition: 'transform 200ms',
        overflow: 'visible',
        display: 'block',
      }}
    >
      <defs>
        <radialGradient id="psk-body-grad" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%"   stopColor={C.furLight}/>
          <stop offset="55%"  stopColor={C.furBase}/>
          <stop offset="100%" stopColor={C.furDark}/>
        </radialGradient>
        <radialGradient id="psk-head-grad" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%"   stopColor={C.furLight}/>
          <stop offset="60%"  stopColor={C.furBase}/>
          <stop offset="100%" stopColor={C.furDark}/>
        </radialGradient>
        <radialGradient id="psk-belly-grad" cx="0.5" cy="0.6" r="0.7">
          <stop offset="0%"   stopColor={C.white}    stopOpacity="0.95"/>
          <stop offset="70%"  stopColor={C.furLight} stopOpacity="0.85"/>
          <stop offset="100%" stopColor={C.furBase}  stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="psk-paw-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.furBase}/>
          <stop offset="100%" stopColor={C.furDark}/>
        </linearGradient>
        <radialGradient id="psk-ear-grad" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0%"   stopColor={C.furLight}/>
          <stop offset="100%" stopColor={C.furDark}/>
        </radialGradient>
        <radialGradient id="psk-eye-grad" cx="0.3" cy="0.3" r="0.85">
          <stop offset="0%"   stopColor="oklch(0.92 0.18 110)"/>
          <stop offset="65%"  stopColor={C.eye}/>
          <stop offset="100%" stopColor="oklch(0.55 0.14 110)"/>
        </radialGradient>
        <radialGradient id="psk-ground-shadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.45)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>

      {!isSleeping && <ellipse cx="50" cy="92" rx="26" ry="3" fill="url(#psk-ground-shadow)"/>}
      {isSleeping && <SleepZs/>}
      {mood === 'love'        && <Hearts/>}
      {isCelebrating          && <Confetti/>}

      {/* Tail */}
      <path d={tailPath} stroke={C.furBase} strokeWidth={isFurious ? 11 : 7}
        strokeLinecap="round" fill="none" style={{ transition: 'all 250ms' }}/>
      <TailRings isFurious={isFurious}/>
      <circle cx={isFurious ? 80 : 78} cy={isFurious ? 16 : 22} r="3.2" fill={C.furDarker}/>

      {/* Body */}
      <ellipse cx="50" cy={bodyY} rx="28" ry={bodyRy} fill={C.furBase}
        style={{ transition: 'cy 250ms, ry 250ms' }}/>
      <ellipse cx="50" cy={bodyY + bodyRy * 0.45} rx="22" ry={bodyRy * 0.55} fill={C.furLight} opacity="0.85"/>
      {!isSleeping && <ellipse cx="40" cy={bodyY - 2} rx="6" ry="9" fill={C.white} opacity="0.9"/>}
      <BodyStripes y={bodyY}/>

      {/* Head */}
      <g style={{
        transformOrigin: '32px 42px',
        animation: isWalking ? 'porsuk-head-bob 0.6s ease-in-out infinite' : 'none',
      }}>
        <ellipse cx="32" cy="42" rx="16" ry="15" fill="url(#psk-head-grad)"/>
        <ellipse cx="40" cy="44" rx="9"  ry="12" fill={C.furDarker} opacity="0.2"/>
        <circle cx="22" cy="48" r="6.5" fill={C.furLight} opacity="0.6"/>
        <circle cx="42" cy="48" r="6"   fill={C.furLight} opacity="0.45"/>
        <ellipse cx="32" cy="53"   rx="6.5" ry="3.8" fill={C.white}/>
        <ellipse cx="32" cy="52.2" rx="6"   ry="2.5" fill="white" opacity="0.6"/>
        <HeadMarkings angry={isAngry || isFurious}/>

        {/* Ears */}
        <g style={{ transformOrigin: '22px 28px', transition: 'transform 200ms' }}
           transform={earBack ? 'rotate(20)' : 'rotate(-3)'}>
          <path d="M 18 32 L 20 19 L 28 30 Z" fill="url(#psk-ear-grad)"/>
          <path d="M 19 30 L 21 23 L 25 29 Z" fill={C.pinkSoft}/>
          <path d="M 21 26 L 23 29" stroke={C.pink} strokeWidth="0.8" opacity="0.6"/>
          <path d="M 20 19 L 19 24" stroke={C.furDarker} strokeWidth="1.2" strokeLinecap="round"/>
        </g>
        <g style={{ transformOrigin: '42px 28px', transition: 'transform 200ms' }}
           transform={earBack ? 'rotate(-20)' : 'rotate(3)'}>
          <path d="M 38 30 L 44 19 L 46 32 Z" fill="url(#psk-ear-grad)"/>
          <path d="M 39 29 L 43 23 L 44 30 Z" fill={C.pinkSoft}/>
          <path d="M 42 26 L 43 29" stroke={C.pink} strokeWidth="0.8" opacity="0.6"/>
          <path d="M 44 19 L 45 24" stroke={C.furDarker} strokeWidth="1.2" strokeLinecap="round"/>
        </g>

        {/* Eyes */}
        {!isSleeping ? (
          <>
            <g style={{ transformOrigin: '28px 43px', animation: isFurious ? 'none' : 'porsuk-blink 5s infinite' }}>
              <ellipse cx="28" cy="43" rx={eyeRx + 0.5} ry={eyeRy + 0.5} fill={C.eyeRim}/>
              <ellipse cx="28" cy="43" rx={eyeRx} ry={eyeRy} fill="url(#psk-eye-grad)"
                style={{ transition: 'rx 150ms, ry 150ms' }}/>
              <ellipse cx="28" cy="43" rx={isFurious ? 0.5 : 0.95} ry={eyeRy * 0.85} fill={C.pupil}/>
              {!isAngry && <><circle cx="29.2" cy="41.8" r="0.8" fill="white"/><circle cx="27" cy="44" r="0.4" fill="white" opacity="0.6"/></>}
            </g>
            <g style={{ transformOrigin: '38px 43px', animation: isFurious ? 'none' : 'porsuk-blink 5s infinite' }}>
              <ellipse cx="38" cy="43" rx={eyeRx + 0.5} ry={eyeRy + 0.5} fill={C.eyeRim}/>
              <ellipse cx="38" cy="43" rx={eyeRx} ry={eyeRy} fill="url(#psk-eye-grad)"
                style={{ transition: 'rx 150ms, ry 150ms' }}/>
              <ellipse cx="38" cy="43" rx={isFurious ? 0.5 : 0.95} ry={eyeRy * 0.85} fill={C.pupil}/>
              {!isAngry && <><circle cx="39.2" cy="41.8" r="0.8" fill="white"/><circle cx="37" cy="44" r="0.4" fill="white" opacity="0.6"/></>}
            </g>
          </>
        ) : (
          <>
            <path d="M 25 43 Q 28 46, 31 43" stroke={C.shadow} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
            <path d="M 35 43 Q 38 46, 41 43" stroke={C.shadow} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </>
        )}

        {/* Nose */}
        <path d="M 33 49 L 30.3 51.8 L 35.7 51.8 Z" fill={C.pink} stroke={C.furDarker} strokeWidth="0.5"/>
        <path d="M 31.5 50 L 33 49.4 L 34.5 50" stroke="oklch(0.92 0.08 25)" strokeWidth="0.5" fill="none" opacity="0.8"/>
        <line x1="33" y1="51.8" x2="33" y2="53.5" stroke={C.furDarker} strokeWidth="0.7"/>

        {/* Mouth */}
        {(isSurprised) ? (
          <ellipse cx="33" cy="55.5" rx="2.2" ry="2.8" fill={C.shadow}/>
        ) : isSad ? (
          <path d="M 29 55.5 Q 33 53, 37 55.5" stroke={C.shadow} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
        ) : (isCelebrating || isWaving) ? (
          <path d="M 29 53.5 Q 33 57.5, 37 53.5" stroke={C.shadow} strokeWidth="1.1" fill="none" strokeLinecap="round"/>
        ) : (
          <path d="M 33 53.5 Q 31 55.5, 28.5 54.5 M 33 53.5 Q 35 55.5, 37.5 54.5"
            stroke={C.shadow} strokeWidth="0.9" fill="none" strokeLinecap="round"/>
        )}

        {/* Whiskers */}
        <line x1="20" y1="49" x2="9"  y2="46" stroke={C.whisker} strokeWidth="0.65" opacity="0.9"/>
        <line x1="20" y1="51" x2="9"  y2="51" stroke={C.whisker} strokeWidth="0.65" opacity="0.9"/>
        <line x1="20" y1="53" x2="9"  y2="55" stroke={C.whisker} strokeWidth="0.55" opacity="0.75"/>
        <line x1="44" y1="49" x2="55" y2="46" stroke={C.whisker} strokeWidth="0.65" opacity="0.9"/>
        <line x1="44" y1="51" x2="55" y2="51" stroke={C.whisker} strokeWidth="0.65" opacity="0.9"/>
        <line x1="44" y1="53" x2="55" y2="55" stroke={C.whisker} strokeWidth="0.55" opacity="0.75"/>
      </g>

      {/* Paws */}
      {isWaving ? (
        <>
          <ellipse cx="38" cy="79" rx="4.5" ry="3.5" fill={C.furBase}/>
          <ellipse cx="38" cy="80.5" rx="3.5" ry="2" fill={C.white}/>
          <ellipse cx="52" cy="82" rx="4.5" ry="3.5" fill={C.furBase}/>
          <ellipse cx="52" cy="83.5" rx="3.5" ry="2" fill={C.white}/>
          <ellipse cx="62" cy="82" rx="4.5" ry="3.5" fill={C.furBase}/>
          <ellipse cx="62" cy="83.5" rx="3.5" ry="2" fill={C.white}/>
          <g style={{ animation: 'porsuk-wave 1s ease-in-out infinite', transformOrigin: '70px 68px' }}>
            <ellipse cx="70" cy="58" rx="4" ry="5" fill={C.furBase}/>
            <ellipse cx="70" cy="61" rx="3" ry="2" fill={C.white}/>
          </g>
        </>
      ) : isCelebrating ? (
        <>
          <ellipse cx="34" cy="56" rx="4" ry="5" fill={C.furBase} transform="rotate(-35 34 56)"/>
          <ellipse cx="66" cy="56" rx="4" ry="5" fill={C.furBase} transform="rotate(35 66 56)"/>
          <ellipse cx="44" cy="84" rx="4.5" ry="3.5" fill={C.furBase}/>
          <ellipse cx="44" cy="85.5" rx="3.5" ry="2" fill={C.white}/>
          <ellipse cx="60" cy="84" rx="4.5" ry="3.5" fill={C.furBase}/>
          <ellipse cx="60" cy="85.5" rx="3.5" ry="2" fill={C.white}/>
        </>
      ) : isSleeping ? (
        <>
          <ellipse cx="36" cy="78" rx="4" ry="3" fill={C.furBase}/>
          <ellipse cx="64" cy="78" rx="4" ry="3" fill={C.furBase}/>
        </>
      ) : isSit ? (
        <>
          <ellipse cx="44" cy="80" rx="4"   ry="4"   fill={C.furBase}/>
          <ellipse cx="44" cy="82" rx="3"   ry="1.8" fill={C.white}/>
          <ellipse cx="56" cy="80" rx="4"   ry="4"   fill={C.furBase}/>
          <ellipse cx="56" cy="82" rx="3"   ry="1.8" fill={C.white}/>
        </>
      ) : (
        <g>
          <g style={{ transformOrigin: '64px 78px', animation: animB }}>
            <ellipse cx="64" cy="80" rx="3.6" ry="6" fill="url(#psk-paw-grad)" opacity="0.75"/>
            <ellipse cx="64" cy="84" rx="4"   ry="3" fill={C.furDark} opacity="0.8"/>
          </g>
          <g style={{ transformOrigin: '40px 76px', animation: animA }}>
            <ellipse cx="40" cy="78" rx="3.6" ry="6" fill="url(#psk-paw-grad)" opacity="0.78"/>
            <ellipse cx="40" cy="82" rx="4"   ry="3" fill={C.white} opacity="0.85"/>
          </g>
          <g style={{ transformOrigin: '60px 76px', animation: animA }}>
            <ellipse cx="60" cy="79"   rx="4"   ry="6.5" fill="url(#psk-paw-grad)"/>
            <ellipse cx="60" cy="83.5" rx="4.5" ry="3.2" fill={C.furBase}/>
            <ellipse cx="60" cy="84"   rx="3.5" ry="2"   fill={C.white}/>
            <circle cx="58.7" cy="84.2" r="0.5" fill={C.pink} opacity="0.7"/>
            <circle cx="60"   cy="84.5" r="0.5" fill={C.pink} opacity="0.7"/>
            <circle cx="61.3" cy="84.2" r="0.5" fill={C.pink} opacity="0.7"/>
          </g>
          <g style={{ transformOrigin: '36px 74px', animation: animB }}>
            <ellipse cx="36" cy="77"   rx="4"   ry="6.5" fill="url(#psk-paw-grad)"/>
            <ellipse cx="36" cy="81.5" rx="4.5" ry="3.2" fill={C.furBase}/>
            <ellipse cx="36" cy="82"   rx="3.5" ry="2"   fill={C.white}/>
            <circle cx="34.7" cy="82.2" r="0.5" fill={C.pink} opacity="0.7"/>
            <circle cx="36"   cy="82.5" r="0.5" fill={C.pink} opacity="0.7"/>
            <circle cx="37.3" cy="82.2" r="0.5" fill={C.pink} opacity="0.7"/>
          </g>
        </g>
      )}

      {isRunning && (
        <g opacity="0.7">
          <line x1="-2" y1="65" x2="6"  y2="65" stroke={C.shadow} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="-2" y1="72" x2="8"  y2="72" stroke={C.shadow} strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="2"  y1="78" x2="10" y2="78" stroke={C.shadow} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      )}
    </svg>
  );
}
