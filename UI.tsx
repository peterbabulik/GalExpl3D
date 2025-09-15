// UI.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';

import type { PlayerState, TooltipData, TargetData, DockingData, AnyItem } from './types';
import { 
    getItemData,
} from './constants';


// --- UTILITY FUNCTIONS ---
export const hasMaterials = (playerMaterials: Record<string, number>, required: Record<string, number>) => {
    for (const mat in required) {
        if ((playerMaterials[mat] || 0) < required[mat]) {
            return false;
        }
    }
    return true;
};


// --- UI HELPER COMPONENTS ---

export const ItemIcon: React.FC<{ item: AnyItem | undefined, size?: 'small' | 'normal' }> = ({ item, size = 'normal' }) => {
    const [imageError, setImageError] = useState(false);
    const sizeClass = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';

    useEffect(() => {
        // Reset error state if the item changes
        setImageError(false);
    }, [item?.id]);

    if (!item) {
        return <div className={`${sizeClass} flex-shrink-0 bg-black/50 rounded-md`}></div>;
    }
    
    const imagePath = `assets/pic/${item.name}.png`;

    if (imageError) {
        // Fallback to emoji if image fails to load
        let defaultIcon = '📦';
        if (item.category === 'Ship') defaultIcon = '🛸';
        else if (item.category === 'Blueprint') defaultIcon = '📜';
        else if (item.category === 'Module') defaultIcon = '🔧';
        else if (item.category === 'Ore' || item.category === 'Mineral') defaultIcon = '💎';
        else if (item.category === 'Drone') defaultIcon = '🤖';
        else if (item.category === 'Ammunition') defaultIcon = '💥';
        const textSizeClass = size === 'small' ? 'text-base' : 'text-xl';
        
        return (
            <div className={`${sizeClass} flex-shrink-0 flex items-center justify-center bg-black/50 rounded-md`} title={`${item.name} (image not found)`}>
                <span className={textSizeClass}>{defaultIcon}</span>
            </div>
        );
    }

    return (
        <div className={`${sizeClass} flex-shrink-0 bg-black/50 rounded-md flex items-center justify-center overflow-hidden`} title={item.name}>
            <img src={imagePath} alt={item.name} className="w-full h-full object-contain" onError={() => setImageError(true)} />
        </div>
    );
};


export const SystemInfoUI: React.FC<{
    systemName: string;
    playerState: PlayerState;
    onNavClick: () => void;
    onOpenSkills: () => void;
    isDocked: boolean;
}> = ({ systemName, playerState, onNavClick, onOpenSkills, isDocked }) => {
    return (
        <div className="absolute top-2.5 left-2.5 z-10 bg-black/50 p-2 rounded">
            <h1 className="text-2xl m-0">{systemName}</h1>
            <p className="text-lg text-yellow-400 m-0">{playerState.isk.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })} ISK</p>
            <div className="flex gap-2 mt-2">
                 {!isDocked && <UIButton onClick={onNavClick}>Navigation</UIButton>}
                 {isDocked && <UIButton onClick={onOpenSkills}>Skills</UIButton>}
            </div>
        </div>
    );
};


