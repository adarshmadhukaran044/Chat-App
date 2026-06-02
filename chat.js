/* =====================================================
   NEXCHAT — chat.js
   Features:
   • Simulated WebSocket connection (with reconnect logic)
   • Smart bot reply engine (keyword-based)
   • Multi-contact sidebar
   • Message history per contact
   • Typing indicator
   • Emoji picker
   • Live timestamps
   ===================================================== */


/* ════════════════════════════════════════
   1.  CONTACTS / BOT DEFINITIONS
════════════════════════════════════════ */

// Each contact has a name, emoji avatar, tagline, and
// their own isolated message history array.
const CONTACTS = [
  {
    id: 'nexbot',
    name: 'NexBot',
    avatar: '🤖',
    tagline: 'AI assistant · always online',
    preview: 'Hey! How can I help you?',
    messages: []   // filled at runtime
  },
  {
    id: 'alice',
    name: 'Alice Chen',
    avatar: '👩‍💻',
    tagline: 'Frontend dev · she/her',
    preview: 'Pushed the PR, check it out!',
    messages: []
  },
  {
    id: 'bob',
    name: 'Bob Ray',
    avatar: '🧑‍🎨',
    tagline: 'UI designer · he/him',
    preview: 'Figma link is ready 🎨',
    messages: []
  },
  {
    id: 'support',
    name: 'Support Team',
    avatar: '🛠️',
    tagline: 'Help & billing · 24/7',
    preview: 'Your ticket has been updated.',
    messages: []
  }
];

// The bot only responds to the first contact (NexBot).
// Other contacts show pre-seeded static history.


/* ════════════════════════════════════════
   2.  BOT REPLY ENGINE
   Maps user input keywords → bot responses.
   Multiple responses per keyword → random pick.
════════════════════════════════════════ */

