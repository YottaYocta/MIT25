import type { FC } from "react";

interface GlassmorphicPedestalProps {
  imageUrl: string;
  focused?: boolean;
  handleClick?: () => void;
}

const GlassmorphicPedestal: FC<GlassmorphicPedestalProps> = ({
  imageUrl,
  focused = false,
  handleClick,
}) => {
  return (
    <button
      onClick={handleClick}
      className={`min-w-40 group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
        focused ? "scale-100" : "scale-90"
      }`}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt="Pedestal item"
        className="bottom-32 relative z-20 w-40 h-40 object-contain transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105"
      />

      {/* Glassmorphic Top Layer */}
      <div
        className={`group-active:bottom-8 bottom-12 absolute w-28 h-28 ${
          focused
            ? "bg-[#87A3F7]/20 backdrop-blur-md border-white/30"
            : "bg-white backdrop-blur-sm border-neutral-200"
        } border rounded-4xl rotate-z-45 rotate-x-45 transition-all duration-300`}
      />

      {/* Bottom Solid Layer */}
      <div
        className={`bottom-0 -z-10 absolute w-32 h-32 ${
          focused
            ? "bg-[#8D8BF7]"
            : "from-[#555]/20 to-[#888]/10 bg-linear-to-br"
        } rounded-3xl rotate-z-45 rotate-x-45 transition-all duration-300`}
      />
    </button>
  );
};

export default GlassmorphicPedestal;
