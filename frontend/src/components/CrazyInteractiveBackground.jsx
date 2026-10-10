import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function CrazyInteractiveBackground() {
    const containerRef = useRef(null);
    const marquee1Ref = useRef(null);
    const marquee2Ref = useRef(null);
    const cursorRef = useRef(null);
    const crosshairRef = useRef(null);
    const gridRef = useRef(null);
    const dotsRef = useRef([]);

    useEffect(() => {
        const isMobile = window.innerWidth < 1024;
        if (isMobile) return;

        let mouseX = window.innerWidth / 4;
        let mouseY = window.innerHeight / 2;
        let targetX = mouseX;
        let targetY = mouseY;

        const xCursorSet = gsap.quickSetter(cursorRef.current, "x", "px");
        const yCursorSet = gsap.quickSetter(cursorRef.current, "y", "px");
        const xCrosshairSet = gsap.quickSetter(crosshairRef.current, "x", "px");
        const yCrosshairSet = gsap.quickSetter(crosshairRef.current, "y", "px");

        let marqueePos1 = 0;
        let marqueePos2 = 0;

        const leftPane = document.getElementById("left-pane-container");
        if (leftPane) leftPane.style.cursor = "none";

        const handleMouseMove = (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            
            // Instantly move the cursors
            xCursorSet(targetX);
            yCursorSet(targetY);
            xCrosshairSet(targetX);
            yCrosshairSet(targetY);
        };

        if (leftPane) {
            leftPane.addEventListener("mousemove", handleMouseMove);
        } else {
            window.addEventListener("mousemove", handleMouseMove);
        }

        const ticker = () => {
            // Lerp mouse for smooth parallax
            mouseX += (targetX - mouseX) * 0.1;
            mouseY += (targetY - mouseY) * 0.1;

            // Parallax Tilt on the grid container
            if (gridRef.current && leftPane) {
                const rect = leftPane.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const tiltX = (centerY - mouseY) * 0.04; // Gentle tilt
                const tiltY = (mouseX - centerX) * 0.04;

                gsap.set(gridRef.current, {
                    rotationX: tiltX,
                    rotationY: tiltY,
                    x: (centerX - mouseX) * 0.05,
                    y: (centerY - mouseY) * 0.05
                });
            }

            // Grid Ripple / Blooming Physics
            dotsRef.current.forEach((dot) => {
                if (!dot) return;
                const rect = dot.getBoundingClientRect();
                const dotX = rect.left + rect.width / 2;
                const dotY = rect.top + rect.height / 2;
                
                const dist = Math.hypot(targetX - dotX, targetY - dotY);
                
                // If cursor is close, bloom the dot
                if (dist < 200) {
                    if (!dot.isBlooming) {
                        dot.isBlooming = true;
                        gsap.to(dot, {
                            scale: 3,
                            rotation: 90,
                            color: "#818cf8", // indigo-400
                            opacity: 1,
                            duration: 0.4,
                            ease: "power2.out",
                            onComplete: () => {
                                // Fade back slowly
                                gsap.to(dot, {
                                    scale: 1,
                                    rotation: 0,
                                    color: "rgb(255 255 255 / 0.1)",
                                    opacity: 0.3,
                                    duration: 2,
                                    ease: "power2.inOut",
                                    onComplete: () => dot.isBlooming = false
                                });
                            }
                        });
                    }
                }
            });

            // Smooth Marquee scrolling based on velocity
            const velocityX = targetX - mouseX;
            marqueePos1 -= (0.5 + velocityX * 0.02);
            marqueePos2 += (0.5 + velocityX * 0.02);
            
            if (marquee1Ref.current && marquee2Ref.current) {
                const wrap1 = gsap.utils.wrap(-2000, 0, marqueePos1);
                const wrap2 = gsap.utils.wrap(-2000, 0, marqueePos2);
                gsap.set(marquee1Ref.current, { x: wrap1 });
                gsap.set(marquee2Ref.current, { x: wrap2 });
            }
        };

        gsap.ticker.add(ticker);

        return () => {
            if (leftPane) {
                leftPane.removeEventListener("mousemove", handleMouseMove);
                leftPane.style.cursor = "auto";
            } else {
                window.removeEventListener("mousemove", handleMouseMove);
            }
            gsap.ticker.remove(ticker);
        };
    }, []);

    const cols = 24;
    const rows = 18;
    const dots = Array.from({ length: cols * rows }, (_, i) => i);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-zinc-950 flex items-center justify-center">
            
            {/* 3D Parallax Grid Container */}
            <div ref={gridRef} className="absolute w-[150%] h-[150%] transform-style-3d perspective-[2000px] flex items-center justify-center">
                
                {/* The Geometric Grid */}
                <div className="absolute inset-0 grid place-items-center opacity-30 pointer-events-none" style={{ 
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    transform: "translateZ(-100px)" 
                }}>
                    {dots.map(i => (
                        <div 
                            key={i}
                            ref={el => dotsRef.current[i] = el}
                            className="text-white/10 text-[14px] font-mono transition-colors"
                        >
                            +
                        </div>
                    ))}
                </div>

                {/* Kinetic Marquee (Floating in Z-space) */}
                <div className="absolute inset-0 flex flex-col justify-center opacity-[0.04] text-white font-black text-[12vw] leading-none whitespace-nowrap select-none mix-blend-overlay" style={{ transform: "translateZ(50px)" }}>
                    <div ref={marquee1Ref} className="flex gap-8">
                        <span>SCHEDULE • ORCHESTRATE • ALLOCATE • SCHEDULE • ORCHESTRATE • ALLOCATE • SCHEDULE • ORCHESTRATE • ALLOCATE</span>
                    </div>
                    <div ref={marquee2Ref} className="flex gap-8 -translate-x-1/4 mt-8">
                        <span>EXAMS • TIMETABLE • FACULTY • EXAMS • TIMETABLE • FACULTY • EXAMS • TIMETABLE • FACULTY</span>
                    </div>
                </div>

            </div>

            {/* Glowing Spotlight Cursor */}
            <div 
                ref={cursorRef} 
                className="fixed top-0 left-0 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none hidden lg:block mix-blend-screen" 
            />
            
            {/* Inner Crosshair Cursor */}
            <div ref={crosshairRef} className="fixed top-0 left-0 w-8 h-8 rounded-full mix-blend-difference -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none hidden lg:flex items-center justify-center">
                <div className="absolute w-full h-[1px] bg-white/70"></div>
                <div className="absolute w-[1px] h-full bg-white/70"></div>
            </div>
        </div>
    );
}
