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

    // --- State & Constants ---
    let userApiKey = '';
    let historyLimit = 10; 
    
    const SYSTEM_INSTRUCTIONS = "You are Gizmo, a helpful, intelligent, and concise AI assistant. You respond in Markdown format. Keep your answers concise and to the point unless asked for details. Use commas for values below zero and use metric units like meters, kilometers and celcius.";
    const INITIAL_MODEL_RESPONSE = { role: 'model', parts:[{ text: "Hi there! I am Gizmo. Before we start, please click the **settings icon** (gear) to add your Google Gemini API Key.\n\nHow can I assist you today?" }] };
    
    const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    const INITIAL_SYSTEM_MESSAGE = { role: 'user', parts:[{ text: SYSTEM_INSTRUCTIONS }] };
    
    let conversationHistory =[INITIAL_SYSTEM_MESSAGE, INITIAL_MODEL_RESPONSE];
    let cumulativeTokens = 0;
    let lastUserMessage = null;
    let uploadedFileState = null;
    let currentSpeakingButton = null;

    const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const LISTEN_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
    const STOP_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect></svg>`;
    const REGENERATE_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>`;

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
            } catch (e) {
                addMessage(INITIAL_MODEL_RESPONSE, 'model', false);
                updateRegenerateButton();
            }
        } else {
            addMessage(INITIAL_MODEL_RESPONSE, 'model', false);
            updateRegenerateButton();
        }
    }
    
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }

    function loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        const savedModel = localStorage.getItem('selectedModel') || 'gemma-3-27b-it';
        modelSelect.value = savedModel;

        userApiKey = localStorage.getItem('userApiKey') || '';
        apiKeyInput.value = userApiKey;

        const savedLimit = localStorage.getItem('historyLimit');
        if (savedLimit !== null) {
            historyLimit = parseInt(savedLimit, 10);
            historyLimitSelect.value = historyLimit.toString();
        }
    }

    userInput.addEventListener('focus', () => { setTimeout(() => { body.classList.add('input-focus-mode'); scrollToBottom(); }, 100); });
    userInput.addEventListener('blur', () => { body.classList.remove('input-focus-mode'); });
    uploadButton.addEventListener('click', () => { fileInput.click(); });
    
    settingsButton.addEventListener('click', (event) => { 
        event.stopPropagation();
        settingsMenu.classList.toggle('visible'); 
    });
    
    document.addEventListener('click', (event) => {
        if (settingsMenu.classList.contains('visible') && !settingsMenu.contains(event.target) && event.target !== settingsButton) {
            settingsMenu.classList.remove('visible');
        }
    });

    clearChatButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the entire chat?')) {
            settingsMenu.classList.remove('visible'); 
            const modelTimestamp = { ...INITIAL_MODEL_RESPONSE, timestamp: new Date().toISOString() };
            conversationHistory = [INITIAL_SYSTEM_MESSAGE, modelTimestamp];
            cumulativeTokens = 0;
            
            localStorage.removeItem('chatHistory');
            localStorage.removeItem('chatTokens');

            chatLog.innerHTML = '';
            scrollAnchor = document.createElement('div');
            scrollAnchor.id = 'scroll-anchor';
            chatLog.appendChild(scrollAnchor);
            
            addMessage(modelTimestamp, 'model');
            totalTokensDisplay.textContent = '0';
            lastUserMessage = null;
        }
    });
    
    toggleThemeButton.addEventListener('click', () => {
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });

    modelSelect.addEventListener('change', () => localStorage.setItem('selectedModel', modelSelect.value));
    
    apiKeyInput.addEventListener('change', () => {
        userApiKey = apiKeyInput.value.trim();
        localStorage.setItem('userApiKey', userApiKey);
    });

    historyLimitSelect.addEventListener('change', () => {
        historyLimit = parseInt(historyLimitSelect.value, 10);
        localStorage.setItem('historyLimit', historyLimit);
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { 
            alert('File is too large. Limit is 10MB.'); 
            fileInput.value = ''; return; 
        }
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

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessageText = userInput.value.trim();
        if (!userMessageText && !uploadedFileState) return;

        if (!userApiKey.trim()) {
            alert("API Key is missing. Please open the settings (gear icon) and add your Gemini API Key.");
            settingsMenu.classList.add('visible');
            return;
        }
        
        updateRegenerateButton(true);

        const messageParts =[];
        if (userMessageText) messageParts.push({ text: userMessageText });
        if (uploadedFileState) messageParts.push({ inlineData: { mimeType: uploadedFileState.mimeType, data: uploadedFileState.data } });
        
        lastUserMessage = { role: 'user', parts: messageParts, fileName: uploadedFileState?.name, timestamp: new Date().toISOString() };

        addMessage(lastUserMessage, 'user');
        conversationHistory.push(lastUserMessage);
        saveChatToDB();
        
        userInput.value = '';
        uploadedFileState = null;
        renderFilePreview();
        
        setFormDisabled(true);
        const thinkingMessageBubble = addMessage({ text: '' }, 'model');
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(thinkingMessageBubble);
    });

    // --- CHANGE START ---
    // Aggressive scroll function to guarantee visibility
    function scrollToBottom(smooth = true) {
        if (!chatContainer) return;
        // Using requestAnimationFrame ensures the DOM has fully calculated new heights before scrolling
        requestAnimationFrame(() => {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        });
    }

    function formatMessage(text) {
        if (!text) return '';
    
        // 1. Destroy trailing invisible carriage returns (\r) and trim giant empty spaces
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
            // Trim the physical line again so no trailing spaces get caught in the <p> tag
            const trimmed = line.trim(); 
            const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
            const olMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    
            if (ulMatch) {
                if (listState !== 'ul') {
                    if (listState) html += `</${listState}>`;
                    html += '<ul>';
                    listState = 'ul';
                }
                html += `<li>${ulMatch[1]}</li>`;
            } else if (olMatch) {
                if (listState !== 'ol') {
                    if (listState) html += `</${listState}>`;
                    html += '<ol>';
                    listState = 'ol';
                }
                html += `<li>${olMatch[2]}</li>`;
            } else {
                if (listState) {
                    html += `</${listState}>`;
                    listState = null;
                }
                // ONLY generate a <p> if the line actually contains text characters
                if (trimmed.length > 0) {
                    html += `<p>${trimmed}</p>`;
                }
            }
        });
    
        if (listState) {
            html += `</${listState}>`;
        }
    
        return html;
    }
    // --- CHANGE END ---

    function formatTimestamp(isoString) {
        if (!isoString) return '';
        const msgDate = new Date(isoString);
        const now = new Date();
        const diffHours = (now - msgDate) / (1000 * 60 * 60);

        if (diffHours > 12) {
            return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        } else {
            return msgDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        }
    }

    async function callInsecureApi(thinkingMessageBubble) {
        let messagesToSend = conversationHistory;
        
        if (historyLimit > 0 && conversationHistory.length > historyLimit + 1) {
            messagesToSend = [
                conversationHistory[0], 
                ...conversationHistory.slice(-historyLimit)
            ];
        }

        const historyForAPI = messagesToSend.map(msg => {
            const { fileName, timestamp, ...apiMsg } = msg;
            return apiMsg;
        });
        
        const activeApiKey = userApiKey.trim();
        const API_URL = `${BASE_API_URL}${modelSelect.value}:generateContent?key=${activeApiKey}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: historyForAPI })
            });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error.message || 'API request failed'); }
            const data = await response.json();
            const modelResponse = data.candidates[0].content.parts[0].text;
            const usage = data.usageMetadata;
            cumulativeTokens += (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
            totalTokensDisplay.textContent = cumulativeTokens;
            const modelMessage = { role: 'model', parts: [{ text: modelResponse }], timestamp: new Date().toISOString() };
            updateModelMessage(thinkingMessageBubble, modelMessage);
            conversationHistory.push(modelMessage);
            saveChatToDB();
        } catch (error) {
            const errorMessage = { role: 'model', parts:[{ text: `Error: ${error.message}. Check your API Key.`}], timestamp: new Date().toISOString() };
            updateModelMessage(thinkingMessageBubble, errorMessage);
        } finally {
            setFormDisabled(false);
            if (!/Mobi|Android/i.test(navigator.userAgent)) { userInput.focus(); }
        }
    }
    
    function setFormDisabled(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
        uploadButton.disabled = disabled;
        // Settings remain clickable during generation
    }

    function addMessage(messageData, sender, shouldScroll = true) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', sender);
        
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble', sender);

        let textContentForTTS = '';
        let textSpan = null;
        let imgElement = null;

        if (sender === 'user') {
            const textPart = messageData.parts.find(p => p.text);
            const filePart = messageData.parts.find(p => p.inlineData);
            if (textPart && textPart.text) {
                textSpan = document.createElement('span');
                textSpan.textContent = textPart.text;
                bubble.appendChild(textSpan);
                textContentForTTS = textPart.text;
            }
            if (filePart) {
                const { mimeType, data } = filePart.inlineData;
                const fileName = messageData.fileName;
                if (mimeType.startsWith('image/')) {
                    imgElement = document.createElement('img');
                    imgElement.src = `data:${mimeType};base64,${data}`;
                    imgElement.alt = fileName;
                    imgElement.onload = () => scrollToBottom(true);
                    if (textSpan) bubble.appendChild(document.createElement('br'));
                    bubble.appendChild(imgElement);
                } else {
                    const fileTag = document.createElement('div');
                    fileTag.classList.add('user-file-tag');
                    fileTag.textContent = `📄 File: ${fileName}`;
                    bubble.appendChild(fileTag);
                }
            }
        } else {
            textContentForTTS = messageData.parts ? messageData.parts[0].text : messageData.text;
            bubble.innerHTML = formatMessage(textContentForTTS || '');
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
        if (imgElement) {
            const textWidth = textSpan ? textSpan.offsetWidth : 0;
            const minWidth = 150;
            imgElement.style.width = `${Math.max(textWidth, minWidth)}px`;
            imgElement.style.maxWidth = '100%';
        }
        
        if (shouldScroll) scrollToBottom();
        
        if (sender === 'model' && textContentForTTS) { addMessageActions(wrapper, bubble, textContentForTTS); }
        return bubble;
    }
    
    function updateModelMessage(bubbleElement, messageData) {
        bubbleElement.classList.remove('loading-bubble');
        bubbleElement.innerHTML = formatMessage(messageData.parts[0].text);
        
        const wrapper = bubbleElement.parentElement;
        
        let metaContainer = wrapper.querySelector('.message-meta');
        if (!metaContainer) {
            metaContainer = document.createElement('div');
            metaContainer.classList.add('message-meta');
            wrapper.appendChild(metaContainer);
        }

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
        
        if (conversationHistory.length <= 2) return;
    
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
        if (!metaContainer) {
            metaContainer = document.createElement('div');
            metaContainer.classList.add('message-meta');
            wrapper.appendChild(metaContainer);
        }

        const oldActions = metaContainer.querySelector('.message-actions');
        if (oldActions) oldActions.remove();

        const actionsContainer = document.createElement('div');
        actionsContainer.classList.add('message-actions');
        
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
            const utterance = new SpeechSynthesisUtterance(textToCopy);
            utterance.lang = 'en-US';
            utterance.onstart = () => { listenButton.innerHTML = STOP_ICON; listenTooltip.textContent = 'Stop'; };
            utterance.onend = utterance.onerror = () => {
                if (currentSpeakingButton === listenButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; listenTooltip.textContent = 'Listen'; currentSpeakingButton = null; }
            };
            window.speechSynthesis.speak(utterance);
        };
        actionsContainer.appendChild(listenWrapper);
        metaContainer.appendChild(actionsContainer);
        updateRegenerateButton();
        
        // --- CHANGE START ---
        // Ensure scrolling triggers AFTER buttons are added to DOM so they are visible
        setTimeout(() => scrollToBottom(false), 50);
        // --- CHANGE END ---
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
        saveChatToDB();

        setFormDisabled(true);
        const thinkingMessageBubble = addMessage({ text: '' }, 'model');
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        await callInsecureApi(thinkingMessageBubble);
    }
    
    loadSettings();
    loadChatFromDB();
});
