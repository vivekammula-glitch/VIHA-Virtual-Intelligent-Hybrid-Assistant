const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

async function chat(messages, json = false) {
  const r = await fetch('/xai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!r.ok) throw new Error(`AI request failed (${r.status}). Check GEMINI_API_KEY in .env and restart npm run dev.`);
  const d = await r.json();
  return d.choices[0].message.content;
}
const parse = (t) => JSON.parse(t.replace(/```json|```/g, '').trim());

export async function makeNotes(topic, minutes, weak = []) {
  const focus = weak.length ? ` The student got these concepts wrong in quizzes: ${weak.join(', ')}. Rewrite the notes so these are explained more simply, with an extra example each, and keep the rest.` : '';
  const t = await chat([
    { role: 'system', content: 'You are VIHA, a study assistant. Reply with JSON only.' },
    { role: 'user', content: `Write enhanced study notes on "${topic}" for a ${minutes}-minute class.${focus}
Return JSON: {"title": string, "youtubeQuery": string, "notes": [{"heading": string, "points": [string]}]} with 4-6 sections.` },
  ], true);
  return parse(t);
}

export async function makeQuiz(topic, notes, round = 1, previous = []) {
  const t = await chat([
    { role: 'system', content: 'You are VIHA, a study assistant. Reply with JSON only.' },
    { role: 'user', content: `Write quiz #${round} with 3 open-ended questions on "${topic}" based on these notes: ${JSON.stringify(notes)}.
Do not repeat these earlier questions: ${JSON.stringify(previous)}.
Return JSON: {"questions": [string]}` },
  ], true);
  return parse(t).questions;
}

export async function gradeQuiz(topic, questions, answers) {
  const qa = questions.map((q, i) => ({ q, a: answers[i] || '(no answer)' }));
  const t = await chat([
    { role: 'system', content: 'You are a fair, encouraging grader. Reply with JSON only.' },
    { role: 'user', content: `Grade these answers on "${topic}": ${JSON.stringify(qa)}.
Return JSON: {"score": number 0-100, "feedback": [string, one per question], "weak": [short concept names], "strong": [short concept names]}` },
  ], true);
  return parse(t);
}

export const askTutor = (history, context) =>
  chat([{ role: 'system', content: `You are VIHA's AI tutor. Be clear and concise. Student context: ${context}` }, ...history]);

export function videoIdFromUrl(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export async function findVideo(query, minutes = 20) {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!key) throw new Error('Add VITE_YOUTUBE_API_KEY to .env and restart npm run dev.');
  const dur = minutes > 20 ? 'long' : 'medium';
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoDuration=${dur}&order=relevance&maxResults=1&q=${encodeURIComponent(query)}&key=${key}`;
  const d = await (await fetch(url)).json();
  if (d.error) throw new Error('YouTube: ' + d.error.message);
  const id = d.items?.[0]?.id?.videoId;
  if (!id) throw new Error('No video found for this topic.');
  return id;
}