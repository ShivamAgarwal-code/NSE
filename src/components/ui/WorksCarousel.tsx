"use client";

import { useState, useEffect, useRef } from "react";
import Slider from "react-slick";
import { cn } from "@/lib/utils";

// Need to import slick styles in your global css file
// @import "slick-carousel/slick/slick.css";
// @import "slick-carousel/slick/slick-theme.css";

interface WorksStep {
  number: number;
  title: string;
  description: string;
}

const steps: WorksStep[] = [
  {
    number: 1,
    title: "Purchase Tokenized Equities",
    description: "Buy tokenized shares backed 1:1 by real-world assets held in reserve."
  },
  {
    number: 2,
    title: "Use Assets as Collateral",
    description: "Collateralize your assets to borrow stablecoins at competitive interest rates."
  },
  {
    number: 3,
    title: "Manage Your Portfolio",
    description: "Track your assets, loans, and health factor in one intuitive dashboard."
  }
];

export default function WorksCarousel() {
  const [activeStep, setActiveStep] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const autoplaySpeed = 4000;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Clean up previous interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      
      // Reset progress
      setProgress(0);
      
      // Start new progress interval
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, autoplaySpeed / 100);
      
      progressInterval.current = interval;
      
      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    }
  }, [activeStep, isClient]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed,
    pauseOnHover: true,
    beforeChange: (_: number, next: number) => setActiveStep(next),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ],
    cssEase: "cubic-bezier(0.645, 0.045, 0.355, 1.000)",
    fade: false,
    centerMode: false,
    swipeToSlide: true,
    className: "works-slider"
  };

  return (
    <div className="card p-8 overflow-hidden">
      <h2 className="text-2xl font-semibold mb-6">How Hedgehog Protocol Works</h2>
      
      {isClient ? (
        <>
          <div className="px-4 carousel-container">
            <Slider {...settings}>
              {steps.map((step) => (
                <div key={step.number} className="p-2 carousel-item">
                  <div className={cn(
                    "space-y-3 p-4 border border-transparent hover:border-[var(--border-color)] rounded-lg transition-all duration-300 h-full hover:shadow-sm hover:bg-[var(--card-bg-secondary)]/30",
                    activeStep === step.number - 1 && "border-[var(--primary)]/30 bg-[var(--card-bg-secondary)]/20"
                  )}>
                    <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center transition-all duration-300 hover:bg-[var(--primary)]/20">
                      <span className="text-[var(--primary)] font-semibold text-lg">{step.number}</span>
                    </div>
                    <h3 className="font-medium text-base">{step.title}</h3>
                    <p className="text-[var(--secondary)] text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
          
          {/* Simple progress indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {steps.map((step, index) => (
              <div key={step.number} className="relative h-1 w-8 bg-[var(--border-color)]/50 rounded-full overflow-hidden">
                {index === activeStep && (
                  <div 
                    className="absolute inset-0 bg-[var(--primary)] rounded-full" 
                    style={{ width: `${progress}%` }} 
                  />
                )}
                {index !== activeStep && index < activeStep && (
                  <div className="absolute inset-0 bg-[var(--primary)] rounded-full" />
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.slice(0, 3).map((step) => (
            <div key={step.number} className="space-y-3">
              <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                <span className="text-[var(--primary)] font-semibold text-lg">{step.number}</span>
              </div>
              <h3 className="font-medium text-base">{step.title}</h3>
              <p className="text-[var(--secondary)] text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 