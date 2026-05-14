const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");

let conversation = [];
let welcomeVisible = true;
let isSending = false;

// Show welcome screen
showWelcome();

function showWelcome() {
  const welcome = document.createElement("div");
  welcome.className = "welcome";
  welcome.id = "welcome-screen";
  welcome.innerHTML = `
    <div class="welcome-icon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <h2>Hackathon Assistant</h2>
    <p>I can help you with hackathon preparation, project ideas, tech stacks, and more. What would you like to know?</p>
    <div class="welcome-chips">
      <button class="welcome-chip" data-msg="What is a hackathon?">What is a hackathon?</button>
      <button class="welcome-chip" data-msg="Give me project ideas">Project ideas</button>
      <button class="welcome-chip" data-msg="What tech stack should I use?">Tech stack</button>
      <button class="welcome-chip" data-msg="How to win a hackathon?">Winning tips</button>
    </div>
  `;
  chatBox.appendChild(welcome);

  welcome.querySelectorAll(".welcome-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const msg = chip.getAttribute("data-msg");
      sendMessage(msg);
    });
  });
}

function removeWelcome() {
  if (!welcomeVisible) return;
  const el = document.getElementById("welcome-screen");
  if (el) el.remove();
  welcomeVisible = false;
}

async function sendMessage(text) {
  const userMessage = text || input.value.trim();
  if (!userMessage || isSending) return;

  isSending = true;
  removeWelcome();
  appendMessage("user", userMessage);
  input.value = "";

  conversation.push({ role: "user", text: userMessage });

  const typingEl = showTyping();
  sendBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error("HTTP error! status: " + response.status);
    }

    const data = await response.json();
    console.log("Backend response:", data);
    const botResponse = data.result;

    removeTyping(typingEl);

    if (!botResponse) {
      console.warn("Empty response from backend");
      appendMessage("bot", "The backend returned an empty response. Check your GEMINI_API_KEY in the .env file.");
    } else {
      appendMessage("bot", botResponse);
      conversation.push({ role: "model", text: botResponse });
    }
  } catch (error) {
    console.error("Fetch error:", error);
    removeTyping(typingEl);
    appendMessage("bot", "Connection error: " + error.message);
  } finally {
    sendBtn.disabled = false;
    isSending = false;
    input.focus();
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  sendMessage();
});

function renderBotContent(bubble, text) {
  if (!text) {
    bubble.textContent = "No response received.";
    return;
  }
  try {
    if (typeof marked !== "undefined" && marked.parse) {
      bubble.innerHTML = marked.parse(text);
    } else {
      bubble.textContent = text;
    }
  } catch (e) {
    console.error("Markdown parse error:", e);
    bubble.textContent = text;
  }
}

function appendMessage(sender, text) {
  const row = document.createElement("div");
  row.classList.add("message-row", sender);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", sender === "user" ? "user-avatar" : "bot-avatar");
  avatar.textContent = sender === "user" ? "U" : "AI";

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  if (sender === "bot") bubble.classList.add("bot-content");

  if (sender === "bot") {
    renderBotContent(bubble, text);
  } else {
    bubble.textContent = text;
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "typing-indicator";
  row.id = "typing";

  const avatar = document.createElement("div");
  avatar.className = "avatar bot-avatar";
  avatar.textContent = "AI";

  const dots = document.createElement("div");
  dots.className = "typing-dots";
  dots.innerHTML = "<span></span><span></span><span></span>";

  row.appendChild(avatar);
  row.appendChild(dots);
  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
  return row;
}

function removeTyping(el) {
  if (el && el.parentNode) {
    el.remove();
  }
}
