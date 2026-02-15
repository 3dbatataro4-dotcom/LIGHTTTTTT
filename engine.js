window.game = window.game || {};
Object.assign(window.game, {
    // 遊戲狀態與資源
    money: 500, fuel: 100, maxFuel: 100, food: 100, maxFood: 100,
    fatigue: 0, maxFatigue: 100, crewMax: 3,
    day: 1, maxDays: 10, hour: 8,
    upgrades: { light: false, armor: false, torpedo: false, submarine: false },
    crew: [], tavernMercs: [], mission: null, missions: [],
    distTotal: 0, distLeft: 0, ap: 2, hp: 100, san: 100,
    // 🌟 新增 BOSS 戰相關變數
    bossMode: false, bossHp: 0,
    flags: { adoraDone: false, godBuff: null }, activeCrises: [], inventory: [], warehouse: [], inventoryMax: 5, warehouseMax: 25,
    codex: [], currentAudio: null, weather: 'CLEAR',

    // --- 系統初始化 ---
    init: function() {
        if (typeof DB !== 'undefined') this.crew = [...DB.coreCrew]; // 載入初始成員
        this.refreshTavern();
        this.randomizeWeather();
        this.updateUI();
        if (this.refreshMissions) this.refreshMissions();
        // 🌟 拔除原本的 peter 彈窗與 openTab，改成等待玩家點擊 START
    },

    // 🌟 替換原本的 enterGame，讓它在載入後呼叫前置劇情
    enterGame: function() {
        if(this.currentAudio) {
            this.currentAudio.play().catch(e => console.log("Audio play failed:", e));
        } else {
            this.playMusic(BGM_PORT);
        }
        document.getElementById('title-layer').style.animation = "fadeOut 1s forwards";
        setTimeout(() => {
            document.getElementById('title-layer').style.display = 'none';
            document.getElementById('main-hud').style.display = 'flex';
            document.getElementById('port-layer').style.display = 'flex';

            this.init();
            this.switchMode('town');
            this.saveGame(false);
            // 🌟 呼叫前置劇情
            this.showPrologue(); 
        }, 1000);
    },

    // --- 🌟 新增：前置劇情 (彼得的警告) ---
    showPrologue: function() {
        let storyMsg = `
            <div style="text-align:left; font-size:1rem; line-height:1.6; color:#cfd8dc; padding:5px;">
                <p style="margin-top:0;">「聽好了。第七星區已經完蛋了。」</p>
                <p>彼得焦躁地摸著腰間的聖水瓶，壓低了聲音。</p>
                <p>「深淵底下的『舊日支配者』正在甦醒。最多十天... 只要十天，克拉肯就會把這片廢棄港口連同我們一起吞噬。</p>
                <p style="margin-bottom:0;">去修好你們的 S.S. NOEMA 號，去酒館找些不要命的傢伙，想辦法搞到<span style="color:var(--alert)">【深淵魚雷】</span>... 這是我們唯一的活路。」</p>
            </div>`;

        this.modal("peter", "彼得村長", storyMsg);
        
        // 覆寫彈窗按鈕，讓它點擊後進入教學畫面
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar); padding:12px; font-size:1.1rem;" onclick="game.showTutorial()">[系統讀取] 進入 S.S. NOEMA OS 指南</button>`;
            }
        }, 10);
    },

    // --- 🌟 新增：系統教學視窗 ---
    showTutorial: function() {
        let tutorialHTML = `
            <div style="text-align:left; font-size:0.95rem; line-height:1.6; color:#cfd8dc; max-height: 50vh; overflow-y: auto; padding: 0 5px;">
                <h3 style="color:var(--gold); border-bottom:1px dashed #555; padding-bottom:5px; margin-top:0;">⏳ 殘酷的十日死線</h3>
                <p style="margin: 5px 0 15px 0;">第 10 天午夜，克拉肯將全面甦醒。如果你在那之前沒有進入【深淵中心】擊殺牠，第七星區將迎來毀滅 (GAME OVER)。</p>
                
                <h3 style="color:var(--sonar); border-bottom:1px dashed #555; padding-bottom:5px;">⚙️ 生存法則</h3>
                <ul style="padding-left:20px; margin-bottom:15px;">
                    <li style="margin-bottom:8px;"><b>航行與 AP</b>：出航後每回合有行動點數，請謹慎分配給船員執行推進或技能。</li>
                    <li style="margin-bottom:8px;"><b>理智 (SAN)</b>：深海的壓迫會讓船員持續掉 SAN，歸零將獲得永久【心理創傷】。請帶上會唱歌或心理疏導的船員！</li>
                    <li style="margin-bottom:8px;"><b>疲勞極限</b>：疲勞達到 100% 畫面將產生暈眩，並引發極度嚴重的幻覺與理智崩潰。記得回旅館休息。</li>
                </ul>

                <h3 style="color:var(--alert); border-bottom:1px dashed #555; padding-bottom:5px;">⚔️ 最終決戰準備</h3>
                <p style="margin: 5px 0 0 0;">船隻預設無法對抗巨獸。你必須在村長家擴建船隻，並存夠 $2500 購買<b style="color:var(--alert)">「深淵魚雷」</b>，否則面對克拉肯只有死路一條。</p>
            </div>
        `;
        
        this.modal("system", "SYSTEM OS: 核心操作指南", tutorialHTML);
        
        // 覆寫按鈕，完成教學並正式開始
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--gold); color:var(--gold); padding:12px; font-size:1.1rem; font-weight:bold;" onclick="game.closeModal()">系統登入完畢 (START)</button>`;
            }
        }, 10);
    },

    // 🌟 新增：測試模式 (直達勝利後小鎮生活)
    debugVictoryMode: function() {
        document.getElementById('title-layer').style.display = 'none';
        document.getElementById('main-hud').style.display = 'flex';
        document.getElementById('port-layer').style.display = 'flex';
        
        this.playMusic(BGM_PORT);
        
        // 設定測試數值
        this.day = 11; // 第 11 天 (勝利後)
        this.money = 99999; 
        this.fuel = 100; this.maxFuel = 300;
        this.food = 100; this.maxFood = 300;
        this.hp = 100; this.san = 100;
        this.crewMax = 8;
        this.flags.victory = true; // 設定勝利旗標
        
        // 解鎖所有科技
        this.upgrades = { light: true, armor: true, torpedo: true, submarine: true };
        
        // 套用勝利主題
        document.body.classList.add('theme-sunny');

        this.modal("system", "DEBUG MODE", "已啟動勝利後測試模式。<br>天數：DAY 11<br>狀態：已擊敗克拉肯<br>主題：明亮小鎮<br><br>盡情享受退休生活吧。");
        
        this.refreshMissions(); 
        this.updateUI();
        this.switchMode('town');
    },

    // 🌟 新增：切換 小鎮/船艙 模式
    switchMode: function(mode) {
        document.getElementById('tab-town').classList.toggle('active', mode === 'town');
        document.getElementById('tab-ship').classList.toggle('active', mode === 'ship');
        
        // 🌟 隱藏舊的左側選單，釋放全螢幕空間
        const menuArea = document.getElementById('port-menu-area');
        if(menuArea) menuArea.style.display = 'none'; 
        
        const mainContent = document.getElementById('main-content');

        if (mode === 'town') {
            // 繪製超酷的全息小鎮地圖
            mainContent.innerHTML = `
                <div class="holo-container">
                    <div id="map-tooltip" style="position:absolute; display:none; background:rgba(0,0,0,0.9); border:1px solid var(--sonar); padding:8px 12px; color:#fff; z-index:20; pointer-events:none; font-size:0.9rem; border-radius:4px; box-shadow:0 0 10px var(--sonar-dim); white-space:nowrap;"></div>
                    <div class="scanline"></div>
                    <div class="map-layer">
                        <!-- 🌟 調整 viewBox 進行縮放，並加大字體 -->
                        <svg viewBox="0 0 800 600">
                            <!-- 🌟 優化：viewBox 800x600，中心 400,300。網格 40x40。300%40=20，所以 y 偏移 20 讓線條穿過中心 -->
                            <defs><pattern id="grid" x="0" y="20" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--sonar)" stroke-opacity="0.15" stroke-width="1"/></pattern></defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                            
                            <path class="map-line" d="M 400 300 L 200 150 L 600 150 L 400 300 L 400 500 L 150 450 M 400 500 L 650 450" />
                            <circle cx="400" cy="300" r="50" fill="none" stroke="var(--sonar)" stroke-opacity="0.3" stroke-width="2" />

                            <g class="building-group" transform="translate(400, 300)" onclick="game.openTab('hall')" data-desc="🏛️ 村長家：升級船隻設施">
                                <rect class="map-building" x="-40" y="-40" width="80" height="80" transform="rotate(45)" />
                                <text class="building-label" x="0" y="70" text-anchor="middle" font-size="24">🏛️ 村長家 (HALL)</text>
                            </g>
                            <g class="building-group" transform="translate(200, 150)" onclick="game.openTab('guild')" data-desc="📜 委託社：承接探索任務">
                                <polygon class="map-building" points="-30,30 30,30 0,-40" />
                                <text class="building-label" x="0" y="60" text-anchor="middle" font-size="24">📜 委託社 (GUILD)</text>
                            </g>
                            <g class="building-group" transform="translate(600, 150)" onclick="game.openTab('store')" data-desc="🛒 補給站：購買生存物資">
                                <rect class="map-building" x="-35" y="-25" width="70" height="50" />
                                <text class="building-label" x="0" y="55" text-anchor="middle" font-size="24">🛒 補給站 (STORE)</text>
                            </g>
                            <g class="building-group" transform="translate(400, 500)" onclick="game.openTab('tavern')" data-desc="🍺 酒館：招募強力傭兵">
                                <circle class="map-building" r="35" />
                                <text class="building-label" x="0" y="65" text-anchor="middle" font-size="24">🍺 酒館 (TAVERN)</text>
                            </g>
                            <g class="building-group" transform="translate(150, 450)" onclick="game.openTab('inn')" data-desc="🛌 旅館：休息恢復狀態">
                                <rect class="map-building" x="-30" y="-30" width="60" height="60" rx="10" />
                                <text class="building-label" x="0" y="60" text-anchor="middle" font-size="24">🛌 旅館 (INN)</text>
                            </g>
                            <g class="building-group" transform="translate(650, 450)" onclick="game.openTab('warehouse')" data-desc="📦 倉庫：管理道具與背包">
                                <rect class="map-building" x="-35" y="-35" width="70" height="70" />
                                <text class="building-label" x="0" y="65" text-anchor="middle" font-size="24">📦 倉庫 (STORAGE)</text>
                            </g>
                            <g class="building-group" transform="translate(400, 60)" onclick="game.openTab('port')">
                                <path class="map-building" d="M -50 0 L 50 0 L 40 30 L -40 30 Z" />
                                <rect class="map-building" x="-5" y="-30" width="10" height="30" />
                                <text class="building-label" x="0" y="55" text-anchor="middle">⚓ 港口 (PORT)</text>
                            </g>
                            <path class="map-line" d="M 400 90 L 400 300" />
                            <text x="400" y="580" fill="var(--sonar)" font-size="18" text-anchor="middle" letter-spacing="5px" opacity="0.5" style="pointer-events:none;">SECTOR-7 PORT HOLOMAP</text>
                        </svg>
                    </div>
                </div>
            `;
            setTimeout(() => this.initMapControls(), 50); // 🌟 初始化地圖拖曳功能
        } else {
            // 🌟 船艙模式
            // 切換到船艙時，只渲染畫面，不再自動啟動出航
            if (typeof this.renderCmds === 'function') this.renderCmds(); 
            this.openShipMenu();
        }
    },

    // 🌟 新增：地圖拖曳與縮放控制
    initMapControls: function() {
        const svg = document.querySelector('.holo-container svg');
        if (!svg) return;
        
        let vb = { x: 50, y: 50, w: 700, h: 500 }; // 初始 viewBox
        let isDown = false;
        let startX, startY;

        const updateViewBox = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);

        // 滑鼠/觸控通用處理
        const startDrag = (x, y) => {
            isDown = true; startX = x; startY = y;
            svg.style.cursor = 'grabbing';
        };

        const moveDrag = (x, y) => {
            if (!isDown) return;
            // 計算移動比例 (根據當前縮放層級)
            const scaleX = vb.w / svg.clientWidth;
            const scaleY = vb.h / svg.clientHeight;
            vb.x -= (x - startX) * scaleX;
            vb.y -= (y - startY) * scaleY;
            startX = x; startY = y;
            updateViewBox();
        };

        const endDrag = () => { isDown = false; svg.style.cursor = 'grab'; };

        // 綁定事件
        svg.addEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => { if(isDown) { e.preventDefault(); moveDrag(e.clientX, e.clientY); } });
        window.addEventListener('mouseup', endDrag);

        svg.addEventListener('touchstart', e => { if(e.touches.length===1) startDrag(e.touches[0].clientX, e.touches[0].clientY); });
        svg.addEventListener('touchmove', e => { if(e.touches.length===1) moveDrag(e.touches[0].clientX, e.touches[0].clientY); });
        svg.addEventListener('touchend', endDrag);

        // 滾輪縮放
        svg.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.1 : 0.9;
            const newW = vb.w * factor, newH = vb.h * factor;
            vb.x += (vb.w - newW) / 2; vb.y += (vb.h - newH) / 2; // 向中心縮放
            vb.w = newW; vb.h = newH;
            updateViewBox();
        });

        // 🌟 新增：懸浮提示 (Tooltip) 邏輯
        const tooltip = document.getElementById('map-tooltip');
        const buildings = document.querySelectorAll('.building-group');

        buildings.forEach(g => {
            g.addEventListener('mouseenter', () => {
                const desc = g.getAttribute('data-desc');
                if(desc) {
                    tooltip.innerHTML = desc;
                    tooltip.style.display = 'block';
                }
            });
            g.addEventListener('mousemove', (e) => {
                const rect = document.querySelector('.holo-container').getBoundingClientRect();
                // 計算相對座標並加上一點偏移
                let x = e.clientX - rect.left + 15;
                let y = e.clientY - rect.top + 15;
                tooltip.style.left = x + 'px';
                tooltip.style.top = y + 'px';
            });
            g.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        });
    },

    // 🌟 新增：船艙主控台畫面
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
    },

    // --- 存檔系統 ---
    saveGame: function(showModal = true) {
        const data = {
            money: this.money, fuel: this.fuel, food: this.food,
            fatigue: this.fatigue, day: this.day, hour: this.hour,
            crew: this.crew, upgrades: this.upgrades,
            inventory: this.inventory, warehouse: this.warehouse,
            codex: this.codex, missions: this.missions,
            mission: this.mission, flags: this.flags,
            maxFuel: this.maxFuel, maxFood: this.maxFood, crewMax: this.crewMax,
            hp: this.hp, san: this.san
        };
        localStorage.setItem('noema_save', JSON.stringify(data));
        if(showModal) this.modal("system", "系統存檔", "數據已寫入核心存儲區。");
    },

    loadGame: function() {
        const json = localStorage.getItem('noema_save');
        if(!json) { this.modal("system", "系統錯誤", "找不到存檔記錄。"); return; }
        
        try {
            const data = JSON.parse(json);
            Object.assign(this, data);
            
            // 進入遊戲介面
            document.getElementById('title-layer').style.display = 'none';
            document.getElementById('main-hud').style.display = 'flex';
            document.getElementById('port-layer').style.display = 'flex';
            
            this.playMusic(BGM_PORT);
            this.updateUI();
            this.switchMode('town');
            this.modal("system", "系統讀取", "歡迎回來，指揮官。");
        } catch(e) {
            console.error(e);
            this.modal("system", "系統錯誤", "存檔數據損壞。");
        }
    },

    // --- UI 更新與渲染 ---
    updateUI: function() {
        // 🌟 更新天氣特效 (僅在出航時顯示)
        if (this.isVoyaging && (this.weather === 'RAIN' || this.weather === 'STORM')) {
            this.createRainEffect();
        } else {
            this.stopWeather();
        }
        
        // 🌟 新增：疲勞度 100% 暈眩特效即時更新
        const seaLayer = document.getElementById('sea-layer');
        if (seaLayer) {
            if (this.fatigue > 90) seaLayer.classList.add('dizzy-effect');
            else seaLayer.classList.remove('dizzy-effect');
        }

        const set = (id, v) => {
            const el = document.getElementById(id);
            if(el) el.innerText = v;
        };
        set('uiMoney', this.money); set('uiFuel', this.fuel); set('maxFuel', this.maxFuel);
        set('uiFood', this.food); set('maxFood', this.maxFood);
        set('uiHp', this.hp); set('uiSan', this.san);
        set('uiCrew', this.crew.length); set('maxCrew', this.crewMax);
        set('uiFatigue', this.fatigue + '%');
        
        // 🌟 修復：分別更新時間與天氣，避免 innerHTML 破壞 DOM 導致指針遺失
        set('uiDay', `DAY ${this.day} / ${this.maxDays}`);
        
        const timeEl = document.getElementById('uiTime');
        if(timeEl) {
            // 🌟 支援分鐘顯示 (0.5 小時 = 30 分)
            let h = Math.floor(this.hour);
            let m = Math.round((this.hour - h) * 60);
            let mStr = m < 10 ? '0'+m : m;
            timeEl.innerText = `${h < 10 ? '0'+h : h}:${mStr}`;
            timeEl.style.color = this.hour >= 22 ? 'var(--alert)' : 'var(--text)';
        }

        const weatherEl = document.querySelector('.weather-text');
        if(weatherEl && typeof WEATHER_TYPES !== 'undefined' && WEATHER_TYPES[this.weather]) {
            weatherEl.innerText = `${WEATHER_TYPES[this.weather].icon} ${WEATHER_TYPES[this.weather].name}`;
            
            // 🌟 更新天氣視覺特效
            const seaLayer = document.getElementById('sea-layer');
            if (seaLayer) {
                seaLayer.classList.remove('weather-storm', 'weather-fog', 'weather-tailwind', 'weather-headwind');
                if (this.weather === 'STORM') seaLayer.classList.add('weather-storm');
                if (this.weather === 'FOG') seaLayer.classList.add('weather-fog');
                if (this.weather === 'TAILWIND') seaLayer.classList.add('weather-tailwind');
                if (this.weather === 'HEADWIND') seaLayer.classList.add('weather-headwind');
            }
        }
        
        const fatEl = document.getElementById('uiFatigue');
        fatEl.classList.toggle('alert', this.fatigue > 50);
        
        const hpEl = document.getElementById('uiHp');
        if(hpEl) hpEl.style.color = this.hp <= 30 ? 'var(--alert)' : 'var(--sonar)';
    },

    npcHtml: function(id) {
        const n = DB.npc[id];
        let msg = n.msg;
        // 🌟 勝利後的對話差分
        if (this.flags && this.flags.victory && n.victoryMsg) {
            msg = n.victoryMsg;
        }
        return `<div class="comm-log">
            <img class="avatar" src="${getImgUrl(id)}" onerror="this.src='${fallbackSVG}'" />
            <div class="dialogue"><div class="speaker">${n.name}</div><div class="msg">"${msg}"</div></div>
        </div>`;
    },

    // 🌟 打開特定設施介面 (並自動附帶返回按鈕)
    openTab: function(tabId) {
        const content = document.getElementById('main-content');
        let html = '';
        
        // 判斷是小鎮建築還是船艙功能，提供對應的返回按鈕
        let backBtn = '';
        if (['crew', 'codex'].includes(tabId)) {
            backBtn = `<button class="tech-btn" style="margin-bottom:15px; width:auto; padding:8px 15px; border-color:#555; color:#aaa;" onclick="game.openShipMenu()">⬅ 返回主控台</button>`;
        } else {
            backBtn = `<button class="tech-btn" style="margin-bottom:15px; width:auto; padding:8px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.switchMode('town')">⬅ 返回小鎮地圖</button>`;
        }

        // --- 以下組裝 HTML 內容 ---

        if (tabId === 'hall') {
            // 🌟 判定是否滿等
            let maxCrew = this.crewMax >= 8;
            let maxFood = this.maxFood >= 300;
            let maxFuel = this.maxFuel >= 300;

            // 🌟 檢測是否為移動端 (若為移動端則禁用藍圖拖曳，避免與頁面捲動衝突)
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

            // 🌟 輔助：生成帶有長按偵測的事件字串 (傳入 event 以區分觸控與滑鼠)
            const bpEvents = (type, cost) => `
                oncontextmenu="return false;"
                onmousedown="game.handleBpPress(this, '${type}', ${cost}, event)"
                onmouseup="game.handleBpRelease(this)"
                onmouseleave="game.handleBpRelease(this)"
                ontouchstart="game.handleBpPress(this, '${type}', ${cost}, event)"
                ontouchcancel="game.handleBpRelease(this)"
                ontouchend="game.handleBpRelease(this)"
                onclick="if(!game.longPressTriggered) game.confirmUpgrade('${type}', ${cost})"`;

            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('peter_win')">💬 與彼得閒聊 (通關)</button>` : ``;

            html = backBtn + `<div style="display:flex; flex-wrap:wrap; gap:20px;">
                <div style="flex:1; min-width:250px;">
                    ${this.npcHtml('peter')}
                    ${chatBtn}
                </div>
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

                            <style>
                                .bp-node { position:absolute; transform:translate(-50%, -50%); cursor:pointer; z-index:10; display:flex; flex-direction:column; align-items:center; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; }
                                .bp-dot { width:12px; height:12px; background:var(--sonar); border-radius:50%; box-shadow:0 0 8px var(--sonar); animation:blink 2s infinite alternate; transition:0.3s; border: 2px solid #000; }
                                .bp-label { margin-top:6px; color:#cfd8dc; font-size:0.75rem; background:rgba(0,10,15,0.85); border:1px solid var(--sonar); padding:4px 8px; border-radius:4px; white-space:nowrap; transition:0.3s; pointer-events:none; }
                                .bp-node:hover .bp-dot { background:var(--gold); box-shadow:0 0 15px var(--gold); transform:scale(1.3); }
                                .bp-node:hover .bp-label { border-color:var(--gold); color:var(--gold); z-index:20; transform:translateY(-2px); }
                                .bp-bought .bp-dot { background: #4caf50; box-shadow:0 0 8px #4caf50; animation:none; border-color:#fff; }
                                .bp-bought .bp-label { border-color: #4caf50; color: #4caf50; }
                            </style>

                            <div class="bp-node ${this.upgrades.light ? 'bp-bought' : ''}" style="top: 15%; left: 50%;" ${bpEvents('light', 1500)}>
                                <div class="bp-dot"></div><div class="bp-label">💡 探照燈 $1500</div>
                            </div>
                            <div class="bp-node ${this.upgrades.armor ? 'bp-bought' : ''}" style="top: 35%; left: 25%;" ${bpEvents('armor', 2000)}>
                                <div class="bp-dot"></div><div class="bp-label">🛡️ 裝甲 $2000</div>
                            </div>
                            <div class="bp-node ${this.upgrades.torpedo ? 'bp-bought' : ''}" style="top: 35%; left: 75%;" ${bpEvents('torpedo', 2500)}>
                                <div class="bp-dot" style="${this.upgrades.torpedo ? '' : 'background:var(--alert); box-shadow:0 0 10px var(--alert);'}"></div>
                                <div class="bp-label">💥 魚雷 $2500</div>
                            </div>
                            <div class="bp-node ${maxCrew ? 'bp-bought bp-max' : ''}" style="top: 48%; left: 50%;" ${bpEvents('crew', 1000)}>
                                <div class="bp-dot"></div><div class="bp-label">👥 船員艙 ${maxCrew ? '(MAX)' : '(+1) $1000'}</div>
                            </div>
                            <div class="bp-node ${maxFood ? 'bp-bought bp-max' : ''}" style="top: 62%; left: 50%;" ${bpEvents('food', 500)}>
                                <div class="bp-dot"></div><div class="bp-label">🥫 糧倉 ${maxFood ? '(MAX)' : '(+50) $500'}</div>
                            </div>
                            <div class="bp-node ${maxFuel ? 'bp-bought bp-max' : ''}" style="top: 76%; left: 50%;" ${bpEvents('fuel', 500)}>
                                <div class="bp-dot"></div><div class="bp-label">🔋 能源箱 ${maxFuel ? '(MAX)' : '(+50) $500'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            
            // 🌟 僅在非移動端啟用藍圖控制 (手機端保持靜態，方便滑動網頁)
            if (!isMobile) setTimeout(() => this.initBlueprintControls(), 50);
        } else if (tabId === 'store') {
            // 🌟 建立滑條產生器 (動態計算可買最大值)
            const sliderCard = (id, name, cur, maxVal, price) => {
                let affordable = Math.floor(this.money / price);
                let space = Math.floor(maxVal - cur);
                let maxBuy = Math.max(0, Math.min(affordable, space));
                let isMax = cur >= maxVal;
                
                return `<div class="tech-card" style="border-color:var(--border); padding:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--sonar); font-weight:bold;">${name} ($${price}/單位)</span>
                        <span style="color:#aaa;">容量: ${Math.floor(cur)}/${maxVal}</span>
                    </div>
                    ${isMax ? `<div style="color:var(--alert); text-align:center;">已達容量上限</div>` : `
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="range" id="sl-${id}" min="0" max="${maxBuy}" value="0" style="flex:1;" oninput="document.getElementById('cst-${id}').innerText = this.value * ${price}; document.getElementById('amt-${id}').innerText = this.value;">
                        <div style="min-width:60px; text-align:right; color:var(--gold);">$<span id="cst-${id}">0</span></div>
                    </div>
                    <button class="tech-btn" style="width:100%; margin-top:10px; border-color:var(--sonar); color:var(--sonar);" onclick="game.buyQuantity('${id}', document.getElementById('sl-${id}').value, ${price})">購買 <span id="amt-${id}">0</span> 單位</button>
                    `}
                </div>`;
            };

            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('lynn_win')">💬 與林恩閒聊 (通關)</button>` : ``;

            html = backBtn + this.npcHtml('lynn') + chatBtn + `<div class="grid">
                ${sliderCard('fuel', '燃油', this.fuel, this.maxFuel, 2)}
                ${sliderCard('food', '口糧', this.food, this.maxFood, 3)}
                ${sliderCard('hp', '船體裝甲修復', this.hp, 100, 5)}
                ${this.sysCard('初級釣竿', '$150', '耐久度 10/10，開啟釣魚功能', `game.buyRod()`)}
                ${this.sysCard('特製魚餌', '$20', '釣魚必備消耗品 (放入背包)', `game.buyBait()`)}
                ${this.sysCard('捕魚網', '$40', '一次性捕魚道具 (放入倉庫)', `game.buyNet()`)}
            </div>`;
            
        // 🌟 新增：港口與釣魚介面
        } else if (tabId === 'port') {
            let rodStatus = this.flags.rodDurability > 0 ? `<span style="color:var(--sonar)">耐久度: ${this.flags.rodDurability}/10</span>` : `<span style="color:var(--alert)">未裝備釣竿或已損壞</span>`;
            let baitCount = this.warehouse.filter(i => i === 'bait').length;
            
            html = backBtn + `
            <h2 style="color:var(--sonar); border-bottom:1px solid var(--sonar); padding-bottom:10px;">⚓ 廢棄港口區</h2>
            <div style="background:rgba(0,20,30,0.5); padding:15px; border:1px solid var(--sonar); margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                    <div>🎣 釣竿狀態: ${rodStatus}</div>
                    <div>🪱 魚餌數量: <span style="color:var(--gold)">${baitCount}</span></div>
                </div>
                <div id="fishing-area" style="text-align:center; padding:30px; background:#000; border:1px dashed #333; height:150px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <div id="fish-msg" style="font-size:1.1rem; color:#aaa; margin-bottom:15px;">平靜的海面... 準備好下竿了嗎？</div>
                    <button id="fish-btn" class="tech-btn" style="border-color:var(--sonar); color:var(--sonar); font-size:1.2rem; padding:10px 40px;" onclick="game.startFishing()">拋出釣線</button>
                </div>
            </div>
            
            <h3 style="color:var(--gold);">🐟 漁獲交易</h3>
            <div class="tech-card" style="border-color:var(--gold);">
                <div class="card-body" style="color:#aaa;">尋找買家出售背包裡的漁獲。運氣好的話，或許能遇到出手闊綽的神秘人物...</div>
                <button class="tech-btn" style="border-color:var(--gold); color:var(--gold); margin-top:10px; width:100%;" onclick="game.findFishBuyer()">尋找買家出售</button>
            </div>
            `;
        } else if (tabId === 'warehouse') {
            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('manmu_win')">💬 與小目閒聊 (通關)</button>` : ``;

            // 🌟 倉庫管理員換成小目 (manmu)
            html = backBtn + this.npcHtml('manmu') + chatBtn + `
            <div style="display:flex; gap:15px; margin-top:10px; flex-wrap:wrap;">
                <div style="flex:1; min-width:250px; border:1px solid var(--sonar); padding:10px; background:rgba(0,0,0,0.5);">
                    <h3 style="color:var(--sonar); margin-top:0; font-size:1rem;">🎒 船上背包 (${this.inventory.length}/${this.inventoryMax})</h3>
                    <div style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">點擊道具放回倉庫</div>
                    <div id="ui-inv-list">${this.renderItemList(this.inventory, 'toWarehouse')}</div>
                </div>
                <div style="flex:1; min-width:250px; border:1px solid var(--gold); padding:10px; background:rgba(0,0,0,0.5);">
                    <h3 style="color:var(--gold); margin-top:0; font-size:1rem;">📦 小鎮倉庫 (${this.warehouse.length}/${this.warehouseMax})</h3>
                    <div style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">點擊道具帶上船</div>
                    <div id="ui-wh-list">${this.renderItemList(this.warehouse, 'toInventory')}</div>
                </div>
            </div>`;
        } else if (tabId === 'guild') {
            // 🌟 如果是第 10 天，隱藏刷新按鈕
            // 🌟 修正：勝利後 (victory) 即使超過 10 天也允許刷新
            let refreshBtn = (this.day < 10 || (this.flags && this.flags.victory)) ? `<button class="tech-btn" style="padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--gold); color:var(--gold); white-space:nowrap;" onclick="game.forceRefreshGuild()">🔄 刷新 ($50)</button>` : ``;

            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('hassel_win')">💬 與哈蘇閒聊 (通關)</button>` : ``;

            html = backBtn + this.npcHtml('hassel') + chatBtn + `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #333; padding-bottom:10px; margin-bottom:15px; flex-wrap:nowrap;">
                <h3 style="color:var(--sonar); margin:0; font-size:1.1rem; white-space:nowrap;">📜 委託發布板</h3>
                ${refreshBtn}
            </div>
            <div class="grid">`;
            
            this.missions.forEach((m, idx) => {
                html += this.missionCard(m.title, m.area, m.dist, m.reward, m.time, m.desc, m.type, m.iconId, idx);
            });
            html += `</div>`;
            if(this.mission) {
                html += `<div style="margin-top:20px; color:var(--sonar)">已設定航線：${this.mission.title}</div>`;
            }
        } else if (tabId === 'tavern') {
            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('lilith_win')">💬 與莉莉絲閒聊 (通關)</button>` : ``;

            html = backBtn + this.npcHtml('lilith') + chatBtn + `<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed #333; padding-bottom:10px; margin-bottom:15px; flex-wrap:nowrap;">
                <h3 style="color:var(--sonar); margin:0; font-size:1.1rem; white-space:nowrap;">🍻 招募船員</h3>
                <button class="tech-btn" style="padding:4px 10px; font-size:0.85rem; width:auto; border-color:var(--gold); color:var(--gold); white-space:nowrap;" onclick="game.forceRefreshTavern()">🔄 刷新 ($50)</button>
            </div>
            <div class="grid">`;
            this.tavernMercs.forEach(m => {
                if(!this.crew.find(c=>c.id===m.id)) html += this.charCard(m, `game.hire('${m.id}')`, 'HIRE ($' + m.cost + ')');
            });
            html += `</div>`;
        } else if (tabId === 'inn') {
            // 🌟 勝利後專屬按鈕
            let chatBtn = (this.flags && this.flags.victory) ? `<button class="tech-btn" style="width:100%; margin-bottom:15px; border-color:var(--gold); color:var(--gold);" onclick="game.startChat('costa_win')"&gt;💬 與科絲塔閒聊 (通關)</button>` : ``;

            // 基礎休息功能
            html = backBtn + this.npcHtml('costa') + chatBtn + `<div class="grid">
                ${this.sysCard('☕ 短暫休息', '$40', '疲勞度 -20 / 些微恢復理智 / 經過 2 小時', `game.rest('short')`)}
                ${this.sysCard('🛏️ 過夜休息', '$100', '疲勞度 -50 / 大幅恢復理智 / 跳至次日早上', `game.rest('long')`)}
            </div>`;
            
            // 🌟 新增：心理創傷治療區塊
            html += `<h3 style="color:var(--sonar); margin-top:25px; border-bottom:1px dashed #333; padding-bottom:5px;">💉 深度心理治療</h3>`;
            
            // 篩選出有創傷的船員
            let traumatizedCrew = this.crew.filter(c => c.trauma);
            
            if (traumatizedCrew.length === 0) {
                html += `<div style="color:#aaa; font-size:0.9rem; padding:10px; text-align:center; background:rgba(0,0,0,0.3); border-radius:5px;">
                    目前沒有船員需要進行深度的心理治療。<br>（大家都還保有理智）
                </div>`;
            } else {
                html += `<div class="grid">`;
                traumatizedCrew.forEach(c => {
                    html += this.sysCard(
                        `治療 ${c.name}`, 
                        '$300', 
                        `消除【${c.trauma.name}】並將理智恢復至上限`, 
                        `game.cureTrauma('${c.id}')`
                    );
                });
                html += `</div>`;
            }
        } else if (tabId === 'crew') {
            html = backBtn + `<div class="grid">`;
            this.crew.forEach(c => {
                let status = "正常", color = "var(--sonar)";
                if(this.fatigue > 50) { status = "疲勞"; color = "var(--gold)"; }
                if(this.fatigue > 80) { status = "極限"; color = "var(--alert)"; }
                html += this.charCard(c, '', '', status, color, `game.showCrewDetail('${c.id}')`);
            });
            html += `</div>`;
        } else if (tabId === 'codex') {
            html = backBtn + `<h2 style="color:var(--sonar); border-bottom:1px solid var(--sonar); padding-bottom:10px;">🐟 漁獲圖鑑 (FISH CODEX)</h2>
            <div class="grid">`;
            
            // 🌟 自動抓取 data.js 裡所有的魚類
            let fishKeys = Object.keys(ITEM_DB).filter(k => ITEM_DB[k].type === 'fish');
            let unlockedCount = 0;
            this.codex = this.codex || [];

            // 🌟 優化：分頁式圖鑑 (避免頁面過長)
            this.codexPage = this.codexPage || '港口'; // 預設頁面
            const habitats = ['港口', '淺灘', '暗礁', '深淵'];
            
            // 渲染分頁按鈕
            html += `<div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px; overflow-x:auto;">`;
            habitats.forEach(t => {
                let active = this.codexPage === t ? 'border-color:var(--gold); color:var(--gold); background:rgba(255,215,0,0.1);' : 'border-color:#555; color:#777;';
                html += `<button class="tech-btn" style="width:auto; padding:5px 15px; white-space:nowrap; ${active}" onclick="game.codexPage='${t}'; game.openTab('codex')">${t}</button>`;
            });
            html += `</div>`;

            // 篩選當前頁面的魚
            let zoneFish = fishKeys.filter(k => ITEM_DB[k].habitat === this.codexPage);
            
            if (zoneFish.length === 0) {
                html += `<div style="grid-column:1/-1; text-align:center; color:#555; padding:30px;">此區域尚無已知生物數據。</div>`;
            } else {
                zoneFish.forEach(k => {
                    let isUnlocked = this.codex.includes(k);
                    if(isUnlocked) unlockedCount++; // 統計總解鎖數 (不分頁)
                    let f = ITEM_DB[k];
                    
                    if (isUnlocked) {
                        html += `<div class="tech-card" style="border-color:var(--sonar);">
                            <div class="card-header" style="justify-content:flex-start; gap:15px; border-bottom:none; margin-bottom:0; padding-bottom:0;">
                                <div style="font-size:2rem; background:rgba(0,176,255,0.1); width:50px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--sonar);">${f.icon}</div>
                                <div>
                                    <div style="color:var(--sonar); font-weight:bold; font-size:1.1rem;">${f.name}</div>
                                    <div style="color:var(--gold); font-size:0.8rem;">售價: $${f.value}</div>
                                </div>
                            </div>
                            <div class="card-body" style="color:#aaa; font-size:0.9rem; margin-top:10px;">${f.desc}</div>
                        </div>`;
                    } else {
                        html += `<div class="tech-card" style="border-color:#333; opacity:0.6;">
                            <div class="card-header" style="justify-content:flex-start; gap:15px; border-bottom:none; margin-bottom:0; padding-bottom:0;">
                                <div style="font-size:2rem; background:#111; width:50px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px dashed #555; color:#555;">?</div>
                                <div>
                                    <div style="color:#777; font-weight:bold; font-size:1.1rem;">未知的漁獲</div>
                                    <div style="color:#555; font-size:0.8rem;">棲息於${this.codexPage}</div>
                                </div>
                            </div>
                            <div class="card-body" style="color:#555; font-size:0.9rem; margin-top:10px;">尚未解鎖此圖鑑。</div>
                        </div>`;
                    }
                });
            }

            html += `</div>
            <div style="margin-top:20px; text-align:center; color:#aaa; font-size:0.9rem;">總收集進度: ${unlockedCount} / ${fishKeys.length}</div>`;
        }
        content.innerHTML = html;
    },

    // 🌟 強制刷新公會委託
    forceRefreshGuild: function() {
        if (this.money < 50) {
            this.modal("hassel", "哈蘇", "刷新資料庫需要手續費 $50。");
            return;
        }
        this.money -= 50;
        this.refreshMissions();
        this.openTab('guild'); // 重新渲染介面
        this.updateUI();
    },

    // 渲染道具列表 (給倉庫用)
    renderItemList: function(list, action) {
        if (list.length === 0) return '<div style="color:#555; text-align:center; padding:20px;">空空如也</div>';
        
        // 🌟 優化：統計數量並堆疊顯示
        let counts = {};
        list.forEach(id => { counts[id] = (counts[id] || 0) + 1; });

        let html = '<div style="display:flex; flex-direction:column; gap:5px;">';
        
        Object.keys(counts).forEach(itemId => {
            const item = ITEM_DB[itemId];
            const count = counts[itemId];
            if(!item) return;

            html += `<button class="cmd-btn" style="padding:8px; display:flex; justify-content:space-between; align-items:center;" onclick="game.requestTransferItem('${action}', '${itemId}', ${count})">
                <div style="display:flex; align-items:center;">
                    <span style="font-size:1.2rem; margin-right:8px;">${item.icon}</span> 
                    <div style="text-align:left;">
                        <div style="color:#fff; font-weight:bold; font-size:0.9rem;">${item.name}</div>
                        <div style="color:#777; font-size:0.7rem;">${item.desc}</div>
                    </div>
                </div>
                <div style="background:var(--sonar); color:#000; padding:2px 8px; border-radius:10px; font-weight:bold; font-size:0.8rem;">x${count}</div>
            </button>`;
        });
        return html + '</div>';
    },

    // 🌟 新增：請求轉移 (判斷是否需要彈出滑條)
    requestTransferItem: function(action, itemId, maxQty) {
        if (maxQty === 1) {
            this.transferItemQuantity(action, itemId, 1);
        } else {
            // 彈出滑條 Modal
            const item = ITEM_DB[itemId];
            const targetName = action === 'toWarehouse' ? '倉庫' : '背包';
            
            this.modal("none", "移動道具", `
                <div style="text-align:center;">
                    <div style="font-size:2rem; margin-bottom:10px;">${item.icon}</div>
                    <div style="margin-bottom:10px;">要移動多少 <span style="color:var(--gold)">${item.name}</span> 到${targetName}？</div>
                    
                    <div style="display:flex; gap:10px; align-items:center; justify-content:center; margin:20px 0;">
                        <input type="range" id="transfer-slider" min="1" max="${maxQty}" value="1" style="width:60%;" oninput="document.getElementById('transfer-val').innerText = this.value">
                        <div style="font-size:1.2rem; font-weight:bold; color:var(--sonar); width:40px;" id="transfer-val">1</div>
                    </div>
                </div>
            `);
            
            // 覆寫按鈕
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--sonar); color:var(--sonar);" onclick="game.confirmTransfer('${action}', '${itemId}')">確認移動</button>
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>
                `;
            }
        }
    },

    confirmTransfer: function(action, itemId) {
        const slider = document.getElementById('transfer-slider');
        const qty = parseInt(slider.value);
        this.closeModal();
        this.transferItemQuantity(action, itemId, qty);
    },

    // 🌟 新增：執行批量轉移
    transferItemQuantity: function(action, itemId, qty) {
        let source = action === 'toWarehouse' ? this.inventory : this.warehouse;
        let target = action === 'toWarehouse' ? this.warehouse : this.inventory;
        let limit = action === 'toInventory' ? this.inventoryMax : this.warehouseMax;

        if (target.length + qty > limit) {
            let targetName = action === 'toInventory' ? "背包" : "倉庫";
            this.modal("system", "系統", `${targetName}空間不足！<br>剩餘空間: ${limit - target.length} <br>嘗試移動: ${qty}`);
            return;
        }

        for(let i=0; i<qty; i++) {
            let idx = source.indexOf(itemId);
            if(idx !== -1) {
                target.push(source.splice(idx, 1)[0]);
            }
        }
        
        this.openTab('warehouse'); // 刷新畫面
    },

    // 打開海上背包
    openBackpack: function() {
        let list = document.getElementById('backpack-list');
        list.innerHTML = '';
        if (this.inventory.length === 0) {
            list.innerHTML = `<div style="color:#555; grid-column: 1 / -1; text-align:center; padding:30px;">
                背包空空如也... <br><span style="font-size:0.8rem;">(容量: 0/${this.inventoryMax})</span>
            </div>`;
        } else {
            // 🌟 顯示容量標題
            list.innerHTML += `<div style="grid-column:1/-1; color:var(--sonar); margin-bottom:10px; font-size:0.9rem; border-bottom:1px solid #333; padding-bottom:5px;">📦 目前負重: <span style="color:#fff; font-weight:bold;">${this.inventory.length}</span> / ${this.inventoryMax}</div>`;
            
            this.inventory.forEach((itemId, idx) => {
                let item = ITEM_DB[itemId];
                // 🌟 如果是魚類 (type: fish)，不顯示使用按鈕
                let useBtn = item.type === 'fish' ? '' : `<button class="tech-btn" style="border-color:var(--purple); color:var(--purple); margin-top:10px;" onclick="game.useItem(${idx})">使用道具</button>`;
                
                list.innerHTML += `<div class="tech-card" style="border-color:var(--purple);">
                    <div class="card-header" style="justify-content:flex-start; align-items:center; border-bottom: 1px dashed #333; padding-bottom: 10px; margin-bottom: 10px;">
                        <span style="font-size:1.5rem; margin-right:10px;">${item.icon}</span>
                        <span class="card-title" style="color:var(--purple); margin:0;">${item.name}</span>
                    </div>
                    <div class="card-body" style="color:#aaa;">${item.desc}</div>
                    ${useBtn}
                </div>`;
            });
        }
        document.getElementById('backpack-modal').style.display = 'flex';
    },

    // 使用道具
    useItem: function(idx) {
        let itemId = this.inventory[idx];
        let item = ITEM_DB[itemId];
        let consumed = item.effect(this);
        // 除非 effect 嚴格返回 false，否則視為消耗品
        if (consumed !== false) {
            this.inventory.splice(idx, 1);
        }
        
        // 🌟 優化：使用道具後立即更新介面狀態 (如血量、疲勞等)
        this.updateUI(); 
        this.renderDash(); 
        if (this.isVoyaging) this.renderCmds(); // 更新按鈕狀態 (例如背包數量變化)

        this.openBackpack(); // 刷新背包畫面
    },

    sysCard: function(title, cost, desc, fn, disabled=false) {
        return `<div class="tech-card">
            <div class="card-header"><span class="card-title">${title}</span><span class="card-cost">${cost}</span></div>
            <div class="card-body">${desc}</div>
            <button class="tech-btn" onclick="${fn}" ${disabled?'disabled':''}>${disabled?'INSTALLED':'PURCHASE'}</button>
        </div>`;
    },

    // --- 角色卡片渲染 (加入專屬 SAN 條與創傷顯示) ---
    charCard: function(c, onclickStr = '', btnText = '', status = '正常', statusColor = 'var(--sonar)', cardClick = '') {
        let btnHtml = onclickStr ? `<button class="tech-btn" style="border-color:var(--sonar); color:var(--sonar); margin-top:10px; width:100%;" onclick="${onclickStr}; event.stopPropagation();">${btnText}</button>` : '';
        let clickAttr = cardClick ? `onclick="${cardClick}" style="cursor:pointer;"` : '';
        
        // 🌟 繪製個人專屬 SAN 條
        let sanBar = `
            <div style="margin-top:10px;">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#b39ddb; margin-bottom:2px;">
                    <span>SANITY</span><span>${Math.floor(c.san)}/${c.maxSan}</span>
                </div>
                <div style="width:100%; background:#222; height:5px; border-radius:2px; overflow:hidden;">
                    <div style="width:${(c.san/c.maxSan)*100}%; background:#b39ddb; height:100%; transition:width 0.3s;"></div>
                </div>
            </div>`;
            
        // 🌟 顯示創傷特質
        let traumaText = c.trauma ? `<div style="color:var(--alert); font-size:0.8rem; font-weight:bold; margin-top:8px; background:rgba(255,0,0,0.15); padding:4px 6px; border-radius:4px;">⚠ 創傷：${c.trauma.name}</div>` : '';

        return `<div class="tech-card" ${clickAttr}>
            <div class="card-header">
                <img src="${getImgUrl(c.id)}" class="card-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="card-avatar-fallback" style="display:none;">${c.name[0]}</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;">
                        <span class="card-title">${c.name}</span>
                        <span style="font-size:0.8rem; color:${statusColor}; border:1px solid ${statusColor}; padding:2px 5px; border-radius:3px;">${status}</span>
                    </div>
                    <div class="card-role" style="color:var(--gold)">${c.role} | ${c.region === 'sector7' ? '第七星區' : '外來者'}</div>
                </div>
            </div>
            <div class="card-body">
                <div style="min-height:40px; color:#aaa; font-size:0.85rem;">${c.desc}</div>
                ${sanBar}
                ${traumaText}
            </div>
            ${btnHtml}
        </div>`;
    },

    // 🌟 修正：委託卡片排版優化，防止移動端字體擠壓與斷行
    missionCard: function(title, area, dist, reward, time, desc, type, iconId, idx) {
        let border = type==='boss' ? 'var(--alert)' : (type==='emergency' ? '#ff9100' : 'var(--border)');
        let color = type==='boss' ? 'var(--alert)' : (type==='emergency' ? '#ff9100' : 'var(--sonar)');
        let icon = type==='boss' ? '🦑' : (type==='emergency' ? '⚠' : (type==='adora' ? '👧' : '📜'));
        
        return `<div class="tech-card" style="border-color:${border}; cursor:pointer;" onclick="game.acceptMission(${idx})">
            <div class="card-header" style="align-items:center; border-bottom:1px solid #333; padding-bottom:8px; margin-bottom:8px;">
                <span class="card-title" style="color:${color}; font-size:1.05rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><span style="font-size:1.2rem;margin-right:5px;">${icon}</span>${title}</span>
            </div>
            <div class="card-body" style="padding-top:0;">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; font-size:0.85rem; color:#aaa; gap:5px;">
                    <span style="flex:1; min-width:80px;">區域: ${area}</span>
                    <span style="flex:1; min-width:80px;">距離: ${dist} KM</span>
                    <span style="flex:1; min-width:80px;">時間: ${time} HR</span>
                </div>
                <div style="color:var(--gold); font-weight:bold; margin-top:8px;">報酬：$${reward}</div>
                <div style="font-size:0.8rem; color:#888; margin-top:5px; border-top:1px dashed #333; padding-top:5px;">${desc}</div>
            </div>
        </div>`;
    },

    // --- 音效與動畫 ---
    playMusic: function(audioObj) {
        if (this.currentAudio === audioObj && !audioObj.paused) return;
        
        // 🌟 平滑淡出舊音樂
        const fadeOut = (audio) => {
            if(!audio) return;
            let vol = audio.volume;
            const interval = setInterval(() => {
                if (vol > 0.05) {
                    vol -= 0.05;
                    audio.volume = vol;
                } else {
                    clearInterval(interval);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 0.4; // 重置音量供下次使用
                }
            }, 50);
        };

        if (this.currentAudio) {
            fadeOut(this.currentAudio);
        }

        this.currentAudio = audioObj;
        if(audioObj) {
            audioObj.volume = 0; // 從靜音開始淡入
            audioObj.play().catch(e => console.log("Auto-play blocked:", e));
            
            let vol = 0;
            const fadeIn = setInterval(() => {
                if (vol < 0.4) {
                    vol += 0.02;
                    audioObj.volume = vol;
                } else {
                    clearInterval(fadeIn);
                }
            }, 50);
        }
    },

    playClick: function() {
        const audio = new Audio('https://file.garden/aWe99vhwaGcNwkok/%E6%84%9B%E9%BA%97%E7%B5%B2%E6%A8%82%E5%9C%92/%E9%9F%B3%E6%A8%82%E7%B4%A0%E6%9D%90/%E7%AC%AC%E4%B8%80%E7%AB%A0_%E9%BB%9E%E6%93%8A%E6%96%B9%E5%A1%8A.mp3');
        audio.volume = 0.6; // 設定音量，避免太刺耳
        audio.play().catch(e => {});
    },

    animateDist: function(start, end, duration) {
        const obj = document.getElementById("dist-display");
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            
            let percent = 100 - (parseInt(obj.innerHTML) / this.distTotal * 100);
            document.getElementById('voyage-progress').style.width = percent + '%';

            if (progress < 1) { window.requestAnimationFrame(step); } 
            else { obj.innerHTML = end; if(end <= 0) this.triggerArrival(); }
        };
        window.requestAnimationFrame(step);
    },

    renderDash: function() {
        this.setBar('hp', this.hp);
        this.setBar('san', this.san);
        this.setBar('fat', this.fatigue);
        document.getElementById('dash-ap').innerText = this.ap;
    },

    // --- 新增：渲染探測節點 ---
    renderNodes: function() {
        const grid = document.getElementById('node-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (this.bossMode || !this.currentNodes) return; // BOSS戰不顯示節點

        this.currentNodes.forEach((node, idx) => {
            grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--sonar); background:rgba(0, 230, 118, 0.05);" onclick="game.selectNode(${idx})">
                <div style="font-size:1.5rem; margin-right:10px;">${node.icon}</div>
                <div>
                    <div class="cmd-role" style="color:var(--sonar)">探測節點</div>
                    <div class="cmd-name">${node.name}</div>
                    <div style="font-size:0.7rem; color:#aaa;">推進 ${node.dist}KM</div>
                </div>
            </button>`;
        });
    },

    // --- 修復：渲染船員指令與危機處理按鈕 ---
    renderCmds: function() {
        const grid = document.getElementById('action-grid');
        if(!grid) return;
        grid.innerHTML = '';

        // 🌟 新增：如果還沒正式出航 (沒有宣告 isVoyaging)，顯示待機畫面
        if (!this.isVoyaging) {
            // 🌟 修改：永遠顯示出航按鈕！
            let targetText = this.mission ? `<span style="color:var(--sonar)">目標：${this.mission.title}</span>` : `<span style="color:#777">未設定目標 (請先前往公會)</span>`;
            
            grid.innerHTML = `<div style="grid-column:span 2; padding:20px; background:rgba(0,20,30,0.5); border:1px solid var(--sonar); border-radius:8px; text-align:center;">
                <div style="font-size:1.1rem; margin-bottom:15px; font-weight:bold;">${targetText}</div>
                <button class="tech-btn" style="width:100%; padding:15px; font-size:1.2rem; border-color:var(--alert); color:var(--alert); font-weight:bold; animation:blink 2s infinite;" onclick="game.checkLaunch()">🚀 啟動引擎出航</button>
            </div>`;
            return;
        }

        // 1. 渲染危機處理按鈕 (紅色，優先顯示)
        this.activeCrises.forEach((c, idx) => {
            grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--alert); background:rgba(255,0,0,0.1);" onclick="game.resolveCrisis(${idx})" ${this.ap < 1 ? 'disabled' : ''}>
                <div style="font-size:2rem; margin-right:10px;">🔧</div>
                <div>
                    <div class="cmd-role" style="color:var(--alert)">CRISIS (危機排除)</div>
                    <div class="cmd-name">${c.name}</div>
                    <div style="font-size:0.7rem; color:#aaa">耗費 1-2 AP</div>
                </div>
            </button>`;
        });

        // 🌟 新增：BOSS 戰專用 - 發射深淵魚雷
        // 🌟 修正：只要有魚雷就顯示按鈕 (不限 BOSS 戰)
        if (this.upgrades && this.upgrades.torpedo) {
            let tpDisabled = this.ap < 1 ? 'disabled style="opacity:0.5; filter:grayscale(1);"' : '';
            grid.innerHTML += `<button class="cmd-btn" style="border-color:var(--gold); background:rgba(255, 202, 40, 0.1);" onclick="game.fireTorpedo()" ${tpDisabled}>
                <div style="font-size:2rem; margin-right:10px;">🚀</div>
                <div>
                    <div class="cmd-role" style="color:var(--gold)">ULTIMATE</div>
                    <div class="cmd-name">發射深淵魚雷</div>
                    <div style="font-size:0.75rem; color:#aaa">耗費 1 AP | 造成大量傷害</div>
                </div>
            </button>`;
        }

        // 2. 渲染船員輔助技能
        if (this.crew) this.crew.forEach(c => {
            // 🌟 船員行動不耗 AP，但每回合限一次 (僅在 BOSS 戰限制)
            let isDisabled = (this.bossMode && c.hasActed) ? 'disabled style="opacity:0.5; filter:grayscale(1);"' : '';
            
            // 🌟 判定創傷標記與理智百分比
            let sanPercent = (c.san / c.maxSan) * 100;
            let traumaWarning = c.trauma ? `<span style="color:var(--alert); font-size:0.7rem; margin-left:4px; font-weight:bold;">[${c.trauma.name}]</span>` : '';
            
            grid.innerHTML += `<button class="cmd-btn" ${isDisabled} 
                onmousedown="game.handleBtnPress(this, '${c.id}')" 
                onmouseup="game.handleBtnRelease(this)" 
                onmouseleave="game.handleBtnRelease(this)"
                ontouchstart="game.handleBtnPress(this, '${c.id}')" 
                ontouchend="game.handleBtnRelease(this)"
                onclick="if(!game.longPressTriggered) game.action('${c.id}')"
                style="align-items:flex-start; padding:8px; display:flex;">
                <img src="${getImgUrl(c.id)}" class="cmd-img" style="border-radius:4px; flex-shrink:0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="cmd-img card-avatar-fallback" style="display:none; font-size:1.2rem; border-radius:4px; flex-shrink:0;">${c.name[0]}</div>
                
                <div style="flex:1; text-align:left; min-width:0; margin-left:8px; display:flex; flex-direction:column; justify-content:space-between; height:100%;">
                    <div>
                        <div class="cmd-role" style="color:var(--sonar)">${c.role}</div>
                        <div class="cmd-name" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}${traumaWarning}</div>
                    </div>
                    <div style="margin-top:auto;">
                        <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#b39ddb; margin-top:4px; margin-bottom:2px;">
                            <span>SAN</span><span>${Math.floor(c.san)}/${c.maxSan}</span>
                        </div>
                        <div style="width:100%; background:#222; height:4px; border-radius:2px; overflow:hidden;">
                            <div style="width:${sanPercent}%; background:${c.trauma ? 'var(--alert)' : '#b39ddb'}; height:100%; transition:width 0.3s;"></div>
                        </div>
                    </div>
                </div>
            </button>`;
        });
        
        // 🌟 新增：手動結束回合按鈕 (永遠顯示在最後)
        // 🌟 修正：僅在 BOSS 戰顯示結束回合
        if (this.bossMode) {
            grid.innerHTML += `<button class="cmd-btn" style="border-color:#555; background:rgba(0,0,0,0.5); justify-content:center;" onclick="game.nextTurn()">
                <div style="text-align:center;">
                    <div style="font-size:1.5rem;">⏳</div>
                    <div class="cmd-name" style="color:#aaa;">結束回合 (NEXT TURN)</div>
                </div>
            </button>`;
        }
    },

    // --- 🌟 新增：長按顯示詳細資料邏輯 ---
    handleBtnPress: function(btn, id) {
        if(this.pressTimer) clearTimeout(this.pressTimer); // 🌟 防止連點或多重觸發
        this.longPressTriggered = false;
        this.pressTimer = setTimeout(() => {
            this.longPressTriggered = true;
            this.showCrewDetail(id);
            if(navigator.vibrate) navigator.vibrate(50); // 手機震動回饋
        }, 500); // 長按 0.5 秒觸發
    },
    
    handleBtnRelease: function(btn) {
        if (this.pressTimer) clearTimeout(this.pressTimer);
    },

    showCrewDetail: function(id) {
        const c = this.crew.find(x => x.id === id);
        if(!c) return;
        
        // 🌟 計算狀態顯示
        let statusHtml = '';
        if (this.fatigue > 80) statusHtml += '<div style="color:var(--alert)">[極度疲勞] 行動效率大幅降低 / SAN消耗增加</div>';
        else if (this.fatigue > 50) statusHtml += '<div style="color:var(--gold)">[疲勞] 行動效率降低</div>';
        else statusHtml += '<div style="color:var(--sonar)">[狀態良好] 無負面影響</div>';

        // 顯示特殊 Buff
        if (this.flags.godBuff === 'melas') statusHtml += '<div style="color:#ce93d8">★ 虛空庇護 (免疫恐懼)</div>';
        if (c.id === 'lanlan' && this.crew.find(x => x.id === 'jornona')) statusHtml += '<div style="color:#f48fb1">★ 愛的力量 (免疫怕鬼)</div>';

        // 🌟 新增：疲勞恢復能力提示
        let fatigueNote = '';
        if(['lazar', 'jornona', 'molly', 'narcissus'].includes(c.id)) {
             fatigueNote = `<div style="color:var(--sonar); margin-top:5px; font-weight:bold;">⚡ 行動時可恢復疲勞值</div>`;
        }

        this.modal(c.id, c.name, `
            <div style="text-align:left; font-size:0.9rem; color:#b0bec5;">
                <div style="margin-bottom:10px; color:var(--gold);">職業: ${c.role}</div>
                ${c.desc}
                ${fatigueNote}
                <div style="margin-top:15px; padding-top:10px; border-top:1px dashed #333;">
                    <div style="margin-bottom:5px; color:#fff;">當前狀態:</div>
                    ${statusHtml}
                </div>
            </div>
        `);
        // 將彈窗按鈕改為單純的關閉
        const btnContainer = document.getElementById('modal-btn-container');
        if(btnContainer) {
            btnContainer.innerHTML = `
                <button class="tech-btn" style="flex:1; padding:12px 0; border-color:var(--alert); color:var(--alert); margin-right:10px;" onclick="game.dismissCrew('${c.id}')">解僱</button>
                <button class="tech-btn" style="flex:1; padding:12px 0;" onclick="game.closeModal()">關閉</button>
            `;
        }
    },

    // 🌟 新增：解僱船員
    dismissCrew: function(id) {
        // 檢查是否為核心成員
        if (DB.coreCrew.find(x => x.id === id)) {
            alert("核心成員無法解僱！");
            return;
        }
        
        if (confirm("確定要解僱這位船員嗎？\n(他可能會回到酒館，也可能就此離開)")) {
            this.crew = this.crew.filter(x => x.id !== id);
            this.closeModal();
            this.updateUI();
            
            // 刷新介面 (如果在船員頁面)
            if (document.getElementById('port-layer').style.display !== 'none') {
                 this.openTab('crew'); 
            }
            // 刷新介面 (如果在航行儀表板)
            if (document.getElementById('sea-layer').style.display !== 'none') {
                this.renderCmds();
            }
        }
    },

    // --- 修改：在儀表板更新時，同步更新危機警告板 ---
    renderDash: function() {
        // 🌟 更新：顯示燃油與食物消耗，以及數值
        let cons = this.bossMode ? 0 : 15;
        let suffix = this.bossMode ? '' : ` (-${cons})`;
        
        // 🌟 確保所有四個數值條都正確更新
        this.setBar('fuel', this.fuel, this.maxFuel, suffix);
        this.setBar('food', this.food, this.maxFood, suffix);
        this.setBar('hp', this.hp, 100);
        this.setBar('fat', this.fatigue, 100);
        
        const apEl = document.getElementById('dash-ap');
        if (apEl) {
            apEl.innerText = this.ap;
            // 🌟 AP 面板僅在擁有魚雷時顯示
            apEl.parentElement.style.display = this.upgrades.torpedo ? 'block' : 'none';
        }

        // 更新危機警告看板
        const board = document.getElementById('crisis-board');
        if (board) {
            board.innerHTML = '';
            this.activeCrises.forEach(c => {
                board.innerHTML += `<div style="background:rgba(255, 23, 68, 0.85); border:1px solid var(--alert); color:#fff; padding:5px 10px; border-radius:4px; font-weight:bold; font-size:0.85rem; box-shadow:0 0 10px var(--alert);">
                    ⚠ 異常：${c.name} (${c.desc})
                </div>`;
            });
        }
    },

    // --- 🌟 新增：根據海域繪製全息戰術地圖 ---
    renderSeaMap: function(mission) {
        const container = document.getElementById('sea-map-container');
        if(!container || !mission) { if(container) container.innerHTML = ''; return; }
        
        let svgContent = '';
        let mapColor = 'rgba(0, 230, 118, 0.4)'; // 預設雷達綠
        let title = '';

        if (mission.type === 'boss') {
            mapColor = 'rgba(255, 23, 68, 0.5)'; // 警告紅
            title = 'KRAKEN LAIR';
            svgContent = `
                <circle cx="400" cy="300" r="180" fill="rgba(255,23,68,0.05)" stroke="${mapColor}" stroke-width="3" stroke-dasharray="10 10"/>
                <path d="M400,100 Q500,200 400,300 Q300,400 400,500" fill="none" stroke="${mapColor}" stroke-width="5"/>
                <path d="M200,300 Q300,250 400,300 Q500,350 600,300" fill="none" stroke="${mapColor}" stroke-width="5"/>
                <circle cx="400" cy="300" r="40" fill="rgba(255,23,68,0.2)" stroke="${mapColor}" stroke-width="2"/>
            `;
        } else if (mission.area.includes('淺灘')) {
            title = 'SHALLOW WATERS';
            svgContent = `
                <path d="M100,200 Q250,100 400,250 T700,300" fill="none" stroke="${mapColor}" stroke-width="2"/>
                <circle cx="250" cy="200" r="50" fill="none" stroke="${mapColor}" stroke-dasharray="5 5"/>
                <rect x="500" y="250" width="100" height="50" fill="none" stroke="${mapColor}" transform="rotate(15 500 250)"/>
            `;
        } else if (mission.area.includes('暗礁')) {
            title = 'REEF ZONE';
            svgContent = `
                <path d="M50,400 L200,250 L350,450 L500,200 L650,350" fill="none" stroke="${mapColor}" stroke-width="2"/>
                <polygon points="300,200 330,120 360,200" fill="rgba(0,230,118,0.05)" stroke="${mapColor}"/>
                <polygon points="550,450 590,350 630,450" fill="rgba(0,230,118,0.05)" stroke="${mapColor}"/>
                <circle cx="400" cy="300" r="100" fill="none" stroke="${mapColor}" stroke-dasharray="2 8"/>
            `;
        } else { // 深淵
            mapColor = 'rgba(179, 157, 219, 0.4)'; // 詭異紫
            title = 'ABYSSAL TRENCH';
            svgContent = `
                <ellipse cx="400" cy="300" rx="250" ry="120" fill="none" stroke="${mapColor}" stroke-width="2"/>
                <ellipse cx="400" cy="300" rx="180" ry="80" fill="none" stroke="${mapColor}" stroke-width="1" stroke-dasharray="4 4"/>
                <ellipse cx="400" cy="300" rx="100" ry="40" fill="rgba(179,157,219,0.1)" stroke="${mapColor}" stroke-width="2"/>
            `;
        }

        container.innerHTML = `
            <div class="sea-map-layer">
                <svg viewBox="0 0 800 600" style="width:100%; height:100%; overflow:visible;">
                    <defs><pattern id="grid-sea" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="${mapColor}" stroke-width="0.5" opacity="0.3"/></pattern></defs>
                    <rect width="100%" height="100%" fill="url(#grid-sea)" />
                    ${svgContent}
                    <text x="400" y="550" fill="${mapColor}" font-size="24" font-weight="bold" text-anchor="middle" letter-spacing="8px" opacity="0.7">${title}</text>
                </svg>
            </div>
        `;
    },

    // --- 新增：顯示遭遇戰彈窗 ---
    showEncounter: function(enc) {
        document.getElementById('enc-title').innerText = `⚠ ${enc.title}`;
        document.getElementById('enc-desc').innerText = enc.desc;
        
        const choicesDiv = document.getElementById('enc-choices');
        choicesDiv.innerHTML = '';
        
        enc.choices.forEach((c, idx) => {
            let hasReq = c.req ? this.crew.find(x => x.id === c.req) : true;
            let reqText = c.req ? `<span class="req-tag" style="color:var(--gold); border:1px solid var(--gold); padding:2px 4px; border-radius:3px; font-size:0.7rem;">需: ${c.req.toUpperCase()}</span>` : '';
            
            choicesDiv.innerHTML += `<button class="enc-choice-btn" style="background:#111; border:1px solid #333; color:#fff; padding:12px; text-align:left; margin-bottom:5px; display:flex; justify-content:space-between; cursor:pointer;" ${!hasReq ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="game.resolveEncounter(${idx})">
                <span>${c.text}</span> ${reqText}
            </button>`;
        });
        
        this.currentEncounter = enc;
        document.getElementById('encounter-modal').style.display = 'flex';
    },

    setBar: function(id, val, max = 100, suffix = '') {
        const pct = Math.min(100, Math.max(0, (val / max) * 100));
        const el = document.getElementById(`bar-${id}`);
        const txt = document.getElementById(`bar-${id}-txt`);
        if(el) el.style.width = pct + '%';
        if(txt) txt.innerText = `${Math.floor(val)}/${max}${suffix}`;
    },

    // --- 🌟 統一事件通知系統 (Event Notification System) ---
    notify: function(type, payload) {
        payload = payload || {};
        switch (type) {
            case 'LOG':
                // 一般日誌訊息
                this.log(payload.msg, payload.style);
                break;
            case 'MODAL':
                // 彈窗對話
                this.modal(payload.faceId || 'system', payload.speaker || 'SYSTEM', payload.msg);
                break;
            case 'CHOICE_MODAL':
                // 🌟 新增：選項彈窗
                const modalUI = document.getElementById('modal-overlay');
                const modalMsg = document.getElementById('modal-msg');
                const speakerName = document.getElementById('modal-speaker');
                const imgEl = document.getElementById('modal-face');
                const fallbackEl = document.getElementById('modal-face-fallback');
                const btnContainer = document.getElementById('modal-btn-container');
                
                speakerName.innerText = payload.speaker || '系統';
                modalMsg.innerHTML = payload.msg;
                
                if(payload.faceId === 'system') {
                    if(imgEl) imgEl.style.display = 'none';
                    if(fallbackEl) { fallbackEl.style.display = 'flex'; fallbackEl.innerText = '⚙️'; }
                } else {
                    if(imgEl) { imgEl.style.display = 'block'; imgEl.src = getImgUrl(payload.faceId); }
                    if(fallbackEl) fallbackEl.style.display = 'none';
                }

                btnContainer.innerHTML = '';
                payload.choices.forEach(choice => {
                    const btn = document.createElement('button');
                    btn.className = 'tech-btn';
                    btn.style.width = 'auto';
                    btn.style.padding = '10px 20px';
                    btn.style.margin = '0 5px';
                    btn.innerText = choice.text;
                    btn.onclick = () => { if (choice.action) choice.action(); };
                    btnContainer.appendChild(btn);
                });

                modalUI.style.display = 'flex';
                break;
            case 'BGM':
                // 背景音樂切換
                if (payload.action === 'stop') {
                    if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; }
                } else if (payload.audio) {
                    this.playMusic(payload.audio);
                }
                break;
            case 'SFX':
                // 視覺/聽覺特效
                if (payload.vfx && payload.id && typeof this.playVFX === 'function') {
                    this.playVFX(payload.id, payload.vfx);
                } else {
                    this.playClick(); // 預設點擊音效
                }
                break;
            case 'ALERT':
            case 'CRISIS':
                // 緊急警告 (紅色粗體)
                this.log(payload.msg, "color:var(--alert); font-weight:bold;");
                if (payload.showModal) this.modal("system", "警告", payload.msg);
                break;
        }
    },

    log: function(msg, style = "") {
        let el = document.getElementById('sys-log');
        if(!el) return;
        let d = document.createElement('div');
        d.style = style;
        d.innerHTML = `&gt; ${msg}`;
        el.appendChild(d);
        
        // 🌟 修正：嚴格限制只顯示最新的 10 條訊息，避免滑條過長
        while(el.children.length > 10) el.removeChild(el.firstChild);
        
        el.scrollTop = el.scrollHeight; // 自動滾到最底
    },

    modal: function(faceId, speaker, msg) {
        document.getElementById('modal-overlay').style.display = 'flex';
        let imgEl = document.getElementById('modal-face');
        let fallbackEl = document.getElementById('modal-face-fallback');
        
        if(faceId === 'none') {
            if(imgEl) imgEl.style.display = 'none';
            if(fallbackEl) fallbackEl.style.display = 'none';
        } else if(faceId === 'system') {
            imgEl.style.display = 'none'; 
            fallbackEl.style.display = 'flex'; 
            // 🌟 強制置中對齊，修復歪斜
            fallbackEl.style.alignItems = 'center';
            fallbackEl.style.justifyContent = 'center';
            fallbackEl.style.lineHeight = '1';
            fallbackEl.innerText = '⚙️';
        } else {
            imgEl.style.display = 'block'; fallbackEl.style.display = 'none';
            imgEl.src = getImgUrl(faceId);
        }
        document.getElementById('modal-speaker').innerText = speaker;
        document.getElementById('modal-msg').innerHTML = msg;

        // 每次打開 Modal，強制把按鈕區塊重置回預設的 ACKNOWLEDGE！
        const btnContainer = document.getElementById('modal-btn-container');
        if(btnContainer) {
            btnContainer.innerHTML = `<button class="tech-btn" id="modal-default-btn" style="width:auto; padding:10px 30px;" onclick="game.closeModal()">ACKNOWLEDGE</button>`;
        }
    },

    closeModal: function() { document.getElementById('modal-overlay').style.display = 'none'; },
    
    randomizeWeather: function() {
        const keys = Object.keys(WEATHER_TYPES);
        this.weather = keys[Math.floor(Math.random() * keys.length)];
    },

    // --- 🌟 新增：藍圖拖曳與縮放控制 (取代舊的 zoomBlueprint) ---
    initBlueprintControls: function() {
        const container = document.getElementById('blueprint-container');
        const content = document.getElementById('blueprint-content');
        if (!container || !content) return;

        // 初始狀態
        let state = { scale: 1, x: 0, y: 0, isDown: false, startX: 0, startY: 0 };

        const updateTransform = () => {
            content.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
        };

        const startDrag = (x, y) => {
            state.isDown = true;
            state.startX = x - state.x;
            state.startY = y - state.y;
            container.style.cursor = 'grabbing';
        };

        const moveDrag = (x, y) => {
            if (!state.isDown) return;
            state.x = x - state.startX;
            state.y = y - state.startY;
            updateTransform();
        };

        const endDrag = () => { state.isDown = false; container.style.cursor = 'grab'; };

        // 綁定滑鼠與觸控事件
        container.addEventListener('mousedown', e => { e.preventDefault(); startDrag(e.clientX, e.clientY); });
        window.addEventListener('mousemove', e => { if(state.isDown) { e.preventDefault(); moveDrag(e.clientX, e.clientY); } });
        window.addEventListener('mouseup', endDrag);

        container.addEventListener('touchstart', e => { if(e.touches.length===1) startDrag(e.touches[0].clientX, e.touches[0].clientY); });
        window.addEventListener('touchmove', e => { if(state.isDown && e.touches.length===1) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); } });
        window.addEventListener('touchend', endDrag);

        // 滾輪縮放
        container.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            let newScale = state.scale * factor;
            newScale = Math.max(0.5, Math.min(newScale, 3.0)); // 限制縮放範圍
            state.scale = newScale;
            updateTransform();
        });
    },

    // --- 🌟 新增：藍圖長按與詳情顯示 ---
    handleBpPress: function(btn, type, cost, e) {
        // 🌟 防止移動端 touch 事件後觸發 mousedown 導致長按狀態被重置
        if (e && e.type === 'mousedown' && this.lastTouchTime && (Date.now() - this.lastTouchTime < 1000)) {
            return;
        }
        if (e && e.type === 'touchstart') {
            this.lastTouchTime = Date.now();
        }

        if(this.pressTimer) clearTimeout(this.pressTimer);
        this.longPressTriggered = false;
        this.pressTimer = setTimeout(() => {
            this.longPressTriggered = true;
            this.showUpgradeDetail(type);
            if(navigator.vibrate) navigator.vibrate(50);
        }, 500);
    },

    handleBpRelease: function(btn) {
        if (this.pressTimer) clearTimeout(this.pressTimer);
    },

    showUpgradeDetail: function(type) {
        const data = {
            light: { name: '探照燈', desc: '高功率探照燈。能照亮深海，減少環境帶來的 SAN 值自然耗損 (每回合 -8 降為 -2)。', max: '1' },
            armor: { name: '強化裝甲', desc: '覆蓋船體的鈦合金裝甲。大幅減少遭遇物理攻擊或撞擊時的船體損傷。', max: '1' },
            torpedo: { name: '深淵魚雷', desc: '搭載深淵彈頭的魚雷發射管。解鎖 AP 系統，並能在 BOSS 戰中造成巨大傷害。', max: '1' },
            crew: { name: '船員艙', desc: '擴充船艙的維生系統。增加船員上限，讓你能招募更多幫手。', max: `8 (目前: ${this.crewMax})` },
            food: { name: '糧倉', desc: '擴充食物儲存空間。', max: `300 (目前: ${this.maxFood})` },
            fuel: { name: '能源箱', desc: '擴充燃料儲存空間。', max: `300 (目前: ${this.maxFuel})` }
        };
        
        const item = data[type];
        if(!item) return;

        this.modal("peter", "藍圖詳情", `
            <div style="text-align:left;">
                <h3 style="color:var(--gold); margin:0 0 10px 0;">${item.name}</h3>
                <div style="color:#ccc; font-size:0.9rem; margin-bottom:15px;">${item.desc}</div>
                <div style="border-top:1px dashed #555; padding-top:10px; font-size:0.8rem; color:var(--sonar);">
                    最大擴充上限: ${item.max}
                </div>
            </div>
        `);
    },

    // --- 🌧️ 優化後的雨滴生成邏輯 ---
    createRainEffect: function() {
        // 如果已經有天氣容器且裡面有雨滴，就不重複生成
        let weatherContainer = document.getElementById('weather-container');
        if (!weatherContainer) {
            weatherContainer = document.createElement('div');
            weatherContainer.id = 'weather-container';
            document.body.appendChild(weatherContainer);
        }
        
        if (weatherContainer.children.length > 0) return; // 已經在下雨了

        // 控制雨滴數量：不要超過 100 滴，否則效能會崩潰
        const dropCount = 80; 

        for (let i = 0; i < dropCount; i++) {
            let drop = document.createElement('div');
            drop.classList.add('rain-drop');
            
            // 隨機 X 軸起始位置 (稍微超出螢幕右側，配合向左傾斜的動畫)
            drop.style.left = `${Math.random() * 120}%`;
            
            // 隨機動畫時間 (0.6秒 到 1.2秒，製造雨滴遠近不同的速度感)
            const duration = Math.random() * 0.6 + 0.6;
            drop.style.animationDuration = `${duration}s`;
            
            // 隨機延遲落下，避免所有雨滴「同時」掉下來像一面牆
            drop.style.animationDelay = `${Math.random() * 2}s`;
            
            weatherContainer.appendChild(drop);
        }
    },

    stopWeather: function() {
        const weatherContainer = document.getElementById('weather-container');
        if (weatherContainer) {
            weatherContainer.innerHTML = ''; // 瞬間停雨
        }
    },

    // --- 💬 聊天室對話系統 (Chat UI) ---
    startChat: function(chatId, nodeId = 0) {
        if (typeof CHAT_DB === 'undefined' || !CHAT_DB[chatId]) return;
        
        let node = CHAT_DB[chatId][nodeId];
        let overlay = document.getElementById('vn-chat-overlay');
        
        // 節點為 -1 代表結束對話
        if (!node || nodeId === -1) {
            this.closeChat();
            return;
        }

        // 初始化聊天視窗 (如果尚未建立)
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'vn-chat-overlay';
            document.body.appendChild(overlay);
        }
        
        // 如果是新對話 (內容為空或隱藏中)，重置介面結構
        if (overlay.style.display === 'none' || overlay.innerHTML.trim() === '') {
            overlay.style.display = 'flex';
            // 取得對話對象的名字
            let title = node.speaker || "通訊頻道";
            
            overlay.innerHTML = `
                <div class="chat-backdrop" onclick="game.closeChat()"></div>
                <div class="chat-window">
                    <div class="chat-header">
                        <div class="chat-title">💬 ${title}</div>
                        <button class="chat-close" onclick="game.closeChat()">✕</button>
                    </div>
                    <div class="chat-body" id="chat-log"></div>
                    <div class="chat-footer" id="chat-options"></div>
                </div>
            `;
        }

        const log = document.getElementById('chat-log');
        const options = document.getElementById('chat-options');
        
        // 1. 顯示 NPC 訊息 (左側)
        let npcHtml = `
            <div class="chat-row npc-row">
                <img src="${getImgUrl(node.face)}" class="chat-avatar" onerror="this.src='${fallbackSVG}'">
                <div class="chat-content">
                    <div class="chat-name">${node.speaker}</div>
                    <div class="chat-bubble npc-bubble">${node.msg}</div>
                </div>
            </div>
        `;
        log.insertAdjacentHTML('beforeend', npcHtml);
        log.scrollTop = log.scrollHeight; // 自動捲動到底部

        // 2. 顯示選項 (底部按鈕)
        let choicesHtml = '';
        node.choices.forEach(c => {
            // 轉義單引號，防止報錯
            let safeText = c.text.replace(/'/g, "&apos;");
            choicesHtml += `<button class="chat-opt-btn" onclick="game.handleChatChoice('${chatId}', ${c.next}, '${safeText}')">${c.text}</button>`;
        });
        options.innerHTML = choicesHtml;
    },

    // 🌟 處理玩家選擇 (顯示玩家氣泡)
    handleChatChoice: function(chatId, nextId, text) {
        const log = document.getElementById('chat-log');
        
        // 顯示玩家選擇 (右側)
        let playerHtml = `
            <div class="chat-row player-row">
                <div class="chat-bubble player-bubble">${text}</div>
            </div>
        `;
        log.insertAdjacentHTML('beforeend', playerHtml);
        log.scrollTop = log.scrollHeight;

        // 清空選項區，等待下一條
        document.getElementById('chat-options').innerHTML = '';

        // 延遲一下再顯示 NPC 回覆，更有聊天感
        setTimeout(() => {
            this.startChat(chatId, nextId);
        }, 400);
    },

    closeChat: function() {
        let overlay = document.getElementById('vn-chat-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = ''; // 清空內容以便下次重新初始化
        }
    }
});

// 全局點擊監聽 (綁定音效)
document.addEventListener('click', (e) => {
    if(e.target.closest('button') || e.target.closest('.nav-btn') || e.target.closest('.tech-card') || e.target.closest('.cmd-btn')) {
        if(window.game && window.game.playClick) window.game.playClick();
    }
});