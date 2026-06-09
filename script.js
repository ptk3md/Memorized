(function() {
    // ---------- elementos DOM ----------
    const screenInput = document.getElementById('screen-input');
    const screenMethod = document.getElementById('screen-method');
    const screenPlay = document.getElementById('screen-play');
    const screenComplete = document.getElementById('screen-complete');
    const resumeModal = document.getElementById('resume-modal');
    const fulltextModal = document.getElementById('fulltext-modal');
    const toast = document.getElementById('toast');

    const textInput = document.getElementById('text-input');
    const sentenceCounter = document.getElementById('sentence-counter');
    const sentencePreview = document.getElementById('sentence-preview');
    const warningFew = document.getElementById('warning-few-sentences');
    const btnStart = document.getElementById('btn-start');
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
    const resumeYes = document.getElementById('resume-yes');
    const resumeNo = document.getElementById('resume-no');

    // ---------- estado da aplicação ----------
    let sentences = [];
    let method = null; // 'block' | 'serial' | 'sliding'
    let originalText = '';
    let originalTextHash = '';
    let currentLevel = 0;
    let currentIndexWithinLevel = 0; // usado apenas no serial
    let selectedMethod = null;

    const STORAGE_KEY = 'memorizador-progress';
    const WINDOW_SIZE = 4; // tamanho da janela deslizante

    // ---------- utilidades ----------
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.remove('hidden');
        void toast.offsetWidth;
        toast.classList.add('toast');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 2000);
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

    function formatAnkiMarkup(raw) {
        let c = (raw || "").trim();
        if (!/<\/?[a-z]/i.test(c)) {
            c = c.split(/\n{2,}/).filter(Boolean).map(s =>
                `<p>${s.trim().replace(/\n/g, "<br>")}</p>`
            ).join("") || `<p>${c}</p>`;
        }
        const PAIRS = [
            [/\\geq?\b/g, "&ge;"],
            [/\\leq?\b/g, "&le;"],
            [/\\neq?\b/g, "&ne;"],
            [/\\pm\b/g, "&plusmn;"],
            [/\\approx\b/g, "&asymp;"],
            [/\\%/g, "%"],
            [/-->/g, "&rarr;"],
            [/<--/g, "&larr;"],
            [/\\rightarrow\b/g, "&rarr;"],
            [/\\leftarrow\b/g, "&larr;"],
            [/\^o/g, "°"]
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
            const parts = block.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9"“'‘\[\(])/);
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
            btnStart.disabled = true;
        } else {
            warningFew.classList.add('hidden');
            btnStart.disabled = false;
        }
        if (count > 0) {
            sentencePreview.classList.add('visible');
            sentencePreview.innerHTML = s.map((phrase, i) =>
                `<span>${i+1}. ${phrase.slice(0, 60)}${phrase.length > 60 ? '…' : ''}</span>`
            ).join('');
        } else {
            sentencePreview.classList.remove('visible');
            sentencePreview.innerHTML = '';
        }
    }

    // ---------- persistência ----------
    function saveProgress() {
        if (!method || !sentences.length) return;
        const data = {
            text: originalText,
            hash: originalTextHash,
            method,
            currentLevel,
            currentIndexWithinLevel: method === 'serial' ? currentIndexWithinLevel : 0
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            showToast('⚠️ Não foi possível salvar o progresso. Espaço insuficiente.');
            console.warn('localStorage setItem falhou:', e);
        }
    }

    function clearProgress() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('localStorage removeItem falhou:', e);
        }
    }

    function loadProgress() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    // ---------- troca de telas ----------
    function showScreen(screen) {
        screenInput.classList.add('hidden');
        screenMethod.classList.add('hidden');
        screenPlay.classList.add('hidden');
        screenComplete.classList.add('hidden');
        screen.classList.remove('hidden');
        lucide.createIcons();
    }

    // ---------- confetes ----------
    function spawnConfetti() {
        const colors = ['#d97757', '#e6b89c', '#f5c6a0', '#f28b82', '#fbbc04', '#aecbfa', '#ff8a65'];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.width = (Math.random() * 8 + 6) + 'px';
            piece.style.height = (Math.random() * 8 + 6) + 'px';
            document.body.appendChild(piece);
            setTimeout(() => piece.remove(), 4000);
        }
    }

    // ---------- renderização dos modos ----------
    function renderBlockMode() {
        let html = '';
        for (let i = 0; i <= currentLevel; i++) {
            const isCurrent = (i === currentLevel);
            const phraseClass = isCurrent ? ' current-block-phrase' : '';
            html +=
                `<p style="margin-bottom:0.5em;" class="${phraseClass}"><span style="color:var(--accent);">${i+1}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
        }
        cardContent.innerHTML = html;
        recitationHint.textContent = 'Recite todas as frases acima em voz alta.';
        levelIndicator.textContent = `Nível ${currentLevel+1} de ${sentences.length}`;
        contextIndicator.innerHTML =
            `Frases neste nível: <span style="color:var(--text-fg);">${sentences.slice(0, currentLevel+1).map(s => s.slice(0,25)+(s.length>25?'…':'')).join(' • ')}</span>`;
        modeBadge.textContent = 'Bloco';
        const progress = ((currentLevel + 1) / sentences.length) * 100;
        progressBarFill.style.width = `${progress}%`;
    }

    function renderSerialMode() {
        const phrase = sentences[currentIndexWithinLevel];
        cardContent.innerHTML = formatAnkiMarkup(phrase);
        levelIndicator.textContent =
            `Nível ${currentLevel+1} (acumula ${currentLevel+1} frase${currentLevel+1>1?'s':''})`;
        let contextHtml = '';
        for (let i = 0; i <= currentLevel; i++) {
            if (i < currentIndexWithinLevel) contextHtml +=
                `<span style="color:var(--accent);">✓ ${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
            else if (i === currentIndexWithinLevel) contextHtml +=
                `<span style="color:#fff;">▶ ${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
            else contextHtml +=
                `<span style="color:#555;">${sentences[i].slice(0,15)}${sentences[i].length>15?'…':''}</span> • `;
        }
        contextIndicator.innerHTML = contextHtml.replace(/ • $/, '');
        recitationHint.textContent =
            'Recite mentalmente todas as frases que já apareceram neste nível antes de avançar.';
        modeBadge.textContent = 'Serial';
        const totalSteps = (sentences.length * (sentences.length + 1)) / 2;
        let completedSteps = 0;
        for (let lvl = 0; lvl < currentLevel; lvl++) completedSteps += (lvl + 1);
        completedSteps += currentIndexWithinLevel + 1;
        const progress = Math.min(100, (completedSteps / totalSteps) * 100);
        progressBarFill.style.width = `${progress}%`;
    }

    function renderSlidingMode() {
        const start = Math.max(0, currentLevel - WINDOW_SIZE + 1);
        const end = currentLevel;
        let html = '';
        for (let i = start; i <= end; i++) {
            const displayNum = i - start + 1;
            const isLast = (i === end);
            const phraseClass = isLast ? ' current-block-phrase' : '';
            html +=
                `<p style="margin-bottom:0.5em;" class="${phraseClass}"><span style="color:var(--accent);">${displayNum}.</span> ${formatAnkiMarkup(sentences[i])}</p>`;
        }
        cardContent.innerHTML = html;
        recitationHint.textContent = 'Recite todas as frases acima em voz alta.';
        levelIndicator.textContent = `Nível ${currentLevel+1} de ${sentences.length}`;
        const windowPhrases = sentences.slice(start, end + 1);
        contextIndicator.innerHTML =
            `Frases neste nível: <span style="color:var(--text-fg);">${windowPhrases.map(s => s.slice(0,25)+(s.length>25?'…':'')).join(' • ')}</span>`;
        modeBadge.textContent = 'Micro';
        const progress = ((currentLevel + 1) / sentences.length) * 100;
        progressBarFill.style.width = `${progress}%`;
    }

    function renderCard() {
        cardContent.parentElement.classList.remove('animate-entrance');
        void cardContent.parentElement.offsetWidth;
        cardContent.parentElement.classList.add('animate-entrance');

        if (method === 'block') {
            renderBlockMode();
        } else if (method === 'serial') {
            renderSerialMode();
        } else if (method === 'sliding') {
            renderSlidingMode();
        }
    }

    // ---------- navegação ----------
    function handleNext() {
        if (method === 'block') {
            if (currentLevel < sentences.length - 1) {
                currentLevel++;
                saveProgress();
                renderCard();
                showToast(`Nível ${currentLevel+1} concluído!`);
            } else {
                clearProgress();
                showCompleteScreen();
            }
        } else if (method === 'serial') {
            if (currentIndexWithinLevel < currentLevel) {
                currentIndexWithinLevel++;
                saveProgress();
                renderCard();
            } else {
                if (currentLevel < sentences.length - 1) {
                    showToast(`Nível ${currentLevel+1} concluído!`);
                    currentLevel++;
                    currentIndexWithinLevel = 0;
                    saveProgress();
                    renderCard();
                    setTimeout(() => showToast(`Nível ${currentLevel+1} iniciado!`), 600);
                } else {
                    clearProgress();
                    showCompleteScreen();
                }
            }
        } else if (method === 'sliding') {
            if (currentLevel < sentences.length - 1) {
                currentLevel++;
                saveProgress();
                renderCard();
                showToast(`Nível ${currentLevel+1} concluído!`);
            } else {
                clearProgress();
                showCompleteScreen();
            }
        }
    }

    function handlePrev() {
        if (method === 'block') {
            if (currentLevel > 0) {
                currentLevel--;
                saveProgress();
                renderCard();
            }
        } else if (method === 'serial') {
            if (currentIndexWithinLevel > 0) {
                currentIndexWithinLevel--;
                saveProgress();
                renderCard();
            } else if (currentLevel > 0) {
                currentLevel--;
                currentIndexWithinLevel = currentLevel;
                saveProgress();
                renderCard();
            }
        } else if (method === 'sliding') {
            if (currentLevel > 0) {
                currentLevel--;
                saveProgress();
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
        if (method && sentences.length) {
            saveProgress();
            renderCard();
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
                    resumeNo.click();
                } else if (modalElement === fulltextModal) {
                    closeFullTextModal();
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

    // ---------- eventos de entrada ----------
    textInput.addEventListener('input', updateSentenceCounter);
    btnStart.addEventListener('click', () => {
        const s = parseSentences(textInput.value);
        if (s.length < 2) {
            showToast('Mínimo de 2 frases necessário.');
            return;
        }
        sentences = s;
        originalText = textInput.value;
        originalTextHash = generateTextHash(originalText);
        showScreen(screenMethod);
        selectedMethod = null;
        methodOptions.forEach(btn => btn.classList.remove('selected'));
        btnConfirmMethod.disabled = true;
        lucide.createIcons();
    });

    btnResetStorage.addEventListener('click', () => {
        if (localStorage.getItem(STORAGE_KEY)) {
            clearProgress();
            showToast('Progresso resetado.');
        } else {
            showToast('Nenhum progresso salvo.');
        }
    });

    // seleção de método
    methodOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            methodOptions.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedMethod = btn.dataset.method;
            btnConfirmMethod.disabled = false;
        });
    });

    btnConfirmMethod.addEventListener('click', () => {
        if (!selectedMethod) return;
        method = selectedMethod;
        currentLevel = 0;
        currentIndexWithinLevel = 0;
        showScreen(screenPlay);
        saveProgress();
        renderCard();
        lucide.createIcons();
    });

    // navegação
    btnNext.addEventListener('click', handleNext);
    btnPrev.addEventListener('click', handlePrev);

    btnEditText.addEventListener('click', () => {
        if (confirm('Editar o texto reiniciará seu progresso. Continuar?')) {
            clearProgress();
            textInput.value = originalText;
            updateSentenceCounter();
            showScreen(screenInput);
        }
    });

    btnResetTraining.addEventListener('click', () => {
        if (confirm('Reiniciar o treino atual? Manterá texto e método.')) {
            resetTrainingState();
            showToast('Treino reiniciado.');
        }
    });

    btnViewFullText.addEventListener('click', openFullTextModal);
    btnCloseFulltext.addEventListener('click', closeFullTextModal);
    fulltextModal.addEventListener('click', (e) => {
        if (e.target === fulltextModal) closeFullTextModal();
    });

    btnRestart.addEventListener('click', () => {
        clearProgress();
        textInput.value = originalText || '';
        updateSentenceCounter();
        showScreen(screenInput);
    });

    // teclas de atalho
    document.addEventListener('keydown', (e) => {
        if (screenPlay.classList.contains('hidden')) return;
        if (!resumeModal.classList.contains('hidden') || !fulltextModal.classList.contains('hidden')) return;
        if (e.code === 'Space' || e.code === 'ArrowRight') {
            e.preventDefault();
            handleNext();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            handlePrev();
        } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (confirm('Reiniciar o treino atual?')) {
                resetTrainingState();
                showToast('Treino reiniciado.');
            }
        }
    });

    // modal de retomada
    function checkResume() {
        const saved = loadProgress();
        if (saved && saved.text && saved.method) {
            const savedHash = saved.hash || '';
            const currentHash = generateTextHash(saved.text);
            if (savedHash && savedHash !== currentHash) {
                clearProgress();
                showScreen(screenInput);
                textInput.focus();
                return;
            }
            resumeModal.classList.remove('hidden');
            trapFocus(resumeModal);
            resumeYes.focus();
        } else {
            showScreen(screenInput);
            textInput.focus();
        }
    }

    resumeYes.addEventListener('click', () => {
        const saved = loadProgress();
        if (!saved) {
            removeTrap(resumeModal);
            resumeModal.classList.add('hidden');
            showScreen(screenInput);
            return;
        }
        sentences = parseSentences(saved.text);
        if (sentences.length < 2) {
            clearProgress();
            removeTrap(resumeModal);
            resumeModal.classList.add('hidden');
            showScreen(screenInput);
            textInput.value = saved.text;
            updateSentenceCounter();
            return;
        }
        originalText = saved.text;
        originalTextHash = generateTextHash(originalText);
        textInput.value = saved.text;
        method = saved.method;
        currentLevel = saved.currentLevel;
        currentIndexWithinLevel = saved.method === 'serial' ? (saved.currentIndexWithinLevel || 0) : 0;
        removeTrap(resumeModal);
        resumeModal.classList.add('hidden');
        showScreen(screenPlay);
        renderCard();
        lucide.createIcons();
    });

    resumeNo.addEventListener('click', () => {
        clearProgress();
        removeTrap(resumeModal);
        resumeModal.classList.add('hidden');
        showScreen(screenInput);
        textInput.focus();
    });

    resumeModal.addEventListener('click', (e) => {
        if (e.target === resumeModal) resumeNo.click();
    });

    // inicialização
    window.addEventListener('DOMContentLoaded', () => {
        updateSentenceCounter();
        checkResume();
        lucide.createIcons();
        if (screenInput.classList.contains('hidden') === false) {
            textInput.focus();
        }
    });
})();
