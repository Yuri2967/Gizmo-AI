document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const body = document.body;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatLog = document.getElementById('chat-log');
    const sendButton = document.getElementById('send-btn');
    const totalTokensDisplay = document.getElementById('total-tokens-value');
    let scrollAnchor = document.getElementById('scroll-anchor');
    const uploadButton = document.getElementById('upload-button');
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const settingsButton = document.getElementById('settings-button');
    const settingsMenu = document.getElementById('settings-menu');
    const clearChatButton = document.getElementById('clear-chat-button');
    const toggleThemeButton = document.getElementById('toggle-theme-button');
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key-input');
    const historyLimitSelect = document.getElementById('history-limit-select');
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

    const SYSTEM_INSTRUCTIONS = "You are Gizmo, a helpful, intelligent, and concise AI assistant. You respond in Markdown format. Keep your answers concise and to the point unless asked for details. Use commas for values below zero and use metric units like meters, kilometers and celcius.";
    
    const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    const INITIAL_SYSTEM_MESSAGE = { role: 'user', parts:[{ text: SYSTEM_INSTRUCTIONS }] };
    
    let conversationHistory =[INITIAL_SYSTEM_MESSAGE];
    let cumulativeTokens = 0;
    let lastUserMessage = null;
    let uploadedFileState = null;
    let currentSpeakingButton = null;
    let currentUtterance = null; 

    // --- CHANGE START ---
    // Proper Volume Max Icon + Other matching solid icons
    const COPY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const LISTEN_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.81 5 3.54 5 6.71s-2.11 5.9-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const STOP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z"/></svg>`;
    const REGENERATE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
    const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
    // --- CHANGE END ---

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

    function saveChatToDB() {
        localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
        localStorage.setItem('chatTokens', cumulativeTokens);
    }

    function loadChatFromDB() {
        const savedHistory = localStorage.getItem('chatHistory');
        const savedTokens = localStorage.getItem('chatTokens');
        chatLog.innerHTML = '';
        scrollAnchor = document.createElement('div');
        scrollAnchor.id = 'scroll-anchor';
        chatLog.appendChild(scrollAnchor);

        if (savedHistory) {
            try {
                conversationHistory = JSON.parse(savedHistory);
                cumulativeTokens = savedTokens ? parseInt(savedTokens, 10) : 0;
                totalTokensDisplay.textContent = cumulativeTokens;

                conversationHistory.forEach((message, index) => {
                    if (index === 0) return;
                    if (message.role === 'model') {
                        addMessage(message, 'model', false);
                    } else if (message.role === 'user') {
                        addMessage(message, 'user', false);
                        lastUserMessage = message;
                    }
                });
                scrollToBottom(false);
                updateRegenerateButton();
                if(conversationHistory.length > 1) {
                    welcomeScreen.classList.add('hidden');
                }
            } catch (e) {
                welcomeScreen.classList.remove('hidden');
                updateRegenerateButton();
            }
        } else {
            welcomeScreen.classList.remove('hidden');
            updateRegenerateButton();
        }
    }
    
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }

    function loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        const savedModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        modelSelect.value = savedModel;

        userApiKey = localStorage.getItem('userApiKey') || '';
        apiKeyInput.value = userApiKey;

        const savedLimit = localStorage.getItem('historyLimit');
        if (savedLimit !== null) {
            historyLimit = parseInt(savedLimit, 10);
            historyLimitSelect.value = historyLimit.toString();
        }
    }

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            sendButton.click(); 
        }
    });

    userInput.addEventListener('focus', () => { setTimeout(() => { body.classList.add('input-focus-mode'); scrollToBottom(); }, 100); });
    userInput.addEventListener('blur', () => { body.classList.remove('input-focus-mode'); });
    
    uploadButton.addEventListener('click', (event) => { 
        fileInput.click(); 
        uploadButton.blur(); 
    });
    
    settingsButton.addEventListener('click', (event) => { 
        event.stopPropagation();
        settingsMenu.classList.toggle('visible'); 
        settingsButton.blur(); 
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
    
    document.addEventListener('click', (event) => {
        if (settingsMenu.classList.contains('visible') && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
            settingsMenu.classList.remove('visible');
        }
    });

    clearChatButton.addEventListener('click', () => {
        if (confirm('Delete current chat?')) {
            settingsMenu.classList.remove('visible'); 
            delete allSessions[currentSessionId];
            localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
            createNewChat();
        }
    });
    
    toggleThemeButton.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    modelSelect.addEventListener('change', () => localStorage.setItem('selectedModel', modelSelect.value));
    apiKeyInput.addEventListener('change', () => { userApiKey = apiKeyInput.value.trim(); localStorage.setItem('userApiKey', userApiKey); });
    historyLimitSelect.addEventListener('change', () => { historyLimit = parseInt(historyLimitSelect.value, 10); localStorage.setItem('historyLimit', historyLimit); });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { alert('File is too large. Limit is 10MB.'); fileInput.value = ''; return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            uploadedFileState = { mimeType: file.type, data: base64Data, name: file.name };
            renderFilePreview();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    });

    function renderFilePreview() {
        filePreviewContainer.innerHTML = '';
        if (uploadedFileState) {
            const previewItem = document.createElement('div');
            previewItem.classList.add('file-preview-item');
            
            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = uploadedFileState.name;
            fileNameSpan.title = uploadedFileState.name;

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.innerHTML = '×';
            removeButton.addEventListener('click', () => {
                uploadedFileState = null;
                renderFilePreview();
            });

            previewItem.appendChild(fileNameSpan);
            previewItem.appendChild(removeButton);
            filePreviewContainer.appendChild(previewItem);
        }
    }

    function createNewChat() {
        currentSessionId = Date.now().toString();
        conversationHistory =[INITIAL_SYSTEM_MESSAGE];
        cumulativeTokens = 0;
        renderChatLog();
        saveCurrentSession();
        renderHistoryList();
        
        welcomeScreen.classList.remove('hidden');
        if (window.innerWidth <= 768) {
            body.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        }
    }

    function saveCurrentSession() {
        let title = "New Chat";
        const firstUserMsg = conversationHistory.find((m, i) => m.role === 'user' && i > 0);
        if (firstUserMsg) {
            const textPart = firstUserMsg.parts.find(p => p.text);
            if (textPart && textPart.text) {
                title = textPart.text.substring(0, 30);
            } else {
                title = "Image Upload";
            }
        }
        
        if (allSessions[currentSessionId] && allSessions[currentSessionId].manualTitle) {
             title = allSessions[currentSessionId].manualTitle;
        }

        allSessions[currentSessionId] = {
            id: currentSessionId,
            history: conversationHistory,
            tokens: cumulativeTokens,
            title: title,
            manualTitle: allSessions[currentSessionId]?.manualTitle || null,
            timestamp: Date.now()
        };
        localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
        localStorage.setItem('gizmo_current_id', currentSessionId);
    }

    function loadSession(id) {
        if (allSessions[id]) {
            currentSessionId = id;
            conversationHistory = allSessions[id].history;
            cumulativeTokens = allSessions[id].tokens;
            
            if (conversationHistory.length > 1) {
                welcomeScreen.classList.add('hidden');
            } else {
                welcomeScreen.classList.remove('hidden');
            }
            
            renderChatLog();
            renderHistoryList();
            localStorage.setItem('gizmo_current_id', currentSessionId);
            if (window.innerWidth <= 768) {
                body.classList.remove('sidebar-open');
                sidebarOverlay.classList.remove('active');
            }
        }
    }

    function renderHistoryList() {
        historyList.innerHTML = '';
        const sortedIds = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);

        sortedIds.forEach(id => {
            const session = allSessions[id];
            
            const itemContainer = document.createElement('div');
            itemContainer.className = `history-item-container ${id === currentSessionId ? 'active' : ''}`;
            itemContainer.onclick = () => loadSession(id);
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'history-item-title';
            titleSpan.textContent = session.title || "New Chat";

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-item-actions';

            const editBtn = document.createElement('button');
            editBtn.innerHTML = EDIT_ICON;
            editBtn.title = "Rename";
            editBtn.onclick = (e) => {
                e.stopPropagation();
                const newTitle = prompt("Enter a new name for this chat:", session.title);
                if (newTitle !== null && newTitle.trim() !== '') {
                    allSessions[id].manualTitle = newTitle.trim();
                    allSessions[id].title = newTitle.trim();
                    localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
                    renderHistoryList();
                }
            };

            const delBtn = document.createElement('button');
            delBtn.innerHTML = TRASH_ICON;
            delBtn.title = "Delete";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm("Delete this chat permanently?")) {
                    delete allSessions[id];
                    localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
                    if (currentSessionId === id) {
                        createNewChat();
                    } else {
                        renderHistoryList();
                    }
                }
            };

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(delBtn);

            itemContainer.appendChild(titleSpan);
            itemContainer.appendChild(actionsDiv);
            historyList.appendChild(itemContainer);
        });
    }

    function loadAllSessions() {
        const storedSessions = localStorage.getItem('gizmo_sessions');
        if (storedSessions) {
            try {
                allSessions = JSON.parse(storedSessions);
            } catch(e) { allSessions = {}; }
        }
        
        const lastId = localStorage.getItem('gizmo_current_id');
        if (lastId && allSessions[lastId]) {
            loadSession(lastId);
        } else {
            createNewChat();
        }
    }

    function renderChatLog() {
        chatLog.innerHTML = '';
        scrollAnchor = document.createElement('div');
        scrollAnchor.id = 'scroll-anchor';
        chatLog.appendChild(scrollAnchor);
        totalTokensDisplay.textContent = cumulativeTokens;

        conversationHistory.forEach((message, index) => {
            if (index === 0) return;
            if (message.role === 'model') {
                addMessage(message, 'model', false);
            } else if (message.role === 'user') {
                addMessage(message, 'user', false);
            }
        });
        scrollToBottom(false);
        updateRegenerateButton();
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessageText = userInput.value.trim();
        if (!userMessageText && !uploadedFileState) return;

        if (!userApiKey.trim()) {
            alert("API Key is missing. Please open the settings (gear icon) and add your Gemini API Key.");
            settingsMenu.classList.add('visible');
            return;
        }
        
        welcomeScreen.classList.add('hidden');
        updateRegenerateButton(true);

        const messageParts =[];
        if (userMessageText) messageParts.push({ text: userMessageText });
        if (uploadedFileState) messageParts.push({ inlineData: { mimeType: uploadedFileState.mimeType, data: uploadedFileState.data } });
        
        lastUserMessage = { role: 'user', parts: messageParts, fileName: uploadedFileState?.name, timestamp: new Date().toISOString() };

        addMessage(lastUserMessage, 'user');
        conversationHistory.push(lastUserMessage);
        
        if (conversationHistory.length === 2 && !allSessions[currentSessionId]?.manualTitle) { 
            allSessions[currentSessionId].title = userMessageText.substring(0, 30) || "Image Upload";
            renderHistoryList();
        }
        saveCurrentSession();
        
        userInput.value = '';
        uploadedFileState = null;
        renderFilePreview();
        
        setFormDisabled(true);
        const thinkingMessageBubble = addMessage({ text: '' }, 'model');
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(thinkingMessageBubble);
    });

    function scrollToBottom(smooth = true) {
        if (!chatContainer) return;
        requestAnimationFrame(() => {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    function formatMessage(text) {
        if (!text) return '';
        text = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const escapeDiv = document.createElement('div');
        escapeDiv.textContent = text;
        let safeText = escapeDiv.innerHTML;
        safeText = safeText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const lines = safeText.split('\n');
        let html = '';
        let listState = null;
        lines.forEach(line => {
            const trimmed = line.trim(); 
            const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
            const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (ulMatch) {
                if (listState !== 'ul') { if (listState) html += `</${listState}>`; html += '<ul>'; listState = 'ul'; }
                html += `<li>${ulMatch[1]}</li>`;
            } else if (olMatch) {
                if (listState !== 'ol') { if (listState) html += `</${listState}>`; html += '<ol>'; listState = 'ol'; }
                html += `<li>${olMatch[2]}</li>`;
            } else {
                if (listState) { html += `</${listState}>`; listState = null; }
                if (trimmed.length > 0) { html += `<p>${trimmed}</p>`; }
            }
        });
        if (listState) { html += `</${listState}>`; }
        return html;
    }

    function formatTimestamp(isoString) {
        if (!isoString) return '';
        const msgDate = new Date(isoString);
        const now = new Date();
        const diffHours = (now - msgDate) / (1000 * 60 * 60);
        if (diffHours > 12) { return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
        else { return msgDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    }

    async function callInsecureApi(thinkingMessageBubble) {
        let messagesToSend = conversationHistory;
        if (historyLimit > 0 && conversationHistory.length > historyLimit + 1) {
            messagesToSend = [conversationHistory[0], ...conversationHistory.slice(-historyLimit)];
        }
        const historyForAPI = messagesToSend.map(msg => { const { fileName, timestamp, ...apiMsg } = msg; return apiMsg; });
        const API_URL = `${BASE_API_URL}${modelSelect.value}:generateContent?key=${userApiKey}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: historyForAPI })
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || 'API request failed'); }
            const data = await response.json();
            const modelResponse = data.candidates[0].content.parts[0].text;
            
            if (data.usageMetadata) {
                cumulativeTokens += data.usageMetadata.totalTokenCount || ((data.usageMetadata.promptTokenCount || 0) + (data.usageMetadata.candidatesTokenCount || 0));
            }
            
            totalTokensDisplay.textContent = cumulativeTokens;
            const modelMessage = { role: 'model', parts: [{ text: modelResponse }], timestamp: new Date().toISOString() };
            updateModelMessage(thinkingMessageBubble, modelMessage);
            conversationHistory.push(modelMessage);
            saveCurrentSession();
        } catch (error) {
            const errorMessage = { role: 'model', parts:[{ text: `Error: ${error.message}. Check API Key.`}], timestamp: new Date().toISOString() };
            updateModelMessage(thinkingMessageBubble, errorMessage);
        } finally {
            setFormDisabled(false);
            if (!/Mobi|Android/i.test(navigator.userAgent)) { userInput.focus(); }
        }
    }
    
    function setFormDisabled(disabled) { userInput.disabled = disabled; sendButton.disabled = disabled; uploadButton.disabled = disabled; }

    function addMessage(messageData, sender, shouldScroll = true) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', sender);
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble', sender);
        
        let textContentForTTS = messageData.parts ? messageData.parts[0].text : messageData.text;
        
        if (sender === 'user') {
            if (messageData.fileName) {
                if (textContentForTTS) {
                    bubble.appendChild(document.createTextNode(textContentForTTS));
                    bubble.appendChild(document.createElement('br'));
                }
                const filePart = messageData.parts.find(p => p.inlineData);
                if (filePart) {
                    if (filePart.inlineData.mimeType.startsWith('image/')) {
                        const imgElement = document.createElement('img');
                        imgElement.src = `data:${filePart.inlineData.mimeType};base64,${filePart.inlineData.data}`;
                        imgElement.alt = messageData.fileName;
                        imgElement.addEventListener('click', () => { openModal(imgElement.src); });
                        imgElement.onload = () => scrollToBottom(true);
                        bubble.appendChild(imgElement);
                    } else {
                        const fileTag = document.createElement('div');
                        fileTag.classList.add('user-file-tag');
                        fileTag.textContent = `📄 File: ${messageData.fileName}`;
                        bubble.appendChild(fileTag);
                    }
                }
            } else {
                bubble.textContent = textContentForTTS;
            }
        } else {
            bubble.innerHTML = DOMPurify.sanitize(marked.parse(textContentForTTS || ''));
        }

        wrapper.appendChild(bubble);
        
        const metaContainer = document.createElement('div');
        metaContainer.classList.add('message-meta');
        if (messageData.timestamp) {
            const timestamp = document.createElement('span');
            timestamp.classList.add('message-timestamp');
            timestamp.textContent = formatTimestamp(messageData.timestamp);
            metaContainer.appendChild(timestamp);
        }
        wrapper.appendChild(metaContainer);
        chatLog.insertBefore(wrapper, scrollAnchor);
        
        if (shouldScroll) scrollToBottom();
        
        if (textContentForTTS) addMessageActions(wrapper, bubble, textContentForTTS);
        return bubble;
    }
    
    function updateModelMessage(bubbleElement, messageData) {
        bubbleElement.classList.remove('loading-bubble');
        bubbleElement.innerHTML = DOMPurify.sanitize(marked.parse(messageData.parts[0].text));
        const wrapper = bubbleElement.parentElement;
        const metaContainer = wrapper.querySelector('.message-meta');
        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        timestamp.textContent = formatTimestamp(messageData.timestamp);
        metaContainer.insertBefore(timestamp, metaContainer.firstChild);
        addMessageActions(wrapper, bubbleElement, messageData.parts[0].text);
    }

    function createActionButton(icon, tooltipText) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('action-button-wrapper');
        const button = document.createElement('button');
        button.innerHTML = icon;
        const tooltip = document.createElement('span');
        tooltip.classList.add('custom-tooltip');
        tooltip.textContent = tooltipText;
        wrapper.appendChild(button);
        wrapper.appendChild(tooltip);
        wrapper.addEventListener('mouseenter', () => { tooltip.style.display = 'block'; });
        wrapper.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        return { wrapper, button, tooltip };
    }

    function updateRegenerateButton(removeOnly = false) {
        document.querySelectorAll('.regenerate-btn').forEach(btn => btn.parentElement.remove());
        if (removeOnly) return;
        if (conversationHistory.length <= 1) return;
    
        const lastModelWrapper = Array.from(document.querySelectorAll('.message-wrapper.model')).pop();
        if (lastModelWrapper) {
            const metaContainer = lastModelWrapper.querySelector('.message-meta');
            if (metaContainer) {
                const actionsContainer = metaContainer.querySelector('.message-actions');
                if (actionsContainer) {
                    const { wrapper: regenWrapper, button: regenButton } = createActionButton(REGENERATE_ICON, 'Regenerate');
                    regenButton.classList.add('regenerate-btn');
                    regenButton.onclick = handleRegenerate;
                    actionsContainer.appendChild(regenWrapper);
                }
            }
        }
    }

    function addMessageActions(wrapper, bubbleElement, textToCopy) {
        let metaContainer = wrapper.querySelector('.message-meta');
        let actionsContainer = metaContainer.querySelector('.message-actions');
        if (!actionsContainer) {
             actionsContainer = document.createElement('div');
             actionsContainer.classList.add('message-actions');
             metaContainer.appendChild(actionsContainer);
        }

        const { wrapper: copyWrapper, button: copyButton, tooltip: copyTooltip } = createActionButton(COPY_ICON, 'Copy');
        copyButton.onclick = () => { navigator.clipboard.writeText(textToCopy).then(() => { copyTooltip.textContent = 'Copied!'; setTimeout(() => { copyTooltip.textContent = 'Copy'; }, 1500); }); };
        actionsContainer.appendChild(copyWrapper);

        const { wrapper: listenWrapper, button: listenButton, tooltip: listenTooltip } = createActionButton(LISTEN_ICON, 'Listen');
        listenButton.onclick = () => {
            if (!('speechSynthesis' in window)) return;
            if (window.speechSynthesis.speaking && currentSpeakingButton === listenButton) { window.speechSynthesis.cancel(); return; }
            if (currentSpeakingButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; currentSpeakingButton.parentElement.querySelector('.custom-tooltip').textContent = 'Listen'; }
            window.speechSynthesis.cancel();
            currentSpeakingButton = listenButton;
            
            currentUtterance = new SpeechSynthesisUtterance(textToCopy);
            currentUtterance.lang = 'en-US';
            currentUtterance.onstart = () => { listenButton.innerHTML = STOP_ICON; listenTooltip.textContent = 'Stop'; };
            currentUtterance.onend = currentUtterance.onerror = () => {
                if (currentSpeakingButton === listenButton) { 
                    currentSpeakingButton.innerHTML = LISTEN_ICON; 
                    listenTooltip.textContent = 'Listen'; 
                    currentSpeakingButton = null; 
                }
                currentUtterance = null;
            };
            window.speechSynthesis.speak(currentUtterance);
        };
        actionsContainer.appendChild(listenWrapper);
        updateRegenerateButton();
        setTimeout(() => scrollToBottom(false), 50);
    }
    
    async function handleRegenerate() {
        window.speechSynthesis.cancel();
        if (currentSpeakingButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; currentSpeakingButton.parentElement.querySelector('.custom-tooltip').textContent = 'Listen'; currentSpeakingButton = null; }

        conversationHistory.pop();
        const lastUserMsgInHistory = conversationHistory.pop();
        
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);

        addMessage(lastUserMsgInHistory, 'user');
        conversationHistory.push(lastUserMsgInHistory);
        saveCurrentSession();

        setFormDisabled(true);
        const thinkingMessageBubble = addMessage({ text: '' }, 'model');
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(thinkingMessageBubble);
    }
    
    loadSettings();
    loadAllSessions();
});
