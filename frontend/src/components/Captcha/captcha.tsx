import React, { useState, useEffect, useMemo } from "react";
import { RefreshCcw } from "lucide-react";
import "./Captcha.css";

export type CaptchaChar = {
  char: string;
  rotate: number;
  translateY: number;
  skewX: number;
  color: string;
};

interface CaptchaProps {
  value: string;
  onChange: (val: string) => void;
  onValidate?: (valid: boolean) => void;
}

function generateCaptchaStr(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomColor(): string {
  const colors = ["#fff", "#f2f2f2", "#dcdcdc", "#e6e6e6"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createCaptchaChars(s: string): CaptchaChar[] {
  return s.split("").map((ch) => ({
    char: ch,
    rotate: Math.round(rand(-25, 25)),
    translateY: Math.round(rand(-6, 6)),
    skewX: Math.round(rand(-8, 8)),
    color: randomColor(),
  }));
}

export const Captcha: React.FC<CaptchaProps> = ({ value, onChange, onValidate }) => {
  const initial = useMemo(() => generateCaptchaStr(), []);
  const [captchaStr, setCaptchaStr] = useState(initial);
  const [captchaChars, setCaptchaChars] = useState<CaptchaChar[]>(() =>
    createCaptchaChars(initial)
  );
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const refreshCaptcha = (): void => {
    const s = generateCaptchaStr();
    setCaptchaStr(s);
    setCaptchaChars(createCaptchaChars(s));
    onChange("");
    setIsValid(null);
    onValidate?.(false);
  };

  useEffect(() => {
    if (value === "") {
      setIsValid(null);
    } else {
      const valid = value.toUpperCase() === captchaStr;
      setIsValid(valid);
      onValidate?.(valid);
    }
  }, [value, captchaStr, onValidate]);

  return (
    <div className="captcha-container">
      <div className="captcha-box">
        <canvas className="captcha-bg" width="180" height="50" />
        <div className="captcha-text">
          {captchaChars.map((c, i) => (
            <span
              key={i}
              className="captcha-char"
              style={{
                transform: `rotate(${c.rotate}deg) translateY(${c.translateY}px) skewX(${c.skewX}deg)`,
                color: c.color,
              }}
            >
              {c.char}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="captcha-refresh"
          onClick={refreshCaptcha}
          aria-label="Refresh captcha"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <input
        type="text"
        className={`captcha-input ${isValid === false ? "error" : ""}`}
        placeholder="Enter the text above"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
      />
      {isValid === false && (
        <p className="captcha-error">Invalid CAPTCHA. Please try again.</p>
      )}
    </div>
  );
};
