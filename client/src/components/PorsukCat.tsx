import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useBudget } from "@/contexts/BudgetContext";

type CatState =
  | "walking"
  | "sitting"
  | "grooming"
  | "rolling"
  | "jumping"
  | "sleeping"
  | "stretching"
  | "running";
type Mood = "happy" | "neutral" | "worried" | "angry" | "sleepy";

// Sayfa bazlı tepkiler — i18n key array'leri (string'ler locale dosyalarında)
const PAGE_NS: Record<string, string> = {
  "/": "dashboard",
  "/gelirler": "income",
  "/giderler": "expense",
  "/borclar": "debt",
  "/birikim": "savings",
  "/analitik": "analytics",
  "/taksitler": "installments",
  "/ayarlar": "settings",
  "/ay-arsivi": "archive",
  "/yillik-odemeler": "annual",
};

const pageReactionKeys = (location: string): string[] => {
  const ns = PAGE_NS[location];
  if (!ns) return [];
  return [0, 1, 2].map(i => `porsuk.page.${ns}.${i}`);
};

const moodMessageKeys = (mood: Mood): string[] =>
  [0, 1, 2, 3].map(i => `porsuk.mood.${mood}.${i}`);

function getMoodFromBudget(
  totalIncome: number,
  totalExpense: number,
  totalDebt: number
): Mood {
  if (totalIncome === 0 && totalExpense === 0) return "sleepy";
  const ratio = totalExpense / (totalIncome || 1);
  if (totalDebt > totalIncome * 3) return "angry";
  if (ratio > 0.95) return "worried";
  if (ratio > 0.75) return "neutral";
  return "happy";
}

const MOOD_COLORS: Record<Mood, string> = {
  happy: "#10B981",
  neutral: "#6B7280",
  worried: "#F59E0B",
  angry: "#EF4444",
  sleepy: "#8B5CF6",
};

const MOOD_EMOJIS: Record<Mood, string> = {
  happy: "😸",
  neutral: "🐱",
  worried: "😟",
  angry: "😾",
  sleepy: "😴",
};

