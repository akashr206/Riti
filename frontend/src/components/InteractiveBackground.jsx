import React, { useRef, useEffect } from "react";
import gsap from "gsap";

export function InteractiveBackground() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Configuration
        const numBlocks = 60;
        const blocksData = [];
        const isMobile = window.innerWidth < 1024;

        if (isMobile) return; // Don't run heavy physics on mobile layout

        for (let i = 0; i < numBlocks; i++) {
            const block = document.createElement("div");
            // Glassmorphism styling mimicking tiny schedule cards
            block.className = "absolute rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-start justify-center p-4 overflow-hidden shadow-2xl";
            
            const width = Math.random() * 120 + 80;
            const height = Math.random() * 60 + 40;
            
            // Distribute mostly in the left pane (first 50vw)
            const x = Math.random() * (window.innerWidth * 0.5) - 50;
            const y = Math.random() * window.innerHeight;
            
            block.style.width = `${width}px`;
            block.style.height = `${height}px`;
            block.style.left = `0px`; 
            block.style.top = `0px`;
            block.style.transformOrigin = "center center";

            // Add fake UI lines to look like schedule blocks
            const colors = ['bg-blue-500/40', 'bg-indigo-500/40', 'bg-purple-500/40', 'bg-zinc-500/40'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            block.innerHTML = `
                <div class="flex items-center gap-2 mb-2 w-full">
                    <div class="w-2 h-2 rounded-full ${color}"></div>
                    <div class="h-1.5 bg-white/20 rounded-full w-1/2"></div>
                </div>
                <div class="h-1.5 bg-white/10 rounded-full w-3/4"></div>
            `;

            container.appendChild(block);

            // Initial placement
            const initialRotation = Math.random() * 20 - 10;
            const initialScale = Math.random() * 0.5 + 0.5;
            gsap.set(block, { x, y, rotation: initialRotation, scale: initialScale, z: Math.random() * -200 });

            blocksData.push({
                el: block,
                x,
                y,
                baseX: x,
                baseY: y,
                vx: 0,
                vy: 0,
                baseRotation: initialRotation
            });
        }

        let mouseX = window.innerWidth * 0.25;
        let mouseY = window.innerHeight * 0.5;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        window.addEventListener("mousemove", handleMouseMove);

        const ticker = () => {
            blocksData.forEach((b) => {
                // Spring force returning to base position
                const dxBase = b.baseX - b.x;
                const dyBase = b.baseY - b.y;
                
                b.vx += dxBase * 0.02; // Spring stiffness
                b.vy += dyBase * 0.02;

                // Repulsion force from mouse
                const dxMouse = mouseX - b.x;
                const dyMouse = mouseY - b.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                const repelRadius = 300;

                if (distMouse < repelRadius) {
                    const force = (repelRadius - distMouse) / repelRadius;
                    // Apply inverse square-ish force
                    b.vx -= (dxMouse / distMouse) * force * 15;
                    b.vy -= (dyMouse / distMouse) * force * 15;
                }

                // Friction / Damping
                b.vx *= 0.88;
                b.vy *= 0.88;

                b.x += b.vx;
                b.y += b.vy;

                // 3D Rotation based on velocity
                const rotX = b.vy * 1.5;
                const rotY = -b.vx * 1.5;

                // Apply transforms safely
                gsap.set(b.el, { 
                    x: b.x, 
                    y: b.y, 
                    rotationX: rotX, 
                    rotationY: rotY,
                    rotationZ: b.baseRotation + (b.vx * 0.5)
                });
            });
        };

        gsap.ticker.add(ticker);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            gsap.ticker.remove(ticker);
            container.innerHTML = "";
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="absolute inset-0 overflow-hidden pointer-events-none z-0"
            style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
        />
    );
}
