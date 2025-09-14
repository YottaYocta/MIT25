import React, { useState } from "react";

interface FloatingInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  value = "",
  onChange,
  type = "text",
  className,
}) => {
  const [focused, setFocused] = useState(false);

  const showFloating = focused || value.length > 0;

  return (
    <div
      className={`relative w-full border border-neutral-200 rounded-md bg-white px-4 pt-4 pb-2 transition-all focus-within:shadow-sm ${className}`}
    >
      {/* Label */}
      <label
        className={`absolute left-4 transition-all duration-200 text-sm ${
          showFloating
            ? "top-1 text-xs text-neutral-500"
            : "top-4 text-neutral-400"
        } pointer-events-none`}
      >
        {label}
      </label>

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-none outline-none text-sm mt-2"
      />
    </div>
  );
};

export default FloatingInput;
