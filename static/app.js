// UI behavior only. Your app handles the logic.
//
// Hooks for your app:
//   document.addEventListener("chat:send", (e) => e.detail.text)  -> fires when the user submits a message
//   chatUI.addMessage("assistant", "text")                        -> show a message
//   chatUI.setTyping(true | false)                                -> show/hide the typing indicator
//   chatUI.clear()                                                -> reset to the empty greeting screen
//   chatUI.setBusy(true | false)                                  -> disable/enable sending
(() => {
  const $ = (id) => document.getElementById(id);
  const app = $("app"), scroll = $("scroll"), messagesEl = $("messages");
  const input = $("input"), sendBtn = $("send"), composer = $("composer");

  let busy = false;
  let typingEl = null;

  const SPARK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>';

  function scrollToBottom() {
    scroll.scrollTo({ top: scroll.scrollHeight, behavior: "smooth" });
  }

  function markHasMessages(has) {
    app.classList.toggle("has-messages", has);
    scroll.classList.toggle("has-messages", has);
    document.body.classList.toggle("has-messages", has);
  }

  function addMessage(role, text) {
    markHasMessages(true);
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    if (role === "user") {
      el.innerHTML = '<div class="bubble"></div>';
    } else {
      el.innerHTML = `<div class="avatar">${SPARK}</div><div class="bubble"></div>`;
    }
    el.querySelector(".bubble").textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
    return el;
  }

  function setTyping(on) {
    if (on && !typingEl) {
      typingEl = document.createElement("div");
      typingEl.className = "msg assistant";
      typingEl.innerHTML = `<div class="avatar">${SPARK}</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>`;
      messagesEl.appendChild(typingEl);
      markHasMessages(true);
      scrollToBottom();
    } else if (!on && typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  function clear() {
    messagesEl.innerHTML = "";
    typingEl = null;
    markHasMessages(false);
    input.focus();
  }

  function updateSend() { sendBtn.disabled = busy || !input.value.trim(); }
  function setBusy(v) { busy = !!v; updateSend(); }

  function autosize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 220) + "px";
  }

  // Input
  input.addEventListener("input", () => { autosize(); updateSend(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      composer.requestSubmit();
    }
  });
  composer.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    autosize();
    updateSend();
    addMessage("user", text);
    document.dispatchEvent(new CustomEvent("chat:send", { detail: { text } }));
  });

  // Sidebar
  const isMobile = () => window.matchMedia("(max-width: 800px)").matches;
  const closeMobile = () => app.classList.remove("mobile-open");
  $("newChat").addEventListener("click", () => {
    clear();
    closeMobile();
    document.dispatchEvent(new CustomEvent("chat:new"));
  });
  $("closeSidebar").addEventListener("click", () =>
    isMobile() ? closeMobile() : app.classList.add("collapsed"));
  $("openSidebar").addEventListener("click", () =>
    isMobile() ? app.classList.add("mobile-open") : app.classList.remove("collapsed"));
  $("scrim").addEventListener("click", closeMobile);

  // Greeting
  const h = new Date().getHours();
  const part = h < 5 ? "Burning the midnight oil" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  $("greetingText").textContent = `${part}. How can I help?`;

  if (isMobile()) app.classList.add("collapsed");
  input.focus();

  window.chatUI = { addMessage, setTyping, clear, setBusy };
})();
