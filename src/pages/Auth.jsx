import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../lib/store.js';

export default function Auth() {
  const [name, setName] = useState('');
  const nav = useNavigate();
  const go = (e) => { e.preventDefault(); if (!name.trim()) return; setUser(name.trim()); nav('/dashboard'); };
  return (
    <div className="auth">
      <aside><b className="logo light">VIHA</b><blockquote>“Every quiz teaches VIHA a little more about how you learn.”</blockquote></aside>
      <main>
        <form onSubmit={go}>
          <h2>What's your name?</h2>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <button className="btn dark block">Start learning</button>
        </form>
      </main>
    </div>
  );
}
