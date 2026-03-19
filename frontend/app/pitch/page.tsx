"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// Using FontAwesome and Google Fonts as requested by the user's design
export default function PitchDeck() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 12;

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  const progress = ((currentSlide + 1) / totalSlides) * 100;

  return (
    <div className="pitch-deck-root">
      {/* External Resources */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      
      {/* Scoped Styles from the User's Design */}
      <style jsx global>{`
        :root {
            --bg-deep: #020617;
            --bg-panel: rgba(15, 23, 42, 0.6);
            --accent-blue: #3b82f6;
            --accent-cyan: #06b6d4;
            --accent-purple: #8b5cf6;
            --accent-emerald: #10b981;
            --accent-red: #ef4444;
            --accent-gold: #fbbf24;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --glass-border: rgba(255, 255, 255, 0.08);
            --glass-bg: rgba(255, 255, 255, 0.03);
        }

        .pitch-deck-root {
            background-color: var(--bg-deep);
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
            display: flex; justify-content: center; align-items: center;
            height: 100vh; width: 100vw; overflow: hidden; 
            font-family: 'Inter', sans-serif; color: var(--text-main);
            position: fixed; top: 0; left: 0; z-index: 9999;
        }

        .slide-container {
            background: var(--bg-panel);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1);
            display: none; 
            flex-direction: column; justify-content: center; align-items: center;
            height: 720px; width: 1280px; padding: 60px 80px;
            position: absolute; overflow: hidden;
        }

        .slide-container.active {
            display: flex;
            animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            z-index: 10;
        }

        @keyframes slideIn {
            0% { opacity: 0; transform: scale(0.95) translateY(20px); filter: blur(4px); }
            100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        .slide-container.active > * {
            animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0; transform: translateY(15px);
        }
        .slide-container.active > *:nth-child(1) { animation-delay: 0.1s; }
        .slide-container.active > *:nth-child(2) { animation-delay: 0.2s; }
        .slide-container.active > *:nth-child(3) { animation-delay: 0.3s; }
        .slide-container.active > *:nth-child(4) { animation-delay: 0.4s; }

        @keyframes fadeUp {
            to { opacity: 1; transform: translateY(0); }
        }

        .glow-orb {
            position: absolute; border-radius: 50%; filter: blur(120px); z-index: 0; pointer-events: none;
        }
        .glow-top { top: -200px; left: 50%; transform: translateX(-50%); width: 800px; height: 400px; opacity: 0.15; }
        
        #slide1 .glow-top, #slide7 .glow-top, #slide12 .glow-top { background: var(--accent-blue); }
        #slide2 .glow-top { background: var(--accent-red); opacity: 0.2; }
        #slide3 .glow-top, #slide9 .glow-top { background: var(--accent-cyan); }
        #slide4 .glow-top, #slide10 .glow-top { background: var(--accent-emerald); }
        #slide5 .glow-top, #slide8 .glow-top { background: var(--accent-purple); }
        #slide6 .glow-top, #slide11 .glow-top { background: var(--accent-blue); }

        .slide-container > * { position: relative; z-index: 1; width: 100%; }

        h1, h2, h3, h4 { font-family: 'Space Grotesk', sans-serif; line-height: 1.1; margin: 0; }
        h1 { font-size: 96px; font-weight: 900; letter-spacing: -3px; }
        .slide-title { font-size: 56px; font-weight: 700; margin-bottom: 50px; text-align: left; }
        .slide-title span { background: linear-gradient(to right, var(--accent-cyan), var(--accent-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        #slide2 .slide-title span { background: linear-gradient(to right, #f87171, var(--accent-red)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        #slide4 .slide-title span { background: linear-gradient(to right, #34d399, var(--accent-emerald)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        #slide5 .slide-title span { background: linear-gradient(to right, #c084fc, var(--accent-purple)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

        h3 { font-size: 28px; font-weight: 600; margin-bottom: 12px; }
        p, .li-text { color: var(--text-muted); font-size: 21px; line-height: 1.6; margin-bottom: 16px; }
        
        .text-gradient {
            background: linear-gradient(to right, var(--accent-cyan), var(--accent-blue));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .text-gradient-gold {
            background: linear-gradient(to right, #fcd34d, var(--accent-gold));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .content-area { display: flex; flex-direction: column; flex-grow: 1; justify-content: center; }
        .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }

        .image-wrapper {
            border-radius: 16px; height: 420px; width: 100%; overflow: hidden;
            border: 1px solid var(--glass-border); background: #000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 40px rgba(59, 130, 246, 0.1);
            position: relative;
        }
        .image-wrapper img { height: 100%; width: 100%; object-fit: cover; }

        .code-block {
            background: #000; border: 1px solid rgba(239, 68, 68, 0.3);
            padding: 40px 30px 30px; border-radius: 16px; font-family: 'Fira Code', monospace;
            color: #fca5a5; font-size: 18px; line-height: 1.6; position: relative; text-align: left;
        }
        .code-block::before {
            content: '🔴 🟡 🟢 terminal_output.log'; position: absolute; top: 12px; left: 20px;
            font-size: 12px; color: #7f1d1d; font-family: 'Inter', sans-serif; font-weight: 600;
        }

        .feature-list { list-style: none; width: 100%; padding: 0; }
        .feature-list li {
            display: flex; align-items: flex-start; gap: 18px; margin-bottom: 24px;
            background: var(--glass-bg); padding: 20px 24px; border-radius: 12px;
            border: 1px solid var(--glass-border); transition: transform 0.2s, background 0.2s;
            text-align: left;
        }
        .feature-list li:hover { transform: translateX(5px); background: rgba(255,255,255,0.06); }
        .feature-list i { color: var(--accent-blue); font-size: 24px; margin-top: 2px; }
        .feature-list.red i { color: var(--accent-red); }
        .feature-list.gold i { color: var(--accent-gold); }
        .feature-list strong { color: var(--text-main); font-weight: 600; font-size: 22px; display: block; margin-bottom: 4px;}

        .grid-cards { display: grid; gap: 30px; width: 100%; }
        .cols-2 { grid-template-columns: repeat(2, 1fr); }
        .cols-3 { grid-template-columns: repeat(3, 1fr); }

        .card {
            background: var(--glass-bg); border: 1px solid var(--glass-border);
            padding: 40px 30px; border-radius: 20px; text-align: center;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative; overflow: hidden;
        }
        .card:hover { transform: translateY(-8px); background: rgba(255,255,255,0.05); box-shadow: 0 15px 30px rgba(0,0,0,0.4); }
        .card i { font-size: 42px; margin-bottom: 24px; display: inline-block; }
        
        .card.emerald { border-color: rgba(16, 185, 129, 0.2); }
        .card.emerald i { color: var(--accent-emerald); }
        .card.purple { border-color: rgba(168, 85, 247, 0.2); text-align: left;}
        .card.purple h4 { color: #d8b4fe; font-size: 24px; margin-bottom: 12px;}
        .card.gold { border-color: rgba(251, 191, 36, 0.2); }
        .card.gold i { color: var(--accent-gold); }

        .flow-diagram { display: flex; align-items: stretch; justify-content: space-between; width: 100%; gap: 15px; }
        .flow-step {
            flex: 1; background: var(--glass-bg); border: 1px solid var(--glass-border);
            padding: 30px 20px; border-radius: 16px; text-align: center; position: relative;
        }
        .flow-step .step-label {
            display: inline-block; padding: 4px 12px; border-radius: 50px;
            font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            margin-bottom: 16px;
        }
        .flow-step:nth-child(1) .step-label { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
        .flow-step:nth-child(3) .step-label { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
        .flow-step:nth-child(5) .step-label { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
        .flow-step:nth-child(7) .step-label { background: rgba(236, 72, 153, 0.2); color: #f9a8d4; }
        
        .flow-step h4 { font-size: 22px; color: #fff; margin-bottom: 12px; }
        .flow-step p { font-size: 15px; margin: 0; line-height: 1.5; }
        .flow-arrow { display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 24px; }

        .table-layout { width: 100%; background: var(--glass-bg); border-radius: 16px; border: 1px solid var(--glass-border); overflow: hidden; }
        .table-layout table { border-collapse: collapse; width: 100%; }
        .table-layout th, .table-layout td { padding: 24px 30px; text-align: left; border-bottom: 1px solid var(--glass-border); }
        .table-layout th { background: rgba(255,255,255,0.02); font-size: 20px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;}
        .table-layout td { font-size: 20px; }
        .table-layout td:first-child { font-weight: 700; color: #fff; }

        .sponsors-banner { display: flex; justify-content: center; gap: 50px; margin-top: 40px; align-items: center; padding: 20px 40px; background: var(--glass-bg); border-radius: 100px; border: 1px solid var(--glass-border); display: inline-flex;}
        .sponsor { display: flex; align-items: center; font-size: 20px; font-weight: 600; color: #fff; }
        .sponsor i { font-size: 28px; margin-right: 12px; }
        .sponsor.uni i { color: #ff007a; } 
        .sponsor.unichain i { color: var(--accent-purple); }
        .sponsor.reactive i { color: var(--accent-emerald); }

        .progress-bar {
            position: fixed; top: 0; left: 0; height: 4px; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-purple));
            z-index: 20000; transition: width 0.4s ease;
        }

        .deck-controls {
            position: fixed; bottom: 30px; right: 40px; display: flex; gap: 15px; z-index: 10000;
        }
        .deck-btn {
            background: rgba(15, 23, 42, 0.7); border: 1px solid var(--glass-border); color: #fff;
            padding: 12px 24px; border-radius: 50px; cursor: pointer; font-family: 'Inter', sans-serif;
            font-size: 15px; font-weight: 600; transition: all 0.2s; backdrop-filter: blur(10px);
            display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .deck-btn:hover:not(:disabled) { background: rgba(59, 130, 246, 0.2); border-color: var(--accent-blue); }
        .deck-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .slide-counter {
            position: fixed; bottom: 30px; left: 40px; color: var(--text-muted); font-size: 15px;
            font-family: 'Fira Code', monospace; z-index: 10000; background: rgba(15, 23, 42, 0.7);
            padding: 12px 24px; border-radius: 50px; border: 1px solid var(--glass-border); backdrop-filter: blur(10px);
        }
        .slide-dots {
            position: fixed; bottom: 45px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 8px; z-index: 10000;
        }
        .dot {
            width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.2); transition: all 0.3s; cursor: pointer;
        }
        .dot.active { background: var(--accent-blue); width: 24px; border-radius: 4px; }

        .exit-link {
            position: fixed; top: 30px; right: 40px; z-index: 10000;
            background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border);
            padding: 8px 16px; border-radius: 12px; color: var(--text-muted);
            text-decoration: none; font-size: 14px; font-weight: 600;
            transition: all 0.2s;
        }
        .exit-link:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
      `}</style>

      <div className="progress-bar" style={{ width: `${progress}%` }}></div>

      <Link href="/" className="exit-link">
        <i className="fa-solid fa-xmark mr-2"></i> Exit
      </Link>

      <div className="slide-counter">
          [<span style={{ color: '#fff' }}>{currentSlide + 1}</span> / {totalSlides}]
      </div>

      <div className="slide-dots">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <div 
            key={idx}
            className={`dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
          />
        ))}
      </div>

      <div className="deck-controls">
          <button className="deck-btn" disabled={currentSlide === 0} onClick={prevSlide}>
            <i className="fa-solid fa-arrow-left"></i> Prev
          </button>
          <button className="deck-btn" disabled={currentSlide === totalSlides - 1} onClick={nextSlide}>
            Next <i className="fa-solid fa-arrow-right"></i>
          </button>
      </div>

      {/* Slide 1: Title */}
      <div className={`slide-container ${currentSlide === 0 ? 'active' : ''}`} id="slide1">
          <div className="glow-orb glow-top"></div>
          <div className="content-area text-center" style={{ textAlign: 'center', alignItems: 'center' }}>
              <i className="fa-solid fa-crosshairs" style={{ fontSize: '80px', color: 'var(--accent-cyan)', marginBottom: '24px' }}></i>
              <h1 className="text-gradient">ChainSniper</h1>
              <p style={{ fontSize: '28px', fontWeight: 500, margin: '24px 0 40px', maxWidth: '800px' }}>
                  The Atomic, Cross-Chain Intent Engine built natively on Uniswap V4.
              </p>
              <div className="sponsors-banner">
                  <div className="sponsor uni"><i className="fa-brands fa-ethereum"></i> Uniswap V4</div>
                  <div className="sponsor unichain"><i className="fa-solid fa-link"></i> Unichain</div>
                  <div className="sponsor reactive"><i className="fa-solid fa-bolt"></i> Reactive</div>
              </div>
          </div>
      </div>

      {/* Slide 2: Problem */}
      <div className={`slide-container ${currentSlide === 1 ? 'active' : ''}`} id="slide2">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">The L2 Trust <span>Paradox</span></h2>
          <div className="content-area">
              <div className="two-column">
                  <div>
                      <p style={{ fontSize: '22px', color: '#fff', marginBottom: '30px', fontWeight: 500 }}>We want L1 security, but we settle for centralized L2 execution bots.</p>
                      <ul className="feature-list red">
                          <li>
                              <i className="fa-solid fa-server"></i>
                              <div><strong>Centralized Keepers</strong> Limit orders rely entirely on off-chain, opaque servers to trigger execution.</div>
                          </li>
                          <li>
                              <i className="fa-solid fa-key"></i>
                              <div><strong>The Trust Gap</strong> Users are forced to grant custodial permissions to third-party, closed-source contracts.</div>
                          </li>
                          <li>
                              <i className="fa-solid fa-clock-rotate-left"></i>
                              <div><strong>Execution Latency</strong> When markets crash, centralized bots go offline. Intent execution fails when you need it most.</div>
                          </li>
                      </ul>
                  </div>
                  <div className="code-block">
{`function executeOrder(Order memory order) external {
    require(msg.sender == centralizedBot, "Unauthorized");
    
    if (bot.isOffline() || gasTracker.isSpiking()) {
        revert ExecutionFailed("User misses the snipe");
    }
    
    // User funds are locked until bot wakes up
    custodian.hold(order.funds);
}`}
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 3: Solution */}
      <div className={`slide-container ${currentSlide === 2 ? 'active' : ''}`} id="slide3">
          <div className="glow-orb glow-top"></div>
          <div className="content-area">
              <h2 style={{ fontSize: '64px', textAlign: 'center', marginBottom: '20px' }}>Trustless <span className="text-gradient">Execution</span></h2>
              <p style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px', fontSize: '24px' }}>
                  We solve the centralization paradox by building a fully autonomous execution engine directly into the Unichain state.
              </p>
              <div className="grid-cards cols-3">
                  <div className="card emerald">
                      <i className="fa-solid fa-bolt"></i>
                      <h3 style={{ color: '#fff' }}>Reactive Precision</h3>
                      <p>Zero-latency L1 monitoring triggers L2 execution the absolute millisecond target conditions hit.</p>
                  </div>
                  <div className="card emerald">
                      <i className="fa-solid fa-shield-halved"></i>
                      <h3 style={{ color: '#fff' }}>Native Non-Custodial</h3>
                      <p>Funds never leave the Uniswap V4 Hook. No third-party custodians. Pure smart contract logic.</p>
                  </div>
                  <div className="card emerald">
                      <i className="fa-solid fa-bullseye"></i>
                      <h3 style={{ color: '#fff' }}>Oracle Fidelity</h3>
                      <p>Executes trades based on highly secure L1 Chainlink feeds, not easily-manipulated local L2 AMM prices.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 4: V4 Advantage */}
      <div className={`slide-container ${currentSlide === 3 ? 'active' : ''}`} id="slide4">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">The Uniswap V4 <span>Advantage</span></h2>
          <div className="content-area">
              <p style={{ fontSize: '24px', color: '#fff', marginBottom: '40px', fontWeight: 500 }}>Why ChainSniper could only be built using V4 Hooks on Unichain.</p>
              <div className="grid-cards cols-3" style={{ gap: '40px' }}>
                  <div className="card emerald" style={{ borderTop: '4px solid var(--accent-emerald)' }}>
                      <i className="fa-solid fa-gauge-high mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Flash Accounting</h3>
                      <p>V4's transient storage allows ChainSniper to securely route intent tokens and execute complex pre-swap checks with minimal gas overhead.</p>
                  </div>
                  <div className="card emerald" style={{ borderTop: '4px solid var(--accent-emerald)' }}>
                      <i className="fa-solid fa-layer-group mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Singleton Routing</h3>
                      <p>Because all V4 pools live in one contract, our single Hook can execute cross-pair snipes (e.g., USDC to WBTC) natively.</p>
                  </div>
                  <div className="card emerald" style={{ borderTop: '4px solid var(--accent-emerald)' }}>
                      <i className="fa-solid fa-code-branch mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Native Interception</h3>
                      <p>Using the <code>beforeSwap</code> hook, we gain unparalleled control to validate cross-chain signatures precisely before pool state changes.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 5: Architecture */}
      <div className={`slide-container ${currentSlide === 4 ? 'active' : ''}`} id="slide5">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">The Sniper <span>Architecture</span></h2>
          <div className="content-area">
              <div className="grid-cards cols-3" style={{ gap: '40px' }}>
                  <div className="card" style={{ borderTop: '4px solid var(--accent-purple)' }}>
                      <i className="fa-solid fa-link mb-6" style={{ color: 'var(--accent-purple)' }}></i>
                      <h3 style={{ color: '#fff' }}>1. Unichain V4 Hook</h3>
                      <p>The Settlement Layer. A custom Uniswap V4 hook manages secure user escrows and intent validation logic.</p>
                  </div>
                  <div className="card" style={{ borderTop: '4px solid var(--accent-cyan)' }}>
                      <i className="fa-solid fa-network-wired mb-6" style={{ color: 'var(--accent-cyan)' }}></i>
                      <h3 style={{ color: '#fff' }}>2. Reactive Network</h3>
                      <p>The Cross-Chain Brain. Subscribes to L1 Oracle updates, acting as an un-censorable, decentralized watcher.</p>
                  </div>
                  <div className="card" style={{ borderTop: '4px solid var(--accent-emerald)' }}>
                      <i className="fa-solid fa-bolt-lightning mb-6" style={{ color: 'var(--accent-emerald)' }}></i>
                      <h3 style={{ color: '#fff' }}>3. Execution Relay</h3>
                      <p>The Trigger. When L1 conditions match intents, Reactive instantly dispatches an atomic cross-chain callback.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 6: Lifecycle */}
      <div className={`slide-container ${currentSlide === 5 ? 'active' : ''}`} id="slide6">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">The Atomic <span>Snipe</span></h2>
          <div className="content-area">
              <div className="flow-diagram">
                  <div className="flow-step">
                      <span className="step-label">1. Intent</span>
                      <h4>Escrow Funds</h4>
                      <p>User deposits USDC into the Unichain Hook and sets a target buy price for UNI.</p>
                  </div>
                  <div className="flow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                  <div className="flow-step">
                      <span className="step-label">2. Watch</span>
                      <h4>Monitor L1</h4>
                      <p>Reactive Network natively tracks L1 Chainlink feeds without costing the user gas.</p>
                  </div>
                  <div className="flow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                  <div className="flow-step">
                      <span className="step-label">3. Strike</span>
                      <h4>Cross-Chain Trigger</h4>
                      <p>L1 price drops to target. Reactive dispatches the execution payload instantly.</p>
                  </div>
                  <div className="flow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                  <div className="flow-step">
                      <span className="step-label">4. Settle</span>
                      <h4>Hook Execution</h4>
                      <p>Hook validates signature, executes the V4 swap, and releases UNI to the user.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 7: Contracts */}
      <div className={`slide-container ${currentSlide === 6 ? 'active' : ''}`} id="slide7">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">Under the <span>Hood</span></h2>
          <div className="content-area">
              <div className="two-column">
                  <div>
                      <ul className="feature-list">
                          <li>
                              <i className="fa-solid fa-laptop-code"></i>
                              <div>
                                  <strong>ChainSniperHook.sol</strong> 
                                  Overrides the V4 <code>beforeSwap</code> delta. Intercepts execution, verifies Reactive Network's cryptographic signature.
                              </div>
                          </li>
                          <li>
                              <i className="fa-solid fa-microchip"></i>
                              <div>
                                  <strong>ReactiveMonitor.sol</strong> 
                                  Deployed on the Reactive Network. Subscribes to target L1 contract events. Compares real-time Chainlink data.
                              </div>
                          </li>
                          <li>
                              <i className="fa-solid fa-shield-check"></i>
                              <div>
                                  <strong>Foundry Integration</strong> 
                                  Battle-tested with a full local fork environment simulating cross-chain state delays and verifying execution.
                              </div>
                          </li>
                      </ul>
                  </div>
                  <div className="image-wrapper">
                       <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80" alt="Solidity Smart Contract" />
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 8: Demo */}
      <div className={`slide-container ${currentSlide === 7 ? 'active' : ''}`} id="slide8">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">Live <span>Execution</span> Demo</h2>
          <div className="content-area">
              <div className="two-column">
                  <div>
                      <ul className="feature-list" style={{ border: 'none' }}>
                          <li style={{ background: 'transparent', border: 'none', padding: '10px 0' }}>
                              <i className="fa-solid fa-pen-nib" style={{ color: 'var(--accent-purple)' }}></i>
                              <div><strong>Creation:</strong> Place an intent on Unichain to buy UNI when L1 Chainlink hits $8.50.</div>
                          </li>
                          <li style={{ background: 'transparent', border: 'none', padding: '10px 0' }}>
                              <i className="fa-solid fa-eye" style={{ color: 'var(--accent-cyan)' }}></i>
                              <div><strong>Observation:</strong> Reactive immediately catches the L1 price drop event.</div>
                          </li>
                          <li style={{ background: 'transparent', border: 'none', padding: '10px 0' }}>
                              <i className="fa-solid fa-bolt" style={{ color: 'var(--accent-emerald)' }}></i>
                              <div><strong>Execution:</strong> Reactive fires the cross-chain callback to the Unichain Hook.</div>
                          </li>
                          <li style={{ background: 'transparent', border: 'none', padding: '10px 0' }}>
                              <i className="fa-solid fa-check-double" style={{ color: 'var(--accent-blue)' }}></i>
                              <div><strong>Settlement:</strong> The order is fulfilled autonomously. No L1 gas paid by user.</div>
                          </li>
                      </ul>
                  </div>
                  <div className="image-wrapper" style={{ borderColor: 'var(--accent-purple)' }}>
                      <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1600&q=80" alt="ChainSniper Dashboard" />
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 9: Matrix */}
      <div className={`slide-container ${currentSlide === 8 ? 'active' : ''}`} id="slide9">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">Competitive <span>Matrix</span></h2>
          <div className="content-area">
              <div className="table-layout">
                  <table>
                      <thead>
                          <tr>
                              <th>Architecture</th>
                              <th style={{ color: '#60a5fa', fontSize: '24px' }}>ChainSniper 🎯</th>
                              <th>Centralized Bots</th>
                              <th>Standard Limit Orders</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td>Execution Engine</td>
                              <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}><i className="fa-solid fa-check mr-2"></i> Autonomous</td>
                              <td style={{ color: '#f87171' }}>Off-chain Server</td>
                              <td style={{ color: 'var(--text-muted)' }}>Passive L2 Only</td>
                          </tr>
                          <tr>
                              <td>Custody & Trust</td>
                              <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}><i className="fa-solid fa-check mr-2"></i> Non-Custodial</td>
                              <td style={{ color: '#f87171' }}>Private Keys</td>
                              <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Smart Contract</td>
                          </tr>
                          <tr>
                              <td>Price Source</td>
                              <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}><i className="fa-solid fa-check mr-2"></i> L1 Oracles</td>
                              <td style={{ color: '#f87171' }}>Centralized APIs</td>
                              <td style={{ color: '#f87171' }}>L2 AMM Price</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Slide 10: Value Capture */}
      <div className={`slide-container ${currentSlide === 9 ? 'active' : ''}`} id="slide10">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">Sustainable <span className="text-gradient-gold">Value Capture</span></h2>
          <div className="content-area">
              <div className="grid-cards cols-3" style={{ gap: '40px' }}>
                  <div className="card gold" style={{ borderTop: '4px solid var(--accent-gold)' }}>
                      <i className="fa-solid fa-coins mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Execution Fee</h3>
                      <p>Minimal flat basis-point fee captured on-chain at the moment of successful snipe.</p>
                  </div>
                  <div className="card gold" style={{ borderTop: '4px solid var(--accent-gold)' }}>
                      <i className="fa-solid fa-fire-flame-curved mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Priority Bidding</h3>
                      <p>Traders boost intent priority via L1 micropayments, generating protocol revenue.</p>
                  </div>
                  <div className="card gold" style={{ borderTop: '4px solid var(--accent-gold)' }}>
                      <i className="fa-solid fa-money-bill-trend-up mb-6"></i>
                      <h3 style={{ color: '#fff' }}>Escrow Yield</h3>
                      <p>Idle user funds in v4 Hook can generate yield via whitelisted Unichain primitives.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 11: Roadmap */}
      <div className={`slide-container ${currentSlide === 10 ? 'active' : ''}`} id="slide11">
          <div className="glow-orb glow-top"></div>
          <h2 className="slide-title">Path to <span>Mainnet</span></h2>
          <div className="content-area">
              <div className="flow-diagram">
                  <div className="flow-step">
                      <span className="step-label" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Phase 1</span>
                      <h4>The Hackathon</h4>
                      <p>Deliver v4 Hook MVP and Reactive Monitor integration.</p>
                      <div className="mt-4 font-bold text-emerald-400"><i className="fa-solid fa-check"></i> Done</div>
                  </div>
                  <div className="flow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                  <div className="flow-step">
                      <span className="step-label">Phase 2</span>
                      <h4>Testnet Alpha</h4>
                      <p>Complete audits and launch incentivized campaigns.</p>
                  </div>
                  <div className="flow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                  <div className="flow-step">
                      <span className="step-label">Phase 3</span>
                      <h4>Unichain Live</h4>
                      <p>Deploy to Mainnet with live liquidity routing.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Slide 12: Team */}
      <div className={`slide-container ${currentSlide === 11 ? 'active' : ''}`} id="slide12">
          <div className="glow-orb glow-top"></div>
          <div className="content-area text-center" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '72px', marginBottom: '20px' }}>Join the <span className="text-gradient">Future</span></h2>
              <p style={{ fontSize: '26px', color: '#fff', marginBottom: '60px' }}>Building the ultimate intent engine on Unichain.</p>
              
              <div style={{ display: 'flex', gap: '80px', justifyContent: 'center', marginBottom: '60px' }}>
                  <div style={{ background: 'var(--glass-bg)', padding: '30px 40px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h4 style={{ fontSize: '28px', color: '#fff', marginBottom: '8px' }}>dev.uche</h4>
                      <div style={{ color: 'var(--accent-cyan)', fontSize: '16px' }}>Smart Contract Engineer</div>
                  </div>
                  <div style={{ background: 'var(--glass-bg)', padding: '30px 40px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                      <h4 style={{ fontSize: '28px', color: '#fff', marginBottom: '8px' }}>ogazboiz</h4>
                      <div style={{ color: 'var(--accent-purple)', fontSize: '16px' }}>Full-Stack Developer</div>
                  </div>
              </div>

              <a href="https://github.com/uhi8/chainsniper" target="_blank" className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 mx-auto w-fit no-underline">
                  <i className="fa-brands fa-github text-2xl"></i> View on GitHub
              </a>
          </div>
      </div>
    </div>
  );
}
