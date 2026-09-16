import {KEY, ROOT, ROUTES, SECTIONS, fresh, decode, day, remaining, active, begin, pause, resume, stop, bookmark, destination, chooseStorage} from './session-core.js';

const persistence = chooseStorage(window);
let state = fresh();
const hub = document.querySelector('#journey-app');
const protectedName = document.body.dataset.adventure;
const gate = document.querySelector('#session-gate');
let currentQuestion = -1;
let answers = [];
let currentView = '';
let warningShown = '';
let dialogSession = '';
let restoring = false;
let allowAutoBookmark = false;
let contentWasActive = false;
let sessionWasActive = false;
const requested = new URLSearchParams(location.search).get('next');
const target = Object.hasOwn(ROUTES, requested) ? requested : null;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (text, action, secondary = false) => `<button class="button${secondary ? ' secondary' : ''}" type="button" data-action="${action}">${text}</button>`;
const storageCopy = () => persistence.mode === 'device' ? 'Your place stays in this browser on this device. No account is needed. Check-in answers are cleared when you start.' : persistence.mode === 'tab' ? 'This browser only allows temporary saving. Your place lasts in this tab until it closes.' : 'Browser saving is blocked. Please allow site storage to use check-ins and timed sessions. No answers have been sent anywhere.';
function read() {
  try { state = decode(persistence.storage?.getItem(KEY)); } catch { state = fresh(); }
  return state;
}
function save() {
  try {
    if (!persistence.storage) throw new Error('Storage unavailable');
    persistence.storage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    document.querySelectorAll('[data-storage]').forEach(e => { e.textContent = 'We could not save in this browser. Keep this page open and ask a grown-up to check browser storage before continuing.'; e.classList.add('error'); });
    return false;
  }
}
function change(fn) { read(); fn(state); return save(); }
function error(text, scope = hub) {
  const el = scope?.querySelector('[data-error]');
  if (el) { el.textContent = text; el.hidden = false; el.focus(); }
}
function panel(content, focus = true) {
  hub.innerHTML = `<div class="journey-panel">${content}<p data-error class="error" role="alert" tabindex="-1" hidden></p></div><p class="storage-note" data-storage>${storageCopy()} <a href="${ROOT}privacy/">Privacy &amp; saving</a></p>`;
  if (focus) { hub.querySelector('h2')?.focus({preventScroll: true}); hub.scrollIntoView({behavior:'instant',block:'start'}); }
}
const questions = [
  {title:'Was today a school day?', cue:'🎒 🏫', description:'How did it go? You can talk with your grown-up. You do not need to type or record anything.', choices:[['school','🎒','Yes, a school day','We can talk about it together.'],['not-today','🏡','Not today','A weekend, holiday, or a different kind of day.'],['help','🤝','I want to talk','Something is on my mind.']]},
  {title:'Have you had a chance to freshen up?', cue:'🧼 👐', description:'Washing hands or using a clean towel can be a small fresh start. Choose what fits your day.'},
  {title:'How is homework going?', cue:'📖 ✏️ 🤝', description:'Some days there is no homework. Some days another person can help.'},
  {title:'Have you had time to play or move?', cue:'🌳 ⚽ 🪑', description:'Outside if it was safe, or indoors in a way that works for your body. Seated play counts too.'},
  {title:'How did you help at home?', cue:'🧸 🍽️ 🪴', description:'Pick one picture that fits. Small contributions matter, and it is okay to need help choosing.', choices:[['toys','🧸','Put my toys away',''],['table','🍽️','Helped set the table','Safe, lightweight items.'],['plant','🪴','Watered a plant',''],['other','💛','Helped another way',''],['not-yet','🌱','Not yet',''],['help','🤝','I need help choosing',''],['not-today','☁️','Not today','A different kind of day.']]}
];
const common = [['done','✓','Done',''],['not-yet','🌱','Not yet',''],['not-today','☁️','Not today',''],['help','🤝','I need help','']];
const choices = index => questions[index].choices || common;
const label = index => choices(index).find(c => c[0] === answers[index])?.[2] || 'Not answered';
const pending = index => ['not-yet','not-today','help'].includes(answers[index]);
function pauseWelcome() { document.querySelectorAll('.welcome-media video').forEach(video => video.pause()); }
function showQuestion(index) {
  pauseWelcome();
  currentView = 'questions'; currentQuestion = index;
  const q = questions[index];
  panel(`<p class="step-label">A little check-in · ${index + 1} of 5</p><div class="journey-progress" aria-hidden="true">${questions.map((_,i)=>`<span class="${i<=index?'visited':''}"></span>`).join('')}</div><div class="question-cue" aria-hidden="true">${q.cue}</div><h2 tabindex="-1">${q.title}</h2><p>${q.description}</p><div class="choice-grid" role="group" aria-label="Choose your answer">${choices(index).map(([id,icon,text,hint])=>`<button type="button" class="choice" data-answer="${id}" aria-pressed="${answers[index]===id}"><span class="choice-icon" aria-hidden="true">${icon}</span><span>${text}${hint?`<small>${hint}</small>`:''}</span></button>`).join('')}</div><p class="feedback" role="status" id="answer-feedback">${answerFeedback(answers[index])}</p><div class="journey-actions">${button(index ? 'Back' : 'Back to welcome','back',true)}<button type="button" class="button" data-action="next" ${answers[index]?'':'disabled'}>${index===4?'Review together':'Next question'}</button></div>`);
}
function answerFeedback(answer) {
  if (answer === 'not-yet') return 'That is okay. Your grown-up can help you decide what comes next.';
  if (answer === 'help') return 'It is okay to ask for help. Let your grown-up know what you need.';
  if (answer === 'not-today') return 'Every day is different. Your grown-up can confirm what fits today.';
  return answer ? 'Thanks for sharing. You can change your answer if you want.' : 'Choose what fits today. There is no perfect answer.';
}
function showReview() {
  currentView = 'review';
  panel(`<p class="step-label">A moment with your grown-up</p><h2 tabindex="-1">What works for today?</h2><p>Grown-up: review the answers together. For anything unfinished or not applicable, arrange help, take a break, or approve an exception. Nothing needs to be a perfect “yes.”</p><ul class="review-list">${questions.map((q,i)=>`<li><div><strong>${['School','Freshening up','Homework','Play & movement','Helping at home'][i]}</strong><span>${escape(label(i))}</span>${pending(i)?`<label class="check-row"><input type="checkbox" data-exception="${i}" aria-label="Approve today’s exception or help for ${['school','freshening up','homework','play and movement','helping at home'][i]}"><span>I confirm this is not needed today, help is arranged, or an exception is okay.</span></label>`:''}</div><button type="button" class="text-button" data-edit="${i}">Change<span class="sr-only"> ${['school','freshening up','homework','play','helping'][i]} answer</span></button></li>`).join('')}</ul><fieldset><legend>How long would you like to explore?</legend><p class="fine">Choose together. These are options, not a recommended limit for every child.</p><select class="time-choice" id="session-duration" aria-label="Session duration">${[5,10,15,20,30].map(n=>`<option value="${n}" ${state.minutes===n?'selected':''}>${n} minutes</option>`).join('')}<option value="custom" ${![5,10,15,20,30].includes(state.minutes)?'selected':''}>Choose another duration</option></select><div class="custom-time" id="custom-time" ${[5,10,15,20,30].includes(state.minutes)?'hidden':''}><label>Minutes (1–120) <input id="custom-minutes" type="number" min="1" max="120" step="1" value="${state.minutes}"></label></div></fieldset><label class="check-row"><input type="checkbox" id="adult-approved"><span>I’m the grown-up. We’ve reviewed what matters today and agreed on this time.</span></label><p class="fine">This is a family confirmation, not identity verification. The timer starts when you open the adventure, and keeps running if you leave the tab. Use Pause &amp; save to take a break.</p><div class="journey-actions">${button('Back to answers','last',true)}${button('Open our adventure','begin')}</div>`);
}
function welcome(focus = true) {
  currentView = 'welcome'; currentQuestion = -1;
  const hasPlace = !!state.progress[state.last];
  const placeNames = {story:'The story',game:'The game',reflection:'For grown-ups',prepare:'Gather your supplies',play:'How to play','step-1':'Step 1: Draw your first route','step-2':'Step 2: Change something','step-3':'Step 3: Pause and notice','step-4':'Step 4: Choose your next move',challenge:'Choose your challenge',talk:'Talk together'};
  const placeName = placeNames[state.progress[state.last]?.section];
  panel(`<p class="step-label">Welcome, explorer</p><h2 tabindex="-1">A little check-in. Then an adventure.</h2><p>Hi, I’m Wobble, your learning buddy! Let’s fill a little gadget time with knowledge, new lessons, and big discoveries. First, take a moment with your grown-up to think about your day.</p>${hasPlace?`<p class="resume-note">Your place in ${state.last==='story'?'Wobble’s story':'the route activity'} is waiting: <strong>${escape(placeName)}</strong>. Start a new check-in and choose your time to return to it.</p>`:''}<p>Five picture questions. Honest answers. Room for a different kind of day.</p><div class="journey-actions">${button('Let’s check in','checkin')}<a class="button secondary" href="${ROOT}about/">For grown-ups</a></div><p class="fine">No microphone, camera, scores, or proof needed.</p>`, focus);
}
function ready(focus = true) {
  currentView = 'ready';
  const nextName = target || state.last;
  panel(`<p class="step-label">Our adventure time</p><h2 tabindex="-1">Where shall we explore?</h2><p>Your family check-in is complete. You can start with the story or the hands-on activity.</p><div class="choice-grid"><a class="choice" href="${destination('story',state)}"><span class="choice-icon" aria-hidden="true">📖</span><span><strong>Wobble Finds Another Way</strong><small>A story to read together · about 6 minutes</small></span></a><a class="choice" href="${destination('activity',state)}"><span class="choice-icon" aria-hidden="true">🗺️</span><span><strong>Find Another Route</strong><small>A hands-on activity · about 15 minutes</small></span></a></div>${state.progress[nextName]?`<p><a href="${destination(nextName,state)}">Return to your saved place →</a></p>`:''}<p>Going to play away from the screen? Pause your session first. You can print the activity guide while your session is open.</p><div class="journey-actions">${button('Pause & save','pause',true)}${button('Stop for today','stop',true)}</div>`,focus);
}
function pausedPage(focus = true) {
  currentView = 'paused';
  panel(`<p class="step-label">There is always another day</p><h2 tabindex="-1">Your adventure is taking a break.</h2><p>${persistence.mode==='device'?'Your place is saved in this browser.':'Your place is saved for this tab.'} You can stop here, or check with your grown-up before continuing.</p><div class="journey-actions">${button('Review our time','review-time')}${button('Stop for today','stop',true)}</div>`,focus);
}
const bar = document.createElement('aside');
bar.className = 'session-bar'; bar.hidden = true;
bar.setAttribute('aria-label','Your family session');
bar.innerHTML = `<div class="wrap"><p>◷ <strong id="time-left"></strong> <span>in our session</span></p><div>${button('Pause & save','pause',true)} <a href="${ROOT}start/">Our adventure</a></div></div><div class="wrap"><p class="session-reminder" id="time-reminder" role="status" hidden></p></div>`;
document.querySelector('.site-header')?.after(bar);
const modal = document.createElement('dialog');
modal.className = 'session-dialog'; modal.setAttribute('aria-labelledby','pause-title');
document.body.append(modal);
modal.addEventListener('cancel', e => e.preventDefault());
function showPause() {
  if (modal.open) return;
  const left = remaining(state);
  dialogSession = state.session?.id || '';
  modal.innerHTML = `<p class="eyebrow">A gentle stopping place</p><h2 id="pause-title">${left?'Let’s take a break.':'Our time is up for now.'}</h2><p data-storage>${persistence.mode==='device'?'Your place is saved in this browser for another day.':'Your place is saved in this tab.'} Stopping is part of the adventure, too.</p><p>${left?'The timer is paused.':'You do not need to finish everything today.'}</p><div class="journey-actions">${button('Stop for today','stop')}${button('Grown-up: review our time','show-extension',true)}</div><div id="extension" hidden><label class="check-row"><input type="checkbox" id="resume-approved"><span>I’m the grown-up, and we agree to continue.</span></label><label for="extra-time">Time to add</label><select class="time-choice" id="extra-time">${left?'<option value="0">Use our remaining time</option>':''}<option value="1">1 minute to finish a thought</option><option value="5">5 more minutes</option><option value="10">10 more minutes</option><option value="15">15 more minutes</option></select><div class="journey-actions">${button('Continue together','resume')}</div></div><p data-error role="alert" class="error" tabindex="-1" hidden></p>`;
  pauseWelcome();
  modal.showModal();
}
function update() {
  read();
  const welcomeWasPlaying = [...document.querySelectorAll('.welcome-media video')].some(video => !video.paused);
  const s = state.session;
  const today = s?.day === day();
  if (s?.status === 'active' && (!today || remaining(state) <= 0)) {
    pause(state); save();
  }
  const isActive = active(state);
  if (sessionWasActive && !isActive) pauseWelcome();
  sessionWasActive = isActive;
  bar.hidden = !isActive;
  const isPaused = today && state.session?.status === 'paused';
  document.body.classList.toggle('session-paused', isPaused);
  if (protectedName) {
    document.body.classList.toggle('session-required', !isActive && !isPaused);
    gate.hidden = isActive || isPaused;
    if (isActive && !contentWasActive) {
      const anchor = SECTIONS[protectedName].includes(location.hash.slice(1)) ? location.hash.slice(1) : state.progress[protectedName]?.section;
      if (anchor) requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:'instant'}));
    }
    contentWasActive = isActive;
  }
  if (isActive) {
    dialogSession = '';
    const ms = remaining(state);
    document.querySelector('#time-left').textContent = `${Math.max(1,Math.ceil(ms/60000))} ${ms>60000?'minutes':'minute'} left`;
    const reminder = document.querySelector('#time-reminder');
    const shouldWarn = ms <= Math.min(120000, state.minutes * 12000);
    if (shouldWarn && warningShown !== s.id) {
      reminder.hidden = false;
      reminder.textContent = 'Our time is nearly up. Find a comfortable place to pause. We’ll keep your place.';
      warningShown = s.id;
    } else if (!shouldWarn) reminder.hidden = true;
    if (modal.open) modal.close();
  } else if (modal.open && (!isPaused || dialogSession !== s?.id)) modal.close();
  if (hub) {
    if (isActive && currentView !== 'ready') ready(false);
    else if (isPaused && currentView !== 'paused') pausedPage(false);
    else if (!isActive && !isPaused && ['ready','paused'].includes(currentView)) welcome(false);
  }
  if (isPaused && (protectedName || currentView==='paused' || welcomeWasPlaying) && !modal.open && dialogSession !== s.id) showPause();
}
function stopSession() {
  if (!change(stop)) return error('We could not save the stopped session. Please keep this page open and check browser storage.', modal.open ? modal : hub);
  answers = []; modal.close(); dialogSession = '';
  location.assign(ROOT + 'start/?stopped=1');
}
document.addEventListener('click', e => {
  const answer = e.target.closest('[data-answer]');
  if (answer && currentView==='questions') {
    answers[currentQuestion] = answer.dataset.answer;
    hub.querySelectorAll('[data-answer]').forEach(el => el.setAttribute('aria-pressed',String(el===answer)));
    hub.querySelector('#answer-feedback').textContent = answerFeedback(answer.dataset.answer);
    hub.querySelector('[data-action="next"]').disabled = false;
  }
  const edit = e.target.closest('[data-edit]');
  if (edit) return showQuestion(Number(edit.dataset.edit));
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'checkin') { answers=[]; showQuestion(0); }
  if (action === 'back') currentQuestion ? showQuestion(currentQuestion-1) : welcome();
  if (action === 'next' && answers[currentQuestion]) currentQuestion===4 ? showReview() : showQuestion(currentQuestion+1);
  if (action === 'last') showQuestion(4);
  if (action === 'begin') {
    if (!persistence.storage) return error(storageCopy());
    if (questions.some((_,i)=>!answers[i])) return error('Please answer each question first.');
    if ([...hub.querySelectorAll('[data-exception]')].some(c=>!c.checked)) return error('Grown-up: please review each item that needs help or an exception.');
    const selection = hub.querySelector('#session-duration').value;
    const minutes = Number(selection==='custom'?hub.querySelector('#custom-minutes').value:selection);
    try {
      if (!change(s=>begin(s,minutes,hub.querySelector('#adult-approved').checked))) return error('Your browser could not save the session. Please check its storage settings.');
      answers=[];
      location.assign(destination(target || state.last,state));
    } catch (err) { error(err.message); }
  }
  if (action === 'pause') { pauseWelcome(); change(pause); dialogSession=''; update(); if (!modal.open) showPause(); }
  if (action === 'review-time') { read(); showPause(); }
  if (action === 'show-extension') { modal.querySelector('#extension').hidden=false; modal.querySelector('#resume-approved').focus(); }
  if (action === 'resume') {
    try {
      if (!change(s=>resume(s,modal.querySelector('#resume-approved').checked,Number(modal.querySelector('#extra-time').value)))) return error('We could not save your session.',modal);
      modal.close(); dialogSession=''; update();
    } catch (err) { error(err.message,modal); }
  }
  if (action === 'stop') stopSession();
  if (action === 'forget') {
    const confirmPanel = document.querySelector('#forget-confirm'); confirmPanel.hidden=false; confirmPanel.querySelector('button').focus();
  }
  if (action === 'cancel-forget') document.querySelector('#forget-confirm').hidden=true;
  if (action === 'confirm-forget') {
    let blocked = false;
    try { window.localStorage.removeItem(KEY); } catch { blocked = true; }
    try { window.sessionStorage.removeItem(KEY); } catch { blocked = true; }
    state=fresh(); answers=[]; modal.close(); document.querySelector('#forget-confirm').hidden=true;
    document.querySelector('#forget-status').textContent=blocked ? 'We cleared the storage this page can access. Use your browser’s site-data settings to remove any blocked storage.' : 'Your saved Wonderabouts session and reading place have been cleared from this browser.';
    update();
  }
});
document.addEventListener('change', e => {
  if (e.target.id==='session-duration') document.querySelector('#custom-time').hidden=e.target.value!=='custom';
});
read();
if (hub) {
  if (active(state)) ready(false);
  else if (state.session?.day===day() && state.session.status==='paused') pausedPage(false);
  else welcome(false);
}
if (protectedName) {
  if (active(state)) change(s=>bookmark(s, protectedName, s.progress[protectedName]?.section || SECTIONS[protectedName][0]));
  const heads = [...document.querySelectorAll('h2[id],.activity-steps>li[id]')].filter(h=>SECTIONS[protectedName].includes(h.id));
  heads.forEach(head=>{
    const control = document.createElement('button'); control.className='bookmark-button'; control.type='button';
    control.textContent='Save my place here'; control.setAttribute('aria-label',`Save my place: ${(head.querySelector('strong') || head).textContent.trim()}`);
    control.addEventListener('click',()=>{
      if (!active(read())) return update();
      allowAutoBookmark = false;
      if (change(s=>bookmark(s,protectedName,head.id))) {
        control.textContent='Place saved ✓';
        document.querySelector('#bookmark-status').textContent='Your place is saved. You can pause whenever you like.';
      }
    });
    head.matches('li')?head.append(control):head.after(control);
  });
  addEventListener('wheel',()=>{allowAutoBookmark=true;},{passive:true});
  addEventListener('touchmove',()=>{allowAutoBookmark=true;},{passive:true});
  addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))allowAutoBookmark=true;});
  addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(active(read()) && SECTIONS[protectedName].includes(id)){allowAutoBookmark=false;change(s=>bookmark(s,protectedName,id));}});
  let scrollPending=false;
  addEventListener('scroll',()=>{
    if (scrollPending || restoring || !allowAutoBookmark) return;
    scrollPending=true;
    setTimeout(()=>{
      scrollPending=false;
      if (!active(read()) || !allowAutoBookmark) return;
      const previous = heads.filter(h=>h.getBoundingClientRect().top<innerHeight*.45).at(-1);
      if (previous && state.progress[protectedName]?.section!==previous.id) change(s=>bookmark(s,protectedName,previous.id));
    },250);
  },{passive:true});
  const saved = state.progress[protectedName]?.section;
  if (active(state) && !location.hash && saved) {
    restoring=true;
    requestAnimationFrame(()=>{document.getElementById(saved)?.scrollIntoView({behavior:'instant'}); restoring=false;});
  }
}
addEventListener('storage',e=>{if(e.key===KEY || e.key===null) update();});
addEventListener('pageshow',()=>update());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
setInterval(update,1000);
update();

// Native player remains usable without JavaScript; these hooks coordinate family time.
for (const video of document.querySelectorAll('.welcome-media video')) {
  const wrapper = video.closest('.welcome-media');
  const failure = wrapper.querySelector('.welcome-media-error');
  const showFailure = () => { if (failure) failure.hidden = false; };
  video.addEventListener('error', showFailure);
  video.querySelector('source')?.addEventListener('error', showFailure);
  video.addEventListener('play', () => {
    update();
    if (state.session?.day === day() && state.session.status === 'paused') {
      video.pause(); showPause();
    }
  });
}
document.querySelector('#welcome-transcript')?.addEventListener('toggle', event => {
  if (event.target.open) pauseWelcome();
});
addEventListener('pagehide', pauseWelcome);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseWelcome(); });
