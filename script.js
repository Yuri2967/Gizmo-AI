document.addEventListener('DOMContentLoaded', () => {

    const options = { throwOnError: false };
    if (window.markedKatex) marked.use(window.markedKatex(options));

    const body = document.body;
    const userInput = document.getElementById('chat-query');
    const chatLog = document.getElementById('chat-log');
    const sendButton = document.getElementById('send-btn');
    const totalTokensDisplay = document.getElementById('total-tokens-value');
    let scrollAnchor = document.getElementById('scroll-anchor');
    
    const fileInput = document.getElementById('file-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const plusSettingsBtn = document.getElementById('plus-settings-btn');
    const menuAddFilesBtn = document.getElementById('menu-add-files-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const toggleThemeButton = document.getElementById('toggle-theme-button');
    const webSearchToggle = document.getElementById('web-search-toggle');
    const apiKeyInput = document.getElementById('app-sec-key');
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

    const globalModalOverlay = document.getElementById('global-modal-overlay');
    const apiKeyPopup = document.getElementById('api-key-popup');
    const closeApiPopupBtn = document.getElementById('close-api-popup');
    const statsTriggerBtn = document.getElementById('stats-trigger');
    const statsPopup = document.getElementById('stats-popup');
    const closeStatsPopupBtn = document.getElementById('close-stats-popup');
    
    const confirmPopup = document.getElementById('confirm-popup');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMsg = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes-btn');
    const confirmNoBtn = document.getElementById('confirm-no-btn');

    const sidebarResizer = document.getElementById('sidebar-resizer');
    let isResizing = false;

    let userApiKey = '';
    let historyLimit = 10; 
    let currentSessionId = Date.now().toString();
    let allSessions = {}; 

    let isGenerating = false;
    let activeStreamSessionId = null;
    let activeStreamMessageObj = null;
    let activeStreamBubbleElement = null;

    const SYSTEM_INSTRUCTIONS = "You are Gizmo, a helpful, intelligent, and versatile AI assistant. You respond in Markdown format. Adapt your response length to the context. Use commas for decimals below zero and use metric units. Always use standard LaTeX for math and chemical formulas (e.g., $H_2O$, $CO_2$, $$\\sqrt{x}$$). Do not use plain text formatting for equations. UNDER NO CIRCUMSTANCES output raw URLs or markdown hyperlinks (like [Title](url)) in your text response. You must act as if the UI automatically handles all links and references. Providing links in the text breaks the system. When using web search, link reading, or document parsing, synthesize information from the provided context sources to provide a comprehensive, up-to-date answer.";
    const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
    
    let cumulativeTokens = 0;
    let lastUserMessage = null;
    let uploadedFileState = null;
    let currentSpeakingButton = null;
    let currentUtterance = null; 

    const MODEL_NAMES = {
        'gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite',
        'gemma-3-27b-it': 'Gemma 3 27B',
        'gemma-3-12b-it': 'Gemma 3 12B',
        'gemma-3-4b-it': 'Gemma 3 4B',
        'gemma-3-1b-it': 'Gemma 3 1B'
    };

    const MODEL_MULTIPLIERS = {
        'gemini-3.1-flash-lite-preview': 0.5,
        'gemma-3-27b-it': 2.2,
        'gemma-3-12b-it': 1.0,
        'gemma-3-4b-it': 0.3,
        'gemma-3-1b-it': 0.08
    };

    const COPY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const LISTEN_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.81 5 3.54 5 6.71s-2.11 5.9-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    const STOP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2z"/></svg>`;
    const REGENERATE_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
    const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

    sidebarResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        let newWidth = e.clientX;
        if (newWidth < 200) newWidth = 200;
        if (newWidth > 600) newWidth = 600;
        document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    });
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            localStorage.setItem('sidebarWidth', document.documentElement.style.getPropertyValue('--sidebar-width'));
        }
    });

    window.toggleSources = function(msgId) {
        const session = allSessions[currentSessionId];
        if (session && session.nodes[msgId]) {
            session.nodes[msgId].sourcesExpanded = !session.nodes[msgId].sourcesExpanded;
            saveSpecificSession(currentSessionId);
            const wrapper = document.getElementById(`sources-wrapper-${msgId}`);
            if (wrapper) wrapper.outerHTML = renderSources(session.nodes[msgId].sources, msgId, session.nodes[msgId].sourcesExpanded);
        }
    };

    chatLog.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a && a.href && !a.href.startsWith('javascript:')) {
            e.preventDefault();
            const url = a.href;
            showConfirmPopup("External Link", `You are about to visit an external website. Do you want to continue?\n\n${url}`, () => {
                window.open(url, '_blank', 'noopener,noreferrer');
            }, { yesText: 'Proceed', yesBg: '#FFFFFF', yesColor: '#000000' });
        }
    });

    function createNode(role, parts, parentId, extra = {}) {
        return {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2,9),
            role, parts, parentId, children:[], timestamp: new Date().toISOString(), ...extra
        };
    }

    function migrateToTree(session) {
        if (session.history) {
            session.nodes = {};
            let lastId = null;
            session.history.forEach((msg) => {
                let node = createNode(msg.role, msg.parts, lastId, { model: msg.model, isError: msg.isError, fileName: msg.fileName, sources: msg.sources });
                node.timestamp = msg.timestamp || node.timestamp; 
                session.nodes[node.id] = node;
                if (lastId && session.nodes[lastId]) session.nodes[lastId].children.push(node.id);
                lastId = node.id;
            });
            session.currentLeafId = lastId;
            delete session.history;
        }
    }

    function getActivePath(nodes, leafId) {
        let path =[];
        let curr = leafId;
        while (curr && nodes[curr]) {
            path.unshift(nodes[curr]);
            curr = nodes[curr].parentId;
        }
        return path;
    }

    function switchBranch(parentId, newIndex) {
        const nodes = allSessions[currentSessionId].nodes;
        const parent = nodes[parentId];
        if (!parent || !parent.children[newIndex]) return;
        
        let leaf = parent.children[newIndex];
        while (nodes[leaf].children && nodes[leaf].children.length > 0) {
            leaf = nodes[leaf].children[nodes[leaf].children.length - 1];
        }
        allSessions[currentSessionId].currentLeafId = leaf;
        saveSpecificSession(currentSessionId);
        renderChatLog();
    }

    function renderSources(sources, msgId, isExpanded = false) {
        if (!sources || sources.length === 0) return '';
        let html = `<div class="source-grounding-container" id="sources-wrapper-${msgId}">`;
        
        const getHost = (uri) => { try { return new URL(uri).hostname.replace(/^www\./, ''); } catch(e) { return "Source"; } };
        const getIcon = (host) => `<img src="https://www.google.com/s2/favicons?domain=${host}&sz=32" width="16" height="16" onerror="this.style.display='none'" />`;
        
        let s0 = sources[0];
        let host0 = getHost(s0.uri);
        
        html += `<div class="sources-top-row">`;
        html += `<a href="${s0.uri}" class="compact-main-chip" title="${s0.title || s0.uri}">${getIcon(host0)}<span class="truncate">${s0.title || host0}</span></a>`;
        
        if (sources.length > 1) {
            if (!isExpanded) {
                html += `<div class="sources-toggle-pill" onclick="window.toggleSources('${msgId}')">`;
                html += `<div class="source-icon-stack">`;
                let maxIcons = Math.min(sources.length, 4); 
                for(let i = 1; i < maxIcons; i++) {
                    html += `<div class="stacked-icon" style="z-index: ${10-i};">${getIcon(getHost(sources[i].uri))}</div>`;
                }
                if (sources.length > 4) {
                    html += `<div class="stacked-more">+${sources.length - 4}</div>`;
                }
                html += `</div>`;
                html += `<div class="expand-chevron"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg></div>`;
                html += `</div>`;
            } else {
                html += `<button class="sources-toggle-pill close-mode" onclick="window.toggleSources('${msgId}')">Close <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M7 14l5-5 5 5z"/></svg></button>`;
            }
        }
        html += `</div>`;
        
        if (isExpanded && sources.length > 1) {
            html += `<div class="expanded-list">`;
            for(let i = 1; i < sources.length; i++) {
                let s = sources[i];
                let host = getHost(s.uri);
                html += `<a href="${s.uri}" class="expanded-source-chip" title="${s.title || s.uri}">${getIcon(host)}<span class="truncate">${s.title || host}</span></a>`;
            }
            html += `</div>`;
        }
        
        html += `</div>`;
        return html;
    }

    function renderMarkdownAndMath(rawText) {
        let text = rawText || "";
        text = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        text = text.replace(/\\\(([\s\S]+?)\\\)/g, '$$$1$$');
        text = text.replace(/\\\[([\s\S]+?)\\\]/g, '$$$$$1$$$$');

        const mathBlocks =[];
        function saveMath(math, isBlock) {
            const id = `KXTZPH${mathBlocks.length}ENDKXTZ`;
            mathBlocks.push({ id, math, isBlock });
            return id;
        }

        text = text.replace(/(^|[^\\])\$\$([\s\S]+?)\$\$/g, (m, pre, math) => pre + saveMath(math, true));
        text = text.replace(/(^|[^\\])\$(?!\s)([^$\n]+?)(?<!\s)\$/g, (m, pre, math) => pre + saveMath(math, false));

        let html = marked.parse(text);

        mathBlocks.forEach(block => {
            let rendered;
            try { 
                rendered = katex.renderToString(block.math, { displayMode: block.isBlock, throwOnError: true }); 
            } catch (e) { 
                const escapedText = block.math.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                rendered = `<span style="font-family: inherit;">${escapedText}</span>`; 
            }
            html = html.split(block.id).join(rendered);
        });

        return DOMPurify.sanitize(html, {
            ADD_TAGS:['math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'ms', 'mspace', 'msqrt', 'mroot', 'mfrac', 'merror', 'mpadded', 'mphantom', 'mfenced', 'mstyle', 'maligngroup', 'malignmark', 'mlabeledtr', 'mstack', 'mth', 'annotation', 'annotation-xml', 'svg', 'path', 'line', 'g'],
            ADD_ATTR:['display', 'xmlns', 'class', 'style', 'aria-hidden', 'd', 'viewBox', 'preserveAspectRatio', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke', 'fill', 'x1', 'y1', 'x2', 'y2', 'height', 'width', 'transform']
        });
    }

    function openModal(src) { enlargedImage.src = src; imageModal.classList.remove('hidden'); }
    function closeModal() { imageModal.classList.add('hidden'); setTimeout(() => { enlargedImage.src = ''; }, 250); }
    closeModalBtn.addEventListener('click', closeModal);
    imageModal.addEventListener('click', (e) => { if (e.target === imageModal) closeModal(); });
    
    function showPopup(popupEl) {
        globalModalOverlay.classList.remove('hidden');
        document.querySelectorAll('.glass-popup').forEach(p => p.classList.add('hidden'));
        popupEl.classList.remove('hidden');
    }
    function hidePopups() { globalModalOverlay.classList.add('hidden'); }
    
    closeApiPopupBtn.addEventListener('click', hidePopups);
    closeStatsPopupBtn.addEventListener('click', hidePopups);
    globalModalOverlay.addEventListener('click', (e) => { if (e.target === globalModalOverlay) hidePopups(); });

    function showConfirmPopup(title, message, onConfirm, options = {}) {
        confirmTitle.textContent = title;
        confirmMsg.textContent = message;
        confirmNoBtn.onclick = hidePopups;
        
        let btn = document.getElementById('confirm-yes-btn');
        let newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.textContent = options.yesText || 'Delete';
        newBtn.style.background = options.yesBg || '#EF4444';
        newBtn.style.color = options.yesColor || '#FFFFFF';

        newBtn.addEventListener('click', () => {
            hidePopups();
            if(onConfirm) onConfirm();
        });
        showPopup(confirmPopup);
    }

    function formatUnit(val, baseUnit) {
        if (val >= 1000) {
            let scaled = val / 1000;
            let str = scaled.toFixed(1).replace('.', ',');
            if (str.endsWith(',0')) str = str.slice(0, -2);
            return { value: str, unit: baseUnit === 'ml' ? 'L' : 'kWh' };
        } else {
            let str = "";
            if (val === 0) str = "0";
            else if (val >= 1) str = Math.round(val).toString();
            else {
                let sig = Math.ceil(-Math.log10(val));
                if (sig < 1) sig = 1;
                str = val.toFixed(sig).replace('.', ',');
            }
            return { value: str, unit: baseUnit };
        }
    }

    statsTriggerBtn.addEventListener('click', () => {
        let selectedModel = getCustomSelectValue('custom-model-select');
        let multiplier = MODEL_MULTIPLIERS[selectedModel] || 1.0;
        let powerWh = cumulativeTokens * 0.001 * multiplier;
        let waterMl = cumulativeTokens * 0.01 * multiplier;
        
        let smartphoneCharges = powerWh / 15; 
        let waterBottles = waterMl / 500; 

        let pFormat = formatUnit(powerWh, 'Wh');
        let wFormat = formatUnit(waterMl, 'ml');

        document.getElementById('popup-power-val').textContent = pFormat.value + ' ' + pFormat.unit;
        document.getElementById('popup-water-val').textContent = wFormat.value + ' ' + wFormat.unit;
        
        let powerRefStr;
        if (smartphoneCharges < 0.1) powerRefStr = `< 10% of a smartphone charge`;
        else if (smartphoneCharges < 1) powerRefStr = `~${Math.round(smartphoneCharges * 100)}% of a smartphone charge`;
        else powerRefStr = `~${Math.round(smartphoneCharges)} smartphone charge${smartphoneCharges >= 1.5 ? 's' : ''}`;

        let waterRefStr;
        if (waterBottles < 0.01) waterRefStr = `a few drops of water`;
        else if (waterBottles < 0.1) waterRefStr = `a sip of water`;
        else if (waterBottles < 1) waterRefStr = `~${Math.round(waterBottles * 100)}% of a water bottle (500ml)`;
        else waterRefStr = `~${waterBottles.toFixed(1).replace('.0', '').replace('.', ',')} bottles of water (500ml)`;

        document.getElementById('stats-ref-power').textContent = powerRefStr;
        document.getElementById('stats-ref-water').textContent = waterRefStr;

        showPopup(statsPopup);
    });

    webSearchToggle.addEventListener('click', () => {
        let currentStatus = allSessions[currentSessionId].webSearch || false;
        allSessions[currentSessionId].webSearch = !currentStatus;
        saveSpecificSession(currentSessionId);
        updateWebSearchUI();
    });

    function updateWebSearchUI() {
        let isEnabled = allSessions[currentSessionId]?.webSearch || false;
        if (isEnabled) {
            webSearchToggle.classList.remove('search-disabled');
        } else {
            webSearchToggle.classList.add('search-disabled');
        }
    }

    function applyTheme(theme) { document.body.classList.toggle('dark-mode', theme === 'dark'); }

    function initCustomSelect(selectId, onSelect) {
        const selectContainer = document.getElementById(selectId);
        const trigger = selectContainer.querySelector('.select-trigger');
        const textSpan = trigger.querySelector('span');
        const options = selectContainer.querySelectorAll('.option');

        trigger.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 && e.type !== 'touchstart') return; 
            e.preventDefault(); e.stopPropagation();
            const isOpen = selectContainer.classList.contains('open');
            document.querySelectorAll('.custom-select').forEach(el => el.classList.remove('open'));
            if (!isOpen) selectContainer.classList.add('open');
        });

        options.forEach(option => {
            option.addEventListener('pointerup', (e) => {
                if (e.button !== 0 && e.type !== 'touchend') return;
                e.preventDefault(); e.stopPropagation();
                const value = option.getAttribute('data-value');
                selectContainer.setAttribute('data-value', value);
                textSpan.textContent = option.textContent;
                selectContainer.classList.remove('open');
                if (onSelect) onSelect(value);
            });
        });
    }

    function getCustomSelectValue(selectId) { return document.getElementById(selectId).getAttribute('data-value'); }
    function setCustomSelectValue(selectId, val) {
        const container = document.getElementById(selectId);
        if (!container) return;
        container.setAttribute('data-value', val);
        const opt = container.querySelector(`.option[data-value="${val}"]`);
        if (opt) container.querySelector('.select-trigger span').textContent = opt.textContent;
    }

    function loadSettings() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('k')) {
            const keyFromUrl = urlParams.get('k');
            if (keyFromUrl && keyFromUrl.trim() !== '') {
                userApiKey = keyFromUrl.trim();
                localStorage.setItem('userApiKey', userApiKey);
            }
            urlParams.delete('k');
            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, document.title, newUrl);
        }

        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) { document.documentElement.style.setProperty('--sidebar-width', savedWidth); }

        let savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
            savedTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            localStorage.setItem('theme', savedTheme);
        }
        applyTheme(savedTheme);

        userApiKey = localStorage.getItem('userApiKey') || '';
        apiKeyInput.value = userApiKey;
        
        if (!userApiKey.trim()) setTimeout(() => showPopup(apiKeyPopup), 500);

        const globalModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        setCustomSelectValue('custom-model-select', globalModel);
        
        initCustomSelect('custom-model-select', (val) => {
            localStorage.setItem('selectedModel', val);
            if (allSessions[currentSessionId]) {
                allSessions[currentSessionId].model = val;
                saveSpecificSession(currentSessionId);
            }
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

    function resizeTextarea() {
        userInput.style.height = '24px'; 
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    }
    userInput.addEventListener('input', resizeTextarea);
    resizeTextarea();

    function scrollToBottom(smooth = true) {
        if (!chatContainer) return;
        requestAnimationFrame(() => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); });
    }

    function setLoadingState(el, text) {
        if (el) {
            el.innerHTML = `
                <div class="loading-animation"><div></div><div></div><div></div></div>
                ${text ? `<div class="loading-text">${text}</div>` : ''}
            `;
        }
    }

    function handleSubmission(forceText = null) {
        if (isGenerating) return; 
        const txt = forceText !== null ? forceText : userInput.value.trim();
        if (!txt && !uploadedFileState) return;
        if (!userApiKey.trim()) { showPopup(apiKeyPopup); return; }
        
        welcomeScreen.classList.add('hidden'); updateRegenerateButton(true); 
        
        const parts =[];
        if (txt) {
            parts.push({ text: txt });
        } else {
            parts.push({ text: '' });
        }

        if (uploadedFileState) {
            if (uploadedFileState.type === 'parsed_text') {
                parts.push({ text: `\n\n--- Document Content: ${uploadedFileState.name} ---\n${uploadedFileState.data}\n---` });
            } else {
                parts.push({ inlineData: { mimeType: uploadedFileState.mimeType, data: uploadedFileState.data } });
            }
        }
        
        let userNode = createNode('user', parts, allSessions[currentSessionId].currentLeafId, { fileName: uploadedFileState?.name });
        allSessions[currentSessionId].nodes[userNode.id] = userNode;
        if (userNode.parentId && allSessions[currentSessionId].nodes[userNode.parentId]) {
            allSessions[currentSessionId].nodes[userNode.parentId].children.push(userNode.id);
        }
        allSessions[currentSessionId].currentLeafId = userNode.id;
        
        addMessage(userNode, 'user');
        saveSpecificSession(currentSessionId);
        
        let path = getActivePath(allSessions[currentSessionId].nodes, currentSessionId);
        if (path.length === 2 && !allSessions[currentSessionId].manualTitle) renderHistoryList(); 
        
        userInput.value = ''; resizeTextarea(); uploadedFileState = null; renderFilePreview();
        isGenerating = true; setFormDisabled(true); activeStreamSessionId = currentSessionId;
        
        const selectedModel = getCustomSelectValue('custom-model-select');
        activeStreamMessageObj = createNode('model',[{text: ''}], userNode.id, { model: selectedModel });
        
        allSessions[currentSessionId].nodes[activeStreamMessageObj.id] = activeStreamMessageObj;
        allSessions[currentSessionId].nodes[userNode.id].children.push(activeStreamMessageObj.id);
        allSessions[currentSessionId].currentLeafId = activeStreamMessageObj.id;
        saveSpecificSession(currentSessionId);
        
        const wrapper = addMessage(activeStreamMessageObj, 'model', true, true);
        activeStreamBubbleElement = wrapper.querySelector('.message-bubble');
        activeStreamBubbleElement.classList.add('loading-bubble');
        setLoadingState(activeStreamBubbleElement);
        
        callInsecureApi(currentSessionId, activeStreamMessageObj);
    }

    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleSubmission();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { 
            e.preventDefault(); 
            handleSubmission(); 
        }
    });

    userInput.addEventListener('focus', () => { setTimeout(() => { body.classList.add('input-focus-mode'); scrollToBottom(); }, 100); });
    userInput.addEventListener('blur', () => { body.classList.remove('input-focus-mode'); });
    
    plusSettingsBtn.addEventListener('pointerdown', (event) => { 
        if (event.button !== 0 && event.type !== 'touchstart') return;
        event.preventDefault(); event.stopPropagation();
        settingsMenu.classList.toggle('visible'); 
    });

    menuAddFilesBtn.addEventListener('pointerup', (e) => {
        if (e.button !== 0 && e.type !== 'touchend') return;
        e.preventDefault(); fileInput.click(); settingsMenu.classList.remove('visible');
    });

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            body.classList.toggle('sidebar-open'); sidebarOverlay.classList.toggle('active');
        } else body.classList.toggle('sidebar-closed');
    }

    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    menuBtn.addEventListener('click', toggleSidebar);
    
    newChatBtn.addEventListener('click', createNewChat);
    
    sidebarOverlay.addEventListener('click', () => { body.classList.remove('sidebar-open'); sidebarOverlay.classList.remove('active'); });
    
    document.addEventListener('pointerdown', (event) => {
        if (settingsMenu.classList.contains('visible') && !settingsMenu.contains(event.target) && !plusSettingsBtn.contains(event.target)) {
            settingsMenu.classList.remove('visible');
        }
        if (!event.target.closest('.custom-select')) document.querySelectorAll('.custom-select').forEach(sel => sel.classList.remove('open'));
    });
    
    toggleThemeButton.addEventListener('pointerup', (e) => {
        if (e.button !== 0 && e.type !== 'touchend') return;
        const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme); applyTheme(newTheme);
    });

    apiKeyInput.addEventListener('change', () => { userApiKey = apiKeyInput.value.trim(); localStorage.setItem('userApiKey', userApiKey); });

    function handleFileUpload(file) {
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        const isDocx = file.name.endsWith('.docx');
        const isText = file.name.match(/\.(txt|md|csv|json|js|css|html|py|c|cpp|java)$/i) || file.type.startsWith('text/');
        
        if (!isImage && !isPdf && !isDocx && !isText) { alert(`Unsupported file format.`); return; }
        if (file.size > 15 * 1024 * 1024) { alert('File limit is 15MB.'); return; }

        if (isPdf && window.pdfjsLib) {
            const reader = new FileReader();
            reader.onload = async function() {
                const typedarray = new Uint8Array(this.result);
                try {
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + "\n";
                    }
                    uploadedFileState = { type: 'parsed_text', data: fullText, name: file.name, mimeType: file.type };
                    renderFilePreview();
                } catch(e) { alert("Error parsing PDF: " + e.message); }
            };
            reader.readAsArrayBuffer(file);
            fileInput.value = '';
            return;
        }

        if (isDocx && window.mammoth) {
            const reader = new FileReader();
            reader.onload = async function(event) {
                const arrayBuffer = event.target.result;
                try {
                    const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
                    uploadedFileState = { type: 'parsed_text', data: result.value, name: file.name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
                    renderFilePreview();
                } catch(e) { alert("Error parsing DOCX: " + e.message); }
            };
            reader.readAsArrayBuffer(file);
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => { alert('Error reading file.'); };
        reader.onloadend = () => {
            const b64 = reader.result.split(',')[1];
            uploadedFileState = { type: 'base64', mimeType: file.type || 'text/plain', data: b64, name: file.name };
            renderFilePreview();
        };
        reader.readAsDataURL(file); fileInput.value = '';
    }

    fileInput.addEventListener('change', (event) => handleFileUpload(event.target.files[0]));
    userInput.addEventListener('paste', (e) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) { e.preventDefault(); handleFileUpload(e.clipboardData.files[0]); }
    });
    body.addEventListener('dragover', (e) => { e.preventDefault(); });
    body.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files[0]);
    });

    function renderFilePreview() {
        filePreviewContainer.innerHTML = '';
        if (uploadedFileState) {
            const item = document.createElement('div'); item.className = 'file-preview-item';
            const span = document.createElement('span'); span.textContent = uploadedFileState.name;
            const btn = document.createElement('button'); btn.type = 'button'; btn.innerHTML = '×';
            btn.onclick = () => { uploadedFileState = null; renderFilePreview(); };
            item.appendChild(span); item.appendChild(btn);
            filePreviewContainer.appendChild(item);
        }
    }

    function saveSpecificSession(id) {
        if (!allSessions[id]) return;
        let title = "New Chat";
        const path = getActivePath(allSessions[id].nodes, allSessions[id].currentLeafId);
        const firstUserMsg = path.find((m, i) => m.role === 'user' && i > 0);
        if (firstUserMsg) {
            const p = firstUserMsg.parts[0];
            title = p && p.text ? p.text.substring(0, 30) : "Document Chat";
        }
        if (allSessions[id].manualTitle) title = allSessions[id].manualTitle;
        allSessions[id].title = title;
        allSessions[id].timestamp = Date.now();
        localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
        if (id === currentSessionId) localStorage.setItem('gizmo_current_id', currentSessionId);
    }

    function createNewChat() {
        currentSessionId = Date.now().toString();
        cumulativeTokens = 0;
        const defaultModel = localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
        
        let rootNode = createNode('user',[{text: SYSTEM_INSTRUCTIONS}], null);
        
        allSessions[currentSessionId] = {
            id: currentSessionId, nodes: {[rootNode.id]: rootNode }, currentLeafId: rootNode.id, tokens: cumulativeTokens,
            title: "New Chat", manualTitle: null, model: defaultModel, webSearch: false, timestamp: Date.now()
        };
        
        setCustomSelectValue('custom-model-select', defaultModel);
        updateWebSearchUI();
        
        renderChatLog(); saveSpecificSession(currentSessionId); renderHistoryList();
        welcomeScreen.classList.remove('hidden');
        setFormDisabled(isGenerating); 
        
        if (!/Mobi|Android/i.test(navigator.userAgent)) setTimeout(() => userInput.focus(), 50);
        if (window.innerWidth <= 768) { body.classList.remove('sidebar-open'); sidebarOverlay.classList.remove('active'); }
    }

    function loadSession(id) {
        if (allSessions[id]) {
            currentSessionId = id;
            migrateToTree(allSessions[id]); 
            cumulativeTokens = allSessions[id].tokens;
            const sessionModel = allSessions[id].model || localStorage.getItem('selectedModel') || 'gemini-3.1-flash-lite-preview';
            setCustomSelectValue('custom-model-select', sessionModel);
            
            updateWebSearchUI();
            
            const path = getActivePath(allSessions[id].nodes, allSessions[id].currentLeafId);
            if (path.length > 1) welcomeScreen.classList.add('hidden');
            else welcomeScreen.classList.remove('hidden');
            
            renderChatLog(); renderHistoryList();
            localStorage.setItem('gizmo_current_id', currentSessionId);
            setFormDisabled(isGenerating); 
            
            if (!/Mobi|Android/i.test(navigator.userAgent)) setTimeout(() => userInput.focus(), 50);
            if (window.innerWidth <= 768) { body.classList.remove('sidebar-open'); sidebarOverlay.classList.remove('active'); }
        }
    }

    function renderHistoryList() {
        historyList.innerHTML = '';
        const sortedIds = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);
        sortedIds.forEach(id => {
            const session = allSessions[id];
            const item = document.createElement('div'); item.className = `history-item-container ${id === currentSessionId ? 'active' : ''}`;
            item.onclick = () => loadSession(id);
            const title = document.createElement('span'); title.className = 'history-item-title'; title.textContent = session.title || "New Chat";
            const actions = document.createElement('div'); actions.className = 'history-item-actions';
            
            const edit = document.createElement('button'); edit.innerHTML = EDIT_ICON;
            edit.onclick = (e) => {
                e.stopPropagation();
                title.style.display = 'none';
                const input = document.createElement('input');
                input.type = 'text'; input.className = 'history-item-title-input'; input.value = session.title || "New Chat";
                input.onclick = (ev) => ev.stopPropagation();
                
                const finishEdit = () => {
                    const n = input.value.trim();
                    if (n) { allSessions[id].manualTitle = n; saveSpecificSession(id); }
                    renderHistoryList();
                };
                
                input.onkeydown = (ev) => {
                    if (ev.key === 'Enter') finishEdit();
                    if (ev.key === 'Escape') renderHistoryList();
                };
                input.onblur = finishEdit;
                item.insertBefore(input, actions);
                input.focus();
            };

            const del = document.createElement('button'); del.innerHTML = TRASH_ICON;
            del.onclick = (e) => {
                e.stopPropagation();
                if (isGenerating && activeStreamSessionId === id) return;
                showConfirmPopup("Delete Chat", "Are you sure you want to permanently delete this chat?", () => {
                    delete allSessions[id]; localStorage.setItem('gizmo_sessions', JSON.stringify(allSessions));
                    if (currentSessionId === id) {
                        const r = Object.keys(allSessions).sort((a, b) => allSessions[b].timestamp - allSessions[a].timestamp);
                        if (r.length > 0) loadSession(r[0]); else createNewChat();
                    } else renderHistoryList();
                });
            };

            actions.appendChild(edit); actions.appendChild(del);
            item.appendChild(title); item.appendChild(actions); historyList.appendChild(item);
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
        chatLog.appendChild(scrollAnchor); totalTokensDisplay.textContent = cumulativeTokens;
        activeStreamBubbleElement = null;
        
        let path = getActivePath(allSessions[currentSessionId].nodes, allSessions[currentSessionId].currentLeafId);

        path.forEach((message, index) => {
            if (index === 0) return; 
            if (message.role === 'model') {
                const stream = (isGenerating && activeStreamSessionId === currentSessionId && message.id === activeStreamMessageObj.id);
                const wrapper = addMessage(message, 'model', false, stream);
                if (stream) {
                    activeStreamBubbleElement = wrapper.querySelector('.message-bubble');
                    if (message.parts[0].text === '') {
                        activeStreamBubbleElement.classList.add('loading-bubble');
                        setLoadingState(activeStreamBubbleElement);
                    }
                }
            } else if (message.role === 'user') addMessage(message, 'user', false);
        });
        scrollToBottom(false); updateRegenerateButton();
    }

    async function callInsecureApi(targetSessionId, targetMsg) {
        let path = getActivePath(allSessions[targetSessionId].nodes, targetMsg.parentId);
        let msgs = path;
        
        if (historyLimit > 0 && msgs.length > historyLimit + 1) msgs =[msgs[0], ...msgs.slice(-historyLimit)];
        
        let activeModel = targetMsg.model || getCustomSelectValue('custom-model-select');
        
        const userMsgNode = allSessions[targetSessionId].nodes[targetMsg.parentId];
        const rawUserText = userMsgNode.parts[0]?.text || "";
        
        const autoSearchRegex = /\b(latest|news|price|pricing|today|current|now|who won|election|political|politics|2024|2025|2026|weather|update|vs)\b/i;
        const isWebSearchEnabled = allSessions[targetSessionId].webSearch || autoSearchRegex.test(rawUserText);

        const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)|([a-zA-Z0-9\-]+\.(?:com|org|net|io|edu|gov|co|uk|ai|app|dev|me|info)[^\s]*)/gi;
        let rawUrls = rawUserText.match(urlRegex);
        let extractedUrls =[];
        if (rawUrls) {
            rawUrls.forEach(u => {
                let clean = u.replace(/[.,;!?)$\]]+$/, ''); 
                if (!clean.startsWith('http')) clean = 'https://' + clean;
                if (!extractedUrls.includes(clean)) extractedUrls.push(clean);
            });
        }
        
        let scrapedText = "";
        if (!targetMsg.sources) targetMsg.sources =[];
        
        if (extractedUrls.length > 0) {
            setLoadingState(activeStreamBubbleElement, "Reading links...");
            for (let url of extractedUrls) {
                let pageText = null;
                let title = url;
                
                try {
                    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                    if (res.ok) {
                        const text = await res.text();
                        const doc = new DOMParser().parseFromString(text, 'text/html');
                        doc.querySelectorAll('script, style, nav, footer, iframe, img').forEach(el => el.remove());
                        pageText = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 15000);
                        title = doc.title || url;
                    }
                } catch(e) {}

                if (!pageText) {
                    try {
                        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                        if (res.ok) {
                            const text = await res.text();
                            const doc = new DOMParser().parseFromString(text, 'text/html');
                            doc.querySelectorAll('script, style, nav, footer, iframe, img').forEach(el => el.remove());
                            pageText = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 15000);
                            title = doc.title || url;
                        }
                    } catch(e) {}
                }

                if (!targetMsg.sources.find(s => s.uri === url)) {
                    targetMsg.sources.push({ uri: url, title: title });
                }

                if (pageText) {
                    scrapedText += `\n\n--- Content from ${url} ---\n${pageText}\n---`;
                } else {
                    scrapedText += `\n\n[System Note: Failed to securely access the contents of ${url}. Please explicitly inform the user that the website is unreachable due to security protections, and then provide an educated guess or estimation of what the content might be based on the URL structure and the prompt.]`;
                }
            }
        }

        if (isWebSearchEnabled) {
            setLoadingState(activeStreamBubbleElement, "Searching the web...");
            try {
                let maxResults = 5;
                if (rawUserText.length > 100 || /research|explain|history|difference|analysis|deep dive/i.test(rawUserText)) maxResults = 8;
                else if (rawUserText.length < 30 || /quick|simple|what is|who is/i.test(rawUserText)) maxResults = 3;

                let query = rawUserText.substring(0, 150);
                let searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
                
                let res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`);
                if (!res.ok) res = await fetch(`https://corsproxy.io/?${encodeURIComponent(searchUrl)}`);
                
                if (res.ok) {
                    const text = await res.text();
                    const doc = new DOMParser().parseFromString(text, 'text/html');
                    const results = doc.querySelectorAll('.result');
                    
                    for(let i = 0; i < Math.min(maxResults, results.length); i++) {
                        const snippetNode = results[i].querySelector('.result__snippet');
                        const titleNode = results[i].querySelector('.result__title .result__a');
                        if (snippetNode && titleNode) {
                            let snippet = snippetNode.innerText.trim();
                            let title = titleNode.innerText.trim();
                            let href = titleNode.getAttribute('href');
                            if (href && href.includes('uddg=')) {
                                href = decodeURIComponent(href.split('uddg=')[1].split('&')[0]);
                            }
                            if(href && !href.startsWith('/')) {
                                targetMsg.sources.push({ uri: href, title: title });
                                scrapedText += `\n\n--- Web Search Result: ${title} (${href}) ---\n${snippet}\n---`;
                            }
                        }
                    }
                }
            } catch(e) {
                console.log("Web Search failed", e);
            }
        }

        const apiMsgs = msgs.map((m, i) => { 
            const { fileName, timestamp, isError, model, id, parentId, children, sourcesExpanded, sources, ...rest } = m; 
            let modified = JSON.parse(JSON.stringify(rest));
            
            if (i === 0 && modified.parts[0] && modified.parts[0].text && modified.parts[0].text.startsWith("You are Gizmo")) {
                 const dateStr = new Date().toLocaleString();
                 const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                 modified.parts[0].text += `\n\n[System Context: The current date and time is ${dateStr}. The user's timezone is ${timeZone}. Tailor your answers and searches to this current context.]`;
            }

            if (m.id === userMsgNode.id && scrapedText) {
                let tp = modified.parts[0];
                if (tp) tp.text += "\n\n[Search Results Context:]\n" + scrapedText;
            }
            return modified; 
        });

        const url = `${BASE_API_URL}${activeModel}:streamGenerateContent?alt=sse&key=${userApiKey}`;
        const payload = { contents: apiMsgs };

        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) { 
                const err = await res.json(); 
                if (res.status === 429 || res.status === 403) throw new Error("API Limit Exceeded or Tool Not Allowed. If Web Search is enabled, turn it off and try again, or wait a minute.");
                throw new Error(err.error?.message || 'API failed'); 
            }
            const reader = res.body.getReader(); const decoder = new TextDecoder('utf-8');
            let buffer = ''; let finalUsage = null;
            let isFirstChunk = true;

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
                    if (isFirstChunk) {
                        activeStreamBubbleElement.classList.remove('loading-bubble');
                        isFirstChunk = false;
                    }
                    activeStreamBubbleElement.innerHTML = renderMarkdownAndMath(targetMsg.parts[0].text) + renderSources(targetMsg.sources, targetMsg.id, targetMsg.sourcesExpanded);
                    scrollToBottom(false);
                }
            }
            if (finalUsage) {
                let t = finalUsage.totalTokenCount || ((finalUsage.promptTokenCount || 0) + (finalUsage.candidatesTokenCount || 0));
                allSessions[targetSessionId].tokens += t;
                if (currentSessionId === targetSessionId) { totalTokensDisplay.textContent = allSessions[targetSessionId].tokens; }
            }
            saveSpecificSession(targetSessionId);
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) {
                addMessageActions(activeStreamBubbleElement.closest('.message-wrapper'), activeStreamBubbleElement, targetMsg.parts[0].text, 'model', targetMsg);
            }
        } catch (error) {
            targetMsg.isError = true; targetMsg.parts[0].text = error.message || "An error occurred.";
            if (currentSessionId === targetSessionId && activeStreamBubbleElement) {
                activeStreamBubbleElement.classList.remove('loading-bubble'); activeStreamBubbleElement.classList.add('error-bubble');
                activeStreamBubbleElement.innerHTML = `<strong>⚠️ Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(targetMsg.parts[0].text)}</div>`;
                addMessageActions(activeStreamBubbleElement.closest('.message-wrapper'), activeStreamBubbleElement, targetMsg.parts[0].text, 'model', targetMsg);
            }
            const parentUserNode = allSessions[targetSessionId].nodes[targetMsg.parentId];
            if (parentUserNode && parentUserNode.role === 'user' && parentUserNode.parts.some(p => p.inlineData)) {
                parentUserNode.parts = parentUserNode.parts.filter(p => !p.inlineData); 
                parentUserNode.parts.push({ text: "\n\n*(Note: File stripped)*" });
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
        const inner = document.createElement('div'); inner.className = 'message-inner';
        const bubble = document.createElement('div'); bubble.className = `message-bubble ${sender}`;
        
        let txt = data.parts[0]?.text || "";
        if (txt && txt.startsWith('\n\n--- Document')) txt = ""; 
        if (txt) txt = txt.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
                } else {
                    const t = document.createElement('div'); t.className = 'user-file-tag'; t.textContent = `📄 File: ${data.fileName}`; bubble.appendChild(t);
                }
            } else bubble.textContent = txt;
        } else {
            if (txt !== undefined) {
                if (data.isError) {
                    bubble.classList.add('error-bubble');
                    bubble.innerHTML = `<strong>⚠️ Error</strong><div style="font-size:0.9em; opacity:0.9; margin-top:4px;">${DOMPurify.sanitize(txt)}</div>`;
                } else {
                    bubble.innerHTML = renderMarkdownAndMath(txt) + renderSources(data.sources, data.id, data.sourcesExpanded);
                }
            }
        }
        
        inner.appendChild(bubble); 
        const meta = document.createElement('div'); meta.className = 'message-meta';
        const metaContent = document.createElement('div'); metaContent.className = 'message-meta-content';

        const parentNode = allSessions[currentSessionId].nodes[data.parentId];
        if (parentNode && parentNode.children.length > 1) {
            const siblingIndex = parentNode.children.indexOf(data.id);
            const branchNav = document.createElement('div'); branchNav.className = 'branch-nav';
            
            const prevBtn = document.createElement('button'); prevBtn.innerHTML = '❮';
            prevBtn.disabled = siblingIndex === 0;
            prevBtn.onclick = () => switchBranch(data.parentId, siblingIndex - 1);
            
            const label = document.createElement('span'); label.textContent = `${siblingIndex + 1} / ${parentNode.children.length}`;
            
            const nextBtn = document.createElement('button'); nextBtn.innerHTML = '❯';
            nextBtn.disabled = siblingIndex === parentNode.children.length - 1;
            nextBtn.onclick = () => switchBranch(data.parentId, siblingIndex + 1);

            branchNav.appendChild(prevBtn); branchNav.appendChild(label); branchNav.appendChild(nextBtn);
            metaContent.appendChild(branchNav);
        }
        
        if (sender === 'model' && data.model) {
            const mBadge = document.createElement('span'); mBadge.className = 'model-badge'; mBadge.textContent = MODEL_NAMES[data.model] || data.model;
            metaContent.appendChild(mBadge);
        }
        
        meta.appendChild(metaContent); inner.appendChild(meta); wrapper.appendChild(inner);
        chatLog.insertBefore(wrapper, scrollAnchor);
        if (scroll) scrollToBottom(); if (txt && !stream) addMessageActions(wrapper, bubble, txt, sender, data);
        return wrapper;
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
        
        let path = getActivePath(allSessions[currentSessionId].nodes, allSessions[currentSessionId].currentLeafId);
        if (removeOnly || isGenerating || path.length <= 1) return; 
        
        const lastModelWrapper = Array.from(document.querySelectorAll('.message-wrapper.model')).pop();
        if (lastModelWrapper) {
            const acts = lastModelWrapper.querySelector('.message-actions');
            if (acts) {
                const { wrapper, button } = createActionButton(REGENERATE_ICON, 'Regenerate');
                button.classList.add('regenerate-btn'); button.onclick = handleRegenerate; acts.appendChild(wrapper);
            }
        }
    }

    function stripMarkdownAndMath(md) {
        let cleanHtml = renderMarkdownAndMath(md);
        const t = document.createElement('div'); 
        t.innerHTML = cleanHtml;
        t.querySelectorAll('.katex-mathml').forEach(el => el.remove());
        t.querySelectorAll('.source-grounding-container').forEach(el => el.remove()); 
        let finalStr = t.textContent || t.innerText || "";
        return finalStr.replace(/\*\*/g, '').replace(/### /g, '').trim();
    }

    function enableInlineEdit(inner, bubble, msgData) {
        const originalText = msgData.parts[0]?.text && !msgData.parts[0].text.startsWith('\n\n--- Document') ? msgData.parts[0].text : "";
        
        const currentWidth = bubble.offsetWidth;
        bubble.style.width = Math.max(currentWidth, 250) + 'px'; 
        bubble.classList.add('editing');
        
        const container = document.createElement('div'); container.className = 'inline-edit-container';
        const textarea = document.createElement('textarea'); textarea.className = 'inline-edit-textarea'; textarea.value = originalText;
        const actions = document.createElement('div'); actions.className = 'inline-edit-actions';
        
        const cancelBtn = document.createElement('button'); cancelBtn.textContent = 'Cancel'; cancelBtn.className = 'edit-cancel-btn secondary-btn';
        cancelBtn.onclick = () => { bubble.style.width = ''; renderChatLog(); }; 

        const saveBtn = document.createElement('button'); saveBtn.textContent = 'Save'; saveBtn.className = 'edit-save-btn secondary-btn';
        const saveSubmitBtn = document.createElement('button'); saveSubmitBtn.textContent = 'Save & Send'; saveSubmitBtn.className = 'inline-edit-save primary-btn';
        
        function finishEdit(shouldSubmit) {
            bubble.style.width = ''; 
            const newText = textarea.value.trim();
            if (!newText && !msgData.fileName) return; 
            
            const newParts = [{ text: newText }];
            if (msgData.parts.length > 1) { newParts.push(msgData.parts[1]); }
            
            let newNode = createNode('user', newParts, msgData.parentId, { fileName: msgData.fileName });
            allSessions[currentSessionId].nodes[newNode.id] = newNode;
            allSessions[currentSessionId].nodes[msgData.parentId].children.push(newNode.id);
            allSessions[currentSessionId].currentLeafId = newNode.id;
            
            if (shouldSubmit) {
                isGenerating = true; setFormDisabled(true); activeStreamSessionId = currentSessionId;
                const selectedModel = getCustomSelectValue('custom-model-select');
                activeStreamMessageObj = createNode('model',[{text: ''}], newNode.id, { model: selectedModel });
                allSessions[currentSessionId].nodes[activeStreamMessageObj.id] = activeStreamMessageObj;
                allSessions[currentSessionId].nodes[newNode.id].children.push(activeStreamMessageObj.id);
                allSessions[currentSessionId].currentLeafId = activeStreamMessageObj.id;
                
                saveSpecificSession(currentSessionId); renderChatLog();
                callInsecureApi(currentSessionId, activeStreamMessageObj);
            } else {
                saveSpecificSession(currentSessionId); renderChatLog();
            }
        }

        saveBtn.onclick = () => finishEdit(false);
        saveSubmitBtn.onclick = () => finishEdit(true);

        actions.appendChild(cancelBtn); actions.appendChild(saveBtn); actions.appendChild(saveSubmitBtn);
        container.appendChild(textarea); container.appendChild(actions);
        bubble.innerHTML = ''; bubble.appendChild(container);
        
        const meta = inner.querySelector('.message-meta'); if (meta) meta.style.display = 'none';
        
        textarea.focus();
        function adjustHeight() { textarea.style.height = 'auto'; textarea.style.height = Math.min(textarea.scrollHeight, 300) + 'px'; }
        textarea.oninput = adjustHeight; setTimeout(adjustHeight, 0); 
    }

    function addMessageActions(wrapper, bubble, txt, sender, data) {
        let meta = wrapper.querySelector('.message-meta-content');
        let acts = meta.querySelector('.message-actions') || document.createElement('div');
        acts.className = 'message-actions'; 
        
        const branchNav = meta.querySelector('.branch-nav');
        if (branchNav) meta.insertBefore(acts, branchNav.nextSibling);
        else meta.insertBefore(acts, meta.firstChild);
        
        if (sender === 'user') {
            const { wrapper: eW, button: eB } = createActionButton(EDIT_ICON, 'Edit');
            eB.onclick = () => enableInlineEdit(wrapper.querySelector('.message-inner'), bubble, data); acts.appendChild(eW);
        }

        const { wrapper: cW, button: cB, tooltip: cT } = createActionButton(COPY_ICON, 'Copy');
        cB.onclick = () => navigator.clipboard.writeText(stripMarkdownAndMath(txt)).then(() => { cT.textContent = 'Copied!'; setTimeout(() => cT.textContent = 'Copy', 1500); });
        acts.appendChild(cW);
        
        const { wrapper: lW, button: lB, tooltip: lT } = createActionButton(LISTEN_ICON, 'Listen');
        lB.onclick = () => {
            if (!('speechSynthesis' in window)) return;
            if (window.speechSynthesis.speaking && currentSpeakingButton === lB) { window.speechSynthesis.cancel(); return; }
            if (currentSpeakingButton) { currentSpeakingButton.innerHTML = LISTEN_ICON; currentSpeakingButton.parentElement.querySelector('.custom-tooltip').textContent = 'Listen'; }
            window.speechSynthesis.cancel(); currentSpeakingButton = lB;
            currentUtterance = new SpeechSynthesisUtterance(stripMarkdownAndMath(txt));
            currentUtterance.onstart = () => { lB.innerHTML = STOP_ICON; lT.textContent = 'Stop'; };
            currentUtterance.onend = () => { if (currentSpeakingButton === lB) { lB.innerHTML = LISTEN_ICON; lT.textContent = 'Listen'; currentSpeakingButton = null; } };
            window.speechSynthesis.speak(currentUtterance);
        };
        acts.appendChild(lW); 
        if (sender === 'model') updateRegenerateButton();
    }
    
    async function handleRegenerate() {
        if (isGenerating) return; 
        updateRegenerateButton(true); window.speechSynthesis.cancel();
        
        let path = getActivePath(allSessions[currentSessionId].nodes, allSessions[currentSessionId].currentLeafId);
        let lastUser = null;
        for (let i = path.length - 1; i >= 0; i--) {
            if (path[i].role === 'user') { lastUser = path[i]; break; }
        }
        if (!lastUser) return;
        
        isGenerating = true; setFormDisabled(true); activeStreamSessionId = currentSessionId;
        const selectedModel = getCustomSelectValue('custom-model-select');
        
        activeStreamMessageObj = createNode('model', [{text: ''}], lastUser.id, { model: selectedModel });
        allSessions[currentSessionId].nodes[activeStreamMessageObj.id] = activeStreamMessageObj;
        allSessions[currentSessionId].nodes[lastUser.id].children.push(activeStreamMessageObj.id);
        allSessions[currentSessionId].currentLeafId = activeStreamMessageObj.id;
        saveSpecificSession(currentSessionId);
        
        renderChatLog();
        callInsecureApi(currentSessionId, activeStreamMessageObj);
    }
    
    loadSettings();
    loadAllSessions();
});