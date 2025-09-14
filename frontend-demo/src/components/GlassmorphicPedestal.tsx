import type { FC } from "react";

interface GlassmorphicPedestalProps {
  imageUrl: string;
  focused?: boolean;
}

const GlassmorphicPedestal: FC<GlassmorphicPedestalProps> = ({
  imageUrl,
  focused = false,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 ${
        focused ? "scale-100" : "scale-90"
      }`}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt="Pedestal item"
        className="relative z-20 w-40 h-40 object-contain transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105"
      />

      {/* Pedestal */}
      <div className="relative mt-[-40px] z-10">
        {/* bottom layer */}
        <div
          className={`top-8 absolute w-32 h-32 ${
            focused
              ? "bg-[#8D8BF7]"
              : "from-[#555]/20 to-[#888]/10 bg-gradient-to-br"
          } rounded-3xl rotate-z-45 rotate-x-45 transition-all duration-300`}
        />

        {/* top layer */}
        <div
          className={`w-32 h-32 ${
            focused
              ? "bg-[#87A3F7]/20 backdrop-blur-md border-white/30"
              : "bg-white backdrop-blur-sm border-neutral-200"
          } border  rounded-3xl rotate-z-45 rotate-x-45 transition-all duration-300`}
        />
      </div>
    </div>
  );
};

export default GlassmorphicPedestal;
