import { useState, useEffect, useRef, useCallback } from 'react';
import type { PorsukPose } from './poses';
import { PORSUK_SPEECH, pickRandom, getTimeContext } from './speechCorpus';

interface PosState {
  x: number;
  dir: number;
}

export interface PorsukState {
  pose: PorsukPose;
  mood: string | null;
  speech: string | null;
  anger: number;
  hidden: boolean;
  pos: PosState;
  turning: boolean;
  onClickPorsuk: (e: React.MouseEvent) => void;
}

export function usePorsukState(page?: string): PorsukState {
  const [pose, setPose]     = useState<PorsukPose>('walking');
  const [mood, setMood]     = useState<string | null>(null);
  const [speech, setSpeech] = useState<string | null>(null);
  const [anger, setAnger]   = useState(0);
  const [hidden, setHidden] = useState(false);
  const [pos, setPos]       = useState<PosState>({ x: 0.85, dir: -1 });
  const [turning, setTurning] = useState(false);

  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPage    = useRef<string | undefined>(undefined);

  const say = useCallback((text: string, ms = 3500) => {
    setSpeech(text);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), ms);
  }, []);

  // Page-context bubble on page change
  useEffect(() => {
    if (!page || page === lastPage.current) return;
    lastPage.current = page;
    const msg = PORSUK_SPEECH.pageContext[page];
    if (msg) {
      setPose('sit');
      say(msg, 3000);
      const t = setTimeout(() => setPose('walking'), 3500);
      return () => clearTimeout(t);
    }
  }, [page, say]);

  // Idle cycle — random activity every 28-40 s
  useEffect(() => {
    if (hidden || anger >= 3) return;
    const id = setInterval(() => {
      if (Math.random() < 0.45 && !speech) {
        const ctx = getTimeContext();
        const timeLines = PORSUK_SPEECH.timeContext[ctx];
        const line = Math.random() < 0.3
          ? pickRandom(timeLines)
          : pickRandom(PORSUK_SPEECH.idle);
        say(line, 3000);
      }
      const r = Math.random();
      if      (r < 0.30) setPose('sit');
      else if (r < 0.45) setPose('sleeping');
      else               setPose('walking');
    }, 28000 + Math.random() * 12000);
    return () => clearInterval(id);
  }, [hidden, anger, speech, say]);

  // Anger decay — -1 every 30 s
  useEffect(() => {
    if (anger === 0) return;
    const id = setTimeout(() => setAnger((a) => Math.max(0, a - 1)), 30000);
    return () => clearTimeout(id);
  }, [anger]);

  // Walking position
  useEffect(() => {
    if (pose !== 'walking' && pose !== 'running') return;
    if (turning) return;
    const speed = pose === 'running' ? 0.04 : 0.005;

    const id = setInterval(() => {
      setPos((p) => {
        const nx = p.x + p.dir * speed;
        if (nx < 0.05 || nx > 0.92) {
          const clamped = nx < 0.05 ? 0.05 : 0.92;
          if (!turnTimer.current) {
            setTurning(true);
            turnTimer.current = setTimeout(() => {
              setPos((pp) => ({ x: clamped, dir: -pp.dir }));
              setTimeout(() => {
                setTurning(false);
                turnTimer.current = null;
              }, 380);
            }, 120);
          }
          return { x: clamped, dir: p.dir };
        }
        return { x: nx, dir: p.dir };
      });
    }, 80);

    return () => {
      clearInterval(id);
      if (turnTimer.current) {
        clearTimeout(turnTimer.current);
        turnTimer.current = null;
      }
    };
  }, [pose, turning]);

  const onClickPorsuk = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setAnger((prev) => {
      const next = prev + 1;
      if (next === 1) {
        setPose('sit');
        say(pickRandom(PORSUK_SPEECH.click1));
        setTimeout(() => setPose('walking'), 2800);
      } else if (next === 2) {
        setPose('sit');
        say(pickRandom(PORSUK_SPEECH.click2));
        setTimeout(() => setPose('walking'), 2800);
      } else if (next === 3) {
        setPose('worried');
        say(pickRandom(PORSUK_SPEECH.click3), 4000);
      } else if (next >= 4) {
        setPose('surprised');
        say(pickRandom(PORSUK_SPEECH.click4), 1800);
        setTimeout(() => {
          setPose('running');
          setPos((p) => ({ x: p.x, dir: p.x > 0.5 ? 1 : -1 }));
        }, 800);
        setTimeout(() => {
          setHidden(true);
          setTimeout(() => {
            setHidden(false);
            setMood(null);
            setPose('sit');
            say(pickRandom(PORSUK_SPEECH.peek), 3500);
            setTimeout(() => { setAnger(0); setPose('walking'); }, 4000);
          }, 32000);
        }, 3000);
      }
      return next;
    });
  }, [say]);

  return { pose, mood, speech, anger, hidden, pos, turning, onClickPorsuk };
}
