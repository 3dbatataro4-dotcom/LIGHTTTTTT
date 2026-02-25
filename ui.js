if (typeof window.game === 'undefined') window.game = {};

// 定義地點座標與名稱 (用於計算距離)
const LOCATIONS = {
    'port': { x: 450, y: 70, name: '港口' },
    'hall': { x: 450, y: 350, name: '村長家' },
    'guild': { x: 200, y: 200, name: '委託社' },
    'store': { x: 700, y: 200, name: '補給站' },
    'tavern': { x: 450, y: 600, name: '酒館' },
    'inn': { x: 200, y: 550, name: '旅館' },
    'warehouse': { x: 820, y: 350, name: '倉庫' },
    'casino': { x: 700, y: 550, name: '賭場' },
    'blackmarket': { x: 80, y: 350, name: '黑市' }
};

Object.assign(window.game, {
    // --- 模式切換與地圖 ---
    switchMode: function(mode) {
        document.getElementById('tab-town').classList.toggle('active', mode === 'town');
        document.getElementById('tab-ship').classList.toggle('active', mode === 'ship');
        const menuArea = document.getElementById('port-menu-area');
        if(menuArea) menuArea.style.display = 'none'; 
        const mainContent = document.getElementById('main-content');

        if (mode === 'town') {
            this.inTownMap = true;
            const isNight = this.hour >= 18 || this.hour < 6;
            const lightOp = isNight ? 0.9 : 0; // 燈光透明度 (白天為0)
            // 優化：夜晚使用徑向漸層，周圍更暗，中心稍亮
            const nightOverlay = isNight ? `<rect width="100%" height="100%" fill="url(#night-gradient)" style="pointer-events:none;" />` : '';

            mainContent.innerHTML = `
                <div class="holo-container">
                    <div id="map-tooltip" style="position:absolute; display:none; background:rgba(0,0,0,0.9); border:1px solid var(--sonar); padding:8px 12px; color:#fff; z-index:20; pointer-events:none; font-size:0.9rem; border-radius:4px; box-shadow:0 0 10px var(--sonar-dim); white-space:nowrap;"></div>
                    <div class="scanline"></div>
                    <div class="map-layer">
                        <svg viewBox="0 0 900 700">
                            <defs>
                                <pattern id="grid" x="0" y="20" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--sonar)" stroke-opacity="0.15" stroke-width="1"/></pattern>
                                <!-- 優化：燈光暈染濾鏡 -->
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                                <!-- 優化：夜晚漸層 -->
                                <radialGradient id="night-gradient" cx="50%" cy="50%" r="80%"><stop offset="0%" stop-color="rgba(0, 10, 30, 0.3)" /><stop offset="100%" stop-color="rgba(0, 5, 15, 0.9)" /></radialGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            ${nightOverlay}
                            
                            <!-- 裝飾：海浪 (北方海域) -->
                            <path d="M 0 40 Q 50 10 100 40 T 200 40 T 300 40 T 400 40 T 500 40 T 600 40 T 700 40 T 800 40 T 900 40" fill="none" stroke="var(--sonar)" stroke-opacity="0.2" stroke-width="1" />
                            <path d="M 50 60 Q 100 30 150 60 T 250 60 T 350 60 T 450 60 T 550 60 T 650 60 T 750 60 T 850 60" fill="none" stroke="var(--sonar)" stroke-opacity="0.15" stroke-width="1" />

                            <!-- 道路連接線 -->
                            <path class="map-line" d="M 450 70 L 450 350 M 200 200 L 450 350 L 700 200 M 200 550 L 450 350 L 700 550 M 450 350 L 450 600 M 200 200 L 200 550 M 700 200 L 700 550 M 700 200 L 820 350 L 700 550 M 80 350 L 200 200 M 80 350 L 200 550" />
                            
                            <!-- 中心裝飾 -->
                            <circle cx="450" cy="350" r="60" fill="none" stroke="var(--sonar)" stroke-opacity="0.3" stroke-width="2" />
                            
                            <g class="building-group" transform="translate(450, 350)" onclick="game.travelTo('hall')" data-desc="🏛️ 村長家：升級船隻設施">
                                <rect class="map-building" x="-40" y="-40" width="80" height="80" transform="rotate(45)" />
                                <circle cx="-15" cy="-15" r="6" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" transform="rotate(45)" />
                                <circle cx="15" cy="15" r="6" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" transform="rotate(45)" />
                                <text class="building-label" x="0" y="70" text-anchor="middle" font-size="24">🏛️ 村長家 (HALL)</text>
                            </g>
                            <g class="building-group" transform="translate(200, 200)" onclick="game.travelTo('guild')" data-desc="📜 委託社：承接探索任務">
                                <polygon class="map-building" points="-30,30 30,30 0,-40" />
                                <rect x="-5" y="0" width="10" height="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="60" text-anchor="middle" font-size="24">📜 委託社 (GUILD)</text>
                            </g>
                            <g class="building-group" transform="translate(700, 200)" onclick="game.travelTo('store')" data-desc="🛒 補給站：購買生存物資">
                                <rect class="map-building" x="-35" y="-25" width="70" height="50" />
                                <rect x="-25" y="-15" width="20" height="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <rect x="5" y="-15" width="20" height="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="55" text-anchor="middle" font-size="24">🛒 補給站 (STORE)</text>
                            </g>
                            <g class="building-group" transform="translate(450, 600)" onclick="game.travelTo('tavern')" data-desc="🍺 酒館：招募強力傭兵">
                                <circle class="map-building" r="35" />
                                <circle r="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="65" text-anchor="middle" font-size="24">🍺 酒館 (TAVERN)</text>
                            </g>
                            <g class="building-group" transform="translate(200, 550)" onclick="game.travelTo('inn')" data-desc="🛌 旅館：休息恢復狀態">
                                <rect class="map-building" x="-30" y="-30" width="60" height="60" rx="10" />
                                <rect x="-20" y="-20" width="15" height="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <rect x="5" y="-20" width="15" height="15" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="60" text-anchor="middle" font-size="24">🛌 旅館 (INN)</text>
                            </g>
                            <g class="building-group" transform="translate(820, 350)" onclick="game.travelTo('warehouse')" data-desc="📦 倉庫：管理道具與背包">
                                <rect class="map-building" x="-35" y="-35" width="70" height="70" />
                                <rect x="-25" y="-25" width="15" height="10" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <rect x="10" y="-25" width="15" height="10" fill="#FFD54F" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="65" text-anchor="middle" font-size="24">📦 倉庫 (STORAGE)</text>
                            </g>
                            <g class="building-group" transform="translate(700, 550)" onclick="game.travelTo('casino')" data-desc="🎰 賭場：以小博大的娛樂場所">
                                <rect class="map-building" x="-30" y="-30" width="60" height="60" rx="5" transform="rotate(15)" />
                                <rect x="-20" y="-20" width="40" height="40" fill="#E91E63" opacity="${lightOp}" filter="url(#glow)" transform="rotate(15)" />
                                <text class="building-label" x="0" y="55" text-anchor="middle" font-size="24">🎰 賭場 (CASINO)</text>
                            </g>
                            <g class="building-group" transform="translate(80, 350)" onclick="game.travelTo('blackmarket')" data-desc="🕵️ 黑市：稀有違禁品">
                                <path class="map-building" d="M -30 0 L 30 0 L 0 -50 Z" fill="#333" stroke="var(--purple)" />
                                <rect x="-10" y="-20" width="20" height="20" fill="var(--purple)" opacity="${lightOp}" filter="url(#glow)" />
                                <text class="building-label" x="0" y="40" text-anchor="middle" font-size="24" fill="var(--purple)">🕵️ 黑市 (MARKET)</text>
                            </g>
                            <g class="building-group" transform="translate(450, 70)" onclick="game.travelTo('port')">
                                <path class="map-building" d="M -50 0 L 50 0 L 40 30 L -40 30 Z" />
                                <rect class="map-building" x="-5" y="-30" width="10" height="30" />
                                <circle cx="0" cy="-35" r="4" fill="#FF5252" opacity="${isNight ? 1 : 0.2}" filter="url(#glow)" class="b-light" />
                                <text class="building-label" x="0" y="55" text-anchor="middle">⚓ 港口 (PORT)</text>
                            </g>
                            <text x="450" y="680" fill="var(--sonar)" font-size="18" text-anchor="middle" letter-spacing="5px" opacity="0.5" style="pointer-events:none;">SECTOR-7 PORT HOLOMAP</text>
                        </svg>
                    </div>
                </div>`;
            setTimeout(() => this.initMapControls(), 50);
            this.updateUI();
        } else {
            this.inTownMap = false;
            if (typeof this.renderCmds === 'function') this.renderCmds(); 
            this.openShipMenu();
        }
    },

    // --- 新增：移動系統 ---
    travelTo: function(targetId) {
        // 安全檢查：防止 currentLocation 無效導致崩潰
        if (!this.currentLocation || !LOCATIONS[this.currentLocation]) this.currentLocation = 'port';
        
        if (this.currentLocation === targetId) { this.openTab(targetId); return; }

        const start = LOCATIONS[this.currentLocation];
        const end = LOCATIONS[targetId];
        
        // 安全檢查：防止座標無效 (直接跳轉)
        if (!start || !end) {
            this.currentLocation = targetId;
            this.openTab(targetId);
            return;
        }
        
        this.inTownMap = false;
        this.stopWeather(); // 強制停止天氣特效

        // 計算距離並轉換為消耗 (每100px = 0.2小時, 2疲勞)
        const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const timeCost = Math.ceil((dist / 100) * 0.2 * 10) / 10; // 小時 (保留一位小數)
        const fatigueCost = Math.ceil(dist / 100 * 2);
        
        if (typeof this.addTime === 'function') this.addTime(timeCost);
        this.fatigue += fatigueCost;
        this.currentLocation = targetId;
        
        this.log(`🚶 前往${end.name} (耗時 ${timeCost}h, 疲勞 +${fatigueCost})`, "color:#aaa");
        this.openTab(targetId);
        this.updateUI();        // 再更新 UI，這樣天氣系統才能正確判斷是否該停止雨滴
    },

    initMapControls: function(targetSvg = null) {
        const svg = targetSvg || document.querySelector('.holo-container svg');
        if (!svg) return;
        let vb = { x: 0, y: 0, w: 900, h: 700 }; // 更新預設視野以適應新地圖尺寸
        let isDown = false; let startX, startY;
        const updateViewBox = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
        const startDrag = (x, y) => { isDown = true; startX = x; startY = y; svg.style.cursor = 'grabbing'; };
        const moveDrag = (x, y) => {
            if (!isDown) return;
            const scaleX = vb.w / svg.clientWidth; const scaleY = vb.h / svg.clientHeight;
            vb.x -= (x - startX) * scaleX; vb.y -= (y - startY) * scaleY;
            startX = x; startY = y; updateViewBox();
        };
        const endDrag = () => { isDown = false; svg.style.cursor = 'grab'; };
        svg.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => { if(isDown) { e.preventDefault(); moveDrag(e.clientX, e.clientY); } });
        window.addEventListener('mouseup', endDrag);
        svg.addEventListener('touchstart', e => { if(e.touches.length===1) startDrag(e.touches[0].clientX, e.touches[0].clientY); });
        svg.addEventListener('touchmove', e => { if(e.touches.length===1) moveDrag(e.touches[0].clientX, e.touches[0].clientY); });
        svg.addEventListener('touchend', endDrag);
        svg.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.1 : 0.9;
            const newW = vb.w * factor, newH = vb.h * factor;
            vb.x += (vb.w - newW) / 2; vb.y += (vb.h - newH) / 2;
            vb.w = newW; vb.h = newH; updateViewBox();
        });
        const tooltip = document.getElementById('map-tooltip');
        document.querySelectorAll('.building-group').forEach(g => {
            g.addEventListener('mouseenter', () => { const desc = g.getAttribute('data-desc'); if(desc) { tooltip.innerHTML = desc; tooltip.style.display = 'block'; } });
            g.addEventListener('mousemove', (e) => { const rect = document.querySelector('.holo-container').getBoundingClientRect(); tooltip.style.left = (e.clientX - rect.left + 15) + 'px'; tooltip.style.top = (e.clientY - rect.top + 15) + 'px'; });
            g.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        });
    },

    openShipMenu: function() {
        const content = document.getElementById('main-content');
        content.innerHTML = `
            <h2 style="color:var(--sonar); border-bottom:1px dashed #333; padding-bottom:10px; margin-top:0;">⚓ 船艙主控台</h2>
            <div class="grid">
                <div class="tech-card" style="cursor:pointer; border-color:var(--sonar);" onclick="game.openTab('crew')">
                    <div class="card-header"><span class="card-title" style="font-size:1.2rem;">👥 船員管理</span></div>
                    <div class="card-body">檢視並管理船上的傭兵與狀態。</div>
                    <div style="color:var(--sonar); font-size:0.8rem; text-align:right;">點擊進入 &rarr;</div>
                </div>
                <div class="tech-card" style="cursor:pointer; border-color:var(--purple);" onclick="game.openBackpack()">
                    <div class="card-header"><span class="card-title" style="font-size:1.2rem; color:var(--purple);">🎒 船上背包</span></div>
                    <div class="card-body">查看與使用船上攜帶的道具。</div>
                    <div style="color:var(--purple); font-size:0.8rem; text-align:right;">點擊進入 &rarr;</div>
                </div>
                <div class="tech-card" style="cursor:pointer; border-color:var(--sonar);" onclick="game.openTab('codex')">
                    <div class="card-header"><span class="card-title" style="font-size:1.2rem;">📘 航海圖鑑</span></div>
                    <div class="card-body">檢視遭遇過的深海生物與異常。</div>
                    <div style="color:var(--sonar); font-size:0.8rem; text-align:right;">點擊進入 &rarr;</div>
                </div>
                <div class="tech-card" style="cursor:pointer; border-color:#90a4ae;" onclick="game.saveGame()">
                    <div class="card-header"><span class="card-title" style="font-size:1.2rem; color:#90a4ae;">💾 系統存檔</span></div>
                    <div class="card-body">保存進度或調整設定。</div>
                    <div style="color:#90a4ae; font-size:0.8rem; text-align:right;">點擊進入 &rarr;</div>
                </div>
            </div>
            <button class="btn-launch" style="width:100%; margin:20px 0 0 0; padding:20px; font-size:1.5rem;" onclick="game.checkLaunch()">🚀 啟動引擎出航</button>
        `;
        this.updateUI();
    },

    updateUI: function() {
        // 優化：使用狀態變數判斷是否顯示天氣，而非依賴 DOM 檢測
        if ((this.isVoyaging || this.inTownMap) && (this.weather === 'RAIN' || this.weather === 'STORM')) this.createRainEffect();
        else this.stopWeather();
        
        const seaLayer = document.getElementById('sea-layer');
        if (seaLayer) {
            if (this.fatigue > 90) seaLayer.classList.add('dizzy-effect');
            else seaLayer.classList.remove('dizzy-effect');
        }

        const set = (id, v) => { const el = document.getElementById(id); if(el) el.innerText = v; };
        set('uiMoney', this.money); set('uiFuel', this.fuel); set('maxFuel', this.maxFuel);
        set('uiFood', this.food); set('maxFood', this.maxFood);
        set('uiHp', this.hp); set('uiSan', this.san);
        set('uiCrew', this.crew.length); set('maxCrew', this.crewMax);
        set('uiFatigue', this.fatigue + '%');
        set('uiDay', `DAY ${this.day} / ${this.maxDays}`);
        
        const timeEl = document.getElementById('uiTime');
        if(timeEl) {
            let h = Math.floor(this.hour); let m = Math.round((this.hour - h) * 60);
            let mStr = m < 10 ? '0'+m : m;
            timeEl.innerText = `${h < 10 ? '0'+h : h}:${mStr}`;
            timeEl.style.color = this.hour >= 22 ? 'var(--alert)' : 'var(--text)';
        }

        const weatherEl = document.querySelector('.weather-text');
        if(weatherEl && typeof WEATHER_TYPES !== 'undefined' && WEATHER_TYPES[this.weather]) {
            weatherEl.innerText = `${WEATHER_TYPES[this.weather].icon} ${WEATHER_TYPES[this.weather].name}`;
            if (seaLayer) {
                seaLayer.classList.remove('weather-storm', 'weather-fog', 'weather-tailwind', 'weather-headwind');
                if (this.weather === 'STORM') seaLayer.classList.add('weather-storm');
                if (this.weather === 'FOG') seaLayer.classList.add('weather-fog');
                if (this.weather === 'TAILWIND') seaLayer.classList.add('weather-tailwind');
                if (this.weather === 'HEADWIND') seaLayer.classList.add('weather-headwind');
            }
        }
        
        const fatEl = document.getElementById('uiFatigue');
        if(fatEl) fatEl.classList.toggle('alert', this.fatigue > 50);
        const hpEl = document.getElementById('uiHp');
        if(hpEl) hpEl.style.color = this.hp <= 30 ? 'var(--alert)' : 'var(--sonar)';
    },

    // --- 核心 UI 渲染 (openTab) ---
    openTab: function(tabId) {
        this.inTownMap = false;
        this.stopWeather(); // 切換分頁時強制停止天氣特效
        const content = document.getElementById('main-content');
        let html = '';
        let backBtn = '';
        if (['crew', 'codex'].includes(tabId)) {
            backBtn = `<button class="tech-btn" style="margin-bottom:15px; width:auto; padding:8px 15px; border-color:#555; color:#aaa;" onclick="game.openShipMenu()">⬅ 返回主控台</button>`;
        } else {
            backBtn = `<button class="tech-btn" style="margin-bottom:15px; width:auto; padding:8px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.switchMode('town')">⬅ 返回小鎮地圖</button>`;
        }

        if (tabId === 'hall') {
            let maxCrew = this.crewMax >= 8; let maxFood = this.maxFood >= 300; let maxFuel = this.maxFuel >= 300;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            const bpEvents = (type, cost) => `oncontextmenu="return false;" onmousedown="game.handleBpPress(this, '${type}', ${cost}, event)" onmouseup="game.handleBpRelease(this)" onmouseleave="game.handleBpRelease(this)" ontouchstart="game.handleBpPress(this, '${type}', ${cost}, event)" ontouchcancel="game.handleBpRelease(this)" ontouchend="game.handleBpRelease(this)" onclick="if(!game.longPressTriggered) game.confirmUpgrade('${type}', ${cost})"`;
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('peter_win')">💬 與彼得閒聊 (通關)</button>` : ``;

            html = backBtn + `<div style="display:flex; flex-wrap:wrap; gap:20px;">
                <div style="flex:1; min-width:250px;">${this.npcHtml('peter')}${chatBtn}</div>
                <div style="flex:2; min-width:300px; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #333; padding-bottom:10px; margin-bottom:10px;">
                        <h3 style="color:var(--gold); margin:0;">🛠️ S.S. NOEMA 改造藍圖</h3>
                        ${isMobile ? '' : '<div style="font-size:0.8rem; color:#777;">(滾輪縮放 / 拖曳移動)</div>'}
                    </div>
                    <div id="blueprint-container" style="position:relative; width:100%; height:450px; background:#020609; border:1px solid var(--border); border-radius:8px; overflow:hidden; display:flex; justify-content:center; align-items:center; ${isMobile ? '' : 'cursor:grab;'}">
                        <div id="blueprint-content" style="position:relative; width:100%; height:100%; transform-origin:center center; display:flex; justify-content:center; align-items:center;">
                            <div style="position:absolute; width:100%; height:100%; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 20px 20px; opacity:0.3;"></div>
                            <svg width="200" height="380" viewBox="0 0 100 300" style="position:absolute; filter:drop-shadow(0 0 10px var(--sonar));">
                                <path d="M 50 10 L 95 80 L 85 260 L 50 280 L 15 260 L 5 80 Z" fill="rgba(0,176,255,0.03)" stroke="rgba(0,176,255,0.3)" stroke-width="1" stroke-dasharray="2 3"/>
                                <path d="M 50 30 L 80 90 L 70 250 L 50 260 L 30 250 L 20 90 Z" fill="rgba(0,10,15,0.9)" stroke="var(--sonar)" stroke-width="1.5"/>
                                <polygon points="50,110 65,140 35,140" fill="rgba(0,176,255,0.15)" stroke="var(--sonar)" stroke-width="1"/>
                                <rect x="38" y="260" width="8" height="15" fill="none" stroke="var(--alert)" stroke-width="1"/>
                                <rect x="54" y="260" width="8" height="15" fill="none" stroke="var(--alert)" stroke-width="1"/>
                                <line x1="50" y1="30" x2="50" y2="260" stroke="var(--sonar)" stroke-width="0.5" stroke-dasharray="4 2"/>
                            </svg>
                            <style>.bp-node { position:absolute; transform:translate(-50%, -50%); cursor:pointer; z-index:10; display:flex; flex-direction:column; align-items:center; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; } .bp-dot { width:12px; height:12px; background:var(--sonar); border-radius:50%; box-shadow:0 0 8px var(--sonar); animation:blink 2s infinite alternate; transition:0.3s; border: 2px solid #000; } .bp-label { margin-top:6px; color:#cfd8dc; font-size:0.75rem; background:rgba(0,10,15,0.85); border:1px solid var(--sonar); padding:4px 8px; border-radius:4px; white-space:nowrap; transition:0.3s; pointer-events:none; } .bp-node:hover .bp-dot { background:var(--gold); box-shadow:0 0 15px var(--gold); transform:scale(1.3); } .bp-node:hover .bp-label { border-color:var(--gold); color:var(--gold); z-index:20; transform:translateY(-2px); } .bp-bought .bp-dot { background: #4caf50; box-shadow:0 0 8px #4caf50; animation:none; border-color:#fff; } .bp-bought .bp-label { border-color: #4caf50; color: #4caf50; }</style>
                            <div class="bp-node ${this.upgrades.light ? 'bp-bought' : ''}" style="top: 15%; left: 50%;" ${bpEvents('light', 1500)}><div class="bp-dot"></div><div class="bp-label">💡 探照燈 $1500</div></div>
                            <div class="bp-node ${this.upgrades.armor ? 'bp-bought' : ''}" style="top: 35%; left: 25%;" ${bpEvents('armor', 2000)}><div class="bp-dot"></div><div class="bp-label">🛡️ 裝甲 $2000</div></div>
                            <div class="bp-node ${this.upgrades.torpedo ? 'bp-bought' : ''}" style="top: 35%; left: 75%;" ${bpEvents('torpedo', 3000)}><div class="bp-dot" style="${this.upgrades.torpedo ? '' : 'background:var(--alert); box-shadow:0 0 10px var(--alert);'}"></div><div class="bp-label">💥 魚雷 $3000</div></div>
                            <div class="bp-node ${maxCrew ? 'bp-bought bp-max' : ''}" style="top: 48%; left: 50%;" ${bpEvents('crew', 1000)}><div class="bp-dot"></div><div class="bp-label">👥 船員艙 ${maxCrew ? '(MAX)' : '(+1) $1000'}</div></div>
                            <div class="bp-node ${maxFood ? 'bp-bought bp-max' : ''}" style="top: 62%; left: 50%;" ${bpEvents('food', 500)}><div class="bp-dot"></div><div class="bp-label">🥫 糧倉 ${maxFood ? '(MAX)' : '(+50) $500'}</div></div>
                            <div class="bp-node ${maxFuel ? 'bp-bought bp-max' : ''}" style="top: 76%; left: 50%;" ${bpEvents('fuel', 500)}><div class="bp-dot"></div><div class="bp-label">🔋 能源箱 ${maxFuel ? '(MAX)' : '(+50) $500'}</div></div>
                        </div>
                    </div>
                </div>
            </div>`;
            if (!isMobile) setTimeout(() => this.initBlueprintControls(), 50);
        } else if (tabId === 'store') {
            const sliderCard = (id, name, cur, maxVal, price) => {
                let affordable = Math.floor(this.money / price); let space = Math.floor(maxVal - cur); let maxBuy = Math.max(0, Math.min(affordable, space)); let isMax = cur >= maxVal;
                return `<div class="tech-card" style="border-color:var(--border); padding:15px;"><div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span style="color:var(--sonar); font-weight:bold;">${name} ($${price}/單位)</span><span style="color:#aaa;">容量: ${Math.floor(cur)}/${maxVal}</span></div>${isMax ? `<div style="color:var(--alert); text-align:center;">已達容量上限</div>` : `<div style="display:flex; gap:10px; align-items:center;"><input type="range" id="sl-${id}" min="0" max="${maxBuy}" value="0" style="flex:1;" oninput="document.getElementById('cst-${id}').innerText = this.value * ${price}; document.getElementById('amt-${id}').innerText = this.value;"><div style="min-width:60px; text-align:right; color:var(--gold);">$<span id="cst-${id}">0</span></div></div><button class="tech-btn" style="width:100%; margin-top:10px; border-color:var(--sonar); color:var(--sonar);" onclick="game.buyQuantity('${id}', document.getElementById('sl-${id}').value, ${price})">購買 <span id="amt-${id}">0</span> 單位</button>`}</div>`;
            };
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('lynn_win')">💬 與林恩閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('lynn') + chatBtn + `<div class="grid">${sliderCard('fuel', '燃油', this.fuel, this.maxFuel, 2)}${sliderCard('food', '口糧', this.food, this.maxFood, 3)}${sliderCard('hp', '船體裝甲修復', this.hp, 100, 5)}${this.sysCard('初級釣竿', '$150', '耐久度 10/10，開啟釣魚功能', `game.buyRod()`)}${this.sysCard('特製魚餌', '$50', '釣魚必備消耗品 (放入背包)', `game.buyBait()`)}${this.sysCard('捕魚網', '$120', '出航專用。有機率獲得<b>雙倍漁獲</b> (消耗品)', `game.buyNet()`)}</div>`;
        } else if (tabId === 'port') {
            let rodInInv = this.inventory.includes('fishing_rod');
            let rodStatus = rodInInv ? `<span style="color:var(--sonar)">耐久度: ${this.flags.rodDurability || 0}/10</span>` : `<span style="color:#777">未裝備 (在倉庫中)</span>`;
            if (!this.inventory.includes('fishing_rod') && !this.warehouse.includes('fishing_rod')) rodStatus = `<span style="color:var(--alert)">未購買釣竿</span>`;
            let rodDurText = this.flags.rodDurability > 0 ? `<div style="margin-top:5px; font-size:0.8rem; color:var(--sonar);">耐久度: ${this.flags.rodDurability}/10</div>` : `<div style="margin-top:5px; font-size:0.8rem; color:var(--alert);">耐久度: 0/10</div>`;
            
            // 優化：顯示詳細的魚餌分佈 (倉庫 + 背包)
            let baitWh = this.warehouse.filter(i => i === 'bait').length;
            let baitInv = this.inventory.filter(i => i === 'bait').length;
            let baitText = `<span style="color:var(--gold)">${baitWh}</span> (倉) + <span style="color:var(--purple)">${baitInv}</span> (包)`;

            html = backBtn + `<h2 style="color:var(--sonar); border-bottom:1px solid var(--sonar); padding-bottom:10px;">⚓ 廢棄港口區</h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="tech-card" style="border-color:var(--sonar);"><div class="card-header"><span class="card-title">原地釣魚</span><span style="font-size:0.8rem; color:#aaa;">港口沿岸</span></div><div class="card-body">在相對安全的港口消磨時間。漁獲普通，但至少不會遇到海怪。<br><div style="margin-top:10px; font-size:0.8rem; color:#777;">需要：釣竿(背包)、魚餌(倉庫)</div>${rodDurText}</div><button id="fish-btn" class="tech-btn" style="border-color:var(--sonar); color:var(--sonar);" onclick="game.startFishing()">拋出釣線</button></div>
                    <div class="tech-card" style="border-color:var(--gold);"><div class="card-header"><span class="card-title">出航捕魚</span><span style="font-size:0.8rem; color:#aaa;">近海探索</span></div><div class="card-body">駕駛船隻前往附近的漁場。風險與回報並存，請確保物資充足。<br><div style="margin-top:10px; font-size:0.8rem; color:#777;">需要：釣竿(背包)、燃料、食物</div></div><button class="tech-btn" style="border-color:var(--gold); color:var(--gold);" onclick="game.openFishingSelect()">選擇海域</button></div>
                </div>
                <div style="margin-top:15px; padding:10px; background:rgba(0,0,0,0.3); border:1px solid #333; display:flex; justify-content:space-around; font-size:0.9rem;"><div >🎣 釣竿狀態: ${rodStatus}</div><div>🪱 魚餌數量: ${baitText}</div></div>
                <h3 style="color:var(--gold); margin-top:25px;">🐟 漁獲交易</h3><div class="tech-card" style="border-color:var(--gold);"><div class="card-body" style="color:#aaa;">尋找買家出售背包裡的漁獲。運氣好的話，或許能遇到出手闊綽的神秘人物...</div><button class="tech-btn" style="border-color:var(--gold); color:var(--gold); margin-top:10px; width:100%;" onclick="game.findFishBuyer()">尋找買家出售</button></div>
                <h3 style="color:var(--sonar); margin-top:25px;">⛩️ 海神祭壇</h3><div class="tech-card" style="border-color:var(--sonar);"><div class="card-body" style="color:#aaa;">一座佈滿藤壺的古老石碑。據說只要投入錢幣，就能在下一次航行中獲得庇護。</div><button class="tech-btn" style="border-color:var(--sonar); color:var(--sonar); margin-top:10px; width:100%;" onclick="game.donateShrine()">祈求庇護 ($200)</button></div>
                <h3 style="color:#aaa; margin-top:20px;">💤 港口角落</h3><div class="tech-card" style="border-color:#555;"><div class="card-body" style="color:#aaa;">身無分文時，只能在充滿魚腥味的角落勉強瞇一下。雖然能恢復體力，但精神會變得更糟...</div><button class="tech-btn" style="border-color:#aaa; color:#aaa; margin-top:10px; width:100%;" onclick="game.openNapUI()">在角落小憩 (免費)</button></div>`;
        } else if (tabId === 'warehouse') {
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('manmu_win')">💬 與小目閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('manmu') + chatBtn + `<div style="display:flex; gap:15px; margin-top:10px; flex-wrap:wrap;"><div style="flex:1; min-width:250px; border:1px solid var(--sonar); padding:10px; background:rgba(0,0,0,0.5);"><h3 style="color:var(--sonar); margin-top:0; font-size:1rem;">🎒 船上背包 (${this.inventory.length}/${this.inventoryMax})</h3><div style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">點擊道具放回倉庫</div><div id="ui-inv-list">${this.renderItemList(this.inventory, 'toWarehouse')}</div></div><div style="flex:1; min-width:250px; border:1px solid var(--gold); padding:10px; background:rgba(0,0,0,0.5);"><h3 style="color:var(--gold); margin-top:0; font-size:1rem;">📦 小鎮倉庫 (${this.warehouse.length}/${this.warehouseMax})</h3><div style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">點擊道具帶上船</div><div id="ui-wh-list">${this.renderItemList(this.warehouse, 'toInventory')}</div></div></div>`;
        } else if (tabId === 'guild') {
            let refreshBtn = (this.day < 10 || (this.flags && this.flags.victory)) ? `<button class="tech-btn" style="padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--gold); color:var(--gold); white-space:nowrap;" onclick="game.forceRefreshGuild()">🔄 刷新 ($50)</button>` : ``;
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('hassel_win')">💬 與哈蘇閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('hassel') + chatBtn + `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #333; padding-bottom:10px; margin-bottom:15px; flex-wrap:nowrap;"><h3 style="color:var(--sonar); margin:0; font-size:1.1rem; white-space:nowrap;">📜 委託發布板</h3>${refreshBtn}</div><div class="grid">`;
            this.missions.forEach((m, idx) => { html += this.missionCard(m.title, m.area, m.dist, m.reward, m.time, m.desc, m.type, m.iconId, idx); });
            html += `</div>`; if(this.mission) html += `<div style="margin-top:20px; color:var(--sonar)">已設定航線：${this.mission.title}</div>`;
        } else if (tabId === 'tavern') {
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('lilith_win')">💬 與莉莉絲閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('lilith') + chatBtn + `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #333; padding-bottom:10px; margin-bottom:15px; flex-wrap:nowrap;"><h3 style="color:var(--sonar); margin:0; font-size:1.1rem; white-space:nowrap;">🍻 招募船員</h3><button class="tech-btn" style="padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--gold); color:var(--gold); white-space:nowrap;" onclick="game.forceRefreshTavern()">🔄 刷新 ($50)</button></div><div class="grid">`;
            this.tavernMercs.forEach(m => { if(!this.crew.find(c=>c.id===m.id)) html += this.charCard(m, `game.hire('${m.id}')`, 'HIRE ($' + m.cost + ')'); });
            html += `</div>`;
        } else if (tabId === 'casino') {
            // 新增：破產門禁檢查
            if (this.money <= 0) {
                this.modal("nathanael", "拿但業", "「沒錢還想進來？滾出去。」<br><br><span style='color:#777'>(身無分文時無法進入賭場)</span>");
                this.switchMode('town');
                return;
            }
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('nathanael_win')">💬 與拿但業閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('nathanael') + chatBtn + `<h3 style="color:var(--gold); margin-top:0; border-bottom:1px dashed #333; padding-bottom:10px;">🎰 貴賓廳</h3><div class="tech-card" style="border-color:var(--gold);"><div class="card-header"><span class="card-title">水手賭局</span></div><div class="card-body">覺得運氣不錯？和那些醉鬼玩兩把骰子吧。<br><span style="font-size:0.8rem; color:#aaa;">(拿但業正饒有興致地看著你)</span></div><button class="tech-btn" style="border-color:var(--gold); color:var(--gold); margin-top:10px; width:100%;" onclick="game.openGambleUI()">加入賭局</button></div>
            <div class="tech-card" style="border-color:var(--alert); margin-top:15px;">
                <div class="card-header"><span class="card-title" style="color:var(--alert)">💰 資金周轉</span></div>
                <div class="card-body">手頭緊？拿但業可以提供一些... 幫助。<br><span style="font-size:0.8rem; color:#aaa;">(當前債務: <span style="color:var(--alert)">$${this.debt || 0}</span> | 日利息: 10%)</span></div>
                <button class="tech-btn" style="border-color:var(--alert); color:var(--alert); margin-top:10px; width:100%;" onclick="game.openLoanUI()">借貸 / 還款</button></div>`;
        } else if (tabId === 'blackmarket') {
            html = backBtn + this.npcHtml('molly') + `<h3 style="color:var(--purple); margin-top:0; border-bottom:1px dashed #333; padding-bottom:10px;">🕵️ 地下交易所</h3>
            <div style="display:flex; gap:10px; margin-bottom:20px;">
                <button class="tech-btn" style="flex:1; border-color:var(--alert); color:var(--alert);" onclick="game.openIllegalModUI()">💀 船體非法改造</button>
                <button class="tech-btn" style="flex:1; border-color:var(--purple); color:var(--purple);" onclick="game.openIllegalEnhanceUI()">💉 船員非法強化</button>
            </div>
            <div class="grid">
                ${this.sysCard('幸運金幣', '$2000', '任務報酬 +20% (被動)', "game.buyBlackMarketItem('lucky_coin', 2000)", this.inventory.includes('lucky_coin') || this.warehouse.includes('lucky_coin'))}
                ${this.sysCard('維修機器人', '$3000', '每回合機率修復船體 (被動)', "game.buyBlackMarketItem('auto_bot', 3000)", this.inventory.includes('auto_bot') || this.warehouse.includes('auto_bot'))}
                ${this.sysCard('軍用興奮劑', '$500', '全體 SAN +30 / HP -15 (消耗品)', "game.buyBlackMarketItem('stimulant', 500)")}
            </div>`;
        } else if (tabId === 'inn') {
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('costa_win')">💬 與科絲塔閒聊 (通關)</button>` : ``;
            html = backBtn + this.npcHtml('costa') + chatBtn + `<div class="grid">${this.sysCard('☕ 短暫休息', '$15 / 人', '疲勞度 -20 / 些微恢復理智 / 經過 2 小時', `game.rest('short')`)}${this.sysCard('🛏️ 過夜休息', '$40 / 人', '疲勞度 -50 / 大幅恢復理智 / 跳至次日早上', `game.rest('long')`)}</div><h3 style="color:var(--sonar); margin-top:25px; border-bottom:1px dashed #333; padding-bottom:5px;">💉 深度心理治療</h3>`;
            let traumatizedCrew = this.crew.filter(c => c.trauma);
            if (traumatizedCrew.length === 0) html += `<div style="color:#aaa; font-size:0.9rem; padding:10px; text-align:center; background:rgba(0,0,0,0.3); border-radius:5px;">目前沒有船員需要進行深度的心理治療。<br>（大家都還保有理智）</div>`;
            else { html += `<div class="grid">`; traumatizedCrew.forEach(c => { html += this.sysCard(`治療 ${c.name}`, '$300', `消除【${c.trauma.name}】並將理智恢復至上限`, `game.cureTrauma('${c.id}')`); }); html += `</div>`; }
        } else if (tabId === 'crew') {
            html = backBtn + `<div class="grid"><button class="tech-btn" style="grid-column:1/-1; margin-bottom:10px; border-color:var(--purple); color:var(--purple);" onclick="game.showSynergies()">✨ 查看角色連攜技能 (Synergies)</button>`;
            this.crew.forEach(c => { let status = "正常", color = "var(--sonar)"; if(this.fatigue > 50) { status = "疲勞"; color = "var(--gold)"; } if(this.fatigue > 80) { status = "極限"; color = "var(--alert)"; } html += this.charCard(c, '', '', status, color, `game.showCrewDetail('${c.id}')`); });
            html += `</div>`;
        } else if (tabId === 'codex') {
            html = backBtn + `<h2 style="color:var(--sonar); border-bottom:1px solid var(--sonar); padding-bottom:10px;">🐟 漁獲圖鑑 (FISH CODEX)</h2><div class="grid">`;
            let fishKeys = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].type === 'fish'); let unlockedCount = 0; this.codex = this.codex || []; this.codexPage = this.codexPage || '港口'; const habitats = ['港口', '淺灘', '暗礁', '深淵'];
            html += `<div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px; overflow-x:auto;">`;
            habitats.forEach(t => { let active = this.codexPage === t ? 'border-color:var(--gold); color:var(--gold); background:rgba(255,215,0,0.1);' : 'border-color:#555; color:#777;'; html += `<button class="tech-btn" style="width:auto; padding:5px 15px; white-space:nowrap; ${active}" onclick="game.codexPage='${t}'; game.openTab('codex')">${t}</button>`; });
            html += `</div>`;
            let zoneFish = fishKeys.filter(k => ITEM_DB[k].habitat === this.codexPage);
            if (zoneFish.length === 0) html += `<div style="grid-column:1/-1; text-align:center; color:#555; padding:30px;">此區域尚無已知生物數據。</div>`;
            else { zoneFish.forEach(k => { let isUnlocked = this.codex.includes(k); if(isUnlocked) unlockedCount++; let f = ITEM_DB[k]; if (isUnlocked) { html += `<div class="tech-card" style="border-color:var(--sonar);"><div class="card-header" style="justify-content:flex-start; gap:15px; border-bottom:none; margin-bottom:0; padding-bottom:0;"><div style="font-size:2rem; background:rgba(0,176,255,0.1); width:50px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--sonar);">${f.icon}</div><div><div style="color:var(--sonar); font-weight:bold; font-size:1.1rem;">${f.name}</div><div style="color:var(--gold); font-size:0.8rem;">售價: $${f.value}</div></div></div><div class="card-body" style="color:#aaa; font-size:0.9rem; margin-top:10px;">${f.desc}</div></div>`; } else { html += `<div class="tech-card" style="border-color:#333; opacity:0.6;"><div class="card-header" style="justify-content:flex-start; gap:15px; border-bottom:none; margin-bottom:0; padding-bottom:0;"><div style="font-size:2rem; background:#111; width:50px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px dashed #555; color:#555;">?</div><div><div style="color:#777; font-weight:bold; font-size:1.1rem;">未知的漁獲</div><div style="color:#555; font-size:0.8rem;">棲息於${this.codexPage}</div></div></div><div class="card-body" style="color:#555; font-size:0.9rem; margin-top:10px;">尚未解鎖此圖鑑。</div></div>`; } }); }
            html += `</div><div style="margin-top:20px; text-align:center; color:#aaa; font-size:0.9rem;">總收集進度: ${unlockedCount} / ${fishKeys.length}</div>`;
        }
        content.innerHTML = html;
        this.updateUI();
    },

    // --- 輔助渲染函數 ---
    renderItemList: function(list, action) {
        if (list.length === 0) return '<div style="color:#555; text-align:center; padding:20px;">空空如也</div>';
        let counts = {}; list.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        let html = '<div style="display:flex; flex-direction:column; gap:5px;">';
        Object.keys(counts).forEach(itemId => { const item = ITEM_DB[itemId]; const count = counts[itemId]; if(!item) return; html += `<button class="cmd-btn" style="padding:8px; display:flex; justify-content:space-between; align-items:center;" onclick="game.requestTransferItem('${action}', '${itemId}', ${count})"><div style="display:flex; align-items:center;"><span style="font-size:1.2rem; margin-right:8px;">${item.icon}</span> <div style="text-align:left;"><div style="color:#fff; font-weight:bold; font-size:0.9rem;">${item.name}</div><div style="color:#777; font-size:0.7rem;">${item.desc}</div></div></div><div style="background:var(--sonar); color:#000; padding:2px 8px; border-radius:10px; font-weight:bold; font-size:0.8rem;">x${count}</div></button>`; });
        return html + '</div>';
    },

    openBackpack: function() {
        let list = document.getElementById('backpack-list'); list.innerHTML = '';
        if (this.inventory.length === 0) list.innerHTML = `<div style="color:#555; grid-column: 1 / -1; text-align:center; padding:30px;">背包空空如也... <br><span style="font-size:0.8rem;">(容量: 0/${this.inventoryMax})</span></div>`;
        else {
            list.innerHTML += `<div style="grid-column:1/-1; color:var(--sonar); margin-bottom:10px; font-size:0.9rem; border-bottom:1px solid #333; padding-bottom:5px;">📦 目前負重: <span style="color:#fff; font-weight:bold;">${this.inventory.length}</span> / ${this.inventoryMax}</div>`;
            this.inventory.forEach((itemId, idx) => {
                let item = ITEM_DB[itemId]; let useBtn = item.type === 'fish' ? '' : `<button class="tech-btn" style="border-color:var(--purple); color:var(--purple); margin-top:10px; position:relative; z-index:2;" onclick="event.stopPropagation(); game.useItem(${idx})">使用道具</button>`;
                
                // 🌟 修正：捕魚模式下隱藏釣具的使用按鈕，避免誤導
                if (this.currentFishingZone && (itemId === 'fishing_rod' || itemId === 'fishing_net' || itemId === 'bait')) {
                    useBtn = '';
                }

                const events = this.isVoyaging ? `oncontextmenu="return false;" onmousedown="game.handleItemPress(this, ${idx}, event)" onmouseup="game.handleItemRelease(this)" onmouseleave="game.handleItemRelease(this)" ontouchstart="game.handleItemPress(this, ${idx}, event)" ontouchcancel="game.handleItemRelease(this)" ontouchend="game.handleItemRelease(this)"` : '';
                list.innerHTML += `<div class="tech-card" style="border-color:var(--purple); position:relative; user-select:none; -webkit-user-select:none;" ${events}><div class="card-header" style="justify-content:flex-start; align-items:center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px;"><span style="font-size:1.5rem; margin-right:10px;">${item.icon}</span><span class="card-title" style="color:var(--purple); margin:0;">${item.name}</span></div><div class="card-body" style="color:#aaa;">${item.desc}</div>${useBtn}</div>`;
            });
        }
        document.getElementById('backpack-modal').style.display = 'flex';
    },

    sysCard: function(title, cost, desc, fn, disabled=false) { return `<div class="tech-card"><div class="card-header"><span class="card-title">${title}</span><span class="card-cost">${cost}</span></div><div class="card-body">${desc}</div><button class="tech-btn" onclick="${fn}" ${disabled?'disabled':''}>${disabled?'INSTALLED':'PURCHASE'}</button></div>`; },
    charCard: function(c, onclickStr = '', btnText = '', status = '正常', statusColor = 'var(--sonar)', cardClick = '') {
        let btnHtml = onclickStr ? `<button class="tech-btn" style="border-color:var(--sonar); color:var(--sonar); margin-top:10px; width:100%;" onclick="${onclickStr}; event.stopPropagation();">${btnText}</button>` : '';
        let clickAttr = cardClick ? `onclick="${cardClick}" style="cursor:pointer;"` : '';
        let sanBar = `<div style="margin-top:10px;"><div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#b39ddb; margin-bottom:2px;"><span>SANITY</span><span>${Math.floor(c.san)}/${c.maxSan}</span></div><div style="width:100%; background:#222; height:5px; border-radius:2px; overflow:hidden;"><div style="width:${(c.san/c.maxSan)*100}%; background:#b39ddb; height:100%; transition:width 0.3s;"></div></div></div>`;
        let traumaText = c.trauma ? `<div style="color:var(--alert); font-size:0.8rem; font-weight:bold; margin-top:8px; background:rgba(255,0,0,0.15); padding:4px 6px; border-radius:4px;">⚠ 創傷：${c.trauma.name}</div>` : '';
        return `<div class="tech-card" ${clickAttr}><div class="card-header"><img src="${getImgUrl(c.id)}" class="card-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="card-avatar-fallback" style="display:none;">${c.name[0]}</div><div style="flex:1;"><div style="display:flex; justify-content:space-between;"><span class="card-title">${c.name}</span><span style="font-size:0.8rem; color:${statusColor}; border:1px solid ${statusColor}; padding:2px 5px; border-radius:3px;">${status}</span></div><div class="card-role" style="color:var(--gold)">${c.role} | ${c.region === 'sector7' ? '第七星區' : '外來者'}</div></div></div><div class="card-body"><div style="min-height:40px; color:#aaa; font-size:0.85rem;">${c.desc}</div>${sanBar}${traumaText}</div>${btnHtml}</div>`;
    },
    missionCard: function(title, area, dist, reward, time, desc, type, iconId, idx) {
        let border = type==='boss' ? 'var(--alert)' : (type==='emergency' ? '#ff9100' : 'var(--border)'); let color = type==='boss' ? 'var(--alert)' : (type==='emergency' ? '#ff9100' : 'var(--sonar)'); let icon = type==='boss' ? '🦑' : (type==='emergency' ? '⚠' : (type==='adora' ? '👧' : '📜'));
        return `<div class="tech-card" style="border-color:${border}; cursor:pointer;" onclick="game.acceptMission(${idx})"><div class="card-header" style="align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:8px;"><span class="card-title" style="color:${color}; font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><span style="font-size:1.2rem;margin-right:5px;">${icon}</span>${title}</span></div><div class="card-body" style="padding-top:0;"><div style="display:flex; justify-content:space-between; flex-wrap:wrap; font-size:0.85rem; color:#aaa; gap:5px;"><span style="flex:1; min-width:80px;">區域: ${area}</span><span style="flex:1; min-width:80px;">距離: ${dist} KM</span><span style="flex:1; min-width:80px;">時間: ${time} HR</span></div><div style="color:var(--gold); font-weight:bold; margin-top:8px;">報酬：$${reward}</div><div style="font-size:0.8rem; color:#888; margin-top:5px; border-top:1px dashed #333; padding-top:5px;">${desc}</div></div></div>`;
    },
    npcHtml: function(id) {
        const n = DB.npc[id]; let msg = n.msg; if (this.flags && this.flags.victory && n.victoryMsg) msg = n.victoryMsg;
        return `<div class="comm-log"><img class="avatar" src="${getImgUrl(id)}" onerror="this.src='${fallbackSVG}'" /><div class="dialogue"><div class="speaker">${n.name}</div><div class="msg">"${msg}"</div></div></div>`;
    },

    // --- 特效與動畫 ---
    animateDist: function(start, end, duration) {
        const obj = document.getElementById("dist-display"); let startTimestamp = null;
        const step = (timestamp) => { if (!startTimestamp) startTimestamp = timestamp; const progress = Math.min((timestamp - startTimestamp) / duration, 1); obj.innerHTML = Math.floor(progress * (end - start) + start); let percent = 100 - (parseInt(obj.innerHTML) / this.distTotal * 100); document.getElementById('voyage-progress').style.width = percent + '%'; if (progress < 1) { window.requestAnimationFrame(step); } else { obj.innerHTML = end; if(end <= 0) this.triggerArrival(); } };
        window.requestAnimationFrame(step);
    },
    renderDash: function() {
        let cons = this.bossMode ? 0 : 15; let suffix = this.bossMode ? '' : ` (-${cons})`;
        this.setBar('fuel', this.fuel, this.maxFuel, suffix); this.setBar('food', this.food, this.maxFood, suffix); this.setBar('hp', this.hp, 100); this.setBar('fat', this.fatigue, 100);
        const apEl = document.getElementById('dash-ap'); if (apEl) { apEl.innerText = this.ap; apEl.parentElement.style.display = this.upgrades.torpedo ? 'block' : 'none'; }
        const board = document.getElementById('crisis-board'); if (board) { board.innerHTML = ''; this.activeCrises.forEach(c => { board.innerHTML += `<div style="background:rgba(255, 23, 68, 0.85); border:1px solid var(--alert); color:#fff; padding:5px 10px; border-radius:4px; font-weight:bold; font-size:0.85rem; box-shadow:0 0 10px var(--alert);">⚠ 異常：${c.name} (${c.desc})</div>`; }); }
    },
    setBar: function(id, val, max = 100, suffix = '') {
        const pct = Math.min(100, Math.max(0, (val / max) * 100)); const el = document.getElementById(`bar-${id}`); const txt = document.getElementById(`bar-${id}-txt`);
        if(el) el.style.width = pct + '%'; if(txt) txt.innerText = `${Math.floor(val)}/${max}${suffix}`;
    },
    renderNodes: function() {
        const grid = document.getElementById('node-grid'); if (!grid) return; grid.innerHTML = ''; if (this.bossMode || !this.currentNodes) return;
        this.currentNodes.forEach((node, idx) => { grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--sonar); background:rgba(0, 230, 118, 0.05);" onclick="game.selectNode(${idx})"><div style="font-size:1.5rem; margin-right:10px;">${node.icon}</div><div><div class="cmd-role" style="color:var(--sonar)">探測節點</div><div class="cmd-name">${node.name}</div><div style="font-size:0.7rem; color:#aaa;">推進 ${node.dist}KM</div></div></button>`; });
    },
    renderCmds: function() {
        const grid = document.getElementById('action-grid'); if(!grid) return; grid.innerHTML = '';
        if (!this.isVoyaging) { let targetText = this.mission ? `<span style="color:var(--sonar)">目標：${this.mission.title}</span>` : `<span style="color:#777">未設定目標 (請先前往公會)</span>`; grid.innerHTML = `<div style="grid-column:span 2; padding:20px; background:rgba(0,20,30,0.5); border:1px solid var(--sonar); border-radius:8px; text-align:center;"><div style="font-size:1.1rem; margin-bottom:15px; font-weight:bold;">${targetText}</div><button class="tech-btn" style="width:100%; padding:15px; font-size:1.2rem; border-color:var(--alert); color:var(--alert); font-weight:bold; animation:blink 2s infinite;" onclick="game.checkLaunch()">🚀 啟動引擎出航</button></div>`; return; }
        this.activeCrises.forEach((c, idx) => { grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--alert); background:rgba(255,0,0,0.1);" onclick="game.resolveCrisis(${idx})" ${this.ap < 1 ? 'disabled' : ''}><div style="font-size:2rem; margin-right:10px;">🔧</div><div><div class="cmd-role" style="color:var(--alert)">CRISIS (危機排除)</div><div class="cmd-name">${c.name}</div><div style="font-size:0.7rem; color:#aaa">耗費 1-2 AP</div></div></button>`; });
        if (this.upgrades && this.upgrades.torpedo) { let tpDisabled = this.ap < 1 ? 'disabled style="opacity:0.5; filter:grayscale(1);"' : ''; grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--gold); background:rgba(255, 202, 40, 0.1);" onclick="game.fireTorpedo()" ${tpDisabled}><div style="font-size:2rem; margin-right:10px;">🚀</div><div><div class="cmd-role" style="color:var(--gold)">ULTIMATE</div><div class="cmd-name">發射深淵魚雷</div><div style="font-size:0.75rem; color:#aaa">耗費 1 AP | 造成大量傷害</div></div></button>`; }
        if (this.crew) this.crew.forEach(c => {
            let isDisabled = (this.bossMode && c.hasActed) ? 'disabled style="opacity:0.5; filter:grayscale(1);"' : ''; let isSelected = (this.bossMode && this.selectedActorId === c.id); let borderStyle = isSelected ? 'border: 2px solid var(--gold); box-shadow: 0 0 15px var(--gold); transform: scale(1.02);' : ''; let bgStyle = isSelected ? 'background: rgba(255, 215, 0, 0.15);' : ''; let sanPercent = (c.san / c.maxSan) * 100; let traumaWarning = c.trauma ? `<span style="color:var(--alert); font-size:0.7rem; margin-left:4px; font-weight:bold;">[${c.trauma.name}]</span>` : '';
            grid.innerHTML += `<button class="cmd-btn" ${isDisabled} onmousedown="game.handleBtnPress(this, '${c.id}')" onmouseup="game.handleBtnRelease(this)" onmouseleave="game.handleBtnRelease(this)" ontouchstart="game.handleBtnPress(this, '${c.id}')" ontouchend="game.handleBtnRelease(this)" onclick="if(!game.longPressTriggered) game.action('${c.id}')" style="align-items:flex-start; padding:8px; display:flex; ${borderStyle} ${bgStyle}"><img src="${getImgUrl(c.id)}" class="cmd-img" style="border-radius:4px; flex-shrink:0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="cmd-img card-avatar-fallback" style="display:none; font-size:1.2rem; border-radius:4px; flex-shrink:0;">${c.name[0]}</div><div style="flex:1; text-align:left; min-width:0; margin-left:8px; display:flex; flex-direction:column; justify-content:space-between; height:100%;"><div><div class="cmd-role" style="color:var(--sonar)">${c.role}</div><div class="cmd-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}${traumaWarning}</div></div><div style="margin-top:auto;"><div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#b39ddb; margin-top:4px; margin-bottom:2px;"><span>SAN</span><span>${Math.floor(c.san)}/${c.maxSan}</span></div><div style="width:100%; background:#222; height:4px; border-radius:2px; overflow:hidden;"><div style="width:${sanPercent}%; background:${c.trauma ? 'var(--alert)' : '#b39ddb'}; height:100%; transition:width 0.3s;"></div></div></div></div></button>`;
        });
        if (this.bossMode) { let execStyle = this.selectedActorId ? 'border-color:var(--gold); color:var(--gold); animation:blink 2s infinite;' : 'border-color:#555; color:#777; cursor:not-allowed;'; let execText = this.selectedActorId ? '⚡ 執行指令 & 結束回合' : '⏳ 請選擇行動角色'; let execAction = this.selectedActorId ? 'game.executeBossAction()' : ''; grid.innerHTML += `<button class="cmd-btn" style="${execStyle} justify-content:center;" onclick="${execAction}"><div style="text-align:center;"><div style="font-size:1.5rem;">⚔️</div><div class="cmd-name">${execText}</div></div></button>`; }
    },
    renderSeaMap: function(mission) {
        const container = document.getElementById('sea-map-container'); if(!container || !mission) { if(container) container.innerHTML = ''; return; }
        let svgContent = ''; let mapColor = 'rgba(0, 230, 118, 0.4)'; let title = '';
        if (mission.type === 'boss') { mapColor = 'rgba(255, 23, 68, 0.5)'; title = 'KRAKEN LAIR'; svgContent = `<circle cx="400" cy="300" r="180" fill="rgba(255,23,68,0.05)" stroke="${mapColor}" stroke-width="3" stroke-dasharray="10 10"/><path d="M400,100 Q500,200 400,300 Q300,400 400,500" fill="none" stroke="${mapColor}" stroke-width="5"/><path d="M200,300 Q300,250 400,300 Q500,350 600,300" fill="none" stroke="${mapColor}" stroke-width="5"/><circle cx="400" cy="300" r="40" fill="rgba(255,23,68,0.2)" stroke="${mapColor}" stroke-width="2"/>`; } 
        else if (mission.area.includes('淺灘')) { title = 'SHALLOW WATERS'; svgContent = `<path d="M100,200 Q250,100 400,250 T700,300" fill="none" stroke="${mapColor}" stroke-width="2"/><circle cx="250" cy="200" r="50" fill="none" stroke="${mapColor}" stroke-dasharray="5 5"/><rect x="500" y="250" width="100" height="50" fill="none" stroke="${mapColor}" transform="rotate(15 500 250)"/>`; } 
        else if (mission.area.includes('暗礁')) { title = 'REEF ZONE'; svgContent = `<path d="M50,400 L200,250 L350,450 L500,200 L650,350" fill="none" stroke="${mapColor}" stroke-width="2"/><polygon points="300,200 330,120 360,200" fill="rgba(0,230,118,0.05)" stroke="${mapColor}"/><polygon points="550,450 590,350 630,450" fill="rgba(0,230,118,0.05)" stroke="${mapColor}"/><circle cx="400" cy="300" r="100" fill="none" stroke="${mapColor}" stroke-dasharray="2 8"/>`; } 
        else { mapColor = 'rgba(179, 157, 219, 0.4)'; title = 'ABYSSAL TRENCH'; svgContent = `<ellipse cx="400" cy="300" rx="250" ry="120" fill="none" stroke="${mapColor}" stroke-width="2"/><ellipse cx="400" cy="300" rx="180" ry="80" fill="none" stroke="${mapColor}" stroke-width="1" stroke-dasharray="4 4"/><ellipse cx="400" cy="300" rx="100" ry="40" fill="rgba(179,157,219,0.1)" stroke="${mapColor}" stroke-width="2"/>`; }
        container.innerHTML = `<div class="sea-map-layer"><svg viewBox="0 0 800 600" style="width:100%; height:100%; overflow:visible;"><defs><pattern id="grid-sea" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="${mapColor}" stroke-width="0.5" opacity="0.3"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid-sea)" />${svgContent}<text x="400" y="550" fill="${mapColor}" font-size="24" font-weight="bold" text-anchor="middle" letter-spacing="8px" opacity="0.7">${title}</text></svg></div>`;
    },

    // --- 互動與事件 ---
    handleBtnPress: function(btn, id) { if(this.pressTimer) clearTimeout(this.pressTimer); this.longPressTriggered = false; this.pressTimer = setTimeout(() => { this.longPressTriggered = true; this.showCrewDetail(id); if(navigator.vibrate) navigator.vibrate(50); }, 500); },
    handleBtnRelease: function(btn) { if (this.pressTimer) clearTimeout(this.pressTimer); },
    handleBpPress: function(btn, type, cost, e) { if (e && e.type === 'mousedown' && this.lastTouchTime && (Date.now() - this.lastTouchTime < 1000)) return; if (e && e.type === 'touchstart') { this.lastTouchTime = Date.now(); e.stopPropagation(); } if(this.pressTimer) clearTimeout(this.pressTimer); this.longPressTriggered = false; this.pressTimer = setTimeout(() => { this.longPressTriggered = true; this.showUpgradeDetail(type); if(navigator.vibrate) navigator.vibrate(50); }, 500); },
    handleBpRelease: function(btn) { if (this.pressTimer) clearTimeout(this.pressTimer); },
    handleItemPress: function(el, idx, e) { if (e && e.type === 'mousedown' && this.lastTouchTime && (Date.now() - this.lastTouchTime < 1000)) return; if (e && e.type === 'touchstart') { this.lastTouchTime = Date.now(); e.stopPropagation(); } if(this.pressTimer) clearTimeout(this.pressTimer); this.longPressTriggered = false; this.pressTimer = setTimeout(() => { this.longPressTriggered = true; if(navigator.vibrate) navigator.vibrate(50); this.confirmDiscardItem(idx); }, 800); },
    handleItemRelease: function(el) { if(this.pressTimer) clearTimeout(this.pressTimer); },

    showCrewDetail: function(id) {
        const c = this.crew.find(x => x.id === id); if(!c) return;
        let statusHtml = ''; if (this.fatigue > 80) statusHtml += '<div style="color:var(--alert)">[極度疲勞] 行動效率大幅降低 / SAN消耗增加</div>'; else if (this.fatigue > 50) statusHtml += '<div style="color:var(--gold)">[疲勞] 行動效率降低</div>'; else statusHtml += '<div style="color:var(--sonar)">[狀態良好] 無負面影響</div>';
        if (this.flags.godBuff === 'melas') statusHtml += '<div style="color:#ce93d8">★ 虛空庇護 (免疫恐懼)</div>'; if (c.id === 'lanlan' && this.crew.find(x => x.id === 'jornona')) statusHtml += '<div style="color:#f48fb1">★ 愛的力量 (免疫怕鬼)</div>';
        let fatigueNote = ''; if(['lazar', 'jornona', 'molly', 'narcissus'].includes(c.id)) fatigueNote = `<div style="color:var(--sonar); margin-top:5px; font-weight:bold;">⚡ 行動時可恢復疲勞值</div>`;
        this.modal(c.id, c.name, `<div style="text-align:left; font-size:0.9rem; color:#b0bec5;"><div style="margin-bottom:10px; color:var(--gold);">職業: ${c.role}</div>${c.desc}${fatigueNote}<div style="margin-top:15px; padding-top:10px; border-top:1px dashed #333;"><div style="margin-bottom:5px; color:#fff;">當前狀態:</div>${statusHtml}</div></div>`);
        const btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="flex:1; padding:12px 0; border-color:var(--alert); color:var(--alert); margin-right:10px;" onclick="game.dismissCrew('${c.id}')">解僱</button><button class="tech-btn" style="flex:1; padding:12px 0;" onclick="game.closeModal()">關閉</button>`;
    },
    showSynergies: function() {
        let html = `<div style="text-align:left; max-height:50vh; overflow-y:auto;">`;
        if (typeof SYNERGY_DB !== 'undefined') { SYNERGY_DB.forEach(s => { let hasAll = s.members.every(name => this.crew.find(c => c.name.includes(name))); let style = hasAll ? "border-color:var(--gold); opacity:1;" : "border-color:#555; opacity:0.6;"; let status = hasAll ? "<span style='color:var(--gold); font-weight:bold; float:right;'>[已激活]</span>" : "<span style='color:#777; float:right;'>[未湊齊]</span>"; html += `<div class="tech-card" style="${style} margin-bottom:10px; padding:10px;"><div style="font-size:1.1rem; color:var(--purple); margin-bottom:5px;">${s.icon} ${s.name} ${status}</div><div style="font-size:0.85rem; color:#aaa; margin-bottom:5px;">成員: ${s.members.join(' + ')}</div><div style="font-size:0.9rem; color:#ddd; line-height:1.4;">${s.desc}</div></div>`; }); }
        html += `</div>`; this.modal("system", "角色連攜技能", html);
    },
    showUpgradeDetail: function(type) {
        const data = { light: { name: '探照燈', desc: '高功率探照燈。能照亮深海，減少環境帶來的 SAN 值自然耗損 (每回合 -8 降為 -2)。', max: '1' }, armor: { name: '強化裝甲', desc: '覆蓋船體的鈦合金裝甲。大幅減少遭遇物理攻擊或撞擊時的船體損傷。', max: '1' }, torpedo: { name: '深淵魚雷', desc: '搭載深淵彈頭的魚雷發射管。解鎖 AP 系統，並能在 BOSS 戰中造成巨大傷害。', max: '1' }, crew: { name: '船員艙', desc: '擴充船艙的維生系統。增加船員上限，讓你能招募更多幫手。', max: `8 (目前: ${this.crewMax})` }, food: { name: '糧倉', desc: '擴充食物儲存空間。', max: `300 (目前: ${this.maxFood})` }, fuel: { name: '能源箱', desc: '擴充燃料儲存空間。', max: `300 (目前: ${this.maxFuel})` } };
        const item = data[type]; if(!item) return;
        this.modal("peter", "藍圖詳情", `<div style="text-align:left;"><h3 style="color:var(--gold); margin:0 0 10px 0;">${item.name}</h3><div style="color:#ccc; font-size:0.9rem; margin-bottom:15px;">${item.desc}</div><div style="border-top:1px dashed #555; padding-top:10px; font-size:0.8rem; color:var(--sonar);">最大擴充上限: ${item.max}</div></div>`);
    },
    showEncounter: function(enc) {
        document.getElementById('enc-title').innerText = `⚠ ${enc.title}`; document.getElementById('enc-desc').innerText = enc.desc;
        const choicesDiv = document.getElementById('enc-choices'); choicesDiv.innerHTML = '';
        enc.choices.forEach((c, idx) => { let hasReq = c.req ? this.crew.find(x => x.id === c.req) : true; let reqText = c.req ? `<span class="req-tag" style="color:var(--gold); border:1px solid var(--gold); padding:2px 4px; border-radius:3px; font-size:0.7rem;">需: ${c.req.toUpperCase()}</span>` : ''; choicesDiv.innerHTML += `<button class="enc-choice-btn" style="background:#111; border:1px solid #333; color:#fff; padding:12px; text-align:left; margin-bottom:5px; display:flex; justify-content:space-between; cursor:pointer;" ${!hasReq ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="game.resolveEncounter(${idx})"><span>${c.text}</span> ${reqText}</button>`; });
        this.currentEncounter = enc; document.getElementById('encounter-modal').style.display = 'flex';
    },
    openSellFishUI: function(buyerId, multiplier) {
        let fishCounts = {}; this.warehouse.forEach(id => { if(ITEM_DB[id] && ITEM_DB[id].type === 'fish') fishCounts[id] = (fishCounts[id] || 0) + 1; });
        let html = `<div style="width:100%; max-height:50vh; overflow-y:auto; overflow-x:hidden; padding:2px; box-sizing:border-box;">`;
        Object.keys(fishCounts).forEach(id => { let item = ITEM_DB[id]; let count = fishCounts[id]; let unitPrice = Math.floor(item.value * multiplier); html += `<div class="tech-card" style="padding:8px; margin-bottom:8px; border-color:#444; width:100%; box-sizing:border-box; overflow:hidden;"><div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;"><div style="display:flex; align-items:center; flex:1; min-width:0; overflow:hidden;"><span style="font-size:1.5rem; margin-right:8px; background:rgba(0,0,0,0.3); border-radius:6px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${item.icon}</span><div style="min-width:0; flex:1; overflow:hidden;"><div style="color:var(--sonar); font-weight:bold; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div><div style="font-size:0.75rem; color:#aaa;">$${unitPrice}</div></div></div><div style="text-align:right; flex-shrink:0;"><div style="color:var(--gold); font-weight:bold; font-size:1rem;">$<span id="subtotal-${id}">0</span></div></div></div><div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px;"><input type="range" class="fish-slider" data-id="${id}" data-price="${unitPrice}" min="0" max="${count}" value="0" style="flex:1; height:24px; min-width:0; margin:0;" oninput="game.updateSellTotal()"><div style="min-width:40px; text-align:right; color:#fff; font-family:monospace; font-size:0.85rem; flex-shrink:0;"><span id="qty-${id}">0</span>/${count}</div></div></div>`; });
        html += `</div><div style="border-top:1px solid #333; margin-top:10px; padding-top:10px; text-align:right;">總計: <span style="color:var(--gold); font-size:1.2rem; font-weight:bold;">$<span id="sell-total">0</span></span></div>`;
        this.modal(buyerId, "交易選擇", html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--gold); color:var(--gold);" onclick="game.confirmSellFish()">確認出售</button><button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>`; this.updateSellTotal(); }, 10);
    },
    updateSellTotal: function() { let total = 0; document.querySelectorAll('.fish-slider').forEach(slider => { let id = slider.getAttribute('data-id'); let price = parseInt(slider.getAttribute('data-price')); let qty = parseInt(slider.value); document.getElementById(`qty-${id}`).innerText = qty; document.getElementById(`subtotal-${id}`).innerText = qty * price; total += qty * price; }); document.getElementById('sell-total').innerText = total; },
    openNapUI: function() {
        this.modal("none", "角落小憩", `<div style="text-align:center;"><div style="font-size:3rem; margin-bottom:10px;">💤</div><div style="margin-bottom:10px; color:#aaa;">要在充滿魚腥味的角落睡多久？<br>(回復疲勞 / <span style="color:#b39ddb">大幅降低 SAN</span>)</div><div style="display:flex; gap:10px; align-items:center; justify-content:center; margin:20px 0;"><input type="range" id="nap-slider" min="1" max="8" value="1" style="width:60%;" oninput="game.updateNapPreview(this.value)"><div style="font-size:1.2rem; font-weight:bold; color:var(--sonar); width:40px;"><span id="nap-hours">1</span>h</div></div><div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; font-size:0.9rem;"><div>預計回復疲勞: <span style="color:var(--sonar)" id="nap-fatigue">-5</span>%</div><div>預計扣除 SAN: <span style="color:#b39ddb" id="nap-san">-5</span> (全體)</div></div></div>`);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--sonar); color:var(--sonar);" onclick="game.confirmNap()">開始休息</button><button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>`; }, 10);
    },
    updateNapPreview: function(val) { document.getElementById('nap-hours').innerText = val; document.getElementById('nap-fatigue').innerText = '-' + (val * 5); document.getElementById('nap-san').innerText = '-' + (val * 5); },
    initBlueprintControls: function() {
        const container = document.getElementById('blueprint-container'); const content = document.getElementById('blueprint-content'); if (!container || !content) return;
        let state = { scale: 1, x: 0, y: 0, isDown: false, startX: 0, startY: 0 };
        const updateTransform = () => { content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`; };
        const startDrag = (x, y) => { state.isDown = true; state.startX = x - state.x; state.startY = y - state.y; container.style.cursor = 'grabbing'; };
        const moveDrag = (x, y) => { if (!state.isDown) return; state.x = x - state.startX; state.y = y - state.startY; updateTransform(); };
        const endDrag = () => { state.isDown = false; container.style.cursor = 'grab'; };
        container.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
        window.addEventListener('mousemove', e => { if(state.isDown) { e.preventDefault(); moveDrag(e.clientX, e.clientY); } });
        window.addEventListener('mouseup', endDrag);
        container.addEventListener('wheel', e => { e.preventDefault(); const factor = e.deltaY > 0 ? 0.9 : 1.1; let newScale = state.scale * factor; newScale = Math.max(0.5, Math.min(newScale, 3.0)); state.scale = newScale; updateTransform(); });
    },
    createRainEffect: function() {
        let weatherContainer = document.getElementById('weather-container'); if (!weatherContainer) { weatherContainer = document.createElement('div'); weatherContainer.id = 'weather-container'; document.body.appendChild(weatherContainer); }
        if (weatherContainer.children.length > 0) return;
        for (let i = 0; i < 80; i++) { let drop = document.createElement('div'); drop.classList.add('rain-drop'); drop.style.left = `${Math.random() * 120}%`; drop.style.animationDuration = `${Math.random() * 0.6 + 0.6}s`; drop.style.animationDelay = `${Math.random() * 2}s`; weatherContainer.appendChild(drop); }
    },
    stopWeather: function() { const weatherContainer = document.getElementById('weather-container'); if (weatherContainer) weatherContainer.remove(); },
    startChat: function(chatId, nodeId = 0) {
        if (typeof CHAT_DB === 'undefined' || !CHAT_DB[chatId]) return;
        let node = CHAT_DB[chatId][nodeId]; let overlay = document.getElementById('vn-chat-overlay');
        if (!node || nodeId === -1) { this.closeChat(); return; }
        if (!overlay) { overlay = document.createElement('div'); overlay.id = 'vn-chat-overlay'; document.body.appendChild(overlay); }
        if (overlay.style.display === 'none' || overlay.innerHTML.trim() === '') { overlay.style.display = 'flex'; overlay.innerHTML = `<div class="chat-backdrop" onclick="game.closeChat()"></div><div class="chat-window"><div class="chat-header"><div class="chat-title">💬 ${node.speaker || "通訊頻道"}</div><button class="chat-close" onclick="game.closeChat()">✕</button></div><div class="chat-body" id="chat-log"></div><div class="chat-footer" id="chat-options"></div></div>`; }
        const log = document.getElementById('chat-log'); const options = document.getElementById('chat-options');
        log.insertAdjacentHTML('beforeend', `<div class="chat-row npc-row"><img src="${getImgUrl(node.face)}" class="chat-avatar" onerror="this.src='${fallbackSVG}'"><div class="chat-content"><div class="chat-name">${node.speaker}</div><div class="chat-bubble npc-bubble">${node.msg}</div></div></div>`);
        log.scrollTop = log.scrollHeight;
        let choicesHtml = ''; node.choices.forEach(c => { let safeText = c.text.replace(/'/g, "&apos;"); choicesHtml += `<button class="chat-opt-btn" onclick="game.handleChatChoice('${chatId}', ${c.next}, '${safeText}')">${c.text}</button>`; });
        options.innerHTML = choicesHtml;
    },
    handleChatChoice: function(chatId, nextId, text) {
        const log = document.getElementById('chat-log'); log.insertAdjacentHTML('beforeend', `<div class="chat-row player-row"><div class="chat-bubble player-bubble">${text}</div></div>`); log.scrollTop = log.scrollHeight;
        document.getElementById('chat-options').innerHTML = ''; setTimeout(() => { this.startChat(chatId, nextId); }, 400);
    },
    closeChat: function() { let overlay = document.getElementById('vn-chat-overlay'); if (overlay) { overlay.style.display = 'none'; overlay.innerHTML = ''; } }
});
