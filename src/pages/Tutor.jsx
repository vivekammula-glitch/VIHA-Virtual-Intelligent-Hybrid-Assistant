import { useState } from 'react';
import Nav from './Nav.jsx';
import { stats } from '../lib/store.js';
import { askTutor } from '../lib/ai.js';

export default function Tutor() {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const { list, weak } = stats();
  const context = `Topics: ${list.map((c) => c.topic).join(', ') || 'none yet'}. Weak concepts: ${weak.join(', ') || 'none yet'}.`;

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: 'user', content: text }];
    setMsgs(next); setText(''); setBusy(true);
    try { setMsgs([...next, { role: 'assistant', content: await askTutor(next, context) }]); }
    catch (err) { setMsgs([...next, { role: 'assistant', content: err.message }]); }
    setBusy(false);
  }
  return (
    <>
      <Nav />
      <div className="wrap page">
        <h2>AI Tutor</h2>
        <div className="card chat">
          {msgs.length === 0 && <p className="muted">Ask anything about your topics.</p>}
          {msgs.map((m, i) => <p key={i} className={m.role}>{m.content}</p>)}
          {busy && <p className="muted">Thinking…</p>}
        </div>
        <form className="row gap mt" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask your tutor…" />
          <button className="btn orange">Send</button>
        </form>
      </div>
    </>
  );
}
