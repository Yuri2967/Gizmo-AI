document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const body = document.body;
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
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
            if (e.button !== 0 && e.type !== 'touchstart') return; // Only left click/touch
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

    function loadSettings() {
        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            savedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            localStorage.setItem('theme', savedTheme);
        }
        applyTheme(savedTheme);

        userApiKey = localStorage.getItem('userApiKey') || '';
        apiKeyInput.value = userApiKey;

        // Init Custom Model Select
        const savedModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        const modelContainer = document.getElementById('custom-model-select');
        modelContainer.setAttribute('data-value', savedModel);
        const modelOpt = modelContainer.querySelector(`.option[data-value="${savedModel}"]`);
        if (modelOpt) modelContainer.querySelector('.select-trigger span').textContent = modelOpt.textContent;
        
        initCustomSelect('custom-model-select', (val) => {
            localStorage.setItem('selectedModel', val);
            updateStatsDisplay();
        });

        // Init Custom History Select
        const savedLimit = localStorage.getItem('historyLimit');
        if (savedLimit !== null) {
            historyLimit = parseInt(savedLimit, 10);
            const historyContainer = document.getElementById('custom-history-select');
            historyContainer.setAttribute('data-value', historyLimit.toString());
            const histOpt = historyContainer.querySelector(`.option[data-value="${historyLimit}"]`);
            if (histOpt) historyContainer.querySelector('.select-trigger span').textContent = histOpt.textContent;
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
                let firstSignificantPlace = Math.ceil(-Math.log10(val));
                if (firstSignificantPlace < 1) firstSignificantPlace = 1;
                return val.toFixed(firstSignificantPlace);
            };
            
            powerDisplay.textContent = formatStat(power);
            waterDisplay.textContent = formatStat(water);
        }
    }

    // Textarea Auto-resize Logic
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
    
    // Snappy Plus Button Trigger
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
    
    // Snappy Global click/touch listener to close custom dropdowns
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

    // File Handling & Validation
    const ALLOWED_MIME_TYPES =['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf', 'text/plain', 'text/csv', 'text/html', 'text/css', 'application/javascript', 'application/json'];

    function handleFileUpload(file) {
        if (!file) return;
        
        const isSupported = ALLOWED_MIME_TYPES.includes(file.type) || file.name.match(/\.(txt|md|csv|json|js|css|html|py|c|cpp|java)$/i);
        if (!isSupported) {
            alert(`File format "${file.type || file.name.split('.').pop()}" is not supported. Please upload standard images, PDFs, or text files.`);
            return;
        }

        if (file.size > 10 * 1024 * 1024) { 
            alert('File is too large. Limit is 10MB.'); 
            return; 
        }
        
        const reader = new FileReader();
        reader.onerror = () => { alert('Error reading file. The file might be corrupted.'); };
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            let mime = file.type || 'text/plain'; 
            uploadedFileState = { mimeType: mime, data: base64Data, name: file.name };
            renderFilePreview();
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
    }

    fileInput.addEventListener('change', (event) => handleFileUpload(event.target.files[0]));

    // Global Paste Listener for Images/Files
    userInput.addEventListener('paste', (e) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            handleFileUpload(e.clipboardData.files[0]);
        }
    });

    // Global Drag & Drop Listeners
    body.addEventListener('dragover', (e) => { e.preventDefault(); });
    body.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
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

    function saveSpecificSession(id) {
        if (!allSessions[id]) return;
        
        let title = "New Chat";
        const sessionHistory = allSessions[id].history;
        const firstUserMsg = sessionHistory.find((m, i) => m.role === 'user' && i > 0);
        if (firstUserMsg) {
            const textPart = firstUserMsg.parts.find(p => p.text);
            if (textPart && textPart.text) {
                title = textPart.text.substring(0, 30);
            } else {
                title = "Image Upload";
            }
        }
        
        if (allSessions[id].manualTitle) {
             title = allSessions[id].manualTitle;
        }

        allSessions[id].title = title;
        allSessions[id].timestamp = Date.now();
        localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
        if (id === currentSessionId) {
            localStorage.setItem('gizmo_current_id', currentSessionId);
        }
    }

    function createNewChat() {
        currentSessionId = Date.now().toString();
        conversationHistory =[INITIAL_SYSTEM_MESSAGE];
        cumulativeTokens = 0;
        
        allSessions[currentSessionId] = {
            id: currentSessionId,
            history: conversationHistory,
            tokens: cumulativeTokens,
            title: "New Chat",
            manualTitle: null,
            timestamp: Date.now()
        };

        renderChatLog();
        saveSpecificSession(currentSessionId);
        renderHistoryList();
        
        welcomeScreen.classList.remove('hidden');
        setFormDisabled(isGenerating); 

        if (window.innerWidth <= 768) {
            body.classList.remove('sidebar-open');
            sidebarOverlay.classList.remove('active');
        }
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
            
            setFormDisabled(isGenerating); 

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
                    saveSpecificSession(id);
                    renderHistoryList();
                }
            };

            const delBtn = document.createElement('button');
            delBtn.innerHTML = TRASH_ICON;
            delBtn.title = "Delete";
            delBtn.onclick = (e) => {
                e.stopPropagation();
                if (isGenerating && activeStreamSessionId === id) {
                    alert("Cannot delete chat while a response is generating.");
                    return;
                }
                if (confirm("Delete this chat permanently?")) {
                    delete allSessions[id];
                    localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
                    
                    if (currentSessionId === id) {
                        const remainingIds = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);
                        if (remainingIds.length > 0) {
                            loadSession(remainingIds[0]);
                        } else {
                            createNewChat();
                        }
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
        updateStatsDisplay();

        activeStreamBubbleElement = null;

        conversationHistory.forEach((message, index) => {
            if (index === 0) return;
            
            let bubble;
            if (message.role === 'model') {
                const isThisStreaming = (isGenerating && activeStreamSessionId === currentSessionId && message === activeStreamMessageObj);
                bubble = addMessage(message, 'model', false, isThisStreaming);
                
                if (isThisStreaming) {
                    activeStreamBubbleElement = bubble;
                    if (message.parts[0].text === '') {
                        bubble.classList.add('loading-bubble');
                        bubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
                    }
                }
            } else if (message.role === 'user') {
                addMessage(message, 'user', false);
            }
        });
        scrollToBottom(false);
        updateRegenerateButton();
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isGenerating) return; 

        const userMessageText = userInput.value.trim();
        if (!userMessageText && !uploadedFileState) return;

        if (!userApiKey.trim()) {
            alert("API Key is missing. Please open the settings (+) menu and add your Gemini API Key.");
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
        
        const targetSessionId = currentSessionId;
        
        saveSpecificSession(targetSessionId);
        if (conversationHistory.length === 2 && !allSessions[targetSessionId]?.manualTitle) { 
            renderHistoryList(); 
        }
        
        userInput.value = '';
        resizeTextarea(); // Reset height instantly
        uploadedFileState = null;
        renderFilePreview();
        
        isGenerating = true;
        setFormDisabled(true);
        activeStreamSessionId = targetSessionId;
        activeStreamMessageObj = { role: 'model', parts:[{ text: '' }], timestamp: new Date().toISOString() };
        
        allSessions[targetSessionId].history.push(activeStreamMessageObj);
        saveSpecificSession(targetSessionId);

        const thinkingMessageBubble = addMessage(activeStreamMessageObj, 'model', true, true);
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        activeStreamBubbleElement = thinkingMessageBubble;

        await callInsecureApi(targetSessionId, activeStreamMessageObj);
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

    function formatTimestamp(isoString) {
        if (!isoString) return '';
        const msgDate = new Date(isoString);
        const now = new Date();
        const diffHours = (now - msgDate) / (1000 * 60 * 60);
        if (diffHours > 12) { return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
        else { return msgDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    }

    async function callInsecureApi(targetSessionId, targetMessageObj) {
        let messagesToSend = allSessions[targetSessionId].history.slice(0, -1); 
        if (historyLimit > 0 && messagesToSend.length > historyLimit + 1) {
            messagesToSend =[messagesToSend[0], ...messagesToSend.slice(-historyLimit)];
        }
        const historyForAPI = messagesToSend.map(msg => { const { fileName, timestamp, isError, ...apiMsg } = msg; return apiMsg; });
        
        let selectedModel = getCustomSelectValue('custom-model-select');
        const API_URL = `${BASE_API_URL}${selectedModel}:streamGenerateContent?alt=sse&key=${userApiKey}`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: historyForAPI })
            });
            
            if (!response.ok) { 
                const errorData = await response.json(); 
                throw new Error(errorData.error?.message || 'API request failed'); 
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let finalUsageMetadata = null;

            if (currentSessionId === targetSessionId && activeStreamBubbleElement && targetMessageObj.parts[0].text === '') {
                activeStreamBubbleElement.classList.remove('loading-bubble');
                activeStreamBubbleElement.innerHTML = '';
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop(); 

                let domNeedsUpdate = false;

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6).trim();
                        if (dataStr === '[DONE]') continue;
                        if (!dataStr) continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                                const chunkText = data.candidates[0].content.parts[0].text;
                                targetMessageObj.parts[0].text += chunkText;
                                domNeedsUpdate = true;
                            }
                            if (data.usageMetadata) {
                                finalUsageMetadata = data.usageMetadata;
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk', e);
                        }
                    }
                }
                
                if (domNeedsUpdate && currentSessionId === targetSessionId && activeStreamBubbleElement) {
                    activeStreamBubbleElement.classList.remove('loading-bubble');
                    activeStreamBubbleElement.innerHTML = DOMPurify.sanitize(marked.parse(targetMessageObj.parts[0].text));
                    scrollToBottom(false);
                }
            }
            
            if (finalUsageMetadata) {
                let requestTokens = finalUsageMetadata.totalTokenCount || ((finalUsageMetadata.promptTokenCount || 0) + (finalUsageMetadata.candidatesTokenCount || 0));
                allSessions[targetSessionId].tokens += requestTokens;
                if (currentSessionId === targetSessionId) {
                    cumulativeTokens = allSessions[targetSessionId].tokens;
                    updateStatsDisplay();
                }
            }
            
            saveSpecificSession(targetSessionId);
            
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) {
                addMessageActions(activeStreamBubbleElement.parentElement, activeStreamBubbleElement, targetMessageObj.parts[0].text);
            }

        } catch (error) {
            targetMessageObj.isError = true;
            targetMessageObj.parts[0].text = error.message || "An unexpected error occurred.";
            
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) {
                activeStreamBubbleElement.classList.remove('loading-bubble');
                activeStreamBubbleElement.classList.add('error-bubble');
                activeStreamBubbleElement.innerHTML = `<strong>⚠️ Generation Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(targetMessageObj.parts[0].text)}</div>`;
                addMessageActions(activeStreamBubbleElement.parentElement, activeStreamBubbleElement, targetMessageObj.parts[0].text);
            }
            
            // Anti-Bricking Logic: Rip out corrupt files on error
            const lastMsg = allSessions[targetSessionId].history[allSessions[targetSessionId].history.length - 2];
            if (lastMsg && lastMsg.role === 'user' && lastMsg.parts.some(p => p.inlineData)) {
                lastMsg.parts = lastMsg.parts.filter(p => !p.inlineData);
                lastMsg.parts.push({ text: "\n\n*(Note: Attached file was stripped from memory due to a generation error)*" });
            }

            saveSpecificSession(targetSessionId);
        } finally {
            isGenerating = false;
            activeStreamSessionId = null;
            activeStreamMessageObj = null;
            activeStreamBubbleElement = null;
            
            setFormDisabled(false);
            if (currentSessionId === targetSessionId && !/Mobi|Android/i.test(navigator.userAgent)) { 
                userInput.focus(); 
            }
            updateRegenerateButton();
        }
    }
    
    function setFormDisabled(disabled) { 
        userInput.disabled = disabled; 
        sendButton.disabled = disabled; 
        plusSettingsBtn.disabled = disabled; 
    }

    function addMessage(messageData, sender, shouldScroll = true, isStreaming = false) {
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
            if (textContentForTTS !== undefined) {
                if (messageData.isError) {
                    bubble.classList.add('error-bubble');
                    bubble.innerHTML = `<strong>⚠️ Generation Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(textContentForTTS)}</div>`;
                } else {
                    bubble.innerHTML = DOMPurify.sanitize(marked.parse(textContentForTTS || ''));
                }
            }
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
        
        if (textContentForTTS && !isStreaming) addMessageActions(wrapper, bubble, textContentForTTS);
        return bubble;
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
        if (removeOnly || isGenerating) return; 
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

    function stripMarkdown(mdText) {
        const temp = document.createElement('div');
        temp.innerHTML = DOMPurify.sanitize(marked.parse(mdText));
        return temp.textContent || temp.innerText || "";
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
            
            const cleanText = stripMarkdown(textToCopy);
            currentUtterance = new SpeechSynthesisUtterance(cleanText);
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
        if (isGenerating) return; 
        
        updateRegenerateButton(true);

        window.speechSynthesis.cancel();
        if (currentSpeakingButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; currentSpeakingButton.parentElement.querySelector('.custom-tooltip').textContent = 'Listen'; currentSpeakingButton = null; }

        conversationHistory.pop();
        const lastUserMsgInHistory = conversationHistory.pop();
        
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);
        if (scrollAnchor.previousElementSibling) chatLog.removeChild(scrollAnchor.previousElementSibling);

        addMessage(lastUserMsgInHistory, 'user');
        conversationHistory.push(lastUserMsgInHistory);
        
        const targetSessionId = currentSessionId;
        saveSpecificSession(targetSessionId);

        isGenerating = true;
        setFormDisabled(true);
        activeStreamSessionId = targetSessionId;
        activeStreamMessageObj = { role: 'model', parts:[{ text: '' }], timestamp: new Date().toISOString() };
        
        allSessions[targetSessionId].history.push(activeStreamMessageObj);
        saveSpecificSession(targetSessionId);

        const thinkingMessageBubble = addMessage(activeStreamMessageObj, 'model', true, true);
        thinkingMessageBubble.classList.add('loading-bubble');
        thinkingMessageBubble.innerHTML = `<div class="loading-animation"><div></div><div></div><div></div></div>`;
        activeStreamBubbleElement = thinkingMessageBubble;

        await callInsecureApi(targetSessionId, activeStreamMessageObj);
    }
    
    loadSettings();
    loadAllSessions();
});
