import React from "react";
import Button from "./Button";

interface ModelCardProps {
  title: string;
  subtitle: string;
  date: string;
  handleClick?: () => void;
  imageUrl: string;
  focused?: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({
  title,
  subtitle,
  date,
  handleClick,
  imageUrl,
  focused,
}) => {
  return (
    <div
      onClick={handleClick}
      className={`group w-80 h-80 ${
        focused ? "shadow-xl" : "scale-90 opacity-50 shadow-sm"
      } relative flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-clip active:scale-[98%] duration-300`}
    >
      <div className="flex flex-col bg-linear-to-b from-[#86A8FF] to-[#8F98FA] items-start gap-2 p-4 text-white shadow border-b border-b-[#8CABFF]">
        <div className="w-full flex justify-between items-center ">
          <p>{title}</p>
          <p>{date}</p>
        </div>
        <p className="font-light text-sm">{subtitle}</p>
      </div>

      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-contain drop-shadow-2xl group-hover:-translate-y-2 group-hover:scale-105 transition-transform duration-300"
      />
      <Button
        handleClick={handleClick}
        className="absolute bottom-4 right-4 active:scale-100"
      >
        Open
      </Button>
    </div>
  );
};

export default ModelCard;
