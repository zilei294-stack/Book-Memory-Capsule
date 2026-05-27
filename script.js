/* ═══════════════════════════════════════
   BOOK MEMORY CAPSULE – script.js
═══════════════════════════════════════ */

// ── Storage helpers ──────────────────
const STORAGE_KEY = 'bookMemoryCapsules';

function loadCapsules() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCapsules(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

// ── Icon: fixed per book title (hash-based) ──
const CAPSULE_ICONS = ['🌸','🍃','🌙','🌷','🦋','⭐','🌻','🎐','🍀','🌈','🫧','🪷','🌾','🎋','🌟'];
function iconForTitle(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  return CAPSULE_ICONS[hash % CAPSULE_ICONS.length];
}

// ── View system ──────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) {
    el.classList.add('active');
    if (name === 'garden') renderGarden();
    if (name === 'leilei') initChat();
    window.scrollTo(0, 0);
  }
}

// ── GARDEN ───────────────────────────
let currentPaperIndex = null;
let formStarRating = 0;

function renderGarden() {
  const capsules = loadCapsules();
  const container = document.getElementById('garden-content');
  container.innerHTML = '';

  if (capsules.length === 0) {
    // Empty state — centre it
    container.style.pointerEvents = 'all';
    container.innerHTML = `
      <div class="garden-empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);">
        <div class="garden-empty-icon">🌱</div>
        <p>Your garden is empty.<br/>Write your first memory capsule.</p>
        <button class="new-memory-btn" onclick="showForm()" style="margin-top:10px;">✨ Write a New Memory</button>
      </div>`;
    return;
  }

  // Safe zone: avoid bottom decorations and edges
  // Cards are 110px wide, ~160px tall. Place within viewport minus header (72px)
  const W = window.innerWidth;
  const H = window.innerHeight - 72;
  const CARD_W = 120, CARD_H = 165;
  const MARGIN = 16;

  // Safe placement area: avoid bottom 28% (illustrations) and left/right 5%
  const minX = Math.floor(W * 0.05);
  const maxX = Math.floor(W * 0.90) - CARD_W;
  const minY = Math.floor(H * 0.05);
  const maxY = Math.floor(H * 0.65) - CARD_H;

  const placed = []; // {x, y}

  function noOverlap(x, y) {
    for (const p of placed) {
      if (Math.abs(x - p.x) < CARD_W + MARGIN && Math.abs(y - p.y) < CARD_H + MARGIN) return false;
    }
    return true;
  }

  function randomPos() {
    for (let attempt = 0; attempt < 200; attempt++) {
      const x = minX + Math.floor(Math.random() * (maxX - minX));
      const y = minY + Math.floor(Math.random() * (maxY - minY));
      if (noOverlap(x, y)) return { x, y };
    }
    // fallback: just place anywhere
    return { x: minX + Math.floor(Math.random() * (maxX - minX)),
             y: minY + Math.floor(Math.random() * (maxY - minY)) };
  }

  capsules.forEach((cap, i) => {
    const stars = '★'.repeat(cap.stars || 0) + '☆'.repeat(5 - (cap.stars || 0));
    const icon = iconForTitle(cap.title || 'x');
    const pos = randomPos();
    placed.push(pos);

    // Randomise float animation timing so each capsule moves independently
    const duration = (3.5 + Math.random() * 2.5).toFixed(1);
    const delay    = (Math.random() * 3).toFixed(1);

    const card = document.createElement('div');
    card.className = 'capsule-card';
    card.style.cssText = `left:${pos.x}px; top:${pos.y}px; animation: capsule-appear 0.5s ease-out, gentle-float ${duration}s ${delay}s ease-in-out infinite;`;
    card.innerHTML = `
      <div class="capsule-visual">${icon}</div>
      <div class="capsule-card-title">${escHtml(cap.title)}</div>
      <div class="capsule-card-stars">${stars}</div>`;
    card.addEventListener('click', () => openPaper(i));
    container.appendChild(card);
  });
}

