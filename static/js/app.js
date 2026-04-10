/**
 * Resumo em Áudio — Frontend Logic
 * Handles text/file input, audio generation, playback, and waveform visualization.
 */

// ========== State ==========
const state = {
    mode: 'text', // 'text' or 'file'
    file: null,
    audioBlob: null,
    audioUrl: null,
    isPlaying: false,
    audioElement: null,
    audioContext: null,
    analyser: null,
    animationFrame: null,
};

// ========== DOM Elements ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const elements = {
    tabText: $('#tab-text'),
    tabFile: $('#tab-file'),
    textSection: $('#text-section'),
    fileSection: $('#file-section'),
    textInput: $('#text-input'),
    charCount: $('#char-count'),
    fileInput: $('#file-input'),
    dropzone: $('#dropzone'),
    fileInfo: $('#file-info'),
    fileName: $('#file-name'),
    fileSize: $('#file-size'),
    fileRemove: $('#file-remove'),
    voiceSelect: $('#voice-select'),
    speedSlider: $('#speed-slider'),
    speedValue: $('#speed-value'),
    generateBtn: $('#generate-btn'),
    statusMessage: $('#status-message'),
    playerCard: $('#player-card'),
    playBtn: $('#play-btn'),
    progressWrapper: $('#progress-wrapper'),
    progressFill: $('#progress-fill'),
    timeCurrent: $('#time-current'),
    timeDuration: $('#time-duration'),
    downloadBtn: $('#download-btn'),
    waveCanvas: $('#wave-canvas'),
};

// ========== Tab Switching ==========
function switchTab(mode) {
    state.mode = mode;

    // Update tab buttons
    elements.tabText.classList.toggle('active', mode === 'text');
    elements.tabFile.classList.toggle('active', mode === 'file');

    // Update sections
    elements.textSection.classList.toggle('hidden', mode !== 'text');
    elements.fileSection.classList.toggle('hidden', mode !== 'file');
}

elements.tabText.addEventListener('click', () => switchTab('text'));
elements.tabFile.addEventListener('click', () => switchTab('file'));

// ========== Character Count ==========
elements.textInput.addEventListener('input', () => {
    const len = elements.textInput.value.length;
    const max = 10000;
    elements.charCount.textContent = `${len.toLocaleString()} / ${max.toLocaleString()} caracteres`;
    elements.charCount.classList.toggle('warning', len > max * 0.8);
    elements.charCount.classList.toggle('danger', len >= max);
});

// ========== File Upload ==========
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function handleFile(file) {
    const allowedExt = ['.txt', '.docx', '.pptx', '.pdf', '.xlsx'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExt.includes(ext)) {
        showStatus(`Formato "${ext}" não suportado. Use: ${allowedExt.join(', ')}`, 'error');
        return;
    }

    if (file.size > 16 * 1024 * 1024) {
        showStatus('Arquivo muito grande. Máximo: 16MB.', 'error');
        return;
    }

    state.file = file;
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);
    elements.fileInfo.classList.add('visible');
    elements.dropzone.style.display = 'none';
    hideStatus();
}

function removeFile() {
    state.file = null;
    elements.fileInput.value = '';
    elements.fileInfo.classList.remove('visible');
    elements.dropzone.style.display = 'block';
}

elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

elements.fileRemove.addEventListener('click', removeFile);

// Drag & Drop
elements.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzone.classList.add('dragover');
});

elements.dropzone.addEventListener('dragleave', () => {
    elements.dropzone.classList.remove('dragover');
});

elements.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// ========== Speed Slider ==========
elements.speedSlider.addEventListener('input', () => {
    const val = parseInt(elements.speedSlider.value);
    const speed = (1 + val / 100).toFixed(1);
    elements.speedValue.textContent = speed + 'x';
});

// ========== Status Messages ==========
function showStatus(message, type = 'error') {
    const iconSvg = type === 'error'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

    elements.statusMessage.innerHTML = iconSvg + `<span>${message}</span>`;
    elements.statusMessage.className = `status-message visible ${type}`;
}

function hideStatus() {
    elements.statusMessage.classList.remove('visible');
}

