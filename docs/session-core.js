// Family guidance, not authentication or a parental-control security boundary.
export const KEY = 'wonderabouts.session.v1';
export const ROOT = '/wonderabouts/';
export const ROUTES = {
  story: ROOT + 'stories/wobble-finds-another-way/',
  activity: ROOT + 'activities/find-another-route/'
};
export const SECTIONS = {
  story: ['story', 'game', 'reflection'],
  activity: ['prepare', 'play', 'step-1', 'step-2', 'step-3', 'step-4', 'challenge', 'talk']
};
export function day(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
export function fresh() {
  return {version: 1, minutes: 15, session: null, progress: {}, last: 'story'};
}
export function decode(raw) {
  const clean = fresh();
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1) return clean;
    if (Number.isInteger(value.minutes) && value.minutes >= 1 && value.minutes <= 120) clean.minutes = value.minutes;
    for (const name of Object.keys(ROUTES)) {
      const p = value.progress?.[name];
      if (p && SECTIONS[name].includes(p.section)) clean.progress[name] = {section: p.section};
    }
    if (Object.hasOwn(ROUTES, value.last)) clean.last = value.last;
    const s = value.session;
    if (s && typeof s.id === 'string' && typeof s.day === 'string' && ['active', 'paused', 'ended'].includes(s.status)
      && Number.isFinite(s.remaining) && s.remaining >= 0 && s.remaining <= 7200000
      && Number.isFinite(s.deadline) && s.deadline >= 0 && typeof s.warned === 'boolean') {
      clean.session = {id: s.id.slice(0, 80), day: s.day, status: s.status, remaining: s.remaining, deadline: s.deadline, warned: s.warned};
    }
  } catch { /* Unavailable, old or damaged storage starts clean. */ }
  return clean;
}
export function remaining(state, now = Date.now()) {
  const s = state.session;
  if (!s || s.day !== day(now) || s.status === 'ended') return 0;
  return s.status === 'active' ? Math.max(0, Math.min(s.remaining, s.deadline - now)) : s.remaining;
}
export function active(state, now = Date.now()) {
  return state.session?.status === 'active' && remaining(state, now) > 0;
}
export function begin(state, minutes, approved, now = Date.now()) {
  if (!approved || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) throw new Error('Choose 1–120 minutes and ask a grown-up to confirm.');
  state.minutes = minutes;
  state.session = {id: `${now}-${Math.random().toString(36).slice(2)}`, day: day(now), status: 'active', remaining: minutes * 60000, deadline: now + minutes * 60000, warned: false};
  return state;
}
export function pause(state, now = Date.now()) {
  if (state.session?.status === 'active') {
    state.session.remaining = remaining(state, now);
    state.session.status = 'paused';
    state.session.deadline = 0;
  }
  return state;
}
export function resume(state, approved, extraMinutes = 0, now = Date.now()) {
  if (!approved || state.session?.day !== day(now) || state.session.status !== 'paused') throw new Error('Please check in with a grown-up first.');
  if (!Number.isInteger(extraMinutes) || extraMinutes < 0 || extraMinutes > 120) throw new Error('Choose a valid time.');
  const ms = Math.min(7200000, remaining(state, now) + extraMinutes * 60000);
  if (ms <= 0) throw new Error('Choose some more time together or stop for today.');
  state.minutes = Math.ceil(ms / 60000);
  Object.assign(state.session, {status: 'active', remaining: ms, deadline: now + ms, warned: extraMinutes ? false : state.session.warned});
  return state;
}
export function stop(state) {
  if (state.session) Object.assign(state.session, {status: 'ended', remaining: 0, deadline: 0});
  return state;
}
export function bookmark(state, name, section) {
  if (Object.hasOwn(SECTIONS, name) && SECTIONS[name].includes(section)) {
    state.progress[name] = {section};
    state.last = name;
  }
  return state;
}
export function destination(name, state) {
  if (!Object.hasOwn(ROUTES, name)) name = state.last;
  const section = state.progress[name]?.section;
  return ROUTES[name] + (SECTIONS[name].includes(section) ? '#' + section : '');
}
export function chooseStorage(host) {
  for (const name of ['localStorage', 'sessionStorage']) {
    try {
      const storage = host[name];
      storage.setItem(KEY + '.test', '1');
      storage.removeItem(KEY + '.test');
      return {storage, mode: name === 'localStorage' ? 'device' : 'tab'};
    } catch { /* Try temporary tab storage before reporting the limitation. */ }
  }
  return {storage: null, mode: 'none'};
}
