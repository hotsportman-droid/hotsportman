
import React, { useState } from "react";
import { UserIcon } from "./icons";

interface Props {
  className?: string;
  size?: number;
  showHologram?: boolean;
}

export const DrRakSvgAvatar: React.FC<Props> = ({
  className = "",
  size = 200,
  showHologram = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Configuration for Female Doctor:
  // - seed: DrRakOfficial -> Ensures consistent face
  // - top: longHairStraight -> Female look
  // - accessories: prescription02 -> Round glasses (Professional & Kind)
  // - clothing: blazerAndShirt -> Doctor-like coat
  // - clothingColor: ffffff -> White coat
  // - hairColor: 2c1b18 -> Dark brown natural hair
  // - skinColor: f5d0b0 -> Light skin tone
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=DrRakOfficial&flip=false&rotate=0&scale=100&radius=0&backgroundColor=b6e3f4&backgroundType=gradientLinear&clothing=blazerAndShirt&clothingColor=ffffff&accessories=prescription02&top=longHairStraight&hairColor=2c1b18&facialHair[]=&skinColor=f5d0b0&eyes=default&eyebrows=defaultNatural&mouth=smile`;

  return (
    <div
      className={`relative flex items-center justify-center rounded-full select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Outer Glow Ring (AI Effect) */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-700 ${
          showHologram ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute inset-[-4px] rounded-full bg-gradient-to-tr from-indigo-400 via-blue-300 to-teal-300 opacity-60 blur-md animate-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-white/50" />
      </div>

      {/* 2. Avatar Container */}
      <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 shadow-inner border-4 border-white">
        {!imageError ? (
          <img
            src={avatarUrl}
            alt="Dr. Rak Avatar"
            className={`w-full h-full object-cover transition-all duration-700 transform ${
              isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback if API fails
          <div className="flex items-center justify-center w-full h-full bg-indigo-50 text-indigo-300">
            <UserIcon className="w-1/2 h-1/2" />
          </div>
        )}

        {/* 3. Glossy Overlay (Glass Effect) */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none" />
      </div>

      {/* 4. Status Dot (Optional: Indicates Online/Active) */}
      <div className="absolute bottom-1 right-1 w-1/6 h-1/6 bg-green-400 rounded-full border-4 border-white shadow-sm"></div>
    </div>
  );
};