function openPaper(index) {
  currentPaperIndex = index;
  const capsules = loadCapsules();
  const cap = capsules[index];
  if (!cap) return;
  const stars = '★'.repeat(cap.stars || 0) + '☆'.repeat(5 - (cap.stars || 0));
  document.getElementById('paper-inner-content').innerHTML = `
    <div class="paper-book-title">📖 ${escHtml(cap.title)}</div>
    ${cap.thought   ? `<div class="paper-section"><div class="paper-section-label">What I Thought</div><div class="paper-section-text">${escHtml(cap.thought)}</div></div>` : ''}
    ${cap.felt      ? `<div class="paper-section"><div class="paper-section-label">What I Felt</div><div class="paper-section-text">${escHtml(cap.felt)}</div></div>` : ''}
    ${cap.good      ? `<div class="paper-section"><div class="paper-section-label">What Was Good / Not So Good</div><div class="paper-section-text">${escHtml(cap.good)}</div></div>` : ''}
    ${cap.favorite  ? `<div class="paper-section"><div class="paper-section-label">Favorite Character(s) or Moment</div><div class="paper-section-text">${escHtml(cap.favorite)}</div></div>` : ''}
    <div class="paper-section"><div class="paper-section-label">How Much I Liked This Book</div><div class="paper-stars-display">${stars}</div></div>`;
  document.getElementById('paper-modal').classList.remove('hidden');
}

function closePaper() {
  document.getElementById('paper-modal').classList.add('hidden');
  currentPaperIndex = null;
}

function copyReflection() {
  const cap = loadCapsules()[currentPaperIndex];
  if (!cap) return;
  const text = [`📖 ${cap.title}`, cap.thought ? `\nWhat I Thought:\n${cap.thought}` : '',
    cap.question ? `\nThe Question It Left Me With:\n${cap.question}` : '',
    cap.matter   ? `\nWhy It Mattered:\n${cap.matter}` : '',
    cap.stars    ? `\nRating: ${'★'.repeat(cap.stars)}` : '',
    '\n\n— Book Memory Capsule'].join('');
  navigator.clipboard.writeText(text).then(() => showToast('📋 Copied to clipboard!'));
}

function deleteCurrentCapsule() {
  if (currentPaperIndex === null) return;
  const capsules = loadCapsules();
  const title = capsules[currentPaperIndex].title;
  showConfirm(`Delete the memory capsule for "${title}"?`, () => {
    const caps = loadCapsules();
    caps.splice(currentPaperIndex, 1);
    saveCapsules(caps);
    closePaper();
    renderGarden();
  });
}

function showConfirm(message, onYes) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.remove('hidden');
  const yes = document.getElementById('confirm-yes');
  const no  = document.getElementById('confirm-no');
  // Clone to remove old listeners
  const newYes = yes.cloneNode(true);
  const newNo  = no.cloneNode(true);
  yes.parentNode.replaceChild(newYes, yes);
  no.parentNode.replaceChild(newNo, no);
  newYes.addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    onYes();
  });
  newNo.addEventListener('click', () => {
    document.getElementById('confirm-modal').classList.add('hidden');
  });
}

function showForm() {
  formStarRating = 0;
  ['f-title','f-thought','f-felt','f-good','f-favorite'].forEach(id => document.getElementById(id).value = '');
  updateFormStars(0);
  document.getElementById('form-modal').classList.remove('hidden');
}
function closeForm() { document.getElementById('form-modal').classList.add('hidden'); }

function sealMemory() {
  const title = document.getElementById('f-title').value.trim();
  if (!title) { alert('Please enter a book title 📖'); return; }
  const capsule = { title, thought: document.getElementById('f-thought').value.trim(),
    felt: document.getElementById('f-felt').value.trim(),
    good: document.getElementById('f-good').value.trim(),
    favorite: document.getElementById('f-favorite').value.trim(),
    stars: formStarRating, createdAt: Date.now() };
  const capsules = loadCapsules();
  capsules.unshift(capsule);
  saveCapsules(capsules);
  closeForm(); renderGarden();
  showToast('🌱 Your book memory has been planted in the garden.');
}

function updateFormStars(val) {
  formStarRating = val;
  document.querySelectorAll('#form-stars .star').forEach((s, i) => s.classList.toggle('active', i < val));
}

