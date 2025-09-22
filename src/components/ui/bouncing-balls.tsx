import { cn } from "@/lib/utils";
import { Circle } from "lucide-react";

type LoaderProps = {
  balls?: number; // Number of balls to display
  delay?: number; // Delay in milliseconds between each ball's animation start
  animation?: string; // Custom animation class
  className?: string; // Additional CSS classes for customization
};

export default function BouncingBalls({ balls = 3, delay = 120, animation = "animate-bounce-sm", className }: LoaderProps) {
  return (
    <div className=" flex gap-1.5">
      {
        Array.from({ length: balls }).map((_, index) => (
          <Circle
            key={index}
            className={cn("font-medium size-2 fill-black stroke-black rounded-full inline-block", animation, className)}
            style={{
              animationDelay: `${index * delay}ms`,
              animationFillMode: "both",
            }}
          />
        ))
      }
    </div>
  );
};