const BOT_RULES = [
  // Greetings
  {
    keywords: ['hello', 'hi', 'hey', 'hii', 'helo', 'howdy', 'sup', 'yo'],
    replies: [
      'Hey there! 👋 Great to see you!',
      'Hi! How can I help you today? 😊',
      'Hello! Welcome to NexChat — what\'s on your mind?'
    ]
  },
  // How are you
  {
    keywords: ['how are you', 'how are u', 'how r u', 'how do you do', 'how\'s it going', 'hows it going', 'you okay', 'u ok'],
    replies: [
      'I\'m doing great, thanks for asking! How about you? 😄',
      'All good here! Running smoothly. What about you?',
      'Fantastic as always! 🚀 How are you doing?'
    ]
  },
  // Name
  {
    keywords: ['what is your name', 'what\'s your name', 'who are you', 'your name'],
    replies: [
      'I\'m NexBot — your smart chat assistant! 🤖',
      'The name\'s NexBot! Nice to meet you 😊',
      'Call me NexBot. I\'m here to chat and help!'
    ]
  },
  // What can you do
  {
    keywords: ['what can you do', 'help', 'commands', 'features', 'capabilities'],
    replies: [
      'I can chat with you, answer questions, and keep you company! Try asking me anything. 💬',
      'I\'m great at conversation! Ask me how I\'m doing, tell me a joke request, or just say hi. 😄',
      'I respond to greetings, questions, jokes, compliments, and much more. Give it a try!'
    ]
  },
  // Jokes
  {
    keywords: ['joke', 'tell me a joke', 'funny', 'make me laugh'],
    replies: [
      'Why do programmers prefer dark mode? Because light attracts bugs! 🐛😄',
      'I told my computer I needed a break. Now it won\'t stop sending me Kit-Kat ads. 🍫',
      'Why do Java developers wear glasses? Because they don\'t C#! 😂'
    ]
  },
  // Thank you
  {
    keywords: ['thanks', 'thank you', 'thank u', 'thx', 'ty', 'cheers'],
    replies: [
      'You\'re welcome! 😊 Anything else I can help with?',
      'Happy to help! Let me know if you need anything else. 🙌',
      'Anytime! That\'s what I\'m here for. ✨'
    ]
  },
  // Bye / goodbye
  {
    keywords: ['bye', 'goodbye', 'see you', 'cya', 'later', 'take care'],
    replies: [
      'Goodbye! Have a wonderful day! 👋😊',
      'See you later! Come back anytime. 🌟',
      'Take care! It was great chatting with you. 💙'
    ]
  },
  // What time is it
  {
    keywords: ['time', 'what time', 'current time'],
    replies: [
      () => `It's currently ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} on your device. ⏰`
    ]
  },
  // What's the date
  {
    keywords: ['date', 'today', 'what day', 'what\'s today'],
    replies: [
      () => `Today is ${new Date().toLocaleDateString('en-US', {weekday:'long', month:'long', day:'numeric', year:'numeric'})}. 📅`
    ]
  },
  // Good morning/afternoon/night
  {
    keywords: ['good morning', 'morning'],
    replies: ['Good morning! ☀️ Hope your day is amazing!', 'Morning! Ready to have a great day? ☕']
  },
  {
    keywords: ['good night', 'goodnight', 'night'],
    replies: ['Good night! 🌙 Sweet dreams!', 'Goodnight! Rest well and come back soon. 😴']
  },
  {
    keywords: ['good afternoon', 'afternoon'],
    replies: ['Good afternoon! ☀️ Hope your day is going well!']
  },
  // Love / feelings
  {
    keywords: ['i love you', 'love you', 'ily'],
    replies: [
      'Aww, that\'s sweet! 💙 I appreciate the love!',
      'You\'re making me blush! 😊 (if bots could blush)',
      '💙 Right back at you! You\'re awesome.'
    ]
  },
  // Sad / not good
  {
    keywords: ['sad', 'unhappy', 'not good', 'not well', 'bad day', 'upset', 'depressed', 'not okay'],
    replies: [
      'I\'m sorry to hear that 😔 I\'m here for you. Want to talk about it?',
      'That\'s tough. Remember — rough days don\'t last forever. 💙',
      'Sending you virtual good vibes! Things will get better. 🌟'
    ]
  },
  // Happy
  {
    keywords: ['happy', 'great', 'awesome', 'amazing', 'fantastic', 'wonderful', 'excellent'],
    replies: [
      'That\'s wonderful to hear! 😄 Keep that energy!',
      'Love the positivity! 🚀 You\'re on fire!',
      'Yay! 🎉 Happiness is contagious — thanks for sharing!'
    ]
  },
  // Weather (fun mock)
  {
    keywords: ['weather', 'forecast', 'raining', 'sunny'],
    replies: [
      'I can\'t check live weather, but I hope it\'s sunny where you are! ☀️',
      'No weather access for me — try a weather app! But here\'s hoping for good vibes ⛅'
    ]
  },
  // Who made you
  {
    keywords: ['who made you', 'who created you', 'who built you', 'your creator'],
    replies: [
      'I was built as part of NexChat, a demo real-time chat app! 🛠️',
      'The NexChat team created me — powered by WebSockets and pure JavaScript! 💻'
    ]
  }
];

// Default fallback reply when no keyword matches
const FALLBACK_REPLIES = [
  'Hmm, I didn\'t quite catch that. Could you rephrase? 🤔',
  'Interesting! Tell me more. 💬',
  'I\'m not sure about that one — try asking something else! 😊',
  'Great question! I\'m still learning. 🤖 Ask me something else!',
  'I didn\'t understand that. Try "hello", "joke", or "help"!'
];

/**
 * getBotReply(text)
 * Checks the user message against BOT_RULES keywords.
 * Returns a matching reply string, or a random fallback.
 */
function getBotReply(text) {
  const lower = text.toLowerCase().trim();

  // Loop through rules and check if any keyword matches
  for (const rule of BOT_RULES) {
    const matched = rule.keywords.some(kw => lower.includes(kw));
    if (matched) {
      // Pick a random reply from the matched rule
      const pool = rule.replies;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      // If the reply is a function (dynamic), call it; otherwise return string
      return typeof pick === 'function' ? pick() : pick;
    }
  }

  // No match — return a random fallback
  return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
}


/* ════════════════════════════════════════
   3.  WEBSOCKET SIMULATION
   Real WebSocket would connect to a server.
   Here we mock the API surface with the same
   .send() / onmessage / onopen / onclose interface
   so the rest of the app doesn't need to change.
════════════════════════════════════════ */

