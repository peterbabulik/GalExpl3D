// Console.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { ConsoleMessage, ConsoleMessageType } from './types';

const getMessageColor = (type: ConsoleMessageType): string => {
    switch (type) {
        case 'damage_in': return 'text-red-400';
        case 'damage_out': return 'text-orange-400';
        case 'mining':
        case 'loot':
        case 'bounty': return 'text-green-400';
        case 'repair': return 'text-cyan-400';
        case 'system':
        default: return 'text-gray-300';
    }
};

export const ConsoleUI: React.FC<{ messages: ConsoleMessage[] }> = ({ messages }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current && !isMinimized) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isMinimized]);

    return (
        <div className={`fixed bottom-5 left-5 w-96 bg-black/70 border-2 border-gray-600 rounded-lg transition-all duration-300 z-40 ${isMinimized ? 'h-8' : 'h-48'}`}>
            <div className={`flex justify-between items-center px-3 h-8 bg-gray-800/80 cursor-pointer ${isMinimized ? 'rounded-lg' : 'rounded-t-lg'}`} onClick={() => setIsMinimized(!isMinimized)}>
                <h3 className="text-sm font-bold m-0 text-gray-200">CONSOLE</h3>
                <button className="text-gray-200 text-lg" aria-label={isMinimized ? 'Expand Console' : 'Minimize Console'}>
                    {isMinimized ? '▲' : '▼'}
                </button>
            </div>
            {!isMinimized && (
                <div ref={scrollRef} className="p-2 h-[calc(100%-2rem)] overflow-y-auto text-sm font-mono" role="log" aria-live="polite">
                    {messages.map((msg, index) => (
                        <div key={index}>
                            <span className="text-gray-500 mr-2" aria-hidden="true">{`[${msg.timestamp}]`}</span>
                            <span className={getMessageColor(msg.type)}>{msg.text}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
