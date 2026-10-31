import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from './Nav.jsx';
import { addClass, stats } from '../lib/store.js';

export default function Dashboard() {
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState(20);
  const nav = useNavigate();
  const { list, scores, weak, strong, avg } = stats();

  const start = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const id = Date.now().toString(36);
    addClass({ id, topic: topic.trim(), minutes, createdAt: Date.now() });
    nav(`/class/${id}`);
  };

  return (
    <>
      <Nav />
      <div className="wrap page">
        <h2>Your learning space</h2>
        <p className="muted">Start a class — VIHA uses everything it knows about you.</p>
        <form className="start" onSubmit={start}>
          <div className="grow"><label>What are you studying today?</label>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Introduction to Machine Learning" /></div>
          <div><label>Minutes</label><input type="number" min="5" value={minutes} onChange={(e) => setMinutes(+e.target.value)} /></div>
          <button className="btn orange">Start class</button>
        </form>
        <div className="cols3">
          <div className="card stat"><span className="muted">Classes</span><b>{list.length}</b></div>
          <div className="card stat"><span className="muted">Average quiz score</span><b>{avg ?? '—'}</b></div>
          <div className="card stat"><span className="muted">Concepts to review</span><b>{weak.length}</b></div>
        </div>
        <div className="cols3 top">
          <div>
            <h3>Progress</h3>
            <div className="card">
              {scores.length < 1 ? <p className="muted">Finish a couple of quizzes to see your progress chart.</p> :
                <div className="bars">{scores.slice().reverse().map((s, i) => <div key={i} style={{ height: `${s}%` }} title={`${s}`}><span>{s}</span></div>)}</div>}
            </div>
            <div className="card mt"><h3>Knowledge map</h3>
              {!weak.length && !strong.length ? <p className="muted">Finish a quiz to see your weak and strong concepts.</p> : <>
                {strong.map((c) => <span className="chip good" key={c}>{c}</span>)}
                {weak.map((c) => <span className="chip bad" key={c}>{c}</span>)}</>}
            </div>
          </div>
          <div>
            <h3>Your classes</h3>
            <div className="card tall">
              {!list.length ? <p className="muted">No classes yet — start your first one above.</p> :
                list.map((c) => <Link className="item" to={`/class/${c.id}`} key={c.id}><b>{c.title || c.topic}</b><span className="muted">{c.minutes} min{c.result ? ` · ${c.result.score}%` : ''}</span></Link>)}
            </div>
          </div>
          <div>
            <h3>Study schedule</h3>
            <div className="card dashed">
              {!list.length ? <p className="muted">Open a class and let VIHA pick its video — your study reminders will show up here.</p> :
                list.filter((c) => c.result?.weak?.length).map((c) => <p key={c.id}>Review <b>{c.topic}</b>: {c.result.weak.join(', ')}</p>)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
