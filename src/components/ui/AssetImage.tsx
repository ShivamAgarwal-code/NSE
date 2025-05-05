"use client";

import Image from "next/image";
import { useState } from "react";

interface AssetImageProps {
  logoUrl: string;
  symbol: string;
  size?: number;
  className?: string;
}

export default function AssetImage({ logoUrl, symbol, size = 8, className = "" }: AssetImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(logoUrl);
  
  const sizeClass = `w-${size} h-${size}`;
  
  return (
    <div className={`relative ${sizeClass} ${className}`} >
      <Image
        src={imgSrc}
        alt={`${symbol} logo`}
        width={50}
        height={50}
        className="object-contain rounded-full"
        onError={() => {
          setImgSrc(`https://via.placeholder.com/${size * 5}?text=${symbol}`);
        }}
      />
    </div>
  );
} 