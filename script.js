document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const body = document.body;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('chat-query');
    const chatLog = document.getElementById('chat-log');
    const sendButton = document.getElementById('send-btn');
    const totalTokensDisplay = document.getElementById('total-tokens-value');
    const powerDisplay = document.getElementById('power-value');
    const waterDisplay = document.getElementById('water-value');
    let scrollAnchor = document.getElementById('scroll-anchor');
    
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const plusSettingsBtn = document.getElementById('plus-settings-btn');
    const menuAddFilesBtn = document.getElementById('menu-add-files-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const toggleThemeButton = document.getElementById('toggle-theme-button');
    const apiKeyInput = document.getElementById('api-key-input');
    const chatContainer = document.getElementById('chat-container');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const newChatBtn = document.getElementById('new-chat-btn');
    const historyList = document.getElementById('history-list');
    const welcomeScreen = document.getElementById('welcome-screen');

    const imageModal = document.getElementById('image-modal');
    const enlargedImage = document.getElementById('enlarged-image');
    const closeModalBtn = document.getElementById('close-modal');

    // --- State & Constants ---
    let userApiKey = '';
    let historyLimit = 10; 
    let currentSessionId = Date.now().toString();
    let allSessions = {}; 

    // Streaming & Generation Locks
    let isGenerating = false;
    let activeStreamSessionId = null;
    let activeStreamMessageObj = null;
    let activeStreamBubbleElement = null;

    const SYSTEM_INSTRUCTIONS = "You are Gizmo, a helpful, intelligent, and concise AI assistant. You respond in Markdown format. Keep your answers concise and to the point unless asked for details. Use commas for values below zero and use metric units like meters, kilometers and celcius.";
    
    const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    const INITIAL_SYSTEM_MESSAGE = { role: 'user', parts:[{ text: SYSTEM_INSTRUCTIONS }] };
    
    let conversationHistory =[INITIAL_SYSTEM_MESSAGE];
    let cumulativeTokens = 0;
    let lastUserMessage = null;
    let uploadedFileState = null;
    let currentSpeakingButton = null;
    let currentUtterance = null; 

    const MODEL_MULTIPLIERS = {
        'gemini-3.1-flash-lite-preview': 0.5,
        'gemma-3-27b-it': 2.2,
        'gemma-3-12b-it': 1.0,
        'gemma-3-4b-it': 0.3,
        'gemma-3-2b-it': 0.15,
        'gemma-3-1b-it': 0.08
    };

    // Solid SVG Icons
    const COPY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const LISTEN_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.81 5 3.54 5 6.71s-2.11 5.9-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const STOP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z"/></svg>`;
    const REGENERATE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
    const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

    function openModal(src) {
        enlargedImage.src = src;
        imageModal.classList.remove('hidden');
    }

    function closeModal() {
        imageModal.classList.add('hidden');
        setTimeout(() => { enlargedImage.src = ''; }, 250); 
    }

    closeModalBtn.addEventListener('click', closeModal);
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) closeModal();
    });
    
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }

    // Custom Dropdown Helper (Snappy Pointer Events)
    function initCustomSelect(selectId, onSelect) {
        const selectContainer = document.getElementById(selectId);
        const trigger = selectContainer.querySelector('.select-trigger');
        const textSpan = trigger.querySelector('span');
        const options = selectContainer.querySelectorAll('.option');

        trigger.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.type !== 'touchstart') return; 
            e.preventDefault(); 
            e.stopPropagation();
            const isOpen = selectContainer.classList.contains('open');
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
            if (!isOpen) selectContainer.classList.add('open');
        });

        options.forEach(option => {
            option.addEventListener('pointerup', (e) => {
                if (e.button !== 0 && e.type !== 'touchend') return;
                e.preventDefault();
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                const text = option.textContent;
                selectContainer.setAttribute('data-value', value);
                textSpan.textContent = text;
                selectContainer.classList.remove('open');
                if (onSelect) onSelect(value);
            });
        });
    }

    function getCustomSelectValue(selectId) {
        return document.getElementById(selectId).getAttribute('data-value');
    }

    function setCustomSelectValue(selectId, val) {
        const container = document.getElementById(selectId);
        if (!container) return;
        container.setAttribute('data-value', val);
        const opt = container.querySelector(`.option[data-value="${val}"]`);
        if (opt) container.querySelector('.select-trigger span').textContent = opt.textContent;
    }

    function loadSettings() {
        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            savedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            localStorage.setItem('theme', savedTheme);
        }
        applyTheme(savedTheme);

        userApiKey = localStorage.getItem('userApiKey') || '';
        apiKeyInput.value = userApiKey;

        const globalModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        setCustomSelectValue('custom-model-select', globalModel);
        
        initCustomSelect('custom-model-select', (val) => {
            localStorage.setItem('selectedModel', val);
            if (allSessions[currentSessionId]) {
                allSessions[currentSessionId].model = val;
                saveSpecificSession(currentSessionId);
            }
            updateStatsDisplay();
        });

        const savedLimit = localStorage.getItem('historyLimit');
        if (savedLimit !== null) {
            historyLimit = parseInt(savedLimit, 10);
            setCustomSelectValue('custom-history-select', historyLimit.toString());
        }
        
        initCustomSelect('custom-history-select', (val) => {
            historyLimit = parseInt(val, 10);
            localStorage.setItem('historyLimit', historyLimit);
        });
    }
    
    function updateStatsDisplay() {
        totalTokensDisplay.textContent = cumulativeTokens;
        let selectedModel = getCustomSelectValue('custom-model-select');
        let multiplier = MODEL_MULTIPLIERS[selectedModel] || 1.0;
        const BASE_POWER_WH = 0.001;
        const BASE_WATER_ML = 0.01;
        
        if (powerDisplay && waterDisplay) {
            let power = cumulativeTokens * BASE_POWER_WH * multiplier;
            let water = cumulativeTokens * BASE_WATER_ML * multiplier;
            const formatStat = (val) => {
                if (val === 0) return "0";
                if (val >= 1) return Math.round(val).toString();
                let sig = Math.ceil(-Math.log10(val));
                if (sig < 1) sig = 1;
                return val.toFixed(sig);
            };
            powerDisplay.textContent = formatStat(power);
            waterDisplay.textContent = formatStat(water);
        }
    }

    function resizeTextarea() {
        userInput.style.height = '24px'; 
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    }
    userInput.addEventListener('input', resizeTextarea);
    resizeTextarea();

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            sendButton.click(); 
        }
    });

    userInput.addEventListener('focus', () => { setTimeout(() => { body.classList.add('input-focus-mode'); scrollToBottom(); }, 100); });
    userInput.addEventListener('blur', () => { body.classList.remove('input-focus-mode'); });
    
    plusSettingsBtn.addEventListener('pointerdown', (event) => { 
        if (event.button !== 0 && event.type !== 'touchstart') return;
        event.preventDefault();
        event.stopPropagation();
        settingsMenu.classList.toggle('visible'); 
    });

    menuAddFilesBtn.addEventListener('pointerup', (e) => {
        if (e.button !== 0 && e.type !== 'touchend') return;
        e.preventDefault();
        fileInput.click();
        settingsMenu.classList.remove('visible');
    });

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            body.classList.toggle('sidebar-open');
            sidebarOverlay.classList.toggle('active');
        } else {
            body.classList.toggle('sidebar-closed');
        }
    }

    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    menuBtn.addEventListener('click', toggleSidebar);
    newChatBtn.addEventListener('click', createNewChat);
    sidebarOverlay.addEventListener('click', () => {
        body.classList.remove('sidebar-open');
        sidebarOverlay.classList.remove('active');
    });
    
    document.addEventListener('pointerdown', (event) => {
        if (settingsMenu.classList.contains('visible') && !settingsMenu.contains(event.target) && !plusSettingsBtn.contains(event.target)) {
            settingsMenu.classList.remove('visible');
        }
        if (!event.target.closest('.custom-select')) {
            document.querySelectorAll('.custom-select').forEach(sel => sel.classList.remove('open'));
        }
    });
    
    toggleThemeButton.addEventListener('pointerup', (e) => {
        if (e.button !== 0 && e.type !== 'touchend') return;
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    apiKeyInput.addEventListener('change', () => { userApiKey = apiKeyInput.value.trim(); localStorage.setItem('userApiKey', userApiKey); });

    const ALLOWED_MIME_TYPES =['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf', 'text/plain', 'text/csv', 'text/html', 'text/css', 'application/javascript', 'application/json'];

    function handleFileUpload(file) {
        if (!file) return;
        const isSupported = ALLOWED_MIME_TYPES.includes(file.type) || file.name.match(/\.(txt|md|csv|json|js|css|html|py|c|cpp|java)$/i);
        if (!isSupported) { alert(`Unsupported file format.`); return; }
        if (file.size > 10 * 1024 * 1024) { alert('Limit is 10MB.'); return; }
        const reader = new FileReader();
        reader.onerror = () => { alert('Error reading file.'); };
        reader.onloadend = () => {
            const b64 = reader.result.split(',')[1];
            uploadedFileState = { mimeType: file.type || 'text/plain', data: b64, name: file.name };
            renderFilePreview();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }

    fileInput.addEventListener('change', (event) => handleFileUpload(event.target.files[0]));
    userInput.addEventListener('paste', (e) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            handleFileUpload(e.clipboardData.files[0]);
        }
    });
    body.addEventListener('dragover', (e) => { e.preventDefault(); });
    body.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    });

    function renderFilePreview() {
        filePreviewContainer.innerHTML = '';
        if (uploadedFileState) {
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            const span = document.createElement('span');
            span.textContent = uploadedFileState.name;
            const btn = document.createElement('button');
            btn.type = 'button'; btn.innerHTML = '×';
            btn.onclick = () => { uploadedFileState = null; renderFilePreview(); };
            item.appendChild(span); item.appendChild(btn);
            filePreviewContainer.appendChild(item);
        }
    }

    function saveSpecificSession(id) {
        if (!allSessions[id]) return;
        let title = "New Chat";
        const history = allSessions[id].history;
        const firstUserMsg = history.find((m, i) => m.role === 'user' && i > 0);
        if (firstUserMsg) {
            const p = firstUserMsg.parts.find(p => p.text);
            title = p ? p.text.substring(0, 30) : "Image Upload";
        }
        if (allSessions[id].manualTitle) title = allSessions[id].manualTitle;
        allSessions[id].title = title;
        allSessions[id].timestamp = Date.now();
        localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
        if (id === currentSessionId) localStorage.setItem('gizmo_current_id', currentSessionId);
    }

    function createNewChat() {
        currentSessionId = Date.now().toString();
        conversationHistory =[INITIAL_SYSTEM_MESSAGE];
        cumulativeTokens = 0;
        const defaultModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        allSessions[currentSessionId] = {
            id: currentSessionId, history: conversationHistory, tokens: cumulativeTokens,
            title: "New Chat", manualTitle: null, model: defaultModel, timestamp: Date.now()
        };
        setCustomSelectValue('custom-model-select', defaultModel);
        renderChatLog(); saveSpecificSession(currentSessionId); renderHistoryList();
        welcomeScreen.classList.remove('hidden');
        setFormDisabled(isGenerating); 
        if (window.innerWidth <= 768) {
            body.classList.remove('sidebar-open'); sidebarOverlay.classList.remove('active');
        }
    }

    function loadSession(id) {
        if (allSessions[id]) {
            currentSessionId = id;
            conversationHistory = allSessions[id].history;
            cumulativeTokens = allSessions[id].tokens;
            const sessionModel = allSessions[id].model || localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
            setCustomSelectValue('custom-model-select', sessionModel);
            if (conversationHistory.length > 1) welcomeScreen.classList.add('hidden');
            else welcomeScreen.classList.remove('hidden');
            renderChatLog(); renderHistoryList();
            localStorage.setItem('gizmo_current_id', currentSessionId);
            setFormDisabled(isGenerating); 
            if (window.innerWidth <= 768) {
                body.classList.remove('sidebar-open'); sidebarOverlay.classList.remove('active');
            }
        }
    }

    function renderHistoryList() {
        historyList.innerHTML = '';
        const sortedIds = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);
        sortedIds.forEach(id => {
            const session = allSessions[id];
            const item = document.createElement('div');
            item.className = `history-item-container ${id === currentSessionId ? 'active' : ''}`;
            item.onclick = () => loadSession(id);
            const title = document.createElement('span');
            title.className = 'history-item-title'; title.textContent = session.title || "New Chat";
            const actions = document.createElement('div');
            actions.className = 'history-item-actions';
            const edit = document.createElement('button');
            edit.innerHTML = EDIT_ICON;
            edit.onclick = (e) => {
                e.stopPropagation();
                const n = prompt("New name:", session.title);
                if (n) { allSessions[id].manualTitle = n.trim(); saveSpecificSession(id); renderHistoryList(); }
            };
            const del = document.createElement('button');
            del.innerHTML = TRASH_ICON;
            del.onclick = (e) => {
                e.stopPropagation();
                if (isGenerating && activeStreamSessionId === id) return;
                if (confirm("Delete this chat?")) {
                    delete allSessions[id];
                    localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
                    if (currentSessionId === id) {
                        const r = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);
                        if (r.length > 0) loadSession(r[0]); else createNewChat();
                    } else renderHistoryList();
                }
            };
            actions.appendChild(edit); actions.appendChild(del);
            item.appendChild(title); item.appendChild(actions);
            historyList.appendChild(item);
        });
    }

    function loadAllSessions() {
        const stored = localStorage.getItem('gizmo_sessions');
        if (stored) { try { allSessions = JSON.parse(stored); } catch(e) { allSessions = {}; } }
        const lastId = localStorage.getItem('gizmo_current_id');
        if (lastId && allSessions[lastId]) loadSession(lastId);
        else createNewChat();
    }

    function renderChatLog() {
        chatLog.innerHTML = '';
        scrollAnchor = document.createElement('div'); scrollAnchor.id = 'scroll-anchor';
        chatLog.appendChild(scrollAnchor); updateStatsDisplay();
        activeStreamBubbleElement = null;
        conversationHistory.forEach((message, index) => {
            if (index === 0) return;
            if (message.role === 'model') {
                const stream = (isGenerating && activeStreamSessionId === currentSessionId && message === activeStreamMessageObj);
                const b = addMessage(message, 'model', false, stream);
                if (stream) {
                    activeStreamBubbleElement = b;
                    if (message.parts[0].text === '') {
                        b.classList.add('loading-bubble');
                        b.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
                    }
                }
            } else if (message.role === 'user') addMessage(message, 'user', false);
        });
        scrollToBottom(false); updateRegenerateButton();
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); if (isGenerating) return; 
        const txt = userInput.value.trim();
        if (!txt && !uploadedFileState) return;
        if (!userApiKey.trim()) { alert("API Key missing."); settingsMenu.classList.add('visible'); return; }
        welcomeScreen.classList.add('hidden'); updateRegenerateButton(true); 
        const parts =[];
        if (txt) parts.push({ text: txt });
        if (uploadedFileState) parts.push({ inlineData: { mimeType: uploadedFileState.mimeType, data: uploadedFileState.data } });
        lastUserMessage = { role: 'user', parts: parts, fileName: uploadedFileState?.name, timestamp: new Date().toISOString() };
        addMessage(lastUserMessage, 'user'); conversationHistory.push(lastUserMessage);
        saveSpecificSession(currentSessionId);
        if (conversationHistory.length === 2 && !allSessions[currentSessionId]?.manualTitle) renderHistoryList(); 
        userInput.value = ''; resizeTextarea(); uploadedFileState = null; renderFilePreview();
        isGenerating = true; setFormDisabled(true); activeStreamSessionId = currentSessionId;
        activeStreamMessageObj = { role: 'model', parts:[{ text: '' }], timestamp: new Date().toISOString() };
        allSessions[currentSessionId].history.push(activeStreamMessageObj); saveSpecificSession(currentSessionId);
        activeStreamBubbleElement = addMessage(activeStreamMessageObj, 'model', true, true);
        activeStreamBubbleElement.classList.add('loading-bubble');
        activeStreamBubbleElement.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(currentSessionId, activeStreamMessageObj);
    });

    function scrollToBottom(smooth = true) {
        if (!chatContainer) return;
        requestAnimationFrame(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); });
    }

    function formatTimestamp(iso) {
        if (!iso) return '';
        const d = new Date(iso); const n = new Date();
        if ((n - d) / 3600000 > 12) return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        else return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    async function callInsecureApi(targetSessionId, targetMsg) {
        let msgs = allSessions[targetSessionId].history.slice(0, -1); 
        if (historyLimit > 0 && msgs.length > historyLimit + 1) msgs =[msgs[0], ...msgs.slice(-historyLimit)];
        const apiMsgs = msgs.map(m => { const { fileName, timestamp, isError, ...rest } = m; return rest; });
        let model = allSessions[targetSessionId].model || getCustomSelectValue('custom-model-select');
        const url = `${BASE_API_URL}${model}:streamGenerateContent?alt=sse&key=${userApiKey}`;
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: apiMsgs }) });
            if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'API failed'); }
            const reader = res.body.getReader(); const decoder = new TextDecoder('utf-8');
            let buffer = ''; let finalUsage = null;
            if (currentSessionId === targetSessionId && activeStreamBubbleElement && targetMsg.parts[0].text === '') {
                activeStreamBubbleElement.classList.remove('loading-bubble'); activeStreamBubbleElement.innerHTML = '';
            }
            while (true) {
                const { done, value } = await reader.read(); if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n'); buffer = lines.pop(); 
                let updateDom = false;
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const s = line.substring(6).trim(); if (s === '[DONE]' || !s) continue;
                        try {
                            const d = JSON.parse(s);
                            if (d.candidates?.[0].content?.parts) { targetMsg.parts[0].text += d.candidates[0].content.parts[0].text; updateDom = true; }
                            if (d.usageMetadata) finalUsage = d.usageMetadata;
                        } catch (e) {}
                    }
                }
                if (updateDom && currentSessionId === targetSessionId && activeStreamBubbleElement) {
                    activeStreamBubbleElement.classList.remove('loading-bubble');
                    activeStreamBubbleElement.innerHTML = DOMPurify.sanitize(marked.parse(targetMsg.parts[0].text));
                    scrollToBottom(false);
                }
            }
            if (finalUsage) {
                let t = finalUsage.totalTokenCount || ((finalUsage.promptTokenCount || 0) + (finalUsage.candidatesTokenCount || 0));
                allSessions[targetSessionId].tokens += t;
                if (currentSessionId === targetSessionId) { cumulativeTokens = allSessions[targetSessionId].tokens; updateStatsDisplay(); }
            }
            saveSpecificSession(targetSessionId);
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) addMessageActions(activeStreamBubbleElement.parentElement, activeStreamBubbleElement, targetMsg.parts[0].text);
        } catch (error) {
            targetMsg.isError = true; targetMsg.parts[0].text = error.message || "An error occurred.";
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) {
                activeStreamBubbleElement.classList.remove('loading-bubble'); activeStreamBubbleElement.classList.add('error-bubble');
                activeStreamBubbleElement.innerHTML = `<strong>⚠️ Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(targetMsg.parts[0].text)}</div>`;
                addMessageActions(activeStreamBubbleElement.parentElement, activeStreamBubbleElement, targetMsg.parts[0].text);
            }
            const last = allSessions[targetSessionId].history[allSessions[targetSessionId].history.length - 2];
            if (last?.role === 'user' && last.parts.some(p => p.inlineData)) {
                last.parts = last.parts.filter(p => !p.inlineData); last.parts.push({ text: "\n\n*(Note: File stripped)*" });
            }
            saveSpecificSession(targetSessionId);
        } finally {
            isGenerating = false; activeStreamSessionId = null; activeStreamMessageObj = null; activeStreamBubbleElement = null;
            setFormDisabled(false); if (currentSessionId === targetSessionId && !/Mobi|Android/i.test(navigator.userAgent)) userInput.focus(); 
            updateRegenerateButton();
        }
    }
    
    function setFormDisabled(d) { userInput.disabled = d; sendButton.disabled = d; plusSettingsBtn.disabled = d; }

    function addMessage(data, sender, scroll = true, stream = false) {
        const wrapper = document.createElement('div'); wrapper.className = `message-wrapper ${sender}`;
        const bubble = document.createElement('div'); bubble.className = `message-bubble ${sender}`;
        let txt = data.parts ? data.parts[0].text : data.text;
        if (sender === 'user') {
            if (data.fileName) {
                if (txt) { bubble.appendChild(document.createTextNode(txt)); bubble.appendChild(document.createElement('br')); }
                const f = data.parts.find(p => p.inlineData);
                if (f) {
                    if (f.inlineData.mimeType.startsWith('image/')) {
                        const i = document.createElement('img'); i.src = `data:${f.inlineData.mimeType};base64,${f.inlineData.data}`;
                        i.onclick = () => openModal(i.src); i.onload = () => scrollToBottom(true); bubble.appendChild(i);
                    } else {
                        const t = document.createElement('div'); t.className = 'user-file-tag'; t.textContent = `📄 File: ${data.fileName}`; bubble.appendChild(t);
                    }
                }
            } else bubble.textContent = txt;
        } else {
            if (txt !== undefined) {
                if (data.isError) {
                    bubble.classList.add('error-bubble');
                    bubble.innerHTML = `<strong>⚠️ Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(txt)}</div>`;
                } else bubble.innerHTML = DOMPurify.sanitize(marked.parse(txt || ''));
            }
        }
        wrapper.appendChild(bubble); const meta = document.createElement('div'); meta.className = 'message-meta';
        if (data.timestamp) { const ts = document.createElement('span'); ts.className = 'message-timestamp'; ts.textContent = formatTimestamp(data.timestamp); meta.appendChild(ts); }
        wrapper.appendChild(meta); chatLog.insertBefore(wrapper, scrollAnchor);
        if (scroll) scrollToBottom(); if (txt && !stream) addMessageActions(wrapper, bubble, txt);
        return bubble;
    }

    function createActionButton(icon, tooltip) {
        const w = document.createElement('div'); w.className = 'action-button-wrapper';
        const b = document.createElement('button'); b.innerHTML = icon;
        const t = document.createElement('span'); t.className = 'custom-tooltip'; t.textContent = tooltip;
        w.appendChild(b); w.appendChild(t);
        w.onmouseenter = () => t.style.display = 'block'; w.onmouseleave = () => t.style.display = 'none';
        return { wrapper: w, button: b, tooltip: t };
    }

    function updateRegenerateButton(removeOnly = false) {
        document.querySelectorAll('.regenerate-btn').forEach(btn => btn.parentElement.remove());
        if (removeOnly || isGenerating || conversationHistory.length <= 1) return; 
        const last = Array.from(document.querySelectorAll('.message-wrapper.model')).pop();
        if (last) {
            const acts = last.querySelector('.message-actions');
            if (acts) {
                const { wrapper, button } = createActionButton(REGENERATE_ICON, 'Regenerate');
                button.classList.add('regenerate-btn'); button.onclick = handleRegenerate; acts.appendChild(wrapper);
            }
        }
    }

    function stripMarkdown(md) {
        const t = document.createElement('div'); t.innerHTML = DOMPurify.sanitize(marked.parse(md));
        return t.textContent || t.innerText || "";
    }

    function addMessageActions(wrapper, bubble, txt) {
        let meta = wrapper.querySelector('.message-meta');
        let acts = meta.querySelector('.message-actions') || document.createElement('div');
        acts.className = 'message-actions'; meta.appendChild(acts);
        const { wrapper: cW, button: cB, tooltip: cT } = createActionButton(COPY_ICON, 'Copy');
        cB.onclick = () => navigator.clipboard.writeText(txt).then(() => { cT.textContent = 'Copied!'; setTimeout(() => { cT.textContent = 'Copy'; }, 1500); });
        acts.appendChild(cW);
        const { wrapper: lW, button: lB, tooltip: lT } = createActionButton(LISTEN_ICON, 'Listen');
        lB.onclick = () => {
            if (!('speechSynthesis' in window)) return;
            if (window.speechSynthesis.speaking && currentSpeakingButton === lB) { window.speechSynthesis.cancel(); return; }
            if (currentSpeakingButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; currentSpeakingButton.parentElement.querySelector('.custom-tooltip').textContent = 'Listen'; }
            window.speechSynthesis.cancel(); currentSpeakingButton = lB;
            currentUtterance = new SpeechSynthesisUtterance(stripMarkdown(txt));
            currentUtterance.onstart = () => { lB.innerHTML = STOP_ICON; lT.textContent = 'Stop'; };
            currentUtterance.onend = () => { if (currentSpeakingButton === lB) { lB.innerHTML = LISTEN_ICON; lT.textContent = 'Listen'; currentSpeakingButton = null; } };
            window.speechSynthesis.speak(currentUtterance);
        };
        acts.appendChild(lW); updateRegenerateButton();
    }
    
    async function handleRegenerate() {
        if (isGenerating) return; 
        updateRegenerateButton(true); window.speechSynthesis.cancel();
        conversationHistory.pop(); const lastU = conversationHistory.pop();
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);
        addMessage(lastU, 'user'); conversationHistory.push(lastU);
        isGenerating = true; setFormDisabled(true); activeStreamSessionId = currentSessionId;
        activeStreamMessageObj = { role: 'model', parts:[{ text: '' }], timestamp: new Date().toISOString() };
        allSessions[currentSessionId].history.push(activeStreamMessageObj); saveSpecificSession(currentSessionId);
        activeStreamBubbleElement = addMessage(activeStreamMessageObj, 'model', true, true);
        activeStreamBubbleElement.classList.add('loading-bubble');
        activeStreamBubbleElement.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(currentSessionId, activeStreamMessageObj);
    }
    
    loadSettings();
    loadAllSessions();
});