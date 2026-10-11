import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowRight, Check, CheckCircle2, Clock3, Compass, Leaf, LoaderCircle, MapPin, Plus, ShieldCheck, Sprout, Trash2, Upload, X } from 'lucide-react';
import { analyzePhoto, deleteMission, getMissions, saveMission, submitEvidence, updateStatus } from './api';
import type { Mission, MissionPlan, MissionStatus } from './types';

type Tab = 'create' | 'history';
const examples = [
  { title: 'A thirsty plant bed', text: 'Check soil moisture and water only if needed.', icon: '🌱', time: '5 min' },
  { title: 'A permitted cleanup spot', text: 'Collect only ordinary litter using suitable protection.', icon: '🧤', time: '10 min' },
  { title: 'A space for native plants', text: 'Research locally suitable plants before planting.', icon: '🌼', time: '8 min' }
];
function statusLabel(status: MissionStatus) {
  return ({suggested:'Suggested', saved:'Saved', in_progress:'In progress', completed:'Completed', cancelled:'Cancelled'})[status];
}
function App() {
  const [tab, setTab] = useState<Tab>('create');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [description, setDescription] = useState('');
  const [plan, setPlan] = useState<MissionPlan | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Mission | null>(null);
  const [reflection, setReflection] = useState('');
  const [afterPhoto, setAfterPhoto] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function refreshHistory() {
    setLoadingHistory(true);
    try { const result = await getMissions(); setMissions(result.missions); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load mission history.'); }
    finally { setLoadingHistory(false); }
  }
  useEffect(() => { void refreshHistory(); }, []);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(next?: File) {
    setError(''); setNotice(''); setPlan(null);
    if (!next) return;
    if (!['image/jpeg','image/png','image/webp'].includes(next.type)) { setError('Choose a JPEG, PNG, or WebP image.'); return; }
    if (next.size > 5 * 1024 * 1024) { setError('Image must be 5 MB or smaller.'); return; }
    setFile(next);
  }
  async function generate() {
    if (!file) { setError('Add an outdoor photo first.'); return; }
    setBusy(true); setError(''); setNotice(''); setPlan(null);
    try { setPlan(await analyzePhoto(file, description)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not analyze this photo.'); }
    finally { setBusy(false); }
  }
  async function saveCurrent() {
    if (!plan) return;
    setBusy(true); setError('');
    try {
      const { mission } = await saveMission(plan);
      setMissions(old => [mission, ...old.filter(m => m._id !== mission._id)]);
      setSelected(mission); setPlan(null); setTab('history'); setNotice('Mission saved. Now take it outside when you are ready.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save mission.'); }
    finally { setBusy(false); }
  }
  async function setStatus(mission: Mission, status: MissionStatus) {
    setError(''); setNotice('');
    try {
      const { mission: updated } = await updateStatus(mission._id, status);
      setMissions(old => old.map(m => m._id === updated._id ? updated : m));
      setSelected(updated); setNotice(`Mission marked ${statusLabel(status).toLowerCase()}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update mission.'); }
  }
  async function completeMission() {
    if (!selected) return;
    setError('');
    try {
      await submitEvidence(selected._id, afterPhoto, reflection);
      const { mission: updated } = await updateStatus(selected._id, 'completed');
      setMissions(old => old.map(m => m._id === updated._id ? updated : m));
      setSelected(updated); setNotice('Completion recorded as user-reported. Nice work getting outside.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save evidence.'); }
  }
  async function removeMission(mission: Mission) {
    if (!confirm('Delete this mission record?')) return;
    try {
      await deleteMission(mission._id);
      setMissions(old => old.filter(m => m._id !== mission._id));
      if (selected?._id === mission._id) setSelected(null);
      setNotice('Mission record deleted.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete mission.'); }
  }

  return <>
    <header className="topbar-wrapper">
      <div className="topbar">
        <a className="brand" href="#" onClick={e => {e.preventDefault(); setTab('create');}}><span className="brand-mark"><Leaf size={20}/></span><span>outsidefix<span className="brand-period">.</span></span></a>
        <nav className="nav-tabs" aria-label="Main navigation">
          <button className={tab==='create'?'nav-tab active':'nav-tab'} onClick={() => setTab('create')}><span className="tab-label">Discover</span></button>
          <button className={tab==='history'?'nav-tab active':'nav-tab'} onClick={() => {setTab('history'); void refreshHistory();}}><span className="tab-label">My missions</span><span className="count">{missions.length}</span></button>
        </nav>
        <div className="top-note"><span className="online-dot"/> small actions, real places</div>
      </div>
    </header>

    <div className="app-shell">

    <main>
      {tab==='create' ? <section className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line"/> YOUR NEIGHBORHOOD, A LITTLE BETTER</div>
          <h1>Less scrolling.<br/><em>More growing.</em></h1>
          <p className="hero-subtitle">Notice something outside? Turn it into one small, safe action that makes a difference right where you are.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => document.getElementById('mission-starter')?.scrollIntoView({behavior:'smooth'})}>Find my first mission <ArrowRight size={17}/></button>
            <span className="micro-note"><MapPin size={14}/> Made for the real world</span>
          </div>
          <div className="hero-stats">
            <div><strong>5–10<span> min</span></strong><small>small enough to start</small></div>
            <div><strong>1<span> action</span></strong><small>not another endless feed</small></div>
            <div><strong>0<span> pressure</span></strong><small>your pace, your place</small></div>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-image"><div className="sun-disc"/><div className="art-caption"><span className="art-label">TODAY'S REMINDER</span><strong>The world is<br/>waiting outside.</strong><span className="art-caption-foot"><Sprout size={15}/> Start where you are</span></div></div>
          <div className="floating-note note-top"><span className="note-icon">✳</span><span><strong>One tiny mission</strong><small>can be a real beginning</small></span></div>
          <div className="floating-note note-bottom"><span className="note-check"><Check size={15}/></span><span><strong>Done is better than perfect</strong><small>Celebrate the action, not the app</small></span></div>
          <div className="art-stamp">STEP<br/>OUTSIDE</div>
        </div>
      </section> : <section className="page-heading"><div className="eyebrow"><span className="eyebrow-line"/> YOUR FIELD NOTES</div><h1>Small actions,<br/><em>kept in memory.</em></h1><p>Your missions live here, ready for the next time you head out.</p></section>}

      {error && <div className="alert alert-error" role="alert"><X size={18}/><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
      {notice && <div className="alert alert-success" role="status"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}

      {tab==='create' ? <>
        <section id="mission-starter" className="starter-section">
          <div className="section-heading"><div><div className="eyebrow">01 / OBSERVE</div><h2>Start with what you notice.</h2><p>Take a photo of a safe outdoor situation. We'll help you find a practical next step.</p></div><span className="section-index">FIELD NOTE 001</span></div>
          <div className="starter-grid">
            <div className="upload-card">
              <div className="upload-top"><span className="step-number">01</span><div><strong>Bring the outside in</strong><small>Only for a moment. Then head back out.</small></div></div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="visually-hidden" onChange={e => chooseFile(e.target.files?.[0])}/>
              {preview ? <div className="image-preview"><img src={preview} alt="Selected outdoor observation"/><button className="remove-image" onClick={() => {setFile(null); setPlan(null); if(inputRef.current) inputRef.current.value='';}} aria-label="Remove image"><X size={17}/></button><span className="preview-chip"><CheckCircle2 size={14}/> Photo ready</span></div> :
                <button className="upload-zone" onClick={() => inputRef.current?.click()}><span className="upload-icon"><Upload size={22}/></span><strong>Choose an outdoor photo</strong><span>JPEG, PNG or WebP · up to 5 MB</span><span className="upload-cta">Browse files <ArrowDownRight size={15}/></span></button>}
              <label className="field-label" htmlFor="description">A little context <span>OPTIONAL</span></label>
              <textarea id="description" value={description} onChange={e=>setDescription(e.target.value)} maxLength={500} placeholder="e.g. This plant bed is on my own balcony..." rows={3}/>
              <button className="button button-primary full-button" disabled={busy || !file} onClick={() => void generate()}>{busy ? <><LoaderCircle className="spin" size={17}/> Thinking through it…</> : <>Find a safe next step <ArrowRight size={17}/></>}</button>
              <p className="privacy-line"><ShieldCheck size={14}/> Your image is sent to the configured AI service for analysis.</p>
            </div>
            <aside className="side-column">
              <div className="side-card side-card-tint"><div className="side-icon"><Compass size={19}/></div><h3>Keep it small.</h3><p>A few minutes outdoors can be a meaningful start. You don't need special gear or a perfect plan.</p><div className="side-rule"/></div>
              <div className="side-card"><div className="side-card-head"><h3>Need inspiration?</h3><span>THREE SMALL STARTS</span></div>{examples.map((item,i)=><button className="idea-row" key={item.title} onClick={()=>setDescription(item.text)}><span className="idea-emoji">{item.icon}</span><span className="idea-text"><strong>{item.title}</strong><small>{item.time} · tap to add context</small></span><ArrowRight size={15}/></button>)}</div>
            </aside>
          </div>
        </section>
        {plan && <section className="mission-result">
          <div className="result-top"><span className="result-kicker"><CheckCircle2 size={16}/> YOUR MISSION IS READY</span><span className="result-time"><Clock3 size={15}/> {plan.durationMinutes} min</span></div>
          <h2>{plan.action}</h2><p className="result-observation">{plan.observation}</p><p>{plan.whyItHelps}</p>
          <div className="result-columns"><div><h4>WHAT YOU'LL NEED</h4>{plan.materials.map(x=><div className="list-line" key={x}><span className="list-dot"/>{x}</div>)}</div><div><h4>YOUR STEPS</h4>{plan.steps.map((x,i)=><div className="step-line" key={x}><span>{i+1}</span>{x}</div>)}</div></div>
          <div className="safety-box"><ShieldCheck size={18}/><div><strong>A note before you go</strong>{plan.safetyNotes.map(x=><p key={x}>{x}</p>)}{plan.permissionRequired&&<p>Permission may be required before taking action.</p>}{plan.uncertainty&&<p>{plan.uncertainty}</p>}</div></div>
          <div className="result-actions"><button className="button button-primary" onClick={()=>void saveCurrent()} disabled={busy}>{busy?'Saving…':<>Save this mission <ArrowRight size={17}/></>}</button><button className="button button-quiet" onClick={()=>setPlan(null)}>Try another photo</button></div>
        </section>}
      </> : <section className="history-section">
        <div className="section-heading"><div><div className="eyebrow">YOUR PERSONAL FIELD NOTES</div><h2>Every small action counts.</h2><p>These records are yours. Completed means you reported finishing the action.</p></div><button className="button button-primary" onClick={()=>setTab('create')}><Plus size={17}/> New mission</button></div>
        {loadingHistory ? <div className="empty-state"><LoaderCircle className="spin" size={25}/><p>Gathering your field notes…</p></div> : missions.length===0 ? <div className="empty-state"><span className="empty-illustration">🌿</span><h3>Your first field note starts here.</h3><p>Generate a mission from a real outdoor observation and save it for later.</p><button className="button button-primary" onClick={()=>setTab('create')}>Create a mission <ArrowRight size={16}/></button></div> :
          <div className="history-layout"><div className="mission-list">{missions.map(m=><button key={m._id} className={`mission-list-item ${selected?._id===m._id?'selected':''}`} onClick={()=>{setSelected(m);setReflection(m.reflection||m.evidence?.reflection||'');setAfterPhoto(m.evidence?.afterPhotoName||'');}}><span className="mission-leaf"><Leaf size={18}/></span><span className="mission-list-copy"><strong>{m.action}</strong><small>{new Date(m.createdAt).toLocaleDateString()} · {m.durationMinutes} min</small><span className={`status status-${m.status}`}>{statusLabel(m.status)}</span></span><ArrowRight size={16}/></button>)}</div>
            {selected && <div className="mission-detail"><div className="detail-head"><span className={`status status-${selected.status}`}>{statusLabel(selected.status)}</span><button className="icon-button" aria-label="Delete mission" onClick={()=>void removeMission(selected)}><Trash2 size={16}/></button></div><h3>{selected.action}</h3><p>{selected.observation}</p><div className="detail-meta"><span><Clock3 size={15}/> {selected.durationMinutes} min</span><span><ShieldCheck size={15}/> Safety first</span></div><h4>Steps</h4>{selected.steps.map((s,i)=><div className="step-line" key={s}><span>{i+1}</span>{s}</div>)}<div className="safety-box compact"><ShieldCheck size={17}/><div>{selected.safetyNotes.map(s=><p key={s}>{s}</p>)}</div></div>
              {selected.status!=='completed'&&selected.status!=='cancelled'&&<div className="detail-actions">{selected.status!=='in_progress'&&<button className="button button-secondary" onClick={()=>void setStatus(selected,'in_progress')}>Start mission</button>}<label className="field-label" htmlFor="afterPhoto">After-photo filename <span>OPTIONAL</span></label><input id="afterPhoto" value={afterPhoto} onChange={e=>setAfterPhoto(e.target.value)} placeholder="e.g. garden-after.jpg"/><label className="field-label" htmlFor="reflection">What changed? <span>OPTIONAL</span></label><textarea id="reflection" rows={3} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="A short reflection on what you did…"/><button className="button button-primary full-button" onClick={()=>void completeMission()}>Record completion <CheckCircle2 size={17}/></button><button className="button button-quiet full-button" onClick={()=>void setStatus(selected,'cancelled')}>Cancel mission</button></div>}
              {selected.status==='completed'&&<div className="completed-note"><CheckCircle2 size={19}/><div><strong>Completion recorded</strong><p>User-reported on {selected.evidence?.submittedAt?new Date(selected.evidence.submittedAt).toLocaleDateString():'the recorded date'}.</p>{selected.evidence?.reflection&&<p>“{selected.evidence.reflection}”</p>}</div></div>}
            </div>}
          </div>}
      </section>}

      <section className="closing-strip"><div className="closing-mark"><Sprout size={21}/></div><div><strong>The goal isn't more screen time.</strong><p>It's one useful thing you do after you put your phone away.</p></div><span className="closing-stamp">GO OUTSIDE <ArrowDownRight size={15}/></span></section>
    </main>
    <footer><a className="brand footer-brand" href="#" onClick={e=>{e.preventDefault();setTab('create')}}><span className="brand-mark"><Leaf size={16}/></span><span>outsidefix<span className="brand-period">.</span></span></a><span>Made for small actions in real places.</span><span className="footer-safety"><ShieldCheck size={14}/> Safety over certainty</span></footer>
    </div>
  </>;
}
export default App;