export function PorsukCat() {
  const { t } = useTranslation();
  const [posX, setPosX] = useState(-120);
  const [facingRight, setFacingRight] = useState(true);
  const [catState, setCatState] = useState<CatState>("walking");
  const [meowText, setMeowText] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("neutral");
  const [showMoodBadge, setShowMoodBadge] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const posXRef = useRef(-120);
  const facingRef = useRef(true);
  const stateRef = useRef<CatState>("walking");
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const stateTimerRef = useRef<number>(0);
  const meowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moodBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [location] = useLocation();
  const { budgetData } = useBudget();

  const screenWidth = typeof window !== "undefined" ? window.innerWidth : 400;

  // Bütçe durumuna göre ruh halini hesapla
  useEffect(() => {
    const totalIncome = budgetData.incomes.reduce(
      (s, i) => s + (i.amount || 0),
      0
    );
    const totalExpense = budgetData.expenses.reduce(
      (s, e) => s + (e.amount || 0),
      0
    );
    const totalDebt = (budgetData.debts || []).reduce(
      (s, d) => s + (d.totalDebt || 0),
      0
    );
    const newMood = getMoodFromBudget(totalIncome, totalExpense, totalDebt);
    setMood(newMood);
  }, [budgetData]);

  const pickNextState = (
    current: CatState
  ): { state: CatState; duration: number } => {
    const roll = Math.random();
    const isSleepy = mood === "sleepy";
    const isAngry = mood === "angry";

    if (current === "walking" || current === "running") {
      if (isSleepy && roll < 0.4)
        return { state: "sleeping", duration: 5000 + Math.random() * 4000 };
      if (isAngry && roll < 0.3)
        return { state: "running", duration: 2000 + Math.random() * 1500 };
      if (roll < 0.25)
        return { state: "sitting", duration: 3000 + Math.random() * 3000 };
      if (roll < 0.38)
        return { state: "grooming", duration: 2000 + Math.random() * 2000 };
      if (roll < 0.48)
        return { state: "rolling", duration: 2500 + Math.random() * 2000 };
      if (roll < 0.55)
        return { state: "stretching", duration: 2000 + Math.random() * 1500 };
      return { state: "walking", duration: 4000 + Math.random() * 4000 };
    }
    // After any idle state, go back to walking
    return { state: "walking", duration: 4000 + Math.random() * 4000 };
  };

  useEffect(() => {
    let stateDuration = 5000;

    const loop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      stateTimerRef.current += dt;

      const isMoving =
        stateRef.current === "walking" || stateRef.current === "running";
      if (isMoving) {
        const speed = stateRef.current === "running" ? 0.18 : 0.06;
        const newX =
          posXRef.current + (facingRef.current ? speed * dt : -speed * dt);
        const catWidth = 90;

        if (newX > screenWidth + catWidth) {
          posXRef.current = -catWidth;
          setFacingRight(true);
          facingRef.current = true;
        } else if (newX < -catWidth) {
          posXRef.current = screenWidth + catWidth;
          setFacingRight(false);
          facingRef.current = false;
        } else {
          posXRef.current = newX;
        }
        setPosX(posXRef.current);
      }

      if (stateTimerRef.current > stateDuration) {
        stateTimerRef.current = 0;
        const next = pickNextState(stateRef.current);
        stateDuration = next.duration;
        stateRef.current = next.state;
        setCatState(next.state);

        if (
          (next.state === "walking" || next.state === "running") &&
          Math.random() < 0.4
        ) {
          facingRef.current = !facingRef.current;
          setFacingRight(facingRef.current);
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(now => {
      lastTimeRef.current = now;
      loop(now);
    });

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [screenWidth, mood]);

  const playMeow = useCallback((angry = false) => {
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      if (angry) {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, []);

  const handleClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 5 kez tıklayınca öfkelenir
    const isAngryClick = newCount >= 5;
    if (isAngryClick) {
      setClickCount(0);
      setMood("angry");
      stateRef.current = "running";
      setCatState("running");
      playMeow(true);
      setMeowText(t("porsuk.angry_click"));
      if (meowTimerRef.current) clearTimeout(meowTimerRef.current);
      meowTimerRef.current = setTimeout(() => {
        setMeowText(null);
        stateRef.current = "walking";
        setCatState("walking");
      }, 2000);
      return;
    }

    // Sayfa bazlı tepki veya ruh hali mesajı (i18n key'leri seçilir, t() ile çevrilir)
    const allKeys = [...pageReactionKeys(location), ...moodMessageKeys(mood)];
    const key = allKeys[Math.floor(Math.random() * allKeys.length)];

    setMeowText(t(key));
    stateRef.current = "jumping";
    setCatState("jumping");
    playMeow(false);

    if (meowTimerRef.current) clearTimeout(meowTimerRef.current);
    meowTimerRef.current = setTimeout(() => {
      setMeowText(null);
      stateRef.current = "walking";
      setCatState("walking");
    }, 1800);
  }, [clickCount, location, mood, playMeow]);

  // Ruh hali badge'ini göster (hover'da)
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    setShowMoodBadge(true);
    if (moodBadgeTimerRef.current) clearTimeout(moodBadgeTimerRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    moodBadgeTimerRef.current = setTimeout(() => setShowMoodBadge(false), 1500);
  }, []);

  const isWalking = catState === "walking";
  const isSitting = catState === "sitting";
  const isGrooming = catState === "grooming";
  const isRolling = catState === "rolling";
  const isJumping = catState === "jumping";
  const isSleeping = catState === "sleeping";
  const isStretching = catState === "stretching";
  const isRunning = catState === "running";

  const moodColor = MOOD_COLORS[mood];
  const moodEmoji = MOOD_EMOJIS[mood];

  // Göz rengi ruh haline göre değişir
  const eyeColor =
    mood === "angry"
      ? "#EF4444"
      : mood === "worried"
        ? "#F59E0B"
        : mood === "happy"
          ? "#10B981"
          : "#D4C44A";

  const bottomOffset = isRolling || isSleeping ? 8 : isStretching ? 4 : 0;

  return (
    <div
      style={{
        position: "fixed",
        bottom: bottomOffset,
        left: posX,
        zIndex: 9999,
        cursor: "pointer",
        userSelect: "none",
        filter: isHovered ? "drop-shadow(0 0 6px rgba(0,0,0,0.3))" : "none",
        transition: "filter 0.2s",
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`Porsuk - ${t(`porsuk.mood_label.${mood}`)}`}
    >
      {/* Ruh hali badge */}
      {showMoodBadge && (
        <div
          style={{
            position: "absolute",
            bottom: isSitting || isGrooming || isSleeping ? 90 : 88,
            left: facingRight ? 5 : -15,
            background: moodColor,
            borderRadius: 20,
            padding: "2px 7px",
            fontSize: 10,
            fontWeight: 700,
            color: "white",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            animation: "porsukMoodIn 0.3s ease-out",
          }}
        >
          {moodEmoji} {t(`porsuk.mood_label.${mood}`)}
        </div>
      )}

      {/* Meow bubble */}
      {meowText && (
        <div
          style={{
            position: "absolute",
            bottom: isSitting || isGrooming ? 90 : 88,
            left: facingRight ? 10 : -50,
            background: "white",
            border: `2px solid ${moodColor}`,
            borderRadius: 12,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            color: "#333",
            animation: "porsukMeow 0.3s ease-out",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {meowText}
          <div
            style={{
              position: "absolute",
              bottom: -8,
              left: 14,
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `8px solid ${moodColor}`,
            }}
          />
        </div>
      )}

      {/* Name tag */}
      <div
        style={{
          position: "absolute",
          bottom:
            isRolling || isSleeping
              ? 58
              : isSitting || isGrooming || isStretching
                ? 72
                : 78,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 9,
          fontWeight: 700,
          color: moodColor,
          letterSpacing: 1,
          opacity: 0.9,
          whiteSpace: "nowrap",
          transition: "color 0.5s",
        }}
      >
        PORSUK
      </div>

      {/* Cat SVG */}
      <svg
        width="90"
        height="80"
        viewBox="0 0 90 80"
        style={{
          transform: facingRight ? "scaleX(1)" : "scaleX(-1)",
          animation: isWalking
            ? "porsukWalk 0.4s steps(1) infinite"
            : isRunning
              ? "porsukRun 0.2s steps(1) infinite"
              : isJumping
                ? "porsukJump 0.5s ease-out"
                : isRolling
                  ? "porsukRoll 1.5s ease-in-out infinite"
                  : isSitting
                    ? "porsukSit 2s ease-in-out infinite"
                    : isGrooming
                      ? "porsukGroom 0.8s ease-in-out infinite"
                      : isSleeping
                        ? "porsukSleep 3s ease-in-out infinite"
                        : isStretching
                          ? "porsukStretch 2s ease-in-out"
                          : "none",
          display: "block",
        }}
      >
        <defs>
          <pattern
            id="tabbyStripe"
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="#8B7355" />
            <rect width="2" height="6" fill="#5C4A2A" />
          </pattern>
        </defs>

        {isRolling || isSleeping ? (
          // Rolling / Sleeping pose - curled up ball
          <g transform="translate(10, 10)">
            <ellipse cx="35" cy="38" rx="28" ry="22" fill="#8B7355" />
            <ellipse
              cx="35"
              cy="38"
              rx="28"
              ry="22"
              fill="url(#tabbyStripe)"
              opacity="0.5"
            />
            <ellipse
              cx="35"
              cy="42"
              rx="18"
              ry="12"
              fill="#C4A882"
              opacity="0.7"
            />
            <ellipse cx="52" cy="22" rx="16" ry="14" fill="#8B7355" />
            <ellipse
              cx="52"
              cy="22"
              rx="16"
              ry="14"
              fill="url(#tabbyStripe)"
              opacity="0.4"
            />
            <polygon points="42,12 38,2 48,10" fill="#8B7355" />
            <polygon points="43,11 40,4 47,10" fill="#C47A7A" opacity="0.6" />
            <polygon points="60,10 64,1 56,9" fill="#8B7355" />
            <polygon points="60,10 63,3 57,9" fill="#C47A7A" opacity="0.6" />
            {/* Eyes closed */}
            <path
              d="M46 22 Q49 20 52 22"
              stroke="#333"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M54 22 Q57 20 60 22"
              stroke="#333"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Sleeping Z */}
            {isSleeping && (
              <>
                <text
                  x="68"
                  y="8"
                  fontSize="8"
                  fill="#8B5CF6"
                  fontWeight="bold"
                  opacity="0.8"
                >
                  z
                </text>
                <text
                  x="74"
                  y="3"
                  fontSize="6"
                  fill="#8B5CF6"
                  fontWeight="bold"
                  opacity="0.6"
                >
                  z
                </text>
              </>
            )}
            <ellipse cx="52" cy="26" rx="2" ry="1.5" fill="#D4887A" />
            <path
              d="M10 50 Q5 30 20 20 Q30 15 35 25"
              stroke="#7A6245"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M10 50 Q5 30 20 20 Q30 15 35 25"
              stroke="#8B7355"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="22" cy="56" rx="8" ry="5" fill="#8B7355" />
            <ellipse cx="48" cy="58" rx="8" ry="5" fill="#8B7355" />
          </g>
        ) : isStretching ? (
          // Stretching pose - body elongated, butt up
          <g transform="translate(5, 5)">
            <ellipse cx="40" cy="55" rx="30" ry="12" fill="#8B7355" />
            <ellipse
              cx="40"
              cy="55"
              rx="30"
              ry="12"
              fill="url(#tabbyStripe)"
              opacity="0.45"
            />
            <ellipse
              cx="40"
              cy="58"
              rx="20"
              ry="7"
              fill="#C4A882"
              opacity="0.65"
            />
            {/* Front paws stretched forward */}
            <ellipse cx="18" cy="65" rx="7" ry="4" fill="#7A6245" />
            <ellipse cx="28" cy="67" rx="7" ry="4" fill="#7A6245" />
            {/* Back paws up */}
            <ellipse cx="55" cy="48" rx="7" ry="4" fill="#8B7355" />
            <ellipse cx="65" cy="46" rx="7" ry="4" fill="#8B7355" />
            {/* Head low */}
            <ellipse cx="15" cy="48" rx="14" ry="12" fill="#8B7355" />
            <ellipse
              cx="15"
              cy="48"
              rx="14"
              ry="12"
              fill="url(#tabbyStripe)"
              opacity="0.4"
            />
            <polygon points="6,38 3,28 12,36" fill="#8B7355" />
            <polygon points="7,37 5,30 11,35" fill="#C47A7A" opacity="0.6" />
            <polygon points="22,36 25,26 18,35" fill="#8B7355" />
            <polygon points="22,36 24,28 19,35" fill="#C47A7A" opacity="0.6" />
            <ellipse cx="10" cy="47" rx="3" ry="3.5" fill={eyeColor} />
            <ellipse cx="10" cy="47" rx="1.5" ry="3" fill="#1A1A1A" />
            <ellipse cx="20" cy="47" rx="3" ry="3.5" fill={eyeColor} />
            <ellipse cx="20" cy="47" rx="1.5" ry="3" fill="#1A1A1A" />
            <ellipse cx="15" cy="52" rx="2" ry="1.5" fill="#D4887A" />
            {/* Tail up */}
            <path
              d="M72 50 Q82 35 75 20"
              stroke="#7A6245"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M72 50 Q82 35 75 20"
              stroke="#8B7355"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : isSitting || isGrooming ? (
          // Sitting pose
          <g transform="translate(5, 5)">
            <ellipse cx="40" cy="52" rx="22" ry="20" fill="#8B7355" />
            <ellipse
              cx="40"
              cy="52"
              rx="22"
              ry="20"
              fill="url(#tabbyStripe)"
              opacity="0.45"
            />
            <ellipse
              cx="40"
              cy="56"
              rx="14"
              ry="12"
              fill="#C4A882"
              opacity="0.65"
            />
            <ellipse cx="30" cy="68" rx="7" ry="5" fill="#8B7355" />
            <ellipse cx="50" cy="68" rx="7" ry="5" fill="#8B7355" />
            {isGrooming && (
              <ellipse
                cx="55"
                cy="42"
                rx="6"
                ry="4"
                fill="#8B7355"
                transform="rotate(-30, 55, 42)"
              />
            )}
            <ellipse cx="40" cy="28" rx="18" ry="16" fill="#8B7355" />
            <ellipse
              cx="40"
              cy="28"
              rx="18"
              ry="16"
              fill="url(#tabbyStripe)"
              opacity="0.4"
            />
            <polygon points="26,16 22,4 34,14" fill="#8B7355" />
            <polygon points="27,15 24,6 33,13" fill="#C47A7A" opacity="0.6" />
            <polygon points="52,14 56,3 44,13" fill="#8B7355" />
            <polygon points="52,14 55,5 45,13" fill="#C47A7A" opacity="0.6" />
            {/* Eyes with mood color */}
            <ellipse cx="33" cy="27" rx="4" ry="4.5" fill={eyeColor} />
            <ellipse cx="33" cy="27" rx="2" ry="4" fill="#1A1A1A" />
            <ellipse cx="47" cy="27" rx="4" ry="4.5" fill={eyeColor} />
            <ellipse cx="47" cy="27" rx="2" ry="4" fill="#1A1A1A" />
            <ellipse cx="32" cy="26" rx="1" ry="1" fill="white" />
            <ellipse cx="46" cy="26" rx="1" ry="1" fill="white" />
            {/* Angry eyebrows */}
            {mood === "angry" && (
              <>
                <line
                  x1="29"
                  y1="22"
                  x2="37"
                  y2="24"
                  stroke="#333"
                  strokeWidth="1.5"
                />
                <line
                  x1="43"
                  y1="24"
                  x2="51"
                  y2="22"
                  stroke="#333"
                  strokeWidth="1.5"
                />
              </>
            )}
            <ellipse cx="40" cy="33" rx="2.5" ry="2" fill="#D4887A" />
            <path
              d="M38 35 Q40 37 42 35"
              stroke="#9A6655"
              strokeWidth="1"
              fill="none"
            />
            <line
              x1="20"
              y1="32"
              x2="36"
              y2="33"
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="20"
              y1="35"
              x2="36"
              y2="35"
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="44"
              y1="33"
              x2="60"
              y2="32"
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="44"
              y1="35"
              x2="60"
              y2="35"
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <path
              d="M60 60 Q75 45 70 30"
              stroke="#7A6245"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M60 60 Q75 45 70 30"
              stroke="#8B7355"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : (
          // Walking / running / jumping pose
          <g transform="translate(5, 5)">
            <ellipse
              cx="42"
              cy={isJumping ? "42" : "48"}
              rx="24"
              ry="17"
              fill="#8B7355"
            />
            <ellipse
              cx="42"
              cy={isJumping ? "42" : "48"}
              rx="24"
              ry="17"
              fill="url(#tabbyStripe)"
              opacity="0.45"
            />
            <ellipse
              cx="42"
              cy={isJumping ? "46" : "52"}
              rx="14"
              ry="9"
              fill="#C4A882"
              opacity="0.65"
            />
            <rect
              x="28"
              y={isJumping ? "52" : "58"}
              width="7"
              height={isJumping ? "10" : "14"}
              rx="3"
              fill="#8B7355"
              className="porsuk-leg-front"
            />
            <rect
              x="48"
              y={isJumping ? "52" : "58"}
              width="7"
              height={isJumping ? "10" : "14"}
              rx="3"
              fill="#8B7355"
              className="porsuk-leg-back"
            />
            <ellipse
              cx="31"
              cy={isJumping ? "63" : "72"}
              rx="5"
              ry="3.5"
              fill="#7A6245"
            />
            <ellipse
              cx="51"
              cy={isJumping ? "63" : "72"}
              rx="5"
              ry="3.5"
              fill="#7A6245"
            />
            <ellipse
              cx="62"
              cy={isJumping ? "24" : "28"}
              rx="17"
              ry="15"
              fill="#8B7355"
            />
            <ellipse
              cx="62"
              cy={isJumping ? "24" : "28"}
              rx="17"
              ry="15"
              fill="url(#tabbyStripe)"
              opacity="0.4"
            />
            <polygon points="50,16 46,4 57,14" fill="#8B7355" />
            <polygon points="51,15 48,6 56,13" fill="#C47A7A" opacity="0.6" />
            <polygon points="73,13 77,2 65,12" fill="#8B7355" />
            <polygon points="73,13 76,4 66,12" fill="#C47A7A" opacity="0.6" />
            {/* Eyes with mood color */}
            <ellipse
              cx="56"
              cy={isJumping ? "23" : "27"}
              rx="4"
              ry="4.5"
              fill={eyeColor}
            />
            <ellipse
              cx="56"
              cy={isJumping ? "23" : "27"}
              rx="2"
              ry="4"
              fill="#1A1A1A"
            />
            <ellipse
              cx="69"
              cy={isJumping ? "23" : "27"}
              rx="4"
              ry="4.5"
              fill={eyeColor}
            />
            <ellipse
              cx="69"
              cy={isJumping ? "23" : "27"}
              rx="2"
              ry="4"
              fill="#1A1A1A"
            />
            <ellipse
              cx="55"
              cy={isJumping ? "22" : "26"}
              rx="1"
              ry="1"
              fill="white"
            />
            <ellipse
              cx="68"
              cy={isJumping ? "22" : "26"}
              rx="1"
              ry="1"
              fill="white"
            />
            {/* Angry eyebrows */}
            {mood === "angry" && (
              <>
                <line
                  x1="52"
                  y1={isJumping ? "18" : "22"}
                  x2="60"
                  y2={isJumping ? "20" : "24"}
                  stroke="#333"
                  strokeWidth="1.5"
                />
                <line
                  x1="65"
                  y1={isJumping ? "20" : "24"}
                  x2="73"
                  y2={isJumping ? "18" : "22"}
                  stroke="#333"
                  strokeWidth="1.5"
                />
              </>
            )}
            <ellipse
              cx="62"
              cy={isJumping ? "29" : "33"}
              rx="2.5"
              ry="2"
              fill="#D4887A"
            />
            <path
              d={`M60 ${isJumping ? 31 : 35} Q62 ${isJumping ? 33 : 37} 64 ${isJumping ? 31 : 35}`}
              stroke="#9A6655"
              strokeWidth="1"
              fill="none"
            />
            <line
              x1="42"
              y1={isJumping ? "31" : "32"}
              x2="58"
              y2={isJumping ? "32" : "33"}
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="42"
              y1={isJumping ? "34" : "35"}
              x2="58"
              y2={isJumping ? "34" : "35"}
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="66"
              y1={isJumping ? "32" : "33"}
              x2="82"
              y2={isJumping ? "31" : "32"}
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            <line
              x1="66"
              y1={isJumping ? "34" : "35"}
              x2="82"
              y2={isJumping ? "34" : "35"}
              stroke="white"
              strokeWidth="0.8"
              opacity="0.9"
            />
            {/* Running speed lines */}
            {isRunning && (
              <>
                <line
                  x1="0"
                  y1="40"
                  x2="15"
                  y2="40"
                  stroke="#aaa"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <line
                  x1="0"
                  y1="50"
                  x2="12"
                  y2="50"
                  stroke="#aaa"
                  strokeWidth="1"
                  opacity="0.4"
                />
              </>
            )}
            <path
              d={isJumping ? "M20 40 Q5 25 15 10" : "M18 50 Q5 38 12 22"}
              stroke="#7A6245"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={isJumping ? "M20 40 Q5 25 15 10" : "M18 50 Q5 38 12 22"}
              stroke="#8B7355"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>

      <style>{`
        @keyframes porsukWalk {
          0%, 100% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px); }
          50% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-2px); }
        }
        @keyframes porsukRun {
          0%, 100% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px); }
          50% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-4px); }
        }
        @keyframes porsukJump {
          0% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px); }
          30% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-22px); }
          60% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-14px); }
          80% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-4px); }
          100% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px); }
        }
        @keyframes porsukRoll {
          0% { transform: scaleX(${facingRight ? 1 : -1}) rotate(0deg) translateY(0px); }
          20% { transform: scaleX(${facingRight ? 1 : -1}) rotate(20deg) translateY(-3px); }
          40% { transform: scaleX(${facingRight ? 1 : -1}) rotate(-15deg) translateY(2px); }
          60% { transform: scaleX(${facingRight ? 1 : -1}) rotate(18deg) translateY(-2px); }
          80% { transform: scaleX(${facingRight ? 1 : -1}) rotate(-8deg) translateY(1px); }
          100% { transform: scaleX(${facingRight ? 1 : -1}) rotate(0deg) translateY(0px); }
        }
        @keyframes porsukSit {
          0%, 100% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px); }
          50% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-1px); }
        }
        @keyframes porsukGroom {
          0%, 100% { transform: scaleX(${facingRight ? 1 : -1}) rotate(0deg); }
          25% { transform: scaleX(${facingRight ? 1 : -1}) rotate(-3deg); }
          75% { transform: scaleX(${facingRight ? 1 : -1}) rotate(3deg); }
        }
        @keyframes porsukSleep {
          0%, 100% { transform: scaleX(${facingRight ? 1 : -1}) translateY(0px) scale(1); }
          50% { transform: scaleX(${facingRight ? 1 : -1}) translateY(-1px) scale(1.02); }
        }
        @keyframes porsukStretch {
          0% { transform: scaleX(${facingRight ? 1 : -1}) scaleX(1); }
          30% { transform: scaleX(${facingRight ? 1 : -1}) scaleX(1.15); }
          60% { transform: scaleX(${facingRight ? 1 : -1}) scaleX(0.95); }
          100% { transform: scaleX(${facingRight ? 1 : -1}) scaleX(1); }
        }
        @keyframes porsukMeow {
          0% { transform: scale(0.5) translateY(5px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes porsukMoodIn {
          0% { transform: scale(0.8) translateY(3px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
