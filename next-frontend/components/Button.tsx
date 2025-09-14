import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  handleClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  handleClick,
}) => {
  return (
    <button
      className={`rounded-md bg-white border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-50 active:scale-95 px-4 py-2 flex items-center ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default Button;
