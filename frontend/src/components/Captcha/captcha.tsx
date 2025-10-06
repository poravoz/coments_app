import React, { useState, useEffect, useRef } from "react";
import { RefreshCcw } from "lucide-react";
import "./Captcha.css";
import { useCaptchaStore } from "../../store/useCaptchaStore";

interface CaptchaProps {
  value: string;
  onChange: (val: string) => void;
  onValidate?: (valid: boolean | null) => void;
  onTokenChange?: (token: string) => void;
}

export const Captcha: React.FC<CaptchaProps> = ({ 
  value, 
  onChange, 
  onValidate, 
  onTokenChange 
}) => {
  const [captchaStr, setCaptchaStr] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSuccessfulValueRef = useRef<string>("");

  const { generateCaptcha, validateCaptcha, checkToken } = useCaptchaStore();

  const fetchCaptcha = async () => {
    setIsLoading(true);
    try {
      const { text, token } = await generateCaptcha();
      setCaptchaStr(text);
      setCaptchaToken(token);
      onTokenChange?.(token);
      setIsValid(null);
      onChange("");
      lastSuccessfulValueRef.current = "";
      onValidate?.(null);
    } catch (err) {
      console.error("Failed to fetch captcha:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const refreshCaptcha = () => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    fetchCaptcha();
  };

  const handleInputChange = async (newValue: string) => {
    onChange(newValue);
    
    if (isValid !== null) {
      setIsValid(null);
      onValidate?.(null);
    }

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    if (newValue.length === captchaStr.length && newValue.length > 0) {
      validationTimeoutRef.current = setTimeout(async () => {
        try {
          const tokenValid = await checkToken(captchaToken);
          if (!tokenValid) {
            refreshCaptcha();
            return;
          }

          const valid = await validateCaptcha(captchaToken, newValue);
          
          setIsValid(valid);
          onValidate?.(valid);
          
          if (valid) {
            lastSuccessfulValueRef.current = newValue;
          }
        } catch (error) {
          console.error("CAPTCHA validation error:", error);
          setIsValid(false);
          onValidate?.(false);
        }
      }, 500); 
    }
  };

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const getCharTransform = (index: number) => {
    const rotations = [-12, 8, -15, 10, -8, 12, -10, 6];
    const scales = [1.15, 0.85, 1.2, 0.9, 1.1, 0.95, 1.25, 0.8];
    const opacities = [0.7, 0.85, 0.6, 0.9, 0.75, 0.8, 0.65, 0.95];
    const blurs = [0.4, 0.15, 0.5, 0.1, 0.35, 0.2, 0.45, 0.05];
    const xTranslate = [-1, 2, -3, 1, -2, 3, -1, 2];
    const yTranslate = [1, -2, 3, -1, 2, -3, 1, -2];
    
    const i = index % 8;
    
    return {
      transform: `rotate(${rotations[i]}deg) scale(${scales[i]}) translate(${xTranslate[i]}px, ${yTranslate[i]}px)`,
      opacity: opacities[i],
      filter: `blur(${blurs[i]}px) contrast(1.2) brightness(${0.9 + Math.random() * 0.2})`
    };
  };

  return (
    <div className="captcha-container">
      <div className="captcha-header">
        <p className="captcha-label">Enter the CAPTCHA</p>
        <button
          type="button"
          className="captcha-refresh"
          onClick={refreshCaptcha}
          disabled={isLoading}
          aria-label="Refresh captcha"
        >
          <RefreshCcw size={16} />
        </button>
      </div>
      
      <div className="captcha-box">
        <div className="captcha-text">
          {captchaStr.split("").map((char, i) => (
            <span
              key={i}
              className="captcha-char"
              style={getCharTransform(i)}
            >
              {char}
            </span>
          ))}
        </div>
        <div className="noise-overlay"></div>
      </div>

      <input
        type="text"
        className={`captcha-input ${isValid === false ? "error" : ""} ${isValid === true ? "success" : ""}`}
        placeholder="Type the characters above"
        value={value}
        onChange={(e) => handleInputChange(e.target.value.toUpperCase())}
        disabled={isLoading}
        maxLength={captchaStr.length}
      />
    </div>
  );
};