class MockWebSocket {
  constructor() {
    this.onmessage = null;  // callback for incoming messages
    this.onopen    = null;  // callback when connected
    this.onclose   = null;  // callback when disconnected
    this.readyState = 0;    // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED

    // Simulate a short connection delay
    setTimeout(() => {
      this.readyState = 1;  // OPEN
      if (this.onopen) this.onopen({ type: 'open' });
    }, 600);
  }

  /**
   * send(text)
   * Simulates the client sending a message.
   * The "server" processes it and fires onmessage with the bot reply.
   */
  send(text) {
    if (this.readyState !== 1) return;

    // Only NexBot auto-replies (other contacts are static)
    if (activeContact.id !== 'nexbot') return;

    // Simulate network round-trip delay: 800ms–1800ms
    const delay = 800 + Math.random() * 1000;

    setTimeout(() => {
      if (this.onmessage) {
        const replyText = getBotReply(text);
        // Fire the mock onmessage event with data payload
        this.onmessage({ data: JSON.stringify({ text: replyText, sender: 'nexbot' }) });
      }
    }, delay);
  }

  /** Simulate disconnect */
  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose({ type: 'close' });
  }
}

// Instantiate the (mock) WebSocket connection
let ws = new MockWebSocket();


/* ════════════════════════════════════════
   4.  STATE
════════════════════════════════════════ */
let activeContact = CONTACTS[0];    // currently selected contact
let typingTimeout  = null;          // reference to hide typing indicator


/* ════════════════════════════════════════
   5.  DOM REFERENCES
════════════════════════════════════════ */
const messagesArea    = document.getElementById('messages-area');
const messageInput    = document.getElementById('message-input');
const sendBtn         = document.getElementById('send-btn');
const contactList     = document.getElementById('contact-list');
const wsStatus        = document.getElementById('ws-status');
const typingIndicator = document.getElementById('typing-indicator');
const typingName      = document.getElementById('typing-name');
const typingAvatar    = document.getElementById('typing-avatar');
const headerName      = document.getElementById('header-name');
const headerStatus    = document.getElementById('header-status');
const headerAvatar    = document.getElementById('header-avatar');
const searchInput     = document.getElementById('search-input');
const emojiBtn        = document.getElementById('emoji-btn');
const emojiPicker     = document.getElementById('emoji-picker');


/* ════════════════════════════════════════
   6.  WEBSOCKET EVENTS
════════════════════════════════════════ */

// Connection opened
ws.onopen = () => {
  wsStatus.textContent = '● LIVE';
  wsStatus.style.color = '';
  wsStatus.style.borderColor = '';
};

// Message received from server (bot reply)
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Hide typing indicator
  hideTyping();

  // Add the received message to active contact's history
  addMessage({ text: data.text, from: 'bot', contactId: data.sender });

  // Update sidebar preview
  updateContactPreview(activeContact.id, data.text);
};

// Connection closed
ws.onclose = () => {
  wsStatus.textContent = '○ OFFLINE';
  wsStatus.style.color = '#ff4d4d';
  wsStatus.style.borderColor = 'rgba(255,77,77,.3)';
};


/* ════════════════════════════════════════
   7.  SEND MESSAGE
════════════════════════════════════════ */

/**
 * sendMessage()
 * Reads the input, creates a "sent" message bubble,
 * then triggers the WebSocket send (which fires the bot reply).
 */
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  // Clear input field
  messageInput.value = '';

  // Add user's message to UI
  addMessage({ text, from: 'user', contactId: activeContact.id });

  // Update sidebar preview
  updateContactPreview(activeContact.id, text);

  // Only send to WebSocket if chatting with NexBot
  if (activeContact.id === 'nexbot') {
    // Show typing indicator while waiting for bot reply
    showTyping();

    // Send via WebSocket
    ws.send(text);
  }
}

// Send on button click
sendBtn.addEventListener('click', sendMessage);

// Send on Enter key
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});


/* ════════════════════════════════════════
   8.  ADD MESSAGE TO UI
════════════════════════════════════════ */