export const MiningProgressIndicator: React.FC<{
    progress: number;
    screenX: number;
    screenY: number;
    remainingTime: number;
}> = ({ progress, screenX, screenY, remainingTime }) => {
    const size = 80; // size of the indicator in pixels
    return (
        <div
            className="absolute flex items-center justify-center pointer-events-none z-20"
            style={{
                left: screenX - size / 2,
                top: screenY - size / 2,
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            <div
                className="absolute w-full h-full rounded-full"
                style={{
                    background: `conic-gradient(
                        rgba(34,197,94,0.7) ${progress}%,
                        transparent ${progress}%
                    )`,
                }}
            />
            <div className="absolute w-[calc(100%-8px)] h-[calc(100%-8px)] bg-black/70 rounded-full" />
            <span className="relative text-white font-mono text-lg z-10">
                {remainingTime.toFixed(1)}s
            </span>
        </div>
    );
};

export const UIButton: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean }> = ({ onClick, children, className = '', disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`py-2 px-3 text-sm bg-gray-800/70 border border-gray-400 text-white font-mono cursor-pointer hover:bg-gray-700/90 disabled:bg-gray-600/50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

export const Tooltip: React.FC<{ data: TooltipData }> = ({ data }) => {
    if (!data.visible) return null;
    return (
        <div
            className="absolute bg-black/75 border border-gray-500 px-2.5 py-1.5 rounded-sm text-sm pointer-events-none z-[100]"
            style={{ left: data.x + 15, top: data.y }}
            dangerouslySetInnerHTML={{ __html: data.content }}
        />
    );
};

export const TargetingReticle: React.FC<{ data: TargetData }> = ({ data }) => {
    if (!data.object) return null;
    return (
        <div
            className="absolute w-24 h-24 border border-white/50 pointer-events-none"
            style={{
                left: data.screenX - 48,
                top: data.screenY - 48,
                background: `
                    linear-gradient(to right, white 2px, transparent 2px) 0 0,
                    linear-gradient(to right, white 2px, transparent 2px) 0 100%,
                    linear-gradient(to left, white 2px, transparent 2px) 100% 0,
                    linear-gradient(to left, white 2px, transparent 2px) 100% 100%,
                    linear-gradient(to bottom, white 2px, transparent 2px) 0 0,
                    linear-gradient(to bottom, white 2px, transparent 2px) 100% 0,
                    linear-gradient(to top, white 2px, transparent 2px) 0 100%,
                    linear-gradient(to top, white 2px, transparent 2px) 100% 100%`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '15px 15px',
            }}
        />
    );
};

export const DockingIndicator: React.FC<{ data: DockingData }> = ({ data }) => {
    if (!data.visible) return null;
    return (
        <div className="absolute bottom-20 w-full text-center text-lg text-green-400 text-shadow-lg z-10 pointer-events-none">
            <p>Distance: {data.distance.toFixed(0)}m</p>
            <p>[ Press ENTER to Dock ]</p>
        </div>
    );
};

export const VirtualJoystick: React.FC<{ onMove: (vector: { x: number; y: number }) => void }> = ({ onMove }) => {
    const baseRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLDivElement>(null);
    const draggingState = useRef({
        isDragging: false,
        touchId: null as number | null,
        joystickCenter: { x: 0, y: 0 },
    });

    const updateThumb = useCallback((touch: Touch | React.Touch) => {
        if (!baseRef.current || !thumbRef.current) return;
        const { joystickCenter } = draggingState.current;

        const baseRadius = baseRef.current.offsetWidth / 2;
        let x = touch.clientX - joystickCenter.x;
        let y = touch.clientY - joystickCenter.y;
        
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance > baseRadius) {
            x = (x / distance) * baseRadius;
            y = (y / distance) * baseRadius;
        }
        
        thumbRef.current.style.transform = `translate(${x}px, ${y}px)`;
        
        onMove({
            x: x / baseRadius,
            y: y / baseRadius,
        });
    }, [onMove]);

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!baseRef.current) return;
        e.stopPropagation();
        const touch = e.changedTouches[0];
        
        const baseRect = baseRef.current.getBoundingClientRect();
        draggingState.current = {
            isDragging: true,
            touchId: touch.identifier,
            joystickCenter: {
                x: baseRect.left + baseRect.width / 2,
                y: baseRect.top + baseRect.height / 2,
            }
        };
        updateThumb(touch);
    }, [updateThumb]);

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            const { isDragging, touchId } = draggingState.current;
            if (!isDragging) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
            if (touch) {
                updateThumb(touch);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const { isDragging, touchId } = draggingState.current;
            if (!isDragging) return;
            const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
            if (touch) {
                draggingState.current.isDragging = false;
                draggingState.current.touchId = null;
                if (thumbRef.current) {
                    thumbRef.current.style.transform = `translate(0px, 0px)`;
                }
                onMove({ x: 0, y: 0 });
            }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
        
        return () => {
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [onMove, updateThumb]);

    return (
        <div 
            ref={baseRef}
            onTouchStart={handleTouchStart}
            className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full flex items-center justify-center z-50"
            aria-hidden="true"
        >
            <div 
                ref={thumbRef}
                className="w-16 h-16 bg-white/30 rounded-full pointer-events-none transition-transform duration-75 ease-out"
            />
        </div>
    );
};


export const HPBar: React.FC<{ current: number, max: number, color: string, label: string }> = ({ current, max, color, label }) => (
    <div className="w-full h-2 bg-black/50 relative my-0.5" title={`${label}: ${current}/${max}`}>
        <div className={`h-full ${color}`} style={{ width: `${(current / max) * 100}%` }}></div>
    </div>
);