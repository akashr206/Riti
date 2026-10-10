import React, { useRef } from "react";
import gsap from "gsap";

export function ShatteringText({ text, className }) {
    const charsRef = useRef([]);
    charsRef.current = []; // Reset on each render to prevent stale refs

    const handleMouseMove = (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        charsRef.current.forEach((char) => {
            if (!char) return;
            const charRect = char.getBoundingClientRect();
            const charX = charRect.left + charRect.width / 2;
            const charY = charRect.top + charRect.height / 2;
            
            const dist = Math.hypot(mouseX - charX, mouseY - charY);
            
            if (dist < 120) { // Repulsion radius
                if (!char.isExploding) {
                    char.isExploding = true;
                    gsap.to(char, {
                        x: gsap.utils.random(-150, 150),
                        y: gsap.utils.random(-150, 150),
                        z: gsap.utils.random(-300, 300),
                        rotationX: gsap.utils.random(-180, 180),
                        rotationY: gsap.utils.random(-180, 180),
                        scale: gsap.utils.random(0.5, 2),
                        opacity: 0.1,
                        duration: 0.4,
                        ease: "power2.out",
                        onComplete: () => {
                            // Rubber band back
                            gsap.to(char, {
                                x: 0,
                                y: 0,
                                z: 0,
                                rotationX: 0,
                                rotationY: 0,
                                scale: 1,
                                opacity: 1,
                                duration: 1.5,
                                ease: "elastic.out(1, 0.3)",
                                onComplete: () => {
                                    char.isExploding = false;
                                }
                            });
                        }
                    });
                }
            }
        });
    };

    const words = text.split(" ");
    
    return (
        <span 
            className={`inline-block perspective-[1000px] ${className}`}
            onMouseMove={handleMouseMove}
        >
            {words.map((word, wordIdx) => (
                <span key={wordIdx} className="inline-block whitespace-nowrap mr-[0.25em]">
                    {word.split("").map((char, charIdx) => (
                        <span 
                            key={charIdx} 
                            className="inline-block transform-style-3d cursor-default"
                            ref={el => {
                                if (el) charsRef.current.push(el);
                            }}
                        >
                            {char}
                        </span>
                    ))}
                </span>
            ))}
        </span>
    );
}