function showToast(msg) {
  const toast = document.getElementById('success-toast');
  toast.textContent = msg; toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ── COMING SOON ──────────────────────
function showComingSoon() { document.getElementById('coming-soon-modal').classList.remove('hidden'); }
function closeComingSoon() { document.getElementById('coming-soon-modal').classList.add('hidden'); }

// ═══════════════════════════════════════
// ── LEILEI CHAT (AI-powered via Claude API) ──
// ═══════════════════════════════════════

let chatHistory = [];   // {role, content}[]
let chatStarRating = 0;
let chatCollectedData = {};   // filled in after conversation
let awaitingStars = false;
let conversationDone = false;

const LEILEI_SYSTEM = `You are Leilei, a warm, curious, and deeply empathetic reading companion. Your personality: gentle, playful, occasionally poetic, and genuinely interested in the reader's inner world. You speak like a close friend who loves books.

Your job: have a NATURAL, FLOWING conversation to help the reader reflect on a book they just read. Do NOT follow a rigid script. React genuinely to what they say.

Rules:
- Always respond warmly to whatever the user says — even short answers like "hmm" or "idk". Treat every answer as a window into their soul.
- If an answer is vague or short, gently probe deeper with a specific, open follow-up. Never just repeat the same question.
- Show genuine emotion: "Oh that gives me chills!", "I love that!", "Hmm, I hadn't thought of it that way..."
- Keep responses SHORT (2-4 sentences max). This is a chat, not an essay.
- After ~5-7 exchanges (once you know the book title + at least 2 meaningful reflections), naturally wrap up the conversation. Say something like "I think I have enough to weave your memory capsule now 🌸 Let me put it together for you..." and then output a JSON block.

The JSON must be the LAST thing in your message, formatted EXACTLY like this (no markdown fences):
CAPSULE_JSON:{"title":"...","thought":"...","question":"...","matter":"..."}

Rules for JSON fields:
- title: the book title (ask for it early if not given)
- thought: synthesize what the user said about their feelings/impressions (2-3 sentences, in FIRST PERSON as if the user is speaking, e.g. "I felt moved by...")
- question: the lingering question the book left them with (if none mentioned, write a thoughtful one based on the conversation)
- matter: why this book mattered personally (from conversation)

Do NOT output the JSON until you have enough content for all fields. Keep chatting until then.`;

function initChat() {
  chatHistory = [];
  chatCollectedData = {};
  chatStarRating = 0;
  awaitingStars = false;
  conversationDone = false;

  document.getElementById('chat-window').innerHTML = '';
  document.getElementById('chat-input-area').classList.add('hidden');
  document.getElementById('chat-options-area').classList.add('hidden');
  document.getElementById('chat-stars-area').classList.add('hidden');
  document.getElementById('reflection-preview').classList.add('hidden');

  setTimeout(() => addLeilaiBubble("Hi there~ 🌿 I'm Leilei, your little reading companion."), 200);
  setTimeout(() => {
    addLeilaiBubble("Did you just finish a book, or do you want to revisit a memory from something you read before?");
    showOptions([
      { label: '📖 I just finished a book!', action: () => startAIChat('new') },
      { label: '🌱 I want to add to an old memory', action: () => startAIChat('revisit') }
    ]);
  }, 900);
}

function resetChat() { initChat(); }

function startAIChat(mode) {
  hideOptions();
  const firstMsg = mode === 'new'
    ? "I just finished a book and want to reflect on it!"
    : "I want to revisit and add to a book memory I already have.";

  chatHistory.push({ role: 'user', content: firstMsg });
  callLeilei();
}

async function callLeilei() {
  showTypingIndicator();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: LEILEI_SYSTEM,
        messages: chatHistory
      })
    });
    const data = await res.json();
    removeTypingIndicator();

    const fullText = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');

    // Check if JSON capsule is embedded
    const jsonMarker = 'CAPSULE_JSON:';
    const jsonIdx = fullText.indexOf(jsonMarker);

    if (jsonIdx !== -1) {
      const visibleText = fullText.slice(0, jsonIdx).trim();
      const jsonStr = fullText.slice(jsonIdx + jsonMarker.length).trim();
      if (visibleText) addLeilaiBubble(visibleText);
      chatHistory.push({ role: 'assistant', content: fullText });

      try {
        chatCollectedData = JSON.parse(jsonStr);
      } catch {
        chatCollectedData = { title: 'My Book', thought: '', question: '', matter: '' };
      }

      conversationDone = true;
      setTimeout(() => askForStarRating(), 600);
    } else {
      addLeilaiBubble(fullText);
      chatHistory.push({ role: 'assistant', content: fullText });
      showChatInput();
    }
  } catch (err) {
    removeTypingIndicator();
    addLeilaiBubble("Oops, I lost connection for a second 🌿 Could you say that again?");
    showChatInput();
  }
}

function sendChatAnswer() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  addUserBubble(text);
  input.value = '';
  hideChatInput();
  chatHistory.push({ role: 'user', content: text });
  callLeilei();
}

function askForStarRating() {
  awaitingStars = true;
  addLeilaiBubble("One last thing — how many stars would you give this book? ✨");
  updateChatStars(0);
  document.getElementById('chat-stars-area').classList.remove('hidden');
  scrollChatToBottom();
}

function showTypingIndicator() {
  const el = document.createElement('div');
  el.className = 'chat-bubble bubble-leilei typing-indicator';
  el.id = 'typing-indicator';
  el.innerHTML = '<span></span><span></span><span></span>';
  document.getElementById('chat-window').appendChild(el);
  scrollChatToBottom();
}
function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ── Bubble helpers ───────────────────
function addLeilaiBubble(text) {
  const el = document.createElement('div');
  el.className = 'chat-bubble bubble-leilei';
  el.textContent = text;
  document.getElementById('chat-window').appendChild(el);
  scrollChatToBottom();
}
function addUserBubble(text) {
  const el = document.createElement('div');
  el.className = 'chat-bubble bubble-user';
  el.textContent = text;
  document.getElementById('chat-window').appendChild(el);
  scrollChatToBottom();
}

