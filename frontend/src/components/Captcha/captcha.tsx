import React, { useState, useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import "./Captcha.css";

export type CaptchaChar = {
  char: string;
  rotate: number;
  translateY: number;
  skewX: number;
};

interface CaptchaProps {
  value: string;
  onChange: (val: string) => void;
  onValidate?: (valid: boolean) => void;
}

function generateCaptchaStr() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createCaptchaChars(s: string): CaptchaChar[] {
  return s.split("").map((ch) => ({
    char: ch,
    rotate: Math.round(rand(-25, 25)),
    translateY: Math.round(rand(-6, 6)),
    skewX: Math.round(rand(-8, 8)),
  }));
}

export const Captcha: React.FC<CaptchaProps> = ({ value, onChange, onValidate }) => {
  const initialCaptcha = generateCaptchaStr();
  const [captchaStr, setCaptchaStr] = useState(initialCaptcha);
  const [captchaChars, setCaptchaChars] = useState<CaptchaChar[]>(() =>
    createCaptchaChars(initialCaptcha)
  );
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const refreshCaptcha = () => {
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
      <div className="captcha-box" aria-hidden>
        <div className="captcha-text" aria-hidden>
          {captchaChars.map((c, i) => (
            <span
              key={i}
              className="captcha-char"
              style={{
                transform: `rotate(${c.rotate}deg) translateY(${c.translateY}px) skewX(${c.skewX}deg)`,
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
        aria-label="Captcha input"
      />
      {isValid === false && (
        <p className="captcha-error">Invalid CAPTCHA. Please try again.</p>
      )}
    </div>
  );
};
