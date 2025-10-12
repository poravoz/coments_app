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
  const [captchaStyles, setCaptchaStyles] = useState<React.CSSProperties[]>([]);
  
  const fetchCaptcha = async () => {
    setIsLoading(true);
    try {
      const { text, token } = await generateCaptcha();
      setCaptchaStr(text);
      setCaptchaToken(token);
      onTokenChange?.(token);
      
      setCaptchaStyles(text.split("").map(() => getCharTransform()));
  
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

  const getCharTransform = () => {
    const rotation = (Math.random() - 0.5) * 40; 
    const scale = 0.8 + Math.random() * 0.6; 
    const opacity = 0.5 + Math.random() * 0.5; 
    const blur = Math.random() * 0.6;
    const xTranslate = (Math.random() - 0.5) * 6; 
    const yTranslate = (Math.random() - 0.5) * 6; 
    const hueRotate = Math.random() * 40 - 20; 

    return {
      transform: `rotate(${rotation}deg) scale(${scale}) translate(${xTranslate}px, ${yTranslate}px)`,
      opacity,
      filter: `blur(${blur}px) contrast(1.3) hue-rotate(${hueRotate}deg)`
    };
  };

  return (
    <div className="captcha-container">
      <p className="captcha-label">Enter the CAPTCHA</p>

      <div className="captcha-box">
        <div className="captcha-text">
        {captchaStr.split("").map((char, i) => (
          <span key={i} className="captcha-char" style={captchaStyles[i]}>
            {char}
          </span>
        ))}
        </div>

        <button
          type="button"
          className="captcha-refresh"
          onClick={refreshCaptcha}
          disabled={isLoading}
          aria-label="Refresh captcha"
        >
          <RefreshCcw size={16} />
        </button>

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
