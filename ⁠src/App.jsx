import { useState, useEffect } from 'react';

export default function App() {
    const [activeTab, setActiveTab] = useState('gym');
    const [balance, setBalance] = useState(() => Number(localStorage.getItem('bulv_balance')) || 0);
    const [energy, setEnergy] = useState(() => {
        const saved = localStorage.getItem('bulv_energy');
        return saved !== null ? Number(saved) : 100;
    });
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('bulv_stats');
        return saved ? JSON.parse(saved) : { str: 10, mas: 10, end: 10 };
    });
    const [capsules, setCapsules] = useState(() => {
        const saved = localStorage.getItem('bulv_capsules');
        return saved !== null ? Number(saved) : 3;
    });
    const [activeGenes, setActiveGenes] = useState(() => {
        const saved = localStorage.getItem('bulv_genes');
        return saved ? JSON.parse(saved) : [];
    });
    const [completedQuests, setCompletedQuests] = useState(() => {
        const saved = localStorage.getItem('bulv_quests');
        return saved ? JSON.parse(saved) : [];
    });
    const [walletConnected, setWalletConnected] = useState(() => localStorage.getItem('bulv_wallet') === 'true');
    const [lastSavedTime, setLastSavedTime] = useState(() => Number(localStorage.getItem('bulv_last_time')) || Date.now());

    const [training, setTraining] = useState(null); 
    const [capsuleOpening, setCapsuleOpening] = useState(false);
    const [questTab, setQuestTab] = useState('social');
    const [verifyingQuest, setVerifyingQuest] = useState(null);
    const [popup, setPopup] = useState(null); 
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    useEffect(() => {
        localStorage.setItem('bulv_balance', balance);
        localStorage.setItem('bulv_energy', energy);
        localStorage.setItem('bulv_stats', JSON.stringify(stats));
        localStorage.setItem('bulv_capsules', capsules);
        localStorage.setItem('bulv_genes', JSON.stringify(activeGenes));
        localStorage.setItem('bulv_quests', JSON.stringify(completedQuests));
        localStorage.setItem('bulv_wallet', walletConnected);
        localStorage.setItem('bulv_last_time', lastSavedTime);
    }, [balance, energy, stats, capsules, activeGenes, completedQuests, walletConnected, lastSavedTime]);

    useEffect(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - lastSavedTime) / 1000);
        const recoveredEnergy = Math.floor(elapsedSeconds / 60);
        if (recoveredEnergy > 0) {
            setEnergy(prev => Math.min(100, prev + recoveredEnergy));
        }
        setLastSavedTime(now);

        const ticker = setInterval(() => {
            setLastSavedTime(prev => {
                if (Math.floor(Date.now() / 1000) % 60 === 0) {
                    setEnergy(e => Math.min(100, e + 1));
                }
                return Date.now();
            });
        }, 1000);

        return () => clearInterval(ticker);
    }, []);

    useEffect(() => {
        if (!training) return;
        const timer = setInterval(() => {
            setTraining(prev => {
                if (!prev) return null;
                if (prev.remaining <= 1) {
                    clearInterval(timer);
                    completeWorkout(prev.id);
                    return null;
                }
                return { ...prev, remaining: prev.remaining - 1 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [training]);

    const getMultiplier = () => {
        return activeGenes.reduce((acc, gene) => acc + gene.buff, 1);
    };

    const baseWorkouts = {
        pushups: { name: 'Push-ups', cost: 20, time: 10, rewardStr: 5, rewardMas: 0, rewardEnd: 0, rewardTokens: 10 },
        squats: { name: 'Squats', cost: 40, time: 30, rewardStr: 0, rewardMas: 10, rewardEnd: 0, rewardTokens: 25 },
        cardio: { name: 'Cardio Blitz', cost: 60, time: 60, rewardStr: 0, rewardMas: 0, rewardEnd: 15, rewardTokens: 50 }
    };

    const triggerWorkout = (id) => {
        if (training) return;
        const workout = baseWorkouts[id];
        if (energy < workout.cost) {
            setPopup({ title: 'Insufficient Energy', type: 'error', content: 'Rest or harvest capsules to regenerate your energy reserve!' });
            return;
        }
        setEnergy(prev => Math.max(0, prev - workout.cost));
        setTraining({ id, total: workout.time, remaining: workout.time });
    };

    const completeWorkout = (id) => {
        const workout = baseWorkouts[id];
        const multiplier = getMultiplier();
        const bonusTokens = Math.floor(workout.rewardTokens * multiplier);

        setStats(prev => ({
            str: prev.str + workout.rewardStr,
            mas: prev.mas + workout.rewardMas,
            end: prev.end + workout.rewardEnd
        }));
        setBalance(prev => prev + bonusTokens);

        let statGainText = '';
        if (workout.rewardStr > 0) statGainText += `+${workout.rewardStr} STR `;
        if (workout.rewardMas > 0) statGainText += `+${workout.rewardMas} MAS `;
        if (workout.rewardEnd > 0) statGainText += `+${workout.rewardEnd} END `;

        setPopup({
            title: 'Workout Complete!',
            type: 'success',
            content: `Incredible hustle! You earned ${statGainText} and credited +${bonusTokens} $BULV to your active account.`
        });
    };

    const handleCrackCapsule = () => {
        if (capsuleOpening) return;
        
        const usesTokens = capsules === 0;
        if (usesTokens && balance < 500) {
            setPopup({ title: 'DNA Restructuring Blocked', type: 'error', content: 'You need either 1 Capsule or 500 $BULV tokens.' });
            return;
        }

        if (usesTokens) {
            setBalance(prev => prev - 500);
        } else {
            setCapsules(prev => prev - 1);
        }

        setCapsuleOpening(true);

        setTimeout(() => {
            setCapsuleOpening(false);
            const roll = Math.random() * 100;
            let selectedGene = null;

            if (roll < 70) {
                selectedGene = { id: 'alpha_' + Date.now(), name: 'Common Alpha Gene', buff: 0.05, tier: 'Common', color: 'text-cyan-400 border-cyan-500/30' };
            } else if (roll < 95) {
                selectedGene = { id: 'mutant_' + Date.now(), name: 'Rare Cyber Mutant Gene', buff: 0.15, tier: 'Rare', color: 'text-blue-400 border-blue-500/40' };
            } else {
                selectedGene = { id: 'banana_' + Date.now(), name: 'Legendary Nano Banana God Gene', buff: 0.50, tier: 'Legendary', color: 'text-amber-400 border-amber-500/60' };
            }

            setActiveGenes(prev => [selectedGene, ...prev]);
            setPopup({
                title: 'Capsule Mutated!',
                type: 'dna',
                content: `Synthesized [${selectedGene.name}] boosting your baseline permanent training rewards by +${selectedGene.buff * 100}%.`
            });
        }, 2000);
    };

    const questsData = {
        social: [
            { id: 'tg_chan', label: 'Join BULVARA Telegram Channel', reward: 500 },
            { id: 'invite_3', label: 'Invite 3 Fitness Friends', reward: 1500 },
            { id: 'follow_x', label: 'Follow BULVARA on X', reward: 400 }
        ],
        fitness: [
            { id: 'squats_real', label: 'Do 20 squats in real life', reward: 300 },
            { id: 'water_2l', label: 'Drink 2L of water today', reward: 200 }
        ]
    };

    const triggerQuestVerification = (quest) => {
        if (completedQuests.includes(quest.id) || verifyingQuest) return;
        setVerifyingQuest(quest.id);

        setTimeout(() => {
            setCompletedQuests(prev => [...prev, quest.id]);
            setBalance(prev => prev + quest.reward);
            setVerifyingQuest(null);
            setPopup({
                title: 'Task Verified',
                type: 'success',
                content: `Successfully claimed +${quest.reward} $BULV tokens for completing: "${quest.label}".`
            });
        }, 3000);
    };

    return (
        <div className="flex flex-col w-full h-full justify-between select-none relative bg-slate-950 text-slate-100">
            
            {/* TOP BAR */}
            <header className="p-4 bg-cyber-card border-b border-slate-800/80 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 shadow-md border border-cyan-400/30">
                        BA
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-cyan-400 tracking-wide">@CyberAthlete_7</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${energy}%` }}></div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{energy}/100 E</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                    <span className="text-base select-none">🍌</span>
                    <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-amber-500 font-bold -mb-0.5">Balance</p>
                        <p className="text-sm font-black font-mono text-amber-400">{balance.toLocaleString()}</p>
                    </div>
                </div>
            </header>

            {/* MAIN AREA */}
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 relative">
                
                {/* GYM TAB */}
                {activeTab === 'gym' && (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="bg-gradient-to-b from-cyber-card to-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-inner min-h-[280px]">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none"></div>
                            
                            <div className="w-full grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 text-center backdrop-blur-sm z-10">
                                <div><p className="text-[10px] uppercase font-bold text-cyan-400">Strength</p><p className="text-base font-extrabold text-slate-200">{stats.str}</p></div>
                                <div><p className="text-[10px] uppercase font-bold text-blue-400">Muscle</p><p className="text-base font-extrabold text-slate-200">{stats.mas}</p></div>
                                <div><p className="text-[10px] uppercase font-bold text-amber-400">Endurance</p><p className="text-base font-extrabold text-slate-200">{stats.end}</p></div>
                            </div>

                            <div className="relative w-44 h-44 flex items-center justify-center my-auto">
                                <svg className={`w-full h-full text-cyan-500/80 drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] ${training ? 'animate-pulse' : 'animate-pulse-slow'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="4" r="2" />
                                    <path d="M12 6v7M12 13l-4 8M12 13l4 8M6 8h12" />
                                </svg>
                                
                                {training && (
                                    <div className="absolute inset-0 bg-slate-950/85 rounded-xl flex flex-col justify-center items-center backdrop-blur-sm p-4 border border-cyan-500/20">
                                        <p className="text-xs uppercase font-black text-cyan-400 tracking-widest animate-pulse">Training</p>
                                        <p className="text-3xl font-black text-slate-100 font-mono my-1">{training.remaining}s</p>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1 max-w-[120px]">
                                            <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-1000 ease-linear" style={{ width: `${(training.remaining / training.total) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 px-1">Select Training Routine</h3>
                            <div className="flex flex-col gap-2.5">
                                {Object.entries(baseWorkouts).map(([key, item]) => (
                                    <button 
                                        key={key} disabled={!!training} onClick={() => triggerWorkout(key)}
                                        className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all duration-200 ${!!training ? 'border-slate-900 bg-slate-900/40 opacity-40 cursor-not-allowed' : 'border-slate-800 bg-cyber-card hover:border-cyan-500/40 active:scale-[0.98]'}`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-100">{item.name}</span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">⏱ {item.time}s</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Gains: <span className="text-cyan-400 font-medium">{item.rewardStr > 0 && `+${item.rewardStr} STR `}{item.rewardMas > 0 && `+${item.rewardMas} MAS `}{item.rewardEnd > 0 && `+${item.rewardEnd} END `}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-black text-amber-400 font-mono">+{Math.floor(item.rewardTokens * getMultiplier())} $BULV</div>
                                            <div className="text-[10px] text-red-400 font-semibold mt-1">⚡️ {item.cost} Energy</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* DNA TAB */}
                {activeTab === 'dna' && (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="bg-cyber-card border border-slate-800 p-4 rounded-2xl flex justify-between items-center shadow-lg">
                            <div><p className="text-xs text-slate-400 font-semibold">Ready Core Stock</p><h2 className="text-xl font-black text-cyan-400 font-mono mt-0.5">{capsules} DNA Capsules</h2></div>
                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl">🧬</div>
                        </div>

                        <div className="bg-gradient-to-b from-cyber-card to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[250px] relative">
                            <div className={`w-32 h-32 flex items-center justify-center text-6xl rounded-full bg-slate-950/60 shadow-2xl border border-slate-800 ${capsuleOpening ? 'animate-shake border-cyan-500 shadow-cyan-500/20' : 'animate-pulse'}`}>🥚</div>
                            <button disabled={capsuleOpening} onClick={handleCrackCapsule} className={`mt-6 w-full max-w-[240px] py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all duration-150 ${capsuleOpening ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 active:scale-95'}`}>
                                {capsuleOpening ? 'Synthesizing...' : capsules > 0 ? 'Crack Capsule (Free)' : 'Crack Capsule (500 $BULV)'}
                            </button>
                        </div>

                        <div>
                            <h3 className="text-xs uppercase tracking-widest font-black text-slate-400 mb-2 px-1">Active Genetic Modifiers</h3>
                            <div className="flex flex-col gap-2">
                                {activeGenes.length === 0 ? (
                                    <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center text-xs text-slate-500">No modifier strands sequenced yet.</div>
                                ) : (
                                    activeGenes.map(gene => (
                                        <div key={gene.id} className={`p-3 rounded-xl border bg-cyber-card flex justify-between items-center ${gene.color}`}>
                                            <div><p className="text-xs font-bold text-slate-200">{gene.name}</p><p className="text-[10px] font-semibold tracking-wider uppercase opacity-60 mt-0.5">{gene.tier}</p></div>
                                            <div className="font-mono text-xs font-black">+{gene.buff * 100}%</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* QUESTS TAB */}
                {activeTab === 'quests' && (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                            <button onClick={() => setQuestTab('social')} className={`py-2 rounded-lg text-xs font-bold transition-all ${questTab === 'social' ? 'bg-cyber-card text-cyan-400 border border-slate-800/80' : 'text-slate-400'}`}>Social</button>
                            <button onClick={() => setQuestTab('fitness')} className={`py-2 rounded-lg text-xs font-bold transition-all ${questTab === 'fitness' ? 'bg-cyber-card text-cyan-400 border border-slate-800/80' : 'text-slate-400'}`}>Fitness</button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {questsData[questTab].map(quest => {
                                const isCompleted = completedQuests.includes(quest.id);
                                const isVerifying = verifyingQuest === quest.id;
                                return (
                                    <div key={quest.id} className="p-3.5 bg-cyber-card border border-slate-800/70 rounded-xl flex items-center justify-between">
                                        <div className="max-w-[70%]"><p className="text-xs font-bold text-slate-200">{quest.label}</p><p className="text-[11px] font-black text-amber-400 mt-1">+{quest.reward} $BULV</p></div>
                                        <button disabled={isCompleted || verifyingQuest !== null} onClick={() => triggerQuestVerification(quest)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isCompleted ? 'bg-slate-900 text-slate-500 border border-slate-800' : isVerifying ? 'bg-slate-800 text-cyan-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95'}`}>
                                            {isCompleted ? '✓ Done' : isVerifying ? 'Verifying...' : 'Claim'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* WALLET TAB */}
                {activeTab === 'wallet' && (
                    <div className="flex flex-col gap-4 animate-fadeIn">
                        <div className="bg-gradient-to-br from-slate-900 to-cyber-card border border-slate-800 rounded-2xl p-5 shadow-xl">
                            <p className="text-[10px] tracking-widest uppercase text-slate-400 font-bold">Estimated Value</p>
                            <h1 className="text-2xl font-black text-slate-100 font-mono mt-1">{(balance * 0.0012).toFixed(2)} <span className="text-xs text-cyan-400">TON</span></h1>
                            <p className="text-xs text-slate-500 font-mono">≈ {balance.toLocaleString()} $BULV</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => setWalletConnected(!walletConnected)} className={`py-3 rounded-xl text-xs font-bold uppercase transition-all ${walletConnected ? 'bg-slate-900 text-green-500 border border-green-500/50' : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 active:scale-95'}`}>
                                {walletConnected ? 'Connected: EQA1...4b29' : 'Connect TON Wallet'}
                            </button>
                            <button onClick={() => setShowWithdrawModal(true)} disabled={!walletConnected} className={`py-3 rounded-xl text-xs font-bold uppercase transition-all ${walletConnected ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-slate-900/40 text-slate-600'}`}>Withdraw $BULV</button>
                        </div>
                    </div>
                )}
            </main>

            {/* POPUPS */}
            {popup && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-cyber-card border border-slate-800 rounded-2xl p-5 w-full max-w-[320px] text-center space-y-3">
                        <div className="text-3xl">{popup.type === 'success' ? '🏆' : popup.type === 'error' ? '❌' : '🧬'}</div>
                        <h3 className="text-sm font-black uppercase text-slate-100">{popup.title}</h3>
                        <p className="text-xs text-slate-400">{popup.content}</p>
                        <button onClick={() => setPopup(null)} className="w-full py-2 bg-slate-800 text-slate-200 font-bold rounded-xl text-xs uppercase border border-slate-700">Dismiss</button>
                    </div>
                </div>
            )}

            {showWithdrawModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-cyber-card border border-slate-800 rounded-2xl p-5 w-full max-w-[320px] text-center space-y-3">
                        <div className="text-3xl">🔒</div>
                        <h3 className="text-sm font-black uppercase text-slate-100">Asset Locked</h3>
                        <p className="text-xs text-slate-400">Withdrawals will open after the official token TGE listing.</p>
                        <button onClick={() => setShowWithdrawModal(false)} className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black rounded-xl text-xs uppercase">Acknowledge</button>
                    </div>
                </div>
            )}

            {/* NAVIGATION BAR */}
            <nav className="absolute bottom-0 left-0 right-0 h-20 bg-cyber-card/95 border-t border-slate-800/80 backdrop-blur-md px-2 flex items-center justify-around z-30 shrink-0 sm:rounded-b-[28px]">
                <button onClick={() => setActiveTab('gym')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'gym' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"/></svg>
                    <span className="text-[10px] uppercase tracking-wider">Gym</span>
                </button>
                <button onClick={() => setActiveTab('dna')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'dna' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.128l1.41-.513M5.106 17.785l1.15-.827m11.379-8.16l1.15-.827M8.14 21.27l.707-.924m6.83-8.91l.707-.924M12 10v4" /></svg>
                    <span className="text-[10px] uppercase tracking-wider">DNA</span>
                </button>
                <button onClick={() => setActiveTab('quests')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'quests' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    <span className="text-[10px] uppercase tracking-wider">Quests</span>
                </button>
                <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${activeTab === 'wallet' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6A2.25 2.25 0 0118.75 20H5.25A2.25 2.25 0 013 18v-6m18 0V9A2.25 2.25 0 0018.75 6.75H5.25A2.25 2.25 0 003 9v3" /></svg>
                    <span className="text-[10px] uppercase tracking-wider">Wallet</span>
                </button>
            </nav>
        </div>
    );
}