// ========== Audio Generation ==========
async function generateAudio() {
    const btn = elements.generateBtn;

    // Validate input
    if (state.mode === 'text') {
        const text = elements.textInput.value.trim();
        if (!text) {
            showStatus('Por favor, insira um texto para gerar o áudio.', 'error');
            return;
        }
    } else {
        if (!state.file) {
            showStatus('Por favor, selecione um arquivo.', 'error');
            return;
        }
    }

    // Set loading state
    btn.classList.add('loading');
    btn.disabled = true;
    hideStatus();
    elements.playerCard.classList.remove('visible');

    try {
        let formData;
        const voice = elements.voiceSelect.value;
        const rate = elements.speedSlider.value;

        if (state.mode === 'file' && state.file) {
            formData = new FormData();
            formData.append('file', state.file);
            formData.append('voice', voice);
            formData.append('rate', rate);
        } else {
            formData = new FormData();
            formData.append('text', elements.textInput.value.trim());
            formData.append('voice', voice);
            formData.append('rate', rate);
        }

        const response = await fetch('/generate', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro desconhecido ao gerar áudio.');
        }

        // Get audio blob
        const blob = await response.blob();
        state.audioBlob = blob;

        // Revoke previous URL
        if (state.audioUrl) {
            URL.revokeObjectURL(state.audioUrl);
        }
        state.audioUrl = URL.createObjectURL(blob);

        // Setup audio player
        setupAudioPlayer(state.audioUrl);

        showStatus('Áudio gerado com sucesso!', 'success');
        elements.playerCard.classList.add('visible');

    } catch (error) {
        showStatus(error.message, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

elements.generateBtn.addEventListener('click', generateAudio);

// ========== Audio Player ==========
function setupAudioPlayer(url) {
    // Stop previous audio
    if (state.audioElement) {
        state.audioElement.pause();
        state.audioElement.src = '';
    }

    const audio = new Audio(url);
    state.audioElement = audio;
    state.isPlaying = false;
    updatePlayButton();

    audio.addEventListener('loadedmetadata', () => {
        elements.timeDuration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100;
        elements.progressFill.style.width = progress + '%';
        elements.timeCurrent.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
        state.isPlaying = false;
        updatePlayButton();
        elements.progressFill.style.width = '0%';
        elements.timeCurrent.textContent = '0:00';
        stopVisualization();
    });

    // Setup audio context for visualization
    setupAudioContext(audio);
}

function togglePlay() {
    if (!state.audioElement) return;

    if (state.isPlaying) {
        state.audioElement.pause();
        stopVisualization();
    } else {
        state.audioElement.play();
        startVisualization();
    }
    state.isPlaying = !state.isPlaying;
    updatePlayButton();
}

function updatePlayButton() {
    const icon = state.isPlaying
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    elements.playBtn.innerHTML = icon;
}

elements.playBtn.addEventListener('click', togglePlay);

// Progress bar seeking
elements.progressWrapper.addEventListener('click', (e) => {
    if (!state.audioElement) return;
    const rect = elements.progressWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    state.audioElement.currentTime = percent * state.audioElement.duration;
});

// ========== Waveform Visualization ==========
function setupAudioContext(audioEl) {
    try {
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const source = state.audioContext.createMediaElementSource(audioEl);
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 256;

        source.connect(state.analyser);
        state.analyser.connect(state.audioContext.destination);
    } catch (e) {
        // AudioContext already connected or unsupported — fallback to static visualization
        drawStaticWaveform();
    }
}

function startVisualization() {
    if (!state.analyser) {
        drawStaticWaveform();
        return;
    }

    const canvas = elements.waveCanvas;
    const ctx = canvas.getContext('2d');
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    function draw() {
        state.animationFrame = requestAnimationFrame(draw);
        state.analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

            const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
            gradient.addColorStop(0, 'rgba(124, 58, 237, 0.6)');
            gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.8)');
            gradient.addColorStop(1, 'rgba(6, 182, 212, 0.9)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, 2);
            ctx.fill();

            x += barWidth;
        }
    }

    draw();
}

function stopVisualization() {
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    drawStaticWaveform();
}

function drawStaticWaveform() {
    const canvas = elements.waveCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bars = 60;
    const barWidth = canvas.width / bars;
    const centerY = canvas.height / 2;

    for (let i = 0; i < bars; i++) {
        const height = Math.random() * 15 + 5;
        const gradient = ctx.createLinearGradient(0, centerY - height, 0, centerY + height);
        gradient.addColorStop(0, 'rgba(124, 58, 237, 0.2)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(i * barWidth + 1, centerY - height, barWidth - 2, height * 2, 2);
        ctx.fill();
    }
}

// ========== Download ==========
elements.downloadBtn.addEventListener('click', () => {
    if (!state.audioBlob) return;

    const link = document.createElement('a');
    link.href = state.audioUrl;
    link.download = 'resumo_audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ========== Utilities ==========
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ========== Init ==========
window.addEventListener('load', () => {
    drawStaticWaveform();
    window.addEventListener('resize', () => {
        if (!state.isPlaying) drawStaticWaveform();
    });
});
