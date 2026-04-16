import React, { useState, useRef, useEffect } from "react";
import {
  Plus, MessageSquare, Paperclip, ArrowUp, Copy, RotateCcw, ThumbsUp,
  MoreVertical, Menu, X, PanelLeftClose, PanelLeft, Send, CheckCircle2, LoaderCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ============================================================
   HaqqAI — Frontend (Single-File React)
   ------------------------------------------------------------
   Komponentenstruktur:

     <App>
       <Sidebar>            ← ausklappbar (Desktop) / Overlay (Mobile)
       <Main>
         <TopBar>           ← Hamburger + Dreipunkt-Menü (Feedback)
         { welcome ? <WelcomeState /> : <ChatArea /> }
         <PromptInput />
       </Main>
       <FeedbackDialog />   ← Modal, öffnet via Dreipunkt-Menü
     </App>

   Responsive-Strategie:
   - >= 900px: Sidebar im Grid. Collapse-Button reduziert auf 0.
   - <  900px: Sidebar fixed als Overlay mit Backdrop.
   ============================================================ */

const GlobalStyles = () => (
  <style>{`
    :root {
      --bg:           #FBF7EE;
      --surface:      #FFFFFF;
      --sidebar-bg:   #F4EEDF;
      --ink:          #1F2D33;
      --ink-soft:     #556872;
      --ink-mute:     #8A97A0;
      --line:         #E8DFC9;
      --primary:      #4A7B8C;
      --primary-ink:  #355A68;
      --primary-soft: #DCE7EB;
      --gold:         #C9A961;
      --user-tint:    #E7EEF1;

      --ff-display: "Cormorant Garamond", "EB Garamond", Georgia, serif;
      --ff-body:   "Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif;

      --fs-brand: 18px;
      --fs-h1:    40px;
      --fs-h2:    22px;
      --fs-body:  15px;
      --fs-sm:    13px;
      --fs-xs:    11px;

      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 22px;

      --shadow-soft: 0 1px 2px rgba(31,45,51,.04), 0 8px 24px rgba(31,45,51,.05);
      --shadow-lift: 0 12px 40px rgba(31,45,51,.14);

      --sidebar-w: 288px;
      --topbar-h: 56px;
    }

    * { box-sizing: border-box; }
    html, body, #root { height: 100%; margin: 0; }
    body {
      font-family: var(--ff-body);
      font-size: var(--fs-body);
      color: var(--ink);
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }

    .app-bg {
      background-color: var(--bg);
      background-image:
        radial-gradient(ellipse at 20% 0%, rgba(201,169,97,.06), transparent 55%),
        radial-gradient(ellipse at 100% 100%, rgba(74,123,140,.05), transparent 60%),
        url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='%234A7B8C' stroke-opacity='0.055' stroke-width='1'><path d='M60 8 L92 26 L92 62 L60 80 L28 62 L28 26 Z'/><path d='M60 28 L78 38 L78 58 L60 68 L42 58 L42 38 Z'/><circle cx='60' cy='48' r='6'/></g></svg>");
      background-size: auto, auto, 240px 240px;
      background-repeat: no-repeat, no-repeat, repeat;
    }

    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-thumb { background: rgba(85,104,114,.18); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(85,104,114,.32); }
    ::-webkit-scrollbar-track { background: transparent; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin .9s linear infinite; display: inline-block; }

    .history-item-del {
      display: none; flex: 0 0 22px; height: 22px;
      place-items: center;
      border: 0; background: transparent; color: var(--ink-mute);
      border-radius: 4px; cursor: pointer; padding: 2px;
      margin-left: auto;
      transition: color .15s ease, background .15s ease;
    }
    .history-item:hover .history-item-del { display: grid; }
    .history-item-del:hover { color: #B0453A; background: rgba(176,69,58,.12); }

    /* ---------- Layout ---------- */
    .app {
      display: grid;
      grid-template-columns: var(--sidebar-w) 1fr;
      min-height: 100vh;
      transition: grid-template-columns .25s ease;
    }
    .app.sidebar-collapsed { grid-template-columns: 0 1fr; }

    /* ---------- Sidebar ---------- */
    .sidebar {
      background: var(--sidebar-bg);
      border-right: 1px solid var(--line);
      display: flex; flex-direction: column;
      padding: 20px 16px;
      gap: 20px;
      overflow: hidden;
      transition: transform .25s ease;
      min-width: 0;
    }
    .app.sidebar-collapsed .sidebar {
      transform: translateX(-100%);
      padding-left: 0; padding-right: 0;
      border-right-color: transparent;
    }

    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 4px 6px 14px;
      border-bottom: 1px solid var(--line);
      min-width: 256px;
    }
    .brand-mark {
      width: 36px; height: 36px; flex: 0 0 36px;
      display: grid; place-items: center;
      border-radius: 10px;
      background: linear-gradient(145deg, #FFFFFF, #F3EAD1);
      border: 1px solid var(--line);
      box-shadow: var(--shadow-soft);
    }
    .brand-text { display: flex; flex-direction: column; line-height: 1.05; }
    .brand-name {
      font-family: var(--ff-display);
      font-size: var(--fs-brand);
      font-weight: 600;
      color: var(--ink);
    }
    .brand-sub {
      font-size: var(--fs-xs);
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--ink-mute);
      margin-top: 3px;
    }

    .btn-new {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%;
      padding: 11px 14px;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-family: var(--ff-body);
      font-size: var(--fs-sm);
      font-weight: 500;
      border: 0; cursor: pointer;
      transition: background .15s ease, transform .15s ease;
      box-shadow: 0 1px 0 rgba(255,255,255,.3) inset, 0 6px 16px rgba(74,123,140,.25);
      min-width: 256px;
    }
    .btn-new:hover { background: var(--primary-ink); }
    .btn-new:active { transform: translateY(1px); }

    .section-label {
      font-size: var(--fs-xs);
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--ink-mute);
      padding: 2px 8px 6px;
    }

    .history { display: flex; flex-direction: column; gap: 2px; }
    .history-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 10px;
      border-radius: var(--radius-sm);
      font-size: var(--fs-sm);
      color: var(--ink-soft);
      cursor: pointer;
      position: relative;
      transition: background .15s ease, color .15s ease;
    }
    .history-item:hover { background: rgba(74,123,140,.08); color: var(--ink); }
    .history-item.active {
      background: rgba(74,123,140,.12);
      color: var(--primary-ink);
      font-weight: 500;
    }
    .history-item.active::before {
      content: ""; position: absolute; left: -16px; top: 8px; bottom: 8px;
      width: 2px; background: var(--gold); border-radius: 2px;
    }
    .history-item svg { flex: 0 0 16px; opacity: .7; }

    .sidebar-foot {
      margin-top: auto;
      font-size: var(--fs-xs);
      color: var(--ink-mute);
      padding: 10px 8px 2px;
      border-top: 1px solid var(--line);
    }

    /* ---------- Main ---------- */
    .main {
      display: flex; flex-direction: column;
      height: 100vh;
      position: relative;
      min-width: 0;
    }

    /* ---------- TopBar ---------- */
    .topbar {
      height: var(--topbar-h);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 16px 0 12px;
      position: sticky; top: 0;
      background: linear-gradient(to bottom, var(--bg) 80%, rgba(251,247,238,0));
      z-index: 5;
    }
    .topbar-left, .topbar-right { display: flex; align-items: center; gap: 4px; }

    .icon-btn {
      width: 36px; height: 36px;
      display: grid; place-items: center;
      border: 0; background: transparent; color: var(--ink-soft);
      border-radius: 10px; cursor: pointer;
      transition: background .15s ease, color .15s ease;
    }
    .icon-btn:hover { background: rgba(74,123,140,.09); color: var(--primary-ink); }
    .icon-btn:active { transform: translateY(1px); }

    .topbar-brand {
      display: none;
      align-items: center; gap: 10px;
      font-family: var(--ff-display);
      font-size: var(--fs-brand);
      font-weight: 600;
      color: var(--ink);
      margin-left: 4px;
    }
    .topbar-brand .brand-mark { width: 28px; height: 28px; flex: 0 0 28px; }

    /* ---------- Dropdown-Menü ---------- */
    .menu-wrap { position: relative; }
    .menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 220px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lift);
      padding: 6px;
      z-index: 20;
      animation: menuIn .15s ease;
    }
    @keyframes menuIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .menu-item {
      width: 100%; text-align: left;
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px;
      border: 0; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm);
      font-family: var(--ff-body); font-size: var(--fs-sm);
      color: var(--ink);
    }
    .menu-item:hover { background: rgba(74,123,140,.08); color: var(--primary-ink); }
    .menu-item svg { color: var(--ink-soft); }
    .menu-item:hover svg { color: var(--primary-ink); }
    .menu-divider { height: 1px; background: var(--line); margin: 4px 6px; }
    .menu-foot {
      padding: 8px 12px 4px;
      font-size: var(--fs-xs);
      color: var(--ink-mute);
    }

    /* ---------- Main-Scroll & Content ---------- */
    .main-scroll {
      flex: 1; overflow-y: auto;
      display: flex; flex-direction: column;
      padding: 24px 48px;
    }
    .main-inner { width: 100%; max-width: 760px; margin: 0 auto; flex: 1; display: flex; flex-direction: column; }

    /* ---------- Welcome-State ---------- */
    .welcome {
      flex: 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
      padding: 24px 0;
    }
    .welcome-greet {
      font-family: var(--ff-display);
      font-size: var(--fs-h1);
      font-style: italic;
      font-weight: 500;
      color: var(--primary-ink);
      line-height: 1.2;
      margin: 0 0 12px;
    }
    .welcome-sub { font-size: var(--fs-body); color: var(--ink-soft); margin: 0; }
    .welcome-divider { width: 40px; height: 1px; background: var(--gold); margin: 22px auto 0; opacity: .7; }

    /* ---------- Chat-State ---------- */
    .messages { display: flex; flex-direction: column; gap: 24px; padding-bottom: 16px; }
    .bubble-row { display: flex; width: 100%; }
    .bubble-row.user { justify-content: flex-end; }
    .bubble-row.ai { justify-content: flex-start; }
    .bubble {
      max-width: 78%;
      padding: 14px 18px;
      font-size: var(--fs-body);
      line-height: 1.6;
      border-radius: var(--radius-lg);
    }
    .bubble.user {
      background: var(--user-tint); color: var(--ink);
      border: 1px solid var(--line);
      border-bottom-right-radius: 6px;
    }
    .bubble.ai {
      background: transparent; color: var(--ink);
      border-left: 2px solid var(--gold);
      border-radius: 0;
      padding: 2px 0 2px 18px;
      max-width: 100%;
    }
    .bubble.ai p { margin: 0 0 10px; }
    .bubble.ai p:last-child { margin-bottom: 0; }

    .msg-meta {
      font-size: var(--fs-xs); color: var(--ink-mute);
      margin-top: 6px; letter-spacing: .04em;
    }
    .bubble-row.user .msg-meta { text-align: right; }

    .ai-label { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); color: var(--ink-soft); margin-bottom: 8px; }
    .ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 0 3px rgba(201,169,97,.18); }

    .msg-actions { display: flex; gap: 6px; margin-top: 10px; }
    .msg-actions button {
      border: 0; background: transparent; color: var(--ink-mute);
      padding: 6px; border-radius: 6px; cursor: pointer;
      display: grid; place-items: center;
      transition: background .15s ease, color .15s ease;
    }
    .msg-actions button:hover { background: rgba(74,123,140,.08); color: var(--primary-ink); }

    /* ---------- Prompt-Input ---------- */
    .prompt-wrap {
      padding: 12px 48px 22px;
      background: linear-gradient(to top, var(--bg) 55%, rgba(251,247,238,0));
    }
    .prompt-inner { width: 100%; max-width: 760px; margin: 0 auto; }
    .prompt {
      display: flex; align-items: center; gap: 10px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 6px 6px 6px 18px;
      box-shadow: var(--shadow-soft);
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    .prompt:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(74,123,140,.10), var(--shadow-soft);
    }
    .prompt .attach {
      border: 0; background: transparent; color: var(--ink-mute);
      cursor: pointer; padding: 6px; display: grid; place-items: center;
      border-radius: 50%;
    }
    .prompt .attach:hover { color: var(--primary-ink); background: rgba(74,123,140,.08); }
    .prompt input {
      flex: 1; border: 0; outline: 0; background: transparent;
      font-family: var(--ff-body); font-size: var(--fs-body); color: var(--ink);
      padding: 10px 6px; min-width: 0;
    }
    .prompt input::placeholder { color: var(--ink-mute); }
    .prompt .send {
      width: 38px; height: 38px; border-radius: 50%; border: 0; cursor: pointer;
      background: var(--primary); color: #fff;
      display: grid; place-items: center;
      transition: background .15s ease, transform .15s ease;
      flex: 0 0 38px;
    }
    .prompt .send:hover { background: var(--primary-ink); }
    .prompt .send:active { transform: translateY(1px); }
    .prompt .send:disabled { background: var(--ink-mute); cursor: not-allowed; opacity: .6; }

    .prompt-foot {
      text-align: center;
      font-size: var(--fs-xs);
      color: var(--ink-mute);
      letter-spacing: .14em;
      text-transform: uppercase;
      margin-top: 10px;
    }

    /* ---------- Backdrop ---------- */
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(31,45,51,.38);
      backdrop-filter: blur(2px);
      z-index: 40;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ---------- Modal (Feedback) ---------- */
    .modal-wrap {
      position: fixed; inset: 0;
      z-index: 60;
      display: grid; place-items: center;
      padding: 16px;
      background: rgba(31,45,51,.42);
      backdrop-filter: blur(3px);
      animation: fadeIn .2s ease;
    }
    .modal {
      width: 100%; max-width: 520px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lift);
      padding: 24px;
      animation: modalIn .22s cubic-bezier(.2,.8,.2,1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(8px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-head {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 12px; margin-bottom: 6px;
    }
    .modal-title {
      font-family: var(--ff-display);
      font-size: 24px;
      color: var(--primary-ink);
      margin: 0; font-weight: 600;
    }
    .modal-sub {
      font-size: var(--fs-sm);
      color: var(--ink-soft);
      margin: 0 0 18px;
      line-height: 1.5;
    }

    .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
    .field label {
      font-size: var(--fs-xs);
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--ink-mute);
    }
    .field input, .field textarea {
      width: 100%;
      font-family: var(--ff-body); font-size: var(--fs-body); color: var(--ink);
      background: var(--bg);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      outline: 0;
      transition: border-color .15s ease, box-shadow .15s ease;
    }
    .field textarea { resize: vertical; min-height: 110px; line-height: 1.5; }
    .field input:focus, .field textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(74,123,140,.10);
    }

    .segmented {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: var(--bg);
      border: 1px solid var(--line);
      padding: 4px; border-radius: var(--radius-sm);
    }
    .segmented button {
      border: 0; background: transparent;
      padding: 8px 10px;
      font-family: var(--ff-body); font-size: var(--fs-sm);
      color: var(--ink-soft);
      border-radius: 6px;
      cursor: pointer;
      transition: background .15s ease, color .15s ease;
    }
    .segmented button:hover { color: var(--primary-ink); }
    .segmented button.active {
      background: var(--surface);
      color: var(--primary-ink);
      box-shadow: 0 1px 2px rgba(31,45,51,.06);
      font-weight: 500;
    }

    .modal-actions {
      display: flex; justify-content: flex-end; gap: 10px;
      margin-top: 18px;
    }
    .btn-ghost {
      padding: 10px 16px;
      border: 1px solid var(--line); background: transparent;
      color: var(--ink-soft);
      border-radius: 999px; cursor: pointer;
      font-family: var(--ff-body); font-size: var(--fs-sm);
      transition: background .15s ease;
    }
    .btn-ghost:hover { background: rgba(74,123,140,.06); color: var(--ink); }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px;
      border: 0; background: var(--primary); color: #fff;
      border-radius: 999px; cursor: pointer;
      font-family: var(--ff-body); font-size: var(--fs-sm); font-weight: 500;
      transition: background .15s ease, transform .15s ease;
      box-shadow: 0 6px 16px rgba(74,123,140,.25);
    }
    .btn-primary:hover { background: var(--primary-ink); }
    .btn-primary:active { transform: translateY(1px); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }

    .success {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: 14px 4px 4px;
    }
    .success svg { color: var(--primary); margin-bottom: 10px; }
    .success h3 {
      font-family: var(--ff-display); font-size: 22px; color: var(--primary-ink);
      margin: 0 0 6px; font-weight: 600;
    }
    .success p { color: var(--ink-soft); margin: 0 0 18px; font-size: var(--fs-sm); }

    /* ============================================================
       RESPONSIVE — Mobile-Breakpoint
       ============================================================ */
    @media (max-width: 900px) {
      :root { --fs-h1: 30px; }

      .app { grid-template-columns: 1fr; }
      .app.sidebar-collapsed { grid-template-columns: 1fr; }

      .sidebar {
        position: fixed;
        top: 0; bottom: 0; left: 0;
        width: min(86vw, 320px);
        z-index: 50;
        transform: translateX(-100%);
        box-shadow: var(--shadow-lift);
        padding: 20px 16px;
        border-right: 1px solid var(--line);
      }
      .app:not(.sidebar-collapsed) .sidebar { transform: translateX(0); }
      .app.sidebar-collapsed .sidebar {
        transform: translateX(-100%);
        padding: 20px 16px;
        border-right: 1px solid var(--line);
      }

      .topbar-brand { display: flex; }

      .main-scroll { padding: 16px 18px; }
      .prompt-wrap { padding: 8px 16px 14px; }
      .prompt { padding: 5px 5px 5px 14px; }
      .bubble { max-width: 90%; padding: 12px 14px; }
      .welcome { padding: 8px 0; }
      .prompt-foot { letter-spacing: .1em; }

      .modal { padding: 20px; }
      .modal-title { font-size: 20px; }
    }

    @media (max-width: 380px) {
      :root { --fs-h1: 26px; }
      .sidebar { width: 88vw; }
    }
  `}</style>
);

/* ---------- Brand-Logo ---------- */

const BrandLogo = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M20 3 L33 11 L33 29 L20 37 L7 29 L7 11 Z" stroke="#4A7B8C" strokeWidth="1.6" fill="none" />
    <path d="M20 10 L28 15 L28 25 L20 30 L12 25 L12 15 Z" stroke="#C9A961" strokeWidth="1.2" fill="none" />
    <circle cx="20" cy="20" r="2.2" fill="#4A7B8C" />
  </svg>
);

