const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

// Initialize conversation history
let conversation = [
  { role: "user", text: "Hello!" },
  { role: "model", text: "Hello! How can I help you today?" },
];

// Add initial bot message
appendMessage("bot", "Hello! How can I help you today?");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add user message to UI
  appendMessage("user", userMessage);
  input.value = "";

  // Add to conversation history
  conversation.push({ role: "user", text: userMessage });

  // Disable form while processing
  const submitButton = form.querySelector("button");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.result;

    // Add bot response to UI
    appendMessage("bot", botResponse);

    // Add to conversation history
    conversation.push({ role: "model", text: botResponse });
  } catch (error) {
    console.error("Error:", error);
    appendMessage(
      "bot",
      "Sorry, there was an error processing your message. Please try again.",
    );
  } finally {
    // Re-enable form
    submitButton.disabled = false;
    submitButton.textContent = "Send";
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);

  if (sender === "bot") {
    // Render markdown for bot messages
    msg.innerHTML = marked.parse(text);
  } else {
    // Plain text for user messages
    msg.textContent = text;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
