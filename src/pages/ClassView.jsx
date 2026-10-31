import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Nav from './Nav.jsx';
import '../class.css';
import { getClass, updateClass } from '../lib/store.js';
import { makeNotes, makeQuiz, gradeQuiz, findVideo, askTutor, videoIdFromUrl } from '../lib/ai.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function ClassView() {
  const { id } = useParams();
  const [c, setC] = useState(() => getClass(id));
  const cRef = useRef(c);
  const busy = useRef(false);
  const retryAt = useRef(0);
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');
  const [videoErr, setVideoErr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [text, setText] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [link, setLink] = useState('');

  const save = (p) => { updateClass(id, p); cRef.current = { ...cRef.current, ...p }; setC(cRef.current); };

  // 1. Topic + minutes -> notes and the best video, fetched together
  async function start() {
    const cur = cRef.current;
    busy.current = true; setStatus('Writing your notes and finding the best video…'); setErr('');
    try {
      const [r, v] = await Promise.all([
        makeNotes(cur.topic, cur.minutes),
        findVideo(`${cur.topic} lesson`, cur.minutes).catch((e) => { setVideoErr(e.message); return null; }),
      ]);
      save({ title: r.title, notes: r.notes, query: r.youtubeQuery, videoId: v, startedAt: Date.now(), quizzes: [], chat: [], notesVersion: 1 });
    } catch (e) { setErr(e.message); }
    busy.current = false; setStatus('');
  }

  // 2. A quiz every 10 minutes (or at the end, for classes shorter than 10 minutes)
  async function addQuiz() {
    if (busy.current) return;
    const cur = cRef.current;
    busy.current = true; setStatus('Writing your next quiz…');
    try {
      const prev = (cur.quizzes || []).flatMap((q) => q.questions);
      const questions = await makeQuiz(cur.topic, cur.notes, (cur.quizzes?.length || 0) + 1, prev);
      save({ quizzes: [...(cur.quizzes || []), { questions, answers: [], result: null }] });
    } catch (e) { setErr(e.message); retryAt.current = Date.now() + 30000; }
    busy.current = false; setStatus('');
  }

  useEffect(() => {
    const cur = cRef.current;
    if (cur && !cur.notes) start();
    else if (cur && !cur.startedAt) save({ startedAt: Date.now(), quizzes: [] });
    const t = setInterval(() => {
      setNow(Date.now());
      const k = cRef.current;
      if (!k?.startedAt || busy.current || Date.now() < retryAt.current) return;
      const every = Math.min(600, k.minutes * 60);
      const total = Math.max(1, Math.floor(k.minutes / 10));
      const due = Math.min(total, Math.floor((Date.now() - k.startedAt) / 1000 / every));
      if ((k.quizzes?.length || 0) < due) addQuiz();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const setAnswer = (qi, i, val) => {
    const quizzes = cRef.current.quizzes.map((q, n) => (n === qi ? { ...q, answers: Object.assign([...q.answers], { [i]: val }) } : q));
    save({ quizzes });
  };

  // 3. Submit -> grade -> notes are rewritten around the weak concepts
  async function submit(qi) {
    if (busy.current) return;
    busy.current = true; setErr(''); setStatus('Grading your answers…');
    const cur = cRef.current;
    try {
      const result = await gradeQuiz(cur.topic, cur.quizzes[qi].questions, cur.quizzes[qi].answers);
      const quizzes = cur.quizzes.map((q, n) => (n === qi ? { ...q, result } : q));
      const weak = [...new Set(quizzes.flatMap((q) => q.result?.weak || []))];
      const strong = [...new Set(quizzes.flatMap((q) => q.result?.strong || []))].filter((s) => !weak.includes(s));
      save({ quizzes, result: { score: result.score, weak, strong } });
      if (result.weak?.length) {
        setStatus('Improving your notes based on your answers…');
        const r = await makeNotes(cur.topic, cur.minutes, weak);
        save({ notes: r.notes, notesVersion: (cRef.current.notesVersion || 1) + 1 });
      }
    } catch (e) { setErr(e.message); }
    busy.current = false; setStatus('');
  }

  // 4. Chatbot under the video
  async function send(e) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg || chatBusy) return;
    const history = [...(cRef.current.chat || []), { role: 'user', content: msg }];
    save({ chat: history }); setText(''); setChatBusy(true);
    const k = cRef.current;
    const ctx = `Topic: ${k.topic}. Note sections: ${(k.notes || []).map((n) => n.heading).join('; ')}. Weak concepts: ${(k.result?.weak || []).join(', ') || 'none yet'}.`;
    let reply;
    try { reply = await askTutor(history.slice(-10), ctx); } catch (er) { reply = er.message; }
    save({ chat: [...cRef.current.chat, { role: 'assistant', content: reply }] });
    setChatBusy(false);
  }

  const useLink = () => { const v = videoIdFromUrl(link); if (v) { save({ videoId: v }); setLink(''); setVideoErr(''); } };

  if (!c) return <><Nav /><div className="wrap page">Class not found. <Link to="/dashboard">Back</Link></div></>;

  const every = Math.min(600, c.minutes * 60);
  const total = Math.max(1, Math.floor(c.minutes / 10));
  const done = c.quizzes?.length || 0;
  const elapsed = c.startedAt ? Math.floor((now - c.startedAt) / 1000) : 0;
  const nextIn = every * (done + 1) - elapsed;

  return (
    <>
      <Nav />
      <div className="wrap wide page">
        <Link to="/dashboard" className="muted">← Dashboard</Link>
        <h2>{c.title || c.topic}</h2>
        {status && <p className="status">{status}</p>}
        {err && <p className="error">{err}</p>}
        <div className="class3">
          <section className="card pane">
            <h3>Enhanced notes {c.notesVersion > 1 && <span className="tag">updated ×{c.notesVersion - 1}</span>}</h3>
            {c.notes?.map((s) => (
              <div key={s.heading}><h4>{s.heading}</h4><ul>{s.points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
            ))}
          </section>

          <div className="mid">
            <section className="card">
              {c.videoId ? (
                <div className="video"><iframe src={`https://www.youtube.com/embed/${c.videoId}?rel=0`} title="Lesson" allowFullScreen /></div>
              ) : (
                <>
                  <p className="muted">{videoErr || 'Finding your video…'}</p>
                  <div className="row gap mt"><input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or paste a YouTube link" /><button className="btn dark" onClick={useLink}>Use</button></div>
                </>
              )}
            </section>
            <section className="card chatbox">
              <h3>Ask your tutor</h3>
              <div className="msgs">
                {!c.chat?.length && <p className="muted">Stuck on something in the video? Ask here.</p>}
                {c.chat?.map((m, i) => <p key={i} className={m.role}>{m.content}</p>)}
                {chatBusy && <p className="muted">Thinking…</p>}
              </div>
              <form className="row gap" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" />
                <button className="btn orange">Send</button>
              </form>
            </section>
          </div>

          <section className="card pane">
            <h3>Quizzes</h3>
            <p className="timer">
              {!c.startedAt ? '' : done >= total ? 'All quizzes for this class are ready.' : `Next quiz in ${fmt(Math.max(0, nextIn))}`}
              {c.startedAt && done < total && <> · <a href="#" onClick={(e) => { e.preventDefault(); addQuiz(); }}>quiz me now</a></>}
            </p>
            {!done && <p className="muted">Your first quiz appears automatically. Keep watching.</p>}
            {[...(c.quizzes || [])].map((q, qi) => ({ q, qi })).reverse().map(({ q, qi }) => (
              <div className="qround" key={qi}>
                <h4>Quiz {qi + 1}{q.result && <span className="tag">{q.result.score}%</span>}</h4>
                {q.questions.map((question, i) => (
                  <div className="q" key={i}>
                    <p><b>{i + 1}.</b> {question}</p>
                    <textarea rows="3" value={q.answers[i] || ''} disabled={!!q.result} onChange={(e) => setAnswer(qi, i, e.target.value)} />
                    {q.result && <p className="fb">{q.result.feedback?.[i]}</p>}
                  </div>
                ))}
                {!q.result && <button className="btn orange" disabled={!!status} onClick={() => submit(qi)}>Submit answers</button>}
                {q.result?.weak?.length > 0 && <p className="fb">Notes were rewritten to cover: {q.result.weak.join(', ')}</p>}
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}