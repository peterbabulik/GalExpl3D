// SkillsUI.tsx
import React from 'react';
import type { PlayerState } from './types';
import { SKILL_DATA, getXpForLevel, MAX_SKILL_LEVEL } from './skills';
import { UIButton } from './UI';

export const SkillsUI: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    playerState: PlayerState;
}> = ({ isOpen, onClose, playerState }) => {
    if (!isOpen) return null;

    const learnedSkills = Object.keys(playerState.skills)
        .map(skillId => ({
            id: skillId,
            ...SKILL_DATA[skillId],
            ...playerState.skills[skillId]
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const formatEffect = (type: string, value: number) => {
        const bonusValue = (value * 100).toFixed(1).replace('.0', '');
        return `${type.replace(/([A-Z])/g, ' $1').replace('Bonus', '').trim()}: +${bonusValue}% per level`;
    };

    return (
        <div className="absolute inset-0 bg-gray-900/95 z-[210] p-5 box-border flex flex-col allow-touch-scroll">
            <div className="flex justify-between items-center pb-2.5 mb-5 flex-shrink-0">
                <h2 className="text-2xl">Skills</h2>
                <UIButton onClick={onClose}>Back to Station</UIButton>
            </div>
            <div className="overflow-y-auto">
                {learnedSkills.length === 0 && (
                     <p className="text-gray-400 text-center py-8">
                        You haven't learned any skills yet.
                        <br/>
                        Perform actions like mining or combat to gain skills.
                    </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {learnedSkills.map(skill => {
                        const xpForNext = getXpForLevel(skill.level + 1, skill.rank);
                        const progress = skill.level >= MAX_SKILL_LEVEL ? 100 : (skill.xp / xpForNext) * 100;
                        
                        return (
                            <div key={skill.id} className="bg-gray-800 border border-gray-600 p-3 rounded-lg">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-lg font-semibold text-cyan-400 m-0">{skill.name}</h3>
                                    <span className="text-xl font-bold">{skill.level}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 mb-2 h-10">{skill.description}</p>
                                
                                <div className="text-xs text-gray-500 mb-1">
                                    {skill.level >= MAX_SKILL_LEVEL ? (
                                        <span>MAX LEVEL</span>
                                    ) : (
                                        <span>XP: {Math.floor(skill.xp).toLocaleString()} / {xpForNext.toLocaleString()}</span>
                                    )}
                                </div>
                                <div className="w-full bg-black/50 rounded-full h-2.5">
                                    <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-gray-700">
                                    <h4 className="text-sm font-semibold mb-1">Effects:</h4>
                                    <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                                        {skill.effects.map((effect, index) => (
                                            <li key={index}>{formatEffect(effect.type, effect.value)}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
