import { PorsukSVG } from './PorsukSVG';
import { SpeechBubble } from './SpeechBubble';
import { usePorsukState } from './usePorsukState';

interface PorsukProps {
  mobile?: boolean;
  page?: string;
}

export function Porsuk({ mobile, page }: PorsukProps) {
  const {
    pose,
    mood,
    speech,
    anger,
    hidden,
    pos,
    turning,
    onClickPorsuk,
  } = usePorsukState(page);

  if (hidden) return null;

  const size = mobile ? 80 : 120;
  const effectivePose = turning ? 'sit' : pose;
  const flipDir       = pos.dir > 0 ? 'scaleX(-1)' : 'scaleX(1)';

  const bodyAnim =
    pose === 'sleeping'    ? 'porsuk-breathe 3s ease-in-out infinite' :
    pose === 'celebrating' ? 'porsuk-walk 0.6s ease-in-out infinite'  :
    pose === 'running'     ? 'porsuk-body-bob 0.36s linear infinite'  :
    pose === 'walking'     ? 'porsuk-body-bob 0.7s ease-in-out infinite' :
    'none';

  const isRunning = pose === 'running';

  return (
    // pointer-events: none on outer so it doesn't block clicks on other UI
    <div
      style={{
        position: 'fixed',
        bottom: mobile ? 80 : 12,
        left: `calc(${pos.x * 100}%)`,
        width: size,
        height: size,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      {/* clickable inner wrapper */}
      <div
        onClick={onClickPorsuk}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: isRunning
            ? 'transform 80ms linear'
            : 'transform 350ms cubic-bezier(0.34, 1.3, 0.64, 1)',
          transform: `${flipDir}${turning ? ' translateY(-1px)' : ''}`,
          animation: turning ? 'none' : bodyAnim,
        }}
      >
        {/* Speech bubble — counter-flip so it always reads LTR */}
        <div style={{ transform: flipDir }}>
          <SpeechBubble text={speech} mobile={mobile} anger={anger} />
        </div>
        <PorsukSVG
          pose={effectivePose}
          mood={mood}
          mobile={mobile}
          size={size}
          anger={anger}
        />
      </div>
    </div>
  );
}
