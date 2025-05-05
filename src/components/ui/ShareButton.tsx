"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
  TelegramIcon,
} from "react-share";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleShare = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleShare}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
          "bg-[var(--card-bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--border-color)]/20 transition-colors px-3 py-1.5 rounded-md text-sm text-white",
          className
        )}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-md shadow-lg z-50">
          <div className="flex flex-col gap-4 text-sm">
            <FacebookShareButton url={url} title={title}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <FacebookIcon size={24} round />
                <span>Facebook</span>
              </div>
            </FacebookShareButton>

            <TwitterShareButton url={url} title={title}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <TwitterIcon size={24} round />
                <span>Twitter</span>
              </div>
            </TwitterShareButton>

            <LinkedinShareButton url={url} title={title}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <LinkedinIcon size={24} round />
                <span>LinkedIn</span>
              </div>
            </LinkedinShareButton>

            <WhatsappShareButton url={url} title={title}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <WhatsappIcon size={24} round />
                <span>WhatsApp</span>
              </div>
            </WhatsappShareButton>

            <TelegramShareButton url={url} title={title}>
              <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <TelegramIcon size={24} round />
                <span>Telegram</span>
              </div>
            </TelegramShareButton>
          </div>
        </div>
      )}
    </div>
  );
} 