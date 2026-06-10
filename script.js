(function() {
    // ---------- elementos DOM ----------
    const screenLibrary = document.getElementById('screen-library');
    const screenInput = document.getElementById('screen-input');
    const screenMethod = document.getElementById('screen-method');
    const screenPlay = document.getElementById('screen-play');
    const screenComplete = document.getElementById('screen-complete');
    const resumeModal = document.getElementById('resume-modal');
    const fulltextModal = document.getElementById('fulltext-modal');

    const textList = document.getElementById('text-list');
    const emptyLibrary = document.getElementById('empty-library');
    const btnNewText = document.getElementById('btn-new-text');
    const btnNewTextEmpty = document.getElementById('btn-new-text-empty');
    const textInput = document.getElementById('text-input');
    const sentenceCounter = document.getElementById('sentence-counter');
    const sentencePreview = document.getElementById('sentence-preview');
    const warningFew = document.getElementById('warning-few-sentences');
    const btnStart = document.getElementById('btn-start');
    const btnSaveOnly = document.getElementById('btn-save-only');
    const btnBackLibrary = document.getElementById('btn-back-library');
    const btnResetStorage = document.getElementById('btn-reset-storage');

    const methodOptions = document.querySelectorAll('.method-option');
    const btnConfirmMethod = document.getElementById('btn-confirm-method');

    const levelIndicator = document.getElementById('level-indicator');
    const modeBadge = document.getElementById('mode-badge');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const contextIndicator = document.getElementById('context-indicator');
    const cardContent = document.getElementById('card-content');
    const recitationHint = document.getElementById('recitation-hint');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnEditText = document.getElementById('btn-edit-text');
    const btnResetTraining = document.getElementById('btn-reset-training');
    const btnViewFullText = document.getElementById('btn-view-full-text');
    const btnCloseFulltext = document.getElementById('btn-close-fulltext');
    const fulltextContent = document.getElementById('fulltext-content');

    const completeSummary = document.getElementById('complete-summary');
    const btnRestart = document.getElementById('btn-restart');
    const btnBackLibraryComplete = document.getElementById('btn-back-library-complete');
    const resumeYes = document.getElementById('resume-yes');
    const resumeNo = document.getElementById('resume-no');

    const deleteModal = document.getElementById('delete-modal');
    const deleteModalTitle = document.getElementById('delete-modal-title');
    const deleteModalDesc = document.getElementById('delete-modal-desc');
    const deleteModalCancel = document.getElementById('delete-modal-cancel');
    const deleteModalConfirm = document.getElementById('delete-modal-confirm');

    const titleInput = document.getElementById('title-input');
    const btnBackPlay = document.getElementById('btn-back-play');
    const btnSettings = document.getElementById('btn-settings');
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const fontOptions = document.querySelectorAll('.font-option');
    const zenToggle = document.getElementById('zen-toggle');

    // Novos elementos para o seletor de janela deslizante
    const slidingWindowSelector = document.getElementById('sliding-window-selector');
    const windowSizeOptions = document.querySelectorAll('.window-size-btn');
    let slidingWindowSize = 4; // valor padrão, será atualizado pelo seletor

    // ---------- estado da aplicação ----------
    let sentences = [];
    let method = null;
    let originalText = '';
    let originalTextHash = '';
    let currentLevel = 0;
    let currentIndexWithinLevel = 0;
    let selectedMethod = null;
    let currentTextId = null;
    let isEditing = false;

    const STORAGE_KEY = 'memorizador-texts';
    const SETTINGS_KEY = 'memorizador-settings';

    // ---------- configurações (fonte + modo zen) ----------
    const FONT_MAP = {
        atkinson: "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        dyslexic: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
        opensans: "'Open Sans', system-ui, -apple-system, sans-serif"
    };
    let settings = { font: 'atkinson', zen: false };

    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            settings = {
                font: FONT_MAP[parsed.font] ? parsed.font : 'atkinson',
                zen: !!parsed.zen
            };
        } catch {
            settings = { font: 'atkinson', zen: false };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) { /* ignora falha de quota */ }
    }

    function applySettings() {
        document.documentElement.style.setProperty('--font-family', FONT_MAP[settings.font] || FONT_MAP.atkinson);
        document.body.classList.toggle('zen-mode', settings.zen);
        fontOptions.forEach(opt => opt.classList.toggle('selected', opt.dataset.font === settings.font));
        if (zenToggle) zenToggle.setAttribute('aria-checked', settings.zen ? 'true' : 'false');
    }

    // ---------- utilidades ----------
    function showToast() {}

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    function generateTextHash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(16);
    }

    function formatRelativeDate(isoString) {
        try {
            const diff = Date.now() - new Date(isoString).getTime();
            const days = Math.floor(diff / 86400000);
            if (days === 0) return 'hoje';
            if (days === 1) return 'ontem';
            if (days < 30) return 'há ' + days + ' dias';
            const months = Math.floor(days / 30);
            return 'há ' + months + (months === 1 ? ' mês' : ' meses');
        } catch (e) { return ''; }
    }

    function formatAnkiMarkup(raw) {
        let c = (raw || "").trim();
        if (!/<\/?[a-z]/i.test(c)) {
            c = c.split(/\n{2,}/).filter(Boolean).map(s =>
                `<p>${s.trim().replace(/\n/g, "<br>")}</p>`
            ).join("") || `<p>${c}</p>`;
        }
        const PAIRS = [
            [/\\geq?\b/g, "&ge;"], [/\leq?\b/g, "&le;"], [/\\neq?\b/g, "&ne;"],
            [/\\pm\b/g, "&plusmn;"], [/\\approx\b/g, "&asymp;"], [/\\%/g, "%"],
            [/-->/g, "&rarr;"], [/<--/g, "&larr;"], [/\\rightarrow\b/g, "&rarr;"],
            [/\\leftarrow\b/g, "&larr;"], [/\^o/g, "°"]
        ];
        for (const [r, v] of PAIRS) c = c.replace(r, v);
        c = c.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1/$2");
        c = c.replace(/\$(.*?)\^\{(.*?)\}\$/g, "$1<sup class='custom-math'>$2</sup>");
        c = c.replace(/\$(.*?)_\{(.*?)\}\$/g, "$1<sub class='custom-math'>$2</sub>");
        c = c.replace(/\$([^$]+)\$/g, "<span class='custom-math-inline'>$1</span>");
        return c;
    }

    function parseSentences(text) {
        if (!text || !text.trim()) return [];
        const blocks = text.split(/\n\s*\n/);
        let result = [];
        for (let block of blocks) {
            block = block.trim();
            if (!block) continue;
            const parts = block.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9""''\[\(])/);
            for (let part of parts) {
                const trimmed = part.trim();
                if (trimmed) result.push(trimmed);
            }
        }
        if (result.length < 2 && text.trim().length > 0) {
            const fallbackParts = text.split(/(?<=[.!?])\s+/);
            result = fallbackParts.filter(p => p.trim().length > 0);
        }
        return result;
    }

    function updateSentenceCounter() {
        const s = parseSentences(textInput.value);
        const count = s.length;
        sentenceCounter.textContent = `${count} frase${count !== 1 ? 's' : ''} detectada${count !== 1 ? 's' : ''}`;
        if (count < 2) {
            warningFew.classList.remove('hidden');
            warningFew.classList.remove('warning-animated');
            void warningFew.offsetWidth;
            warningFew.classList.add('warning-animated');
            btnStart.disabled = true;
        } else {
            warningFew.classList.add('hidden');
            btnStart.disabled = false;
        }
        if (count > 0) {
            sentencePreview.classList.add('visible');
            sentencePreview.innerHTML = s.map((phrase, i) =>
                `<span data-index="${i}" class="chip-color-${i % 4}">${i+1}. ${phrase.slice(0, 60)}${phrase.length > 60 ? '…' : ''}</span>`
            ).join('');
        } else {
            sentencePreview.classList.remove('visible');
            sentencePreview.innerHTML = '';
        }
    }

    // ---------- persistência da biblioteca ----------
    function loadAllTexts() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveAllTexts(texts) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(texts));
        } catch (e) {
            showToast('Não foi possível salvar. Espaço insuficiente.', 'warning');
        }
    }

    function findTextById(id) {
        const texts = loadAllTexts();
        return texts.find(t => t.id === id);
    }

    function updateTextInLibrary(id, updates) {
        const texts = loadAllTexts();
        const index = texts.findIndex(t => t.id === id);
        if (index !== -1) {
            texts[index] = { ...texts[index], ...updates };
            saveAllTexts(texts);
        }
    }

    function deleteTextFromLibrary(id) {
        let texts = loadAllTexts();
        texts = texts.filter(t => t.id !== id);
        saveAllTexts(texts);
    }

    function saveProgressForCurrentText() {
        if (!currentTextId || !method) return;
        const progress = {
            method,
            currentLevel,
            currentIndexWithinLevel: method === 'serial' ? currentIndexWithinLevel : 0
        };
        // Salva o tamanho da janela para o modo sliding
        if (method === 'sliding') {
            progress.slidingWindowSize = slidingWindowSize;
        }
        updateTextInLibrary(currentTextId, { progress });
    }

    function clearProgressForCurrentText() {
        if (!currentTextId) return;
        updateTextInLibrary(currentTextId, { progress: null });
    }

    // ---------- modal de confirmação genérico ----------
    let _confirmCallback = null;

    function openConfirmModal(title, desc, onConfirm, confirmLabel, danger) {
        deleteModalTitle.textContent = title;
        deleteModalDesc.textContent = desc;
        deleteModalConfirm.textContent = confirmLabel || 'Confirmar';
        deleteModalConfirm.style.background = danger ? '#c62828' : 'var(--accent)';
        _confirmCallback = onConfirm;
        const iconEl = deleteModal.querySelector('.delete-modal-icon i');
        if (iconEl) {
            iconEl.setAttribute('data-lucide', danger ? 'trash-2' : 'alert-circle');
        }
        deleteModal.classList.remove('hidden');
        trapFocus(deleteModal);
        deleteModalCancel.focus();
        lucide.createIcons();
    }

    function closeConfirmModal() {
        deleteModal.classList.add('hidden');
        removeTrap(deleteModal);
        _confirmCallback = null;
    }

    deleteModalCancel.addEventListener('click', closeConfirmModal);
    deleteModalConfirm.addEventListener('click', () => {
        const cb = _confirmCallback;
        closeConfirmModal();
        if (cb) cb();
    });
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeConfirmModal();
    });

    function escapeHtml(text) {
        const map = {
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#039;'
        };
        return (text || '').replace(/[&<>"']/g, m => map[m]);
    }

    // ---------- renderização da biblioteca ----------
    function renderLibrary() {
        const texts = loadAllTexts();
        textList.innerHTML = '';
        if (texts.length === 0) {
            emptyLibrary.classList.remove('hidden');
            textList.classList.add('hidden');
        } else {
            emptyLibrary.classList.add('hidden');
            textList.classList.remove('hidden');
            texts.forEach(text => {
                const preview = (text.content || '').slice(0, 120).replace(/\n/g, ' ');
                const hasProgress = !!(text.progress);
                const totalSentences = parseSentences(text.content || '').length;
                const progressPctValue = hasProgress && totalSentences > 0
                    ? Math.round(((text.progress.currentLevel + 1) / totalSentences) * 100)
                    : 0;
                const relDate = text.savedAt ? formatRelativeDate(text.savedAt) : '';

                const div = document.createElement('div');
                div.className = 'lib-card';
                div.innerHTML = `
                    <div class="lib-card__header">
                        <span class="lib-card__title">${escapeHtml(text.title)}</span>
                        ${relDate ? `<span class="lib-card__meta">${relDate}</span>` : ''}
                    </div>
                    <div class="lib-card__preview">${escapeHtml(preview)}${text.content.length > 120 ? '…' : ''}</div>
                    ${hasProgress ? `
                    <div class="lib-card__progress-row">
                        <span class="lib-card__badge">Em andamento</span>
                        <div class="lib-card__mini-progress">
                            <div class="lib-card__mini-progress-fill" style="width:${progressPctValue}%"></div>
                        </div>
                        <span class="lib-card__pct">${progressPctValue}%</span>
                    </div>` : ''}
                    <div class="lib-card__actions">
                        <button class="lib-card__action-btn lib-card__action-btn--play train-btn"
                            data-id="${text.id}" aria-label="Treinar: ${escapeHtml(text.title)}">
                            <i data-lucide="play" class="w-3 h-3"></i> Treinar
                        </button>
                        <button class="lib-card__action-btn lib-card__action-btn--edit edit-btn"
                            data-id="${text.id}" aria-label="Editar: ${escapeHtml(text.title)}">
                            <i data-lucide="edit-2" class="w-3 h-3"></i> Editar
                        </button>
                        <button class="lib-card__action-btn lib-card__action-btn--delete delete-btn"
                            data-id="${text.id}" aria-label="Apagar: ${escapeHtml(text.title)}">
                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                        </button>
                    </div>
                `;
                textList.appendChild(div);
            });

            document.querySelectorAll('.train-btn').forEach(btn => {
                btn.addEventListener('click', (e) => startTraining(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => editText(e.currentTarget.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const textItem = findTextById(id);
                    openConfirmModal(
                        'Apagar texto?',
                        `"${escapeHtml(textItem ? textItem.title : '')}" e todo seu progresso serão apagados permanentemente.`,
                        () => {
                            deleteTextFromLibrary(id);
                            renderLibrary();
                            showToast('Texto removido.', 'success');
                        },
                        'Apagar',
                        true
                    );
                });
            });

            lucide.createIcons();
        }
    }

    // ---------- fluxo de telas ----------
    function showScreen(screen) {
        [screenLibrary, screenInput, screenMethod, screenPlay, screenComplete].forEach(s => {
            s.classList.add('hidden');
            s.classList.remove('screen-transition-enter');
        });
        screen.classList.remove('hidden');
        screen.classList.add('screen-transition-enter');
        screen.addEventListener('animationend', () => {
            screen.classList.remove('screen-transition-enter');
        }, { once: true });
        lucide.createIcons();
        document.body.classList.toggle('study-mode', screen === screenPlay);
        if (screen === screenPlay) {
            setTimeout(() => btnNext && btnNext.focus(), 80);
        }
    }

    // ---------- ações da biblioteca ----------
    function startTraining(id) {
        const text = findTextById(id);
        if (!text) return;
        sentences = parseSentences(text.content);
        if (sentences.length < 2) {
            showToast('Este texto não tem frases suficientes para treinar.', 'warning');
            return;
        }
        currentTextId = id;
        originalText = text.content;
        originalTextHash = generateTextHash(originalText);
        textInput.value = originalText;

        // Restaura o tamanho da janela se for modo sliding com progresso salvo
        if (text.progress && text.progress.method === 'sliding' && text.progress.slidingWindowSize) {
            slidingWindowSize = text.progress.slidingWindowSize;
            windowSizeOptions.forEach(btn => btn.classList.toggle('selected', parseInt(btn.dataset.size) === slidingWindowSize));
        }

        if (text.progress) {
            resumeModal.classList.remove('hidden');
            trapFocus(resumeModal);
            resumeYes.focus();
            resumeYes.onclick = () => {
                resumeYes.onclick = null;
                resumeNo.onclick = null;
                removeTrap(resumeModal);
                resumeModal.classList.add('hidden');
                method = text.progress.method;
                currentLevel = text.progress.currentLevel;
                currentIndexWithinLevel = text.progress.method === 'serial' ? (text.progress.currentIndexWithinLevel || 0) : 0;
                if (text.progress.method === 'sliding' && text.progress.slidingWindowSize) {
                    slidingWindowSize = text.progress.slidingWindowSize;
                }
                showScreen(screenPlay);
                renderCard();
            };
            resumeNo.onclick = () => {
                resumeYes.onclick = null;
                resumeNo.onclick = null;
                removeTrap(resumeModal);
                resumeModal.classList.add('hidden');
                clearProgressForCurrentText();
                goToMethodSelection();
            };
            resumeModal.addEventListener('click', (e) => {
                if (e.target === resumeModal) resumeNo.click();
            });
        } else {
            goToMethodSelection();
        }
    }

    function goToMethodSelection() {
        method = null;
        currentLevel = 0;
        currentIndexWithinLevel = 0;
        selectedMethod = null;
        methodOptions.forEach(btn => btn.classList.remove('selected'));
        btnConfirmMethod.disabled = true;
        // Reseta o seletor de janela para o valor padrão e oculta
        slidingWindowSize = 4;
        windowSizeOptions.forEach(btn => btn.classList.toggle('selected', btn.dataset.size === '4'));
        slidingWindowSelector.classList.add('hidden');
        showScreen(screenMethod);
    }

    function editText(id) {
        const text = findTextById(id);
        if (!text) return;
        isEditing = true;
        currentTextId = id;
        titleInput.value = text.title || '';
        textInput.value = text.content;
        updateSentenceCounter();
        showScreen(screenInput);
    }

    // ---------- tela de input ----------
    textInput.addEventListener('input', updateSentenceCounter);

    function goToNewText() {
        isEditing = false;
        currentTextId = null;
        textInput.value = '';
        titleInput.value = '';
        updateSentenceCounter();
        showScreen(screenInput);
    }

    btnNewText.addEventListener('click', goToNewText);
    if (btnNewTextEmpty) btnNewTextEmpty.addEventListener('click', goToNewText);

    btnBackLibrary.addEventListener('click', () => {
        showScreen(screenLibrary);
        renderLibrary();
    });

    // Função auxiliar para salvar o texto (usada tanto pelo "Salvar" quanto pelo "Começar")
    function saveTextToLibrary(title, content, isEditingExisting) {
        if (isEditingExisting && currentTextId) {
            updateTextInLibrary(currentTextId, {
                title,
                content,
                progress: null
            });
            return currentTextId;
        } else {
            const newId = generateId();
            const texts = loadAllTexts();
            texts.push({
                id: newId,
                title,
                content,
                progress: null,
                savedAt: new Date().toISOString()
            });
            saveAllTexts(texts);
            return newId;
        }
    }

    // Botão "Salvar" — apenas salva e volta para a biblioteca
    btnSaveOnly.addEventListener('click', () => {
        const s = parseSentences(textInput.value);
        if (s.length < 1) {
            showToast('Digite algum texto para salvar.', 'warning');
            return;
        }
        sentences = s;
        originalText = textInput.value;
        originalTextHash = generateTextHash(originalText);

        let title = (titleInput.value || '').trim();
        if (title === '') {
            title = originalText.slice(0, 50).replace(/\s+/g, ' ').trim() + (originalText.length > 50 ? '…' : '');
        }

        currentTextId = saveTextToLibrary(title, originalText, isEditing && currentTextId);
        showToast('Texto salvo!', 'success');
        showScreen(screenLibrary);
        renderLibrary();
        lucide.createIcons();
    });

    // Botão "Começar" — salva e vai para a seleção de método
    btnStart.addEventListener('click', () => {
        const s = parseSentences(textInput.value);
        if (s.length < 2) {
            showToast('Mínimo de 2 frases necessário.', 'warning');
            return;
        }
        sentences = s;
        originalText = textInput.value;
        originalTextHash = generateTextHash(originalText);

        let title = (titleInput.value || '').trim();
        if (title === '') {
            title = originalText.slice(0, 50).replace(/\s+/g, ' ').trim() + (originalText.length > 50 ? '…' : '');
        }

        currentTextId = saveTextToLibrary(title, originalText, isEditing && currentTextId);
        showToast('Texto salvo!', 'success');
        goToMethodSelection();
        lucide.createIcons();
    });

    btnResetStorage.addEventListener('click', () => {
        openConfirmModal(
            'Resetar tudo?',
            'Isso apagará TODOS os textos e progressos salvos. Esta ação não pode ser desfeita.',
            () => {
                localStorage.removeItem(STORAGE_KEY);
                renderLibrary();
                showToast('Todos os dados foram apagados.', 'warning');
            },
            'Resetar tudo',
            true
        );
    });

    // ---------- seleção de método ----------
    methodOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            methodOptions.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMethod = btn.dataset.method;
            btnConfirmMethod.disabled = false;
            // Mostra/oculta seletor de janela conforme o método escolhido
            if (selectedMethod === 'sliding') {
                slidingWindowSelector.classList.remove('hidden');
            } else {
                slidingWindowSelector.classList.add('hidden');
            }
        });
    });

    // Eventos do seletor de tamanho da janela deslizante
    windowSizeOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            windowSizeOptions.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            slidingWindowSize = parseInt(btn.dataset.size, 10);
        });
    });

    btnConfirmMethod.addEventListener('click', () => {
        if (!selectedMethod) return;
        method = selectedMethod;
        currentLevel = 0;
        currentIndexWithinLevel = 0;
        saveProgressForCurrentText();
        showScreen(screenPlay);
        renderCard();
        lucide.createIcons();
    });

    // ---------- renderização dos modos ----------
    function renderBlockMode() {
        let html = '';
        for (let i = 0; i <= currentLevel; i++) {
            const isCurrent = (i === currentLevel);
            const phraseClass = isCurrent ? ' current-block-phrase' : '';
            html += `<p style="margin-bottom:0.5em;" class="${phraseClass}"><span style="color:var(--accent);">${i+1}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
        }
        cardContent.innerHTML = html;
        recitationHint.textContent = 'Recite todas as frases acima em voz alta.';
        levelIndicator.textContent = `Nível ${currentLevel+1} de ${sentences.length}`;
        contextIndicator.innerHTML = `Frases neste nível: <span style="color:var(--text-fg);">${sentences.slice(0, currentLevel+1).map(s => s.slice(0,25)+(s.length>25?'…':'')).join(' • ')}</span>`;
        modeBadge.textContent = 'Bloco';
        const progress = ((currentLevel + 1) / sentences.length) * 100;
        progressBarFill.style.width = `${progress}%`;
    }

    function renderSerialMode() {
        const phrase = sentences[currentIndexWithinLevel];
        cardContent.innerHTML = formatAnkiMarkup(phrase);
        levelIndicator.textContent = `Nível ${currentLevel+1} (acumula ${currentLevel+1} frase${currentLevel+1>1?'s':''})`;
        let contextHtml = '';
        for (let i = 0; i <= currentLevel; i++) {
            if (i < currentIndexWithinLevel) contextHtml += `<span style="color:var(--accent);">✓ ${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
            else if (i === currentIndexWithinLevel) contextHtml += `<span style="color:#fff;">▶ ${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
            else contextHtml += `<span style="color:#555;">${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
        }
        contextIndicator.innerHTML = contextHtml.replace(/ • $/, '');
        recitationHint.textContent = 'Recite mentalmente todas as frases que já apareceram neste nível antes de avançar.';
        modeBadge.textContent = 'Serial';
        const totalSteps = (sentences.length * (sentences.length + 1)) / 2;
        let completedSteps = 0;
        for (let lvl = 0; lvl < currentLevel; lvl++) completedSteps += (lvl + 1);
        completedSteps += currentIndexWithinLevel + 1;
        const progress = Math.min(100, (completedSteps / totalSteps) * 100);
        progressBarFill.style.width = `${progress}%`;
    }

    function renderSlidingMode() {
        const N = slidingWindowSize;
        const totalFrases = sentences.length;
        const totalSteps = totalFrases * N;

        let startIndex, endIndex, windowSize;

        if (currentLevel < N - 1) {
            // Fase de crescimento: janela começa em 0 e vai até currentLevel
            startIndex = 0;
            endIndex = currentLevel;
            windowSize = currentLevel + 1;
        } else {
            // Fase de deslizamento: janela de tamanho N
            const lastPhraseIndex = currentLevel % totalFrases;
            endIndex = lastPhraseIndex;
            startIndex = (endIndex - N + 1 + totalFrases) % totalFrases;
            windowSize = N;
        }

        let html = '';
        if (startIndex <= endIndex) {
            // Janela contígua
            for (let i = startIndex; i <= endIndex; i++) {
                const displayNum = i - startIndex + 1;
                const isLast = (i === endIndex);
                const phraseClass = isLast ? ' current-block-phrase' : '';
                html += `<p style="margin-bottom:0.5em;" class="${phraseClass}"><span style="color:var(--accent);">${displayNum}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
            }
        } else {
            // Wrap-around
            for (let i = startIndex; i < totalFrases; i++) {
                const displayNum = i - startIndex + 1;
                html += `<p style="margin-bottom:0.5em;"><span style="color:var(--accent);">${displayNum}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
            }
            for (let i = 0; i <= endIndex; i++) {
                const displayNum = (totalFrases - startIndex) + i + 1;
                const isLast = (i === endIndex);
                const phraseClass = isLast ? ' current-block-phrase' : '';
                html += `<p style="margin-bottom:0.5em;" class="${phraseClass}"><span style="color:var(--accent);">${displayNum}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
            }
        }

        cardContent.innerHTML = html;
        recitationHint.textContent = 'Recite todas as frases acima em voz alta.';

        const displayLevel = (currentLevel % totalFrases) + 1;
        levelIndicator.textContent = `Passo ${currentLevel+1} de ${totalSteps} (frase ${displayLevel})`;
        contextIndicator.innerHTML = `Janela de ${windowSize} frase${windowSize>1?'s':''} · Cada frase aparece ${N} vez${N>1?'es':''}`;
        modeBadge.textContent = `Micro ${N}`;
        const progress = ((currentLevel + 1) / totalSteps) * 100;
        progressBarFill.style.width = `${progress}%`;
    }

    function renderCard() {
        const card = cardContent.parentElement;
        card.classList.remove('animate-entrance');
        void card.offsetWidth;
        card.classList.add('animate-entrance');
        card.setAttribute('data-mode', method || '');

        if (method === 'block') {
            renderBlockMode();
        } else if (method === 'serial') {
            renderSerialMode();
        } else if (method === 'sliding') {
            renderSlidingMode();
        }

        if (card.scrollTo) {
            card.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            card.scrollTop = 0;
        }
    }

    // ---------- navegação ----------
    function handleNext() {
        if (method === 'block') {
            if (currentLevel < sentences.length - 1) {
                currentLevel++;
                saveProgressForCurrentText();
                renderCard();
                showToast(`Nível ${currentLevel+1} concluído!`, 'info');
            } else {
                clearProgressForCurrentText();
                showCompleteScreen();
            }
        } else if (method === 'serial') {
            if (currentIndexWithinLevel < currentLevel) {
                currentIndexWithinLevel++;
                saveProgressForCurrentText();
                renderCard();
            } else {
                if (currentLevel < sentences.length - 1) {
                    showToast(`Nível ${currentLevel+1} concluído!`, 'info');
                    currentLevel++;
                    currentIndexWithinLevel = 0;
                    saveProgressForCurrentText();
                    renderCard();
                    setTimeout(() => showToast(`Nível ${currentLevel+1} iniciado!`, 'info'), 600);
                } else {
                    clearProgressForCurrentText();
                    showCompleteScreen();
                }
            }
        } else if (method === 'sliding') {
            const N = slidingWindowSize;
            const totalSteps = sentences.length * N;
            if (currentLevel < totalSteps - 1) {
                currentLevel++;
                saveProgressForCurrentText();
                renderCard();
                if ((currentLevel + 1) % sentences.length === 0) {
                    const ciclo = Math.floor((currentLevel + 1) / sentences.length);
                    showToast(`Ciclo ${ciclo} de ${N} concluído!`, 'info');
                }
            } else {
                clearProgressForCurrentText();
                showCompleteScreen();
            }
        }
    }

    function handlePrev() {
        if (method === 'block') {
            if (currentLevel > 0) {
                currentLevel--;
                saveProgressForCurrentText();
                renderCard();
            }
        } else if (method === 'serial') {
            if (currentIndexWithinLevel > 0) {
                currentIndexWithinLevel--;
                saveProgressForCurrentText();
                renderCard();
            } else if (currentLevel > 0) {
                currentLevel--;
                currentIndexWithinLevel = currentLevel;
                saveProgressForCurrentText();
                renderCard();
            }
        } else if (method === 'sliding') {
            if (currentLevel > 0) {
                currentLevel--;
                saveProgressForCurrentText();
                renderCard();
            }
        }
    }

    function showCompleteScreen() {
        showScreen(screenComplete);
        completeSummary.innerHTML = sentences.map((s, i) => `<p>${i+1}. ${s}</p>`).join('');
        spawnConfetti();
        lucide.createIcons();
    }

    function resetTrainingState() {
        currentLevel = 0;
        currentIndexWithinLevel = 0;
        saveProgressForCurrentText();
        renderCard();
    }

    // ---------- confetes ----------
    function spawnConfetti() {
        const colors = [
            '#d97757', '#7eb8da', '#81c784', '#ce93d8',
            '#ffb74d', '#e57373', '#f5c6a0', '#aecbfa'
        ];
        const shapes = [2, 4, 50];
        for (let i = 0; i < 70; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 6;
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            piece.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)] + 'px';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4500);
        }
    }

    // ---------- modal de texto completo ----------
    function openFullTextModal() {
        fulltextContent.textContent = originalText || sentences.join('\n\n');
        fulltextModal.classList.remove('hidden');
        btnCloseFulltext.focus();
        trapFocus(fulltextModal);
        lucide.createIcons();
    }

    function closeFullTextModal() {
        fulltextModal.classList.add('hidden');
        removeTrap(fulltextModal);
        btnViewFullText.focus();
    }

    // ---------- focus trap ----------
    function trapFocus(modalElement) {
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const focusableElements = modalElement.querySelectorAll(focusableSelectors);
        if (focusableElements.length === 0) return;
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        function handleTab(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
            if (e.key === 'Escape') {
                if (modalElement === resumeModal) {
                    if (resumeNo.onclick) resumeNo.onclick();
                } else if (modalElement === fulltextModal) {
                    closeFullTextModal();
                } else if (modalElement === deleteModal) {
                    closeConfirmModal();
                } else if (modalElement === settingsModal) {
                    closeSettingsModal();
                }
            }
        }
        modalElement.addEventListener('keydown', handleTab);
        modalElement._trapHandler = handleTab;
        firstFocusable.focus();
    }

    function removeTrap(modalElement) {
        if (modalElement._trapHandler) {
            modalElement.removeEventListener('keydown', modalElement._trapHandler);
            delete modalElement._trapHandler;
        }
    }

    // ---------- ripple no btn-next ----------
    btnNext.addEventListener('mousedown', (e) => {
        const rect = btnNext.getBoundingClientRect();
        btnNext.style.setProperty('--ripple-x', (e.clientX - rect.left) + 'px');
        btnNext.style.setProperty('--ripple-y', (e.clientY - rect.top) + 'px');
        btnNext.classList.remove('ripple-active');
        void btnNext.offsetWidth;
        btnNext.classList.add('ripple-active');
        setTimeout(() => btnNext.classList.remove('ripple-active'), 700);
    });

    // ---------- eventos da tela de treino ----------
    btnNext.addEventListener('click', handleNext);
    btnPrev.addEventListener('click', handlePrev);

    btnEditText.addEventListener('click', () => {
        openConfirmModal(
            'Editar texto?',
            'Editar o texto reiniciará o progresso do treino atual.',
            () => {
                clearProgressForCurrentText();
                isEditing = true;
                textInput.value = originalText;
                updateSentenceCounter();
                showScreen(screenInput);
            },
            'Editar',
            false
        );
    });

    btnResetTraining.addEventListener('click', () => {
        openConfirmModal(
            'Reiniciar treino?',
            'O progresso do nível atual será reiniciado. O texto e o método serão mantidos.',
            () => {
                resetTrainingState();
                showToast('Treino reiniciado.', 'info');
            },
            'Reiniciar',
            false
        );
    });

    btnViewFullText.addEventListener('click', openFullTextModal);
    btnCloseFulltext.addEventListener('click', closeFullTextModal);
    fulltextModal.addEventListener('click', (e) => {
        if (e.target === fulltextModal) closeFullTextModal();
    });

    btnRestart.addEventListener('click', () => {
        resetTrainingState();
        showScreen(screenPlay);
        renderCard();
    });

    btnBackLibraryComplete.addEventListener('click', () => {
        showScreen(screenLibrary);
        renderLibrary();
    });

    btnBackPlay.addEventListener('click', () => {
        showScreen(screenLibrary);
        renderLibrary();
    });

    // ---------- modal de configurações ----------
    function openSettingsModal() {
        applySettings();
        settingsModal.classList.remove('hidden');
        trapFocus(settingsModal);
        btnCloseSettings.focus();
        lucide.createIcons();
    }

    function closeSettingsModal() {
        settingsModal.classList.add('hidden');
        removeTrap(settingsModal);
        btnSettings.focus();
    }

    if (btnSettings) btnSettings.addEventListener('click', openSettingsModal);
    if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) closeSettingsModal();
    });

    fontOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            settings.font = opt.dataset.font;
            saveSettings();
            applySettings();
        });
    });

    if (zenToggle) {
        zenToggle.addEventListener('click', () => {
            settings.zen = !settings.zen;
            saveSettings();
            applySettings();
        });
    }

    // ---------- teclas de atalho ----------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!settingsModal.classList.contains('hidden')) {
                closeSettingsModal();
                return;
            }
            if (!deleteModal.classList.contains('hidden')) {
                closeConfirmModal();
                return;
            }
            if (!fulltextModal.classList.contains('hidden')) {
                closeFullTextModal();
                return;
            }
            if (!screenInput.classList.contains('hidden') || !screenMethod.classList.contains('hidden')) {
                showScreen(screenLibrary);
                renderLibrary();
                return;
            }
        }

        if (screenPlay.classList.contains('hidden')) return;
        if (!resumeModal.classList.contains('hidden') ||
            !fulltextModal.classList.contains('hidden') ||
            !deleteModal.classList.contains('hidden') ||
            !settingsModal.classList.contains('hidden')) return;

        if (e.code === 'Space' || e.code === 'ArrowRight') {
            e.preventDefault();
            handleNext();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            handlePrev();
        } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            openConfirmModal(
                'Reiniciar treino?',
                'O progresso do nível atual será reiniciado.',
                () => {
                    resetTrainingState();
                    showToast('Treino reiniciado.', 'info');
                },
                'Reiniciar',
                false
            );
        } else if (e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            showScreen(screenLibrary);
            renderLibrary();
        }
    });

    // ---------- inicialização ----------
    window.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        applySettings();
        renderLibrary();
        lucide.createIcons();
    });
})();