function showOptions(opts) {
  const area = document.getElementById('chat-options-area');
  area.innerHTML = '';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.label;
    btn.addEventListener('click', () => { addUserBubble(opt.label); hideOptions(); opt.action(); });
    area.appendChild(btn);
  });
  area.classList.remove('hidden');
}
function hideOptions() {
  document.getElementById('chat-options-area').classList.add('hidden');
  document.getElementById('chat-options-area').innerHTML = '';
}
function showChatInput() {
  document.getElementById('chat-input-area').classList.remove('hidden');
  setTimeout(() => document.getElementById('chat-input').focus(), 100);
}
function hideChatInput() { document.getElementById('chat-input-area').classList.add('hidden'); }

function updateChatStars(val) {
  chatStarRating = val;
  document.querySelectorAll('#chat-stars .star').forEach((s, i) => s.classList.toggle('active', i < val));
}

function confirmStarRating() {
  if (chatStarRating === 0) { alert('Please pick at least one star ⭐'); return; }
  addUserBubble('★'.repeat(chatStarRating) + '☆'.repeat(5 - chatStarRating));
  document.getElementById('chat-stars-area').classList.add('hidden');
  awaitingStars = false;
  generateReflectionPreview();
}

function generateReflectionPreview() {
  const d = chatCollectedData;
  const stars = '★'.repeat(chatStarRating) + '☆'.repeat(5 - chatStarRating);
  const previewHTML = `
    <div class="paper-book-title">📖 ${escHtml(d.title || 'My Book')}</div>
    ${d.thought   ? `<div class="paper-section"><div class="paper-section-label">What I Thought</div><div class="paper-section-text">${escHtml(d.thought)}</div></div>` : ''}
    ${d.question  ? `<div class="paper-section"><div class="paper-section-label">The Question It Left Me With</div><div class="paper-section-text">${escHtml(d.question)}</div></div>` : ''}
    ${d.matter    ? `<div class="paper-section"><div class="paper-section-label">Why It Mattered</div><div class="paper-section-text">${escHtml(d.matter)}</div></div>` : ''}
    <div class="paper-section"><div class="paper-section-label">How Much I Liked This Book</div><div class="paper-stars-display">${stars}</div></div>`;
  document.getElementById('preview-content').innerHTML = previewHTML;
  document.getElementById('reflection-preview').classList.remove('hidden');
  addLeilaiBubble("Here's your memory capsule ✨ Does it feel right?");
  scrollChatToBottom();
}

function sealFromChat() {
  const d = chatCollectedData;
  const capsule = { title: d.title || 'My Book', thought: d.thought || '',
    question: d.question || '', matter: d.matter || '',
    stars: chatStarRating, createdAt: Date.now() };
  const capsules = loadCapsules();
  capsules.unshift(capsule);
  saveCapsules(capsules);
  document.getElementById('reflection-preview').classList.add('hidden');
  addLeilaiBubble("🌱 Your memory capsule has been planted in the garden! Go visit it anytime~");
  scrollChatToBottom();
  setTimeout(() => showOptions([
    { label: '🌸 Go to My Garden', action: () => showView('garden') },
    { label: '📖 Reflect on another book', action: resetChat }
  ]), 600);
}

function scrollChatToBottom() {
  const win = document.getElementById('chat-window');
  setTimeout(() => win.scrollTop = win.scrollHeight, 100);
}

// ── Util ─────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Event wiring ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#form-stars .star').forEach(s => {
    s.addEventListener('click', () => updateFormStars(+s.dataset.val));
    s.addEventListener('mouseenter', () => document.querySelectorAll('#form-stars .star').forEach((st,i) => st.classList.toggle('active', i < +s.dataset.val)));
    s.addEventListener('mouseleave', () => updateFormStars(formStarRating));
  });

  document.querySelectorAll('#chat-stars .star').forEach(s => {
    s.addEventListener('click', () => { updateChatStars(+s.dataset.val); setTimeout(confirmStarRating, 300); });
    s.addEventListener('mouseenter', () => document.querySelectorAll('#chat-stars .star').forEach((st,i) => st.classList.toggle('active', i < +s.dataset.val)));
    s.addEventListener('mouseleave', () => updateChatStars(chatStarRating));
  });

  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatAnswer(); }
    });
  }
});
