import { useState } from 'react';
import WorldCanvas, { type WorldTarget, type WorldPosition } from './world/WorldCanvas';

export default function App() {
  const [active, setActive] = useState(false);
  const [focus, setFocus] = useState<WorldTarget | null>(null);
  const [interaction, setInteraction] = useState<string | null>(null);
  const [position, setPosition] = useState<WorldPosition | null>(null);
  const [ready, setReady] = useState(false);
  return <main className="game-root">
    <WorldCanvas active={active} blocked={Boolean(interaction)} appearance={{ skin: '#a9714b', shirt: '#167a79', hair: '#26211e' }} reducedMotion={false} onInteract={setInteraction} onFocus={setFocus} onPosition={setPosition} onReady={setReady} />
    {!active ? <section className="launch-panel">
      <div className="brand">PQ<span>PROJECTQUEST</span></div>
      <p className="eyebrow">YOUR FIRST DAY. YOUR NEXT CHAPTER.</p>
      <h1>A career<br />worth <em>playing.</em></h1>
      <p className="launch-description">Step into a project team. Find the facts, make the call, and see what happens next.</p>
      <button className="primary" onClick={() => setActive(true)}>Explore the workplace <span>↗</span></button>
      <p className="quiet">Development milestone 01 · 3D interaction sandbox</p>
    </section> : <>
      <header className="hud-header"><div className="brand">PQ<span>PROJECTQUEST</span></div><button className="secondary" onClick={() => setActive(false)}>Main menu</button></header>
      <aside className="mission-hud"><p className="eyebrow">INTERACTION SANDBOX</p><h2>Your new workplace</h2><p>Explore the office, planning room and foundation site. Approach a colleague or project station to interact.</p><div className="control-line">WASD / arrows · Move<br />Drag · Camera &nbsp; E · Interact<br />Click ground · Walk</div></aside>
      <div className="world-status">{ready ? 'WORKPLACE CONNECTED' : 'Preparing workplace…'}{position && <small>{position.x.toFixed(1)} / {position.z.toFixed(1)}</small>}</div>
      {focus && !interaction && <button className="interaction-prompt" onClick={() => setInteraction(focus.id)}><kbd>E</kbd><span>{focus.name}<small>{focus.role}</small></span><span>Interact ↗</span></button>}
      {interaction && <div className="modal-backdrop"><section className="panel dialogue-panel" role="dialog" aria-modal="true" aria-labelledby="dialogue-title"><p className="eyebrow">WORLD INTERACTION</p><h2 id="dialogue-title">{interaction}</h2><p>You reached this station in the 3D workplace. The next milestone connects it to the internship mission, evidence and project simulation.</p><button className="primary" onClick={() => setInteraction(null)}>Return to workplace</button></section></div>}
    </>}
  </main>;
}