/**
 * addMessage({ text, from, contactId })
 * Creates and appends a message bubble to the chat area.
 * Also pushes to the contact's history array.
 * from: 'user' | 'bot'
 */
function addMessage({ text, from, contactId }) {
  const contact = CONTACTS.find(c => c.id === contactId) || activeContact;
  const isSent  = from === 'user';
  const now     = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Save to history
  contact.messages.push({ text, from, time: timeStr });

  // Only render if this contact is active
  if (contact.id !== activeContact.id) return;

  // Build message row element
  const row = document.createElement('div');
  row.className = `msg-row ${isSent ? 'sent' : 'received'}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = isSent ? '🧑' : contact.avatar;

  // Bubble wrap (bubble + meta)
  const wrap = document.createElement('div');
  wrap.className = 'msg-bubble-wrap';

  // Bubble text
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.textContent = text;

  // Meta (time + tick for sent)
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = isSent
    ? `${timeStr} <span class="msg-tick">✓✓</span>`
    : timeStr;

  wrap.appendChild(bubble);
  wrap.appendChild(meta);

  // Arrange: avatar is on the outside
  if (isSent) {
    row.appendChild(wrap);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(wrap);
  }

  messagesArea.appendChild(row);

  // Auto-scroll to the latest message
  scrollToBottom();
}

/** Smoothly scroll messages area to the bottom */
function scrollToBottom() {
  messagesArea.scrollTop = messagesArea.scrollHeight;
}


/* ════════════════════════════════════════
   9.  TYPING INDICATOR
════════════════════════════════════════ */

function showTyping() {
  typingAvatar.textContent = activeContact.avatar;
  typingName.textContent   = `${activeContact.name} is typing…`;
  typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

function hideTyping() {
  typingIndicator.classList.add('hidden');
}


/* ════════════════════════════════════════
   10.  SIDEBAR — RENDER CONTACTS
════════════════════════════════════════ */

/** Render all contacts in the sidebar */
function renderContacts(filter = '') {
  contactList.innerHTML = '';

  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(contact => {
    const li = document.createElement('li');
    li.className = `contact-item ${contact.id === activeContact.id ? 'active' : ''}`;
    li.dataset.id = contact.id;

    // Unread badge (only show if not active & has messages)
    const unread = contact.id !== activeContact.id && contact.messages.length
      ? `<span class="contact-badge">${Math.min(contact.messages.length, 9)}</span>`
      : '';

    li.innerHTML = `
      <div class="contact-avatar">${contact.avatar}</div>
      <div class="contact-info">
        <div class="contact-name">${contact.name}</div>
        <div class="contact-preview">${contact.preview}</div>
      </div>
      <div class="contact-time">${getShortTime()}</div>
      ${unread}
    `;

    // Clicking a contact switches the chat to that contact
    li.addEventListener('click', () => switchContact(contact.id));

    contactList.appendChild(li);
  });
}

/** Switch the active contact and reload message history */
function switchContact(id) {
  activeContact = CONTACTS.find(c => c.id === id);

  // Update header
  headerAvatar.textContent  = activeContact.avatar;
  headerName.textContent    = activeContact.name;
  headerStatus.textContent  = activeContact.tagline;

  // Clear and re-render messages for this contact
  messagesArea.innerHTML = '';
  activeContact.messages.forEach(msg => {
    renderMessageFromHistory(msg);
  });

  // Add a date divider at the top if there are messages
  if (activeContact.messages.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'date-divider';
    divider.textContent = 'Today';
    messagesArea.prepend(divider);
  }

  hideTyping();
  scrollToBottom();
  renderContacts(); // refresh sidebar active state
}

/**
 * Render a message from history (no re-push to array)
 * Used when switching contacts.
 */
function renderMessageFromHistory({ text, from, time }) {
  const isSent = from === 'user';

  const row = document.createElement('div');
  row.className = `msg-row ${isSent ? 'sent' : 'received'}`;

  const avatar = document.createElement('div');
  avatar.className  = 'msg-avatar';
  avatar.textContent = isSent ? '🧑' : activeContact.avatar;

  const wrap = document.createElement('div');
  wrap.className = 'msg-bubble-wrap';

  const bubble = document.createElement('div');
  bubble.className  = 'msg-bubble';
  bubble.textContent = text;

  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  meta.innerHTML = isSent
    ? `${time} <span class="msg-tick">✓✓</span>`
    : time;

  wrap.appendChild(bubble);
  wrap.appendChild(meta);

  if (isSent) { row.appendChild(wrap); row.appendChild(avatar); }
  else        { row.appendChild(avatar); row.appendChild(wrap); }

  messagesArea.appendChild(row);
}

/** Update the sidebar preview text for a contact */
function updateContactPreview(id, text) {
  const c = CONTACTS.find(c => c.id === id);
  if (c) {
    c.preview = text.length > 30 ? text.slice(0, 30) + '…' : text;
    renderContacts(searchInput.value);
  }
}

/** Returns a short time string like "2:45 PM" */
function getShortTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Filter contacts as user types in search box
searchInput.addEventListener('input', () => {
  renderContacts(searchInput.value);
});


/* ════════════════════════════════════════
   11.  EMOJI PICKER
════════════════════════════════════════ */

const EMOJIS = ['😀','😂','😍','🥰','😎','😅','🤔','😢','😡','🥳',
                '👍','👎','❤️','🔥','✨','🎉','💯','🚀','👏','🙏',
                '😊','😋','😇','🤩','😴','😬','🙄','😤','😭','🥺'];

// Populate emoji picker buttons
EMOJIS.forEach(em => {
  const btn = document.createElement('button');
  btn.textContent = em;
  // Clicking an emoji inserts it into the message input
  btn.addEventListener('click', () => {
    messageInput.value += em;
    messageInput.focus();
    emojiPicker.classList.add('hidden');
  });
  emojiPicker.appendChild(btn);
});

// Toggle emoji picker visibility
emojiBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  emojiPicker.classList.toggle('hidden');
});

// Close picker when clicking anywhere else
document.addEventListener('click', () => {
  emojiPicker.classList.add('hidden');
});


/* ════════════════════════════════════════
   12.  PRE-SEED MESSAGE HISTORY
   Give non-NexBot contacts some starter messages
   so they look like real active chats.
════════════════════════════════════════ */

function seedHistory() {
  // Alice — code review chat
  CONTACTS[1].messages = [
    { text: 'Hey! I pushed the PR for the dashboard component.', from: 'bot', time: '9:12 AM' },
    { text: 'Awesome! I\'ll review it shortly.', from: 'user', time: '9:14 AM' },
    { text: 'Let me know if you have any comments 😊', from: 'bot', time: '9:15 AM' },
    { text: 'Pushed the PR, check it out!', from: 'bot', time: '10:02 AM' }
  ];

  // Bob — design chat
  CONTACTS[2].messages = [
    { text: 'The Figma mockups are done! Check the link in Notion.', from: 'bot', time: '11:30 AM' },
    { text: 'Looks great! Love the new color scheme 🎨', from: 'user', time: '11:45 AM' },
    { text: 'Figma link is ready 🎨', from: 'bot', time: '12:00 PM' }
  ];

  // Support — ticket chat
  CONTACTS[3].messages = [
    { text: 'Your support ticket #4821 has been received.', from: 'bot', time: '8:00 AM' },
    { text: 'Thank you! When will it be resolved?', from: 'user', time: '8:05 AM' },
    { text: 'Your ticket has been updated.', from: 'bot', time: '9:00 AM' }
  ];
}


/* ════════════════════════════════════════
   13.  INIT — Run on page load
════════════════════════════════════════ */

function init() {
  // Seed fake history for non-bot contacts
  seedHistory();

  // Render the sidebar
  renderContacts();

  // Start on NexBot chat
  switchContact('nexbot');

  // Add a welcome message from NexBot after a short delay
  setTimeout(() => {
    addMessage({
      text: 'Hey! 👋 I\'m NexBot. Try saying hello, ask for a joke, or just chat!',
      from: 'bot',
      contactId: 'nexbot'
    });
    updateContactPreview('nexbot', 'Hey! 👋 I\'m NexBot...');
  }, 800);
}

// Kick everything off
init();
