import { Link } from 'react-router-dom';
import { getUser } from '../lib/store.js';

const steps = [
  ['Pick a topic', 'Type what you\u2019re studying and how long you have.'],
  ['Learn', 'Get AI notes plus the best YouTube lesson, found for you.'],
  ['Get quizzed', 'Answer open questions. VIHA grades them and spots weak areas.'],
  ['Notes improve', 'Your notes are rewritten around what you still need.'],
];

export default function Landing() {
  const to = getUser() ? '/dashboard' : '/auth';
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <header className="row between"><b className="logo light">VIHA</b><Link to={to} className="pill">Sign in</Link></header>
          <span className="badge">Virtual Intelligent Hybrid Assistant</span>
          <h1>Study smarter. Every class makes the next one <em>fit you better.</em></h1>
          <p className="lead">VIHA finds lessons, writes your notes, quizzes you, and keeps adapting to what you know.</p>
          <Link to={to} className="btn orange">Start learning free</Link>
        </div>
      </section>
      <div className="wrap steps">
        {steps.map(([t, d], i) => (
          <div className="card" key={t}><span className="num">0{i + 1}</span><h4>{t}</h4><p>{d}</p></div>
        ))}
      </div>
      <div className="wrap center ask"><h3>Stuck? Just ask.</h3><p>A built-in AI tutor that knows your topic and your weak spots.</p></div>
    </>
  );
}
