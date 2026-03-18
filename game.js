/* =========================================
   Block Blast! — Game Engine
   ========================================= */

(function () {
    'use strict';

    // ── Constants ──────────────────────────────
    const GRID_SIZE = 8;
    const POINTS_PER_BLOCK = 10;
    const LINE_BASE = 100;
    const COMBO_MULTIPLIER = 1.5;
    const BOARD_CLEAR_BONUS = 500;

    // ── Color Palettes — each palette is used until the board is fully cleared ──
    const COLOR_PALETTES = [
        ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#e67e22', '#1abc9c', '#e84393'],
        ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8', '#3a0ca3', '#3f37c9', '#4895ef'],
        ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#36d399', '#f87171'],
        ['#e63946', '#f4a261', '#2a9d8f', '#264653', '#e9c46a', '#f4845f', '#a8dadc', '#457b9d'],
        ['#06d6a0', '#118ab2', '#ef476f', '#ffd166', '#073b4c', '#83c5be', '#e29578', '#6d6875'],
        ['#c9184a', '#ff758f', '#ff7eb3', '#7b2cbf', '#5a189a', '#3c096c', '#e0aaff', '#48bfe3'],
        ['#fb5607', '#ff006e', '#8338ec', '#3a86ff', '#ffbe0b', '#06d6a0', '#e63946', '#a7c957'],
    ];

    // ── Piece Definitions ──
    // Each piece is an array of [row, col] offsets from top-left
    const PIECE_TEMPLATES = [
        // 1-cell
        { name: '1x1', cells: [[0, 0]] },

        // 2-cells
        { name: '1x2', cells: [[0, 0], [0, 1]] },
        { name: '2x1', cells: [[0, 0], [1, 0]] },

        // 3-cells
        { name: '1x3', cells: [[0, 0], [0, 1], [0, 2]] },
        { name: '3x1', cells: [[0, 0], [1, 0], [2, 0]] },
        { name: 'L3r', cells: [[0, 0], [1, 0], [1, 1]] },
        { name: 'L3l', cells: [[0, 1], [1, 0], [1, 1]] },
        { name: 'L3ru', cells: [[0, 0], [0, 1], [1, 0]] },
        { name: 'L3lu', cells: [[0, 0], [0, 1], [1, 1]] },

        // 4-cells
        { name: '1x4', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
        { name: '4x1', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
        { name: '2x2', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
        { name: 'T4d', cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
        { name: 'T4u', cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
        { name: 'S4', cells: [[0, 1], [0, 2], [1, 0], [1, 1]] },
        { name: 'Z4', cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
        { name: 'L4r', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
        { name: 'L4l', cells: [[0, 1], [1, 1], [2, 0], [2, 1]] },
        { name: 'L4rd', cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
        { name: 'L4ld', cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },

        // 5-cells: 1x5 and 5x1
        { name: '1x5', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
        { name: '5x1', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },

        // L-shapes big
        { name: 'Lbig1', cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
        { name: 'Lbig2', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
        { name: 'Lbig3', cells: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
        { name: 'Lbig4', cells: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]] },

        // 3x3
        { name: '3x3', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
    ];

    // ── State ──────────────────────────────────
    let grid = [];           // 8x8: null or color-string
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('blockblast_best') || '0', 10);
    let currentPieces = [null, null, null]; // 3 piece objects or null
    let comboCount = 0;
    let currentPaletteIndex = 0;
    let dragging = null;     // { pieceIndex, piece, ghost, offsetR, offsetC }

    // ── DOM ────────────────────────────────────
    const gridEl = document.getElementById('grid');
    const gridContainer = document.getElementById('grid-container');
    const scoreEl = document.getElementById('score');
    const bestScoreEl = document.getElementById('best-score');
    const comboIndicator = document.getElementById('combo-indicator');
    const comboText = document.getElementById('combo-text');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const finalScoreEl = document.getElementById('final-score');
    const finalBestScoreEl = document.getElementById('final-best-score');
    const restartBtn = document.getElementById('restart-btn');
    const pieceSlots = [
        document.getElementById('slot-0'),
        document.getElementById('slot-1'),
        document.getElementById('slot-2'),
    ];

    let cells = []; // 2D array of DOM cell elements

    // ── Utility ────────────────────────────────
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getPalette() {
        return COLOR_PALETTES[currentPaletteIndex % COLOR_PALETTES.length];
    }

    function randomColor() {
        const pal = getPalette();
        return pal[Math.floor(Math.random() * pal.length)];
    }

    function nextPalette() {
        currentPaletteIndex = (currentPaletteIndex + 1) % COLOR_PALETTES.length;
    }

    // ── Grid Logic ─────────────────────────────
    function initGrid() {
        grid = [];
        gridEl.innerHTML = '';
        cells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            grid[r] = [];
            cells[r] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                grid[r][c] = null;
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                gridEl.appendChild(cell);
                cells[r][c] = cell;
            }
        }
    }

    function renderGrid() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = cells[r][c];
                if (grid[r][c]) {
                    cell.style.background = grid[r][c];
                    cell.classList.add('filled');
                } else {
                    cell.style.background = '';
                    cell.classList.remove('filled');
                }
                cell.classList.remove('preview', 'preview-invalid', 'clearing');
            }
        }
    }

    function canPlace(piece, startR, startC) {
        for (const [dr, dc] of piece.cells) {
            const r = startR + dr;
            const c = startC + dc;
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
            if (grid[r][c]) return false;
        }
        return true;
    }

    function canPlaceAnywhere(piece) {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (canPlace(piece, r, c)) return true;
            }
        }
        return false;
    }

    function placePiece(piece, startR, startC) {
        const placed = [];
        for (const [dr, dc] of piece.cells) {
            const r = startR + dr;
            const c = startC + dc;
            grid[r][c] = piece.color;
            placed.push([r, c]);
        }
        // Animate placed cells
        for (const [r, c] of placed) {
            const cell = cells[r][c];
            cell.style.background = piece.color;
            cell.classList.add('filled', 'placed');
            setTimeout(() => cell.classList.remove('placed'), 260);
        }

        score += piece.cells.length * POINTS_PER_BLOCK;
        updateScore();
    }

    // ── Line Clearing ──────────────────────────
    function findFullLines() {
        const rowsToClear = [];
        const colsToClear = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            if (grid[r].every(c => c !== null)) rowsToClear.push(r);
        }
        for (let c = 0; c < GRID_SIZE; c++) {
            let full = true;
            for (let r = 0; r < GRID_SIZE; r++) {
                if (!grid[r][c]) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }
        return { rowsToClear, colsToClear };
    }

    function clearLines(rowsToClear, colsToClear) {
        if (rowsToClear.length === 0 && colsToClear.length === 0) {
            comboCount = 0;
            return;
        }

        comboCount++;
        const totalLines = rowsToClear.length + colsToClear.length;
        let linePoints = totalLines * LINE_BASE;
        if (comboCount > 1) {
            linePoints = Math.floor(linePoints * Math.pow(COMBO_MULTIPLIER, comboCount - 1));
        }
        score += linePoints;

        // Gather cells to clear (unique)
        const toClear = new Set();
        for (const r of rowsToClear) {
            for (let c = 0; c < GRID_SIZE; c++) toClear.add(`${r},${c}`);
        }
        for (const c of colsToClear) {
            for (let r = 0; r < GRID_SIZE; r++) toClear.add(`${r},${c}`);
        }

        // Animate clearing
        for (const key of toClear) {
            const [r, c] = key.split(',').map(Number);
            cells[r][c].classList.add('clearing');
        }

        // Show combo text
        if (comboCount > 1) {
            showCombo(comboCount, totalLines);
        } else if (totalLines >= 2) {
            showCombo(0, totalLines);
        }

        // Show score pop near the grid
        showScorePop(linePoints);

        // After animation, remove
        setTimeout(() => {
            for (const key of toClear) {
                const [r, c] = key.split(',').map(Number);
                grid[r][c] = null;
                cells[r][c].classList.remove('clearing', 'filled');
                cells[r][c].style.background = '';
            }

            // Check if entire board is now empty → change palette
            const boardEmpty = grid.every(row => row.every(cell => cell === null));
            if (boardEmpty) {
                nextPalette();
                score += BOARD_CLEAR_BONUS;
                showCombo(0, 0, true);
                gridContainer.classList.add('board-clear-flash');
                setTimeout(() => gridContainer.classList.remove('board-clear-flash'), 650);
            }

            updateScore();
            updatePiecePlayability();
        }, 420);
    }

    function showCombo(combo, lines, boardClear) {
        comboIndicator.classList.remove('hidden');
        if (boardClear) {
            comboText.textContent = '🌟 PANO TEMİZ! 🌟';
        } else if (combo > 1) {
            comboText.textContent = `🔥 ${combo}x KOMBO!`;
        } else {
            comboText.textContent = `✨ ${lines} SATIR!`;
        }
        // Force re-animate
        comboText.style.animation = 'none';
        void comboText.offsetHeight;
        comboText.style.animation = '';
        setTimeout(() => comboIndicator.classList.add('hidden'), 900);
    }

    function showScorePop(points) {
        const pop = document.createElement('div');
        pop.className = 'score-pop';
        pop.textContent = `+${points}`;
        const rect = gridContainer.getBoundingClientRect();
        pop.style.left = `${rect.left + rect.width / 2}px`;
        pop.style.top = `${rect.top + rect.height / 2}px`;
        document.body.appendChild(pop);
        setTimeout(() => pop.remove(), 1050);
    }

    // ── Scoring ────────────────────────────────
    function updateScore() {
        scoreEl.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('blockblast_best', bestScore);
        }
        bestScoreEl.textContent = bestScore;
    }

    // ── Piece Generation ───────────────────────
    function generatePiece() {
        const template = PIECE_TEMPLATES[randomInt(0, PIECE_TEMPLATES.length - 1)];
        return {
            ...template,
            color: randomColor(),
        };
    }

    function spawnPieceSet() {
        for (let i = 0; i < 3; i++) {
            currentPieces[i] = generatePiece();
        }
        renderPieces();
    }

    function renderPieces() {
        for (let i = 0; i < 3; i++) {
            const slot = pieceSlots[i];
            slot.innerHTML = '';
            const piece = currentPieces[i];
            if (!piece) continue;

            // Calculate bounding box
            let maxR = 0, maxC = 0;
            for (const [r, c] of piece.cells) {
                if (r > maxR) maxR = r;
                if (c > maxC) maxC = c;
            }
            const rows = maxR + 1;
            const cols = maxC + 1;

            const pieceEl = document.createElement('div');
            pieceEl.classList.add('piece');
            pieceEl.dataset.index = i;
            pieceEl.style.gridTemplateColumns = `repeat(${cols}, var(--piece-cell-size))`;
            pieceEl.style.gridTemplateRows = `repeat(${rows}, var(--piece-cell-size))`;

            // Build cell map
            const cellSet = new Set(piece.cells.map(([r, c]) => `${r},${c}`));
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const cellEl = document.createElement('div');
                    cellEl.classList.add('piece-cell');
                    if (cellSet.has(`${r},${c}`)) {
                        cellEl.style.background = piece.color;
                    } else {
                        cellEl.classList.add('empty-cell');
                    }
                    pieceEl.appendChild(cellEl);
                }
            }

            // Check if placeable
            if (!canPlaceAnywhere(piece)) {
                pieceEl.classList.add('cannot-place');
            }

            slot.appendChild(pieceEl);
            setupDrag(pieceEl, i);
        }
    }

    function updatePiecePlayability() {
        for (let i = 0; i < 3; i++) {
            const piece = currentPieces[i];
            if (!piece) continue;
            const slot = pieceSlots[i];
            const pieceEl = slot.querySelector('.piece');
            if (!pieceEl) continue;
            if (!canPlaceAnywhere(piece)) {
                pieceEl.classList.add('cannot-place');
            } else {
                pieceEl.classList.remove('cannot-place');
            }
        }
    }

    // ── Drag & Drop ────────────────────────────
    function setupDrag(pieceEl, index) {
        // Touch events
        pieceEl.addEventListener('touchstart', (e) => onDragStart(e, index), { passive: false });
        // Mouse events
        pieceEl.addEventListener('mousedown', (e) => onDragStart(e, index));
    }

    function onDragStart(e, index) {
        e.preventDefault();
        const piece = currentPieces[index];
        if (!piece) return;

        const touch = e.touches ? e.touches[0] : e;

        // Create ghost
        const ghost = createGhost(piece);
        document.body.appendChild(ghost);

        // Compute offset to center the ghost's (0,0) cell on the pointer
        // but lifted above finger for visibility
        const cellPx = getCellPixelSize();
        let maxR = 0, maxC = 0;
        for (const [r, c] of piece.cells) {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }

        dragging = {
            pieceIndex: index,
            piece,
            ghost,
            rows: maxR + 1,
            cols: maxC + 1,
        };

        // Mark the original as semi-transparent
        const slotPiece = pieceSlots[index].querySelector('.piece');
        if (slotPiece) slotPiece.style.opacity = '0.3';

        moveGhost(touch.clientX, touch.clientY);

        if (e.touches) {
            document.addEventListener('touchmove', onDragMove, { passive: false });
            document.addEventListener('touchend', onDragEnd);
        } else {
            document.addEventListener('mousemove', onDragMove);
            document.addEventListener('mouseup', onDragEnd);
        }
    }

    function onDragMove(e) {
        e.preventDefault();
        if (!dragging) return;
        const touch = e.touches ? e.touches[0] : e;
        moveGhost(touch.clientX, touch.clientY);
        showPreview(touch.clientX, touch.clientY);
    }

    function onDragEnd(e) {
        if (!dragging) return;
        const touch = e.changedTouches ? e.changedTouches[0] : e;
        const pos = getGridPosition(touch.clientX, touch.clientY);

        // Restore piece slot opacity
        const slotPiece = pieceSlots[dragging.pieceIndex].querySelector('.piece');
        if (slotPiece) slotPiece.style.opacity = '';

        if (pos && canPlace(dragging.piece, pos.row, pos.col)) {
            placePiece(dragging.piece, pos.row, pos.col);
            currentPieces[dragging.pieceIndex] = null;
            pieceSlots[dragging.pieceIndex].innerHTML = '';

            // Check lines
            const { rowsToClear, colsToClear } = findFullLines();
            clearLines(rowsToClear, colsToClear);

            updateScore();

            // Check if all pieces used → spawn new set
            if (currentPieces.every(p => p === null)) {
                setTimeout(() => {
                    spawnPieceSet();
                    checkGameOver();
                }, 480);
            } else {
                setTimeout(() => {
                    updatePiecePlayability();
                    checkGameOver();
                }, 480);
            }
        }

        // Cleanup preview
        clearPreview();
        if (dragging.ghost) dragging.ghost.remove();
        dragging = null;

        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
    }

    function createGhost(piece) {
        let maxR = 0, maxC = 0;
        for (const [r, c] of piece.cells) {
            if (r > maxR) maxR = r;
            if (c > maxC) maxC = c;
        }
        const rows = maxR + 1;
        const cols = maxC + 1;

        const ghost = document.createElement('div');
        ghost.classList.add('drag-ghost');
        ghost.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        ghost.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        const cellSet = new Set(piece.cells.map(([r, c]) => `${r},${c}`));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellEl = document.createElement('div');
                cellEl.classList.add('piece-cell');
                if (cellSet.has(`${r},${c}`)) {
                    cellEl.style.background = piece.color;
                } else {
                    cellEl.classList.add('empty-cell');
                }
                ghost.appendChild(cellEl);
            }
        }
        return ghost;
    }

    function moveGhost(clientX, clientY) {
        if (!dragging || !dragging.ghost) return;
        const cellPx = getCellPixelSize();
        const gap = 2;
        // Position ghost top-left so the (0,0) cell is centered on pointer, shifted up
        const ghostLeft = clientX - cellPx / 2;
        const ghostTop = clientY - 80 - cellPx / 2;
        dragging.ghost.style.left = `${ghostLeft}px`;
        dragging.ghost.style.top = `${ghostTop}px`;
    }

    function getCellPixelSize() {
        if (cells[0] && cells[0][0]) {
            return cells[0][0].getBoundingClientRect().width;
        }
        return 52;
    }

    function getGridPosition(clientX, clientY) {
        const cellPx = getCellPixelSize();
        const gap = 2;
        const step = cellPx + gap;
        const gridRect = gridEl.getBoundingClientRect();

        // Ghost top-left corner position (matches moveGhost)
        const ghostLeft = clientX - cellPx / 2;
        const ghostTop = clientY - 80 - cellPx / 2;

        // Snap ghost top-left to nearest grid cell
        const col = Math.round((ghostLeft - gridRect.left) / step);
        const row = Math.round((ghostTop - gridRect.top) / step);

        if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) return null;
        return { row, col };
    }

    function showPreview(clientX, clientY) {
        clearPreview();
        if (!dragging) return;
        const pos = getGridPosition(clientX, clientY);
        if (!pos) return;

        const valid = canPlace(dragging.piece, pos.row, pos.col);
        for (const [dr, dc] of dragging.piece.cells) {
            const r = pos.row + dr;
            const c = pos.col + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                if (valid) {
                    cells[r][c].classList.add('preview');
                    cells[r][c].style.background = dragging.piece.color;
                } else {
                    cells[r][c].classList.add('preview-invalid');
                }
            }
        }
    }

    function clearPreview() {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                cells[r][c].classList.remove('preview', 'preview-invalid');
                if (!grid[r][c]) {
                    cells[r][c].style.background = '';
                }
            }
        }
    }

    // ── Game Over ──────────────────────────────
    function checkGameOver() {
        const remaining = currentPieces.filter(p => p !== null);
        if (remaining.length === 0) return; // new set spawning

        const anyPlayable = remaining.some(p => canPlaceAnywhere(p));
        if (!anyPlayable) {
            setTimeout(() => showGameOver(), 300);
        }
    }

    function showGameOver() {
        finalScoreEl.textContent = score;
        finalBestScoreEl.textContent = bestScore;
        gameOverOverlay.classList.remove('hidden');
    }

    function restart() {
        gameOverOverlay.classList.add('hidden');
        score = 0;
        comboCount = 0;
        currentPaletteIndex = randomInt(0, COLOR_PALETTES.length - 1);
        initGrid();
        updateScore();
        spawnPieceSet();
    }

    // ── Init ───────────────────────────────────
    function init() {
        currentPaletteIndex = randomInt(0, COLOR_PALETTES.length - 1);
        initGrid();
        updateScore();
        spawnPieceSet();

        restartBtn.addEventListener('click', restart);

        // Prevent context menu on long-press (mobile)
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    init();
})();
