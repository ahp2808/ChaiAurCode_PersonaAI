const CHANNELS = {
  chat1: {
    name: "Hitesh Sir",
    title: "Ask Hitesh Sir a question or type a message.",
    placeholder: "Share your thoughts here…",
    color: "#5eead4",
    colorDim: "rgba(94, 234, 212, 0.14)",
    img_name: "https://yt3.googleusercontent.com/6tLBV-DRVemxhmanuezR5HkHshX2g7Y46Rq8cysyO1V-nd2SaQ2Fi8cdgVM-n6v_8XZ5BEimxXI=s160-c-k-c0x00ffffff-no-rj"
  },
  chat2: {
    name: "Piyush Sir",
    title: "Ask Piyush Sir a question or type a message.",
    placeholder: "Share your thoughts here…",
    color: "#f5a97f",
    colorDim: "rgba(245, 169, 127, 0.14)",
    img_name: "piyush_sir_dp.jpg"
  },
};

const state = {
  active: "chat1",
  histories: {
    chat1: [],
    chat2: [],
  },
};

const root = document.documentElement;
const channelButtons = document.querySelectorAll(".channel-btn");
const deckTitle = document.getElementById("deck-title");
const deckSubtitle = document.getElementById("deck-subtitle");
const activeLabel = document.getElementById("active-channel-label");
const transcript = document.getElementById("transcript");
const emptyState = document.getElementById("empty-state");
const composer = document.getElementById("composer");
const input = document.getElementById("prompt-input");
const sendBtn = document.getElementById("send-btn");

function applyChannel(id) {
  const cfg = CHANNELS[id];
  state.active = id;
  root.style.setProperty("--active", cfg.color);
  root.style.setProperty("--active-dim", cfg.colorDim);
  deckTitle.textContent = cfg.title;
  deckSubtitle.textContent = cfg.subtitle;
  input.placeholder = cfg.placeholder;

  channelButtons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.channel === id);
  });

  renderTranscript();
}

function renderTranscript() {
  transcript.innerHTML = "";
  const history = state.histories[state.active];

  if (history.length === 0) {
    transcript.appendChild(emptyState);
    return;
  }

  history.forEach((entry) => {
    transcript.appendChild(buildMessageEl(entry));
  });

  transcript.scrollTop = transcript.scrollHeight;
}

function buildMessageEl({ role, text, pending }) {
  const el = document.createElement("div");
  el.className = `msg ${role === "user" ? "user" : "ai"}${pending ? " pending" : ""}`;

  const avatar = document.createElement("img");
  avatar.className = "msg-avatar";
  avatar.src = `${CHANNELS[state.active].img_name}`;
  avatar.alt = role === "user" ? "you" : CHANNELS[state.active].name;

  const tag = document.createElement("span");
  tag.className = "msg-tag";
  tag.textContent =
    role === "user" ? "you" : CHANNELS[state.active].name
  el.appendChild(tag);


  const body = document.createElement("span");
  body.textContent = text;
  el.appendChild(body);

  return el;
}

channelButtons.forEach((btn) => {
  btn.addEventListener("click", () => applyChannel(btn.dataset.channel));
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
});

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const channel = state.active;
  const history = state.histories[channel];

  history.push({ role: "user", text });
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;
  input.disabled = true;
  renderTranscript();

  const pendingEntry = { role: "ai", text: "Thinking…", pending: true };
  history.push(pendingEntry);
  renderTranscript();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        message: text,
        history: history
          .filter((m) => !m.pending)
          .slice(0, -1)
          .map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
          })),
      }),
    });

    const data = await res.json();

    pendingEntry.text = res.ok
      ? data.response
      : `${data.error || "Could not reach the server. Please try again."}`;
  } catch (err) {
    pendingEntry.text = "Could not reach the server. Please try again.";
  } finally {
    pendingEntry.pending = false;
    sendBtn.disabled = false;
    input.disabled = false;
    renderTranscript();
  }
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

applyChannel("chat1");