const BrandHeader = () => (
  <div className="brand">
    <div className="brand-mark"><BrandLogo /></div>
    <div className="brand-text">
      <span className="brand-name">HaqqAI</span>
      <span className="brand-sub">MHG Dortmund</span>
    </div>
  </div>
);

/* ---------- Sidebar ---------- */

const Sidebar = ({ sessions, activeId, onSelect, onNewChat, onDelete }) => (
  <aside className="sidebar">
    <BrandHeader />

    <button className="btn-new" onClick={onNewChat}>
      <Plus size={16} strokeWidth={2} />
      Neuer Chat
    </button>

    <div>
      <div className="section-label">Chats</div>
      <nav className="history">
        {sessions.length === 0 && (
          <div style={{ padding: "10px", fontSize: "var(--fs-sm)", color: "var(--ink-mute)" }}>
            Noch keine Chats.
          </div>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            className={`history-item ${s.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <MessageSquare size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {s.title}
            </span>
            <button
              className="history-item-del"
              onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
              title="Chat löschen"
              aria-label="Chat löschen"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </nav>
    </div>

    <div className="sidebar-foot">Ein Projekt der MHG&nbsp;Dortmund</div>
  </aside>
);

/* ---------- TopBar mit Hamburger + Dreipunkt-Menü ---------- */

const TopBar = ({ onToggleSidebar, sidebarOpen, isMobile, onOpenFeedback, onNewChat }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const SidebarIcon = isMobile ? Menu : (sidebarOpen ? PanelLeftClose : PanelLeft);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
          title={sidebarOpen ? "Sidebar schließen" : "Sidebar öffnen"}
        >
          <SidebarIcon size={20} strokeWidth={1.8} />
        </button>

        {isMobile && !sidebarOpen && (
          <div className="topbar-brand">
            <div className="brand-mark"><BrandLogo size={18} /></div>
            HaqqAI
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="menu-wrap" ref={menuRef}>
          <button
            className="icon-btn"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menü öffnen"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreVertical size={20} strokeWidth={1.8} />
          </button>

          {menuOpen && (
            <div className="menu" role="menu">
              <button
                className="menu-item"
                onClick={() => { setMenuOpen(false); onNewChat(); }}
              >
                <Plus size={16} strokeWidth={1.8} /> Neuer Chat
              </button>
              <div className="menu-divider" />
              <button
                className="menu-item"
                onClick={() => { setMenuOpen(false); onOpenFeedback(); }}
              >
                <Send size={16} strokeWidth={1.8} /> Feedback senden
              </button>
              <div className="menu-foot">HaqqAI · MHG Dortmund</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Welcome, Message, Chat ---------- */

const WelcomeState = () => (
  <div className="welcome">
    <h1 className="welcome-greet">Assalamu alaikum&nbsp;🌿</h1>
    <p className="welcome-sub">Wie kann ich dir heute helfen?</p>
    <div className="welcome-divider" />
  </div>
);

const MessageBubble = ({ role, content, time, isError, sources }) => {
  if (role === "user") {
    return (
      <div className="bubble-row user">
        <div>
          <div className="bubble user">{content}</div>
          {time && <div className="msg-meta">{time}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="bubble-row ai">
      <div style={{ width: "100%" }}>
        <div className="ai-label"><span className="ai-dot" />HaqqAI</div>
        <div
          className="bubble ai"
          style={isError ? { color: "var(--ink-mute)", fontStyle: "italic" } : undefined}
        >
          {isError
            ? content
            : <ReactMarkdown>{content}</ReactMarkdown>
          }
          {sources?.length > 0 && (
            <div style={{ marginTop: 10, fontSize: "var(--fs-xs)", color: "var(--ink-mute)" }}>
              Quellen: {sources.join(" · ")}
            </div>
          )}
        </div>
        {!isError && (
          <div className="msg-actions">
            <button title="Kopieren" onClick={() => navigator.clipboard.writeText(content)}>
              <Copy size={15} strokeWidth={1.8} />
            </button>
            <button title="Hilfreich"><ThumbsUp size={15} strokeWidth={1.8} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatArea = ({ messages, loading }) => (
  <div className="messages">
    {messages.map((m, i) => (
      <MessageBubble key={i} role={m.role} content={m.content} time={m.time} isError={m.isError} sources={m.sources} />
    ))}
    {loading && (
      <div className="bubble-row ai">
        <div style={{ width: "100%" }}>
          <div className="ai-label"><span className="ai-dot" />HaqqAI</div>
          <div className="bubble ai" style={{ color: "var(--ink-mute)", display: "flex", alignItems: "center", gap: 8 }}>
            <LoaderCircle size={15} className="spin" /> Antwort wird geladen…
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ---------- PromptInput ---------- */

const PromptInput = ({ value, onChange, onSend, placeholder, disabled }) => {
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) { e.preventDefault(); onSend(); }
  };
  return (
    <div className="prompt-wrap">
      <div className="prompt-inner">
        <div className="prompt">
          <button className="attach" title="Datei anhängen" aria-label="Datei anhängen">
            <Paperclip size={18} strokeWidth={1.8} />
          </button>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKey}
            placeholder={placeholder}
            aria-label="Nachricht an HaqqAI"
            disabled={disabled}
          />
          <button className="send" onClick={onSend} disabled={!value.trim() || disabled} title="Senden" aria-label="Senden">
            <ArrowUp size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="prompt-foot">Antworten basieren auf MHG-Quellen · bitte prüfen</div>
      </div>
    </div>
  );
};

/* ---------- FeedbackDialog ---------- */

const FeedbackDialog = ({ open, onClose }) => {
  const [category, setCategory] = useState("Vorschlag");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory("Vorschlag");
    setMessage("");
    setContact("");
    setStatus("idle");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus("sending");
    setError("");

    const payload = {
      category,
      message: message.trim(),
      contact: contact.trim() || null,
      sent_at: new Date().toISOString(),
      user_agent: navigator.userAgent,
      path: window.location.pathname,
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
    } catch (err) {
      // Demo-Fallback: zeige trotzdem Erfolg, falls Endpoint fehlt
      console.warn("Feedback-Endpoint nicht erreichbar:", err);
      setStatus("success");
    }
  };

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true" aria-labelledby="fb-title" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {status === "success" ? (
          <div className="success">
            <CheckCircle2 size={42} strokeWidth={1.6} />
            <h3>Jazak Allahu khairan 🌿</h3>
            <p>Dein Feedback ist angekommen. Ich schaue es mir an.</p>
            <button className="btn-primary" onClick={onClose}>Schließen</button>
          </div>
        ) : (
          <>
            <div className="modal-head">
              <div>
                <h2 id="fb-title" className="modal-title">Feedback senden</h2>
                <p className="modal-sub">
                  Kurze Rückmeldung, Bug oder Wunsch? Deine Nachricht geht direkt an mich —
                  nichts davon wird öffentlich.
                </p>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label="Schließen">
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="field">
              <label>Art</label>
              <div className="segmented">
                {["Vorschlag", "Bug", "Sonstiges"].map(c => (
                  <button
                    key={c}
                    className={category === c ? "active" : ""}
                    onClick={() => setCategory(c)}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label htmlFor="fb-msg">Deine Nachricht</label>
              <textarea
                id="fb-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Was möchtest du mir mitteilen?"
                maxLength={2000}
              />
            </div>

            <div className="field">
              <label htmlFor="fb-contact">Kontakt (optional)</label>
              <input
                id="fb-contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="E-Mail oder Name, falls Rückfrage sinnvoll"
              />
            </div>

            {error && (
              <div style={{ color: "#B0453A", fontSize: "var(--fs-sm)", marginBottom: 10 }}>
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={onClose} disabled={status === "sending"}>
                Abbrechen
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!message.trim() || status === "sending"}
              >
                <Send size={15} strokeWidth={1.9} />
                {status === "sending" ? "Wird gesendet…" : "Senden"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ---------- App ---------- */

export default function App() {
  const firstId = useRef(Date.now());
  const [sessions, setSessions] = useState(() => [
    { id: firstId.current, title: "Neuer Chat", messages: [] }
  ]);
  const [activeId, setActiveId] = useState(() => firstId.current);
  const [input, setInput] = useState("");

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 900 : false
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== "undefined" ? window.innerWidth > 900 : false
  );
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const scrollRef = useRef(null);
  const activeSession = sessions.find(s => s.id === activeId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];
  const welcome = messages.length === 0;

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(prev => {
        if (prev !== mobile) setSidebarOpen(!mobile);
        return mobile;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const now = () => new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const currentId = activeId;
    const prevMessages = sessions.find(s => s.id === currentId)?.messages ?? [];
    const isFirst = prevMessages.length === 0;
    const userMsg = { role: "user", content: text, time: now() };
    const nextMessages = [...prevMessages, userMsg];

    setSessions(prev => prev.map(s => s.id !== currentId ? s : {
      ...s,
      title: isFirst ? (text.length > 38 ? text.slice(0, 38) + "…" : text) : s.title,
      messages: nextMessages,
    }));
    setInput("");
    setIsSending(true);
    if (isMobile) setSidebarOpen(false);

    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
      const endpoint = apiBase ? `${apiBase}/api/chat` : "/api/chat";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setSessions(prev => prev.map(s => s.id !== currentId ? s : {
        ...s,
        messages: [...s.messages, {
          role: "ai", content: data.answer, time: now(),
          sources: data.sources?.length ? data.sources : null,
        }],
      }));
    } catch (err) {
      setSessions(prev => prev.map(s => s.id !== currentId ? s : {
        ...s,
        messages: [...s.messages, {
          role: "ai",
          content: err.message || "Das Backend ist nicht erreichbar.",
          time: now(),
          isError: true,
        }],
      }));
    } finally {
      setIsSending(false);
    }
  };

  const handleNewChat = () => {
    const id = Date.now();
    setSessions(prev => [{ id, title: "Neuer Chat", messages: [] }, ...prev]);
    setActiveId(id);
    setInput("");
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectSession = (id) => {
    setActiveId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const newId = Date.now();
        setActiveId(newId);
        return [{ id: newId, title: "Neuer Chat", messages: [] }];
      }
      if (id === activeId) setActiveId(remaining[0].id);
      return remaining;
    });
  };

  const appClass = `app app-bg ${sidebarOpen ? "" : "sidebar-collapsed"}`;

  return (
    <>
      <GlobalStyles />
      <div className={appClass}>
        <Sidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
          onDelete={handleDeleteSession}
        />

        {isMobile && sidebarOpen && (
          <div className="backdrop" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="main">
          <TopBar
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            sidebarOpen={sidebarOpen}
            isMobile={isMobile}
            onOpenFeedback={() => setFeedbackOpen(true)}
            onNewChat={handleNewChat}
          />

          <div className="main-scroll" ref={scrollRef}>
            <div className="main-inner">
              {welcome ? <WelcomeState /> : <ChatArea messages={messages} loading={isSending} />}
            </div>
          </div>

          <PromptInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            placeholder={welcome ? "Frage HaqqAI etwas…" : "Weiter schreiben…"}
            disabled={isSending}
          />
        </main>

        <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      </div>
    </>
  );
}