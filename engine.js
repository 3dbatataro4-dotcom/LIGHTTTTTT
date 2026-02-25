window.game = window.game || {};
Object.assign(window.game, {
    // 遊戲狀態與資源
    money: 500, fuel: 100, maxFuel: 100, food: 100, maxFood: 100,
    fatigue: 0, maxFatigue: 100, crewMax: 3,
    day: 1, maxDays: 10, hour: 8,
    upgrades: { light: false, armor: false, torpedo: false },
    crew: [], tavernMercs: [], mission: null, missions: [],
    distTotal: 0, distLeft: 0, ap: 2, hp: 100, san: 100,
    bossMode: false, bossHp: 0,
    flags: { adoraDone: false, godBuff: null }, activeCrises: [], inventory: [], warehouse: [], inventoryMax: 5, warehouseMax: 25,
    codex: [], currentAudio: null, weather: 'CLEAR',

    // --- 系統初始化 ---
    init: function() {
        // 使用 JSON parse/stringify 進行深層複製，避免修改到原始 DB 資料
        if (typeof DB !== 'undefined') this.crew = JSON.parse(JSON.stringify(DB.coreCrew));
        if (this.refreshTavern) this.refreshTavern();
        if (this.randomizeFishingWeather) this.randomizeFishingWeather();
        if (this.randomizeWeather) this.randomizeWeather();
        if (this.updateUI) this.updateUI();
        if (this.refreshMissions) this.refreshMissions();
    },

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
            this.showPrologue(); 
        }, 1000);
    },

    // --- 劇情與教學 ---
    showPrologue: function() {
        let storyMsg = `
            <div style="text-align:left; font-size:1rem; line-height:1.6; color:#cfd8dc; padding:5px;">
                <p style="margin-top:0;">「聽好了。第七星區已經完蛋了。」</p>
                <p>彼得焦躁地摸著腰間的聖水瓶，壓低了聲音。</p>
                <p>「深淵底下的『舊日支配者』正在甦醒。最多十天... 只要十天，克拉肯就會把這片廢棄港口連同我們一起吞噬。</p>
                <p style="margin-bottom:0;">去修好你們的 S.S. NOEMA 號，去酒館找些不要命的傢伙，想辦法搞到<span style="color:var(--alert)">【深淵魚雷】</span>... 這是我們唯一的活路。」</p>
            </div>`;
        this.modal("peter", "彼得村長", storyMsg);
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar); padding:12px; font-size:1.1rem;" onclick="game.showTutorial()">[系統讀取] 進入 S.S. NOEMA OS 指南</button>`;
        }, 10);
    },

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
                <p style="margin: 5px 0 0 0;">船隻預設無法對抗巨獸。你必須在村長家擴建船隻，並存夠 $3000 購買<b style="color:var(--alert)">「深淵魚雷」</b>，否則面對克拉肯只有死路一條。</p>
            </div>`;
        this.modal("system", "SYSTEM OS: 核心操作指南", tutorialHTML);
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--gold); color:var(--gold); padding:12px; font-size:1.1rem; font-weight:bold;" onclick="game.closeModal()">系統登入完畢 (START)</button>`;
        }, 10);
    },

    debugVictoryMode: function() {
        document.getElementById('title-layer').style.display = 'none';
        document.getElementById('main-hud').style.display = 'flex';
        document.getElementById('port-layer').style.display = 'flex';
        this.playMusic(BGM_PORT);
        if (this.crew.length === 0) this.init(); // 確保有船員資料
        this.day = 11; this.money = 9999; 
        this.fuel = 300; this.maxFuel = 300;
        this.food = 300; this.maxFood = 300;
        this.hp = 100; this.san = 100;
        this.crewMax = 8;
        this.flags.victory = true;
        this.upgrades = { light: true, armor: true, torpedo: true, submarine: true };
        document.body.classList.add('theme-sunny');
        this.modal("system", "DEBUG MODE", "已啟動通關後模式。<br>天數：DAY 11 (勝利)<br>狀態：已擊敗克拉肯<br>現在可以體驗通關後的對話與功能。");
        if(this.refreshMissions) this.refreshMissions(); 
        if(this.updateUI) this.updateUI();
        if(this.switchMode) this.switchMode('town');
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
            document.getElementById('title-layer').style.display = 'none';
            document.getElementById('main-hud').style.display = 'flex';
            document.getElementById('port-layer').style.display = 'flex';
            this.playMusic(BGM_PORT);
            if(this.updateUI) this.updateUI();
            if(this.switchMode) this.switchMode('town');
            this.modal("system", "系統讀取", "歡迎回來，指揮官。");
        } catch(e) {
            console.error(e);
            this.modal("system", "系統錯誤", "存檔數據損壞。");
        }
    },
    
    // --- 新增：繼承碼系統 ---
    exportSave: function() {
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
        try {
            const json = JSON.stringify(data);
            // 使用 UTF-8 安全的方式進行 Base64 編碼
            const encoded = btoa(unescape(encodeURIComponent(json)));
            this.modal("system", "導出繼承碼", `
                <div>請複製下方的代碼，並妥善保存：</div>
                <textarea style="width:100%; height:100px; background:#111; color:#0f0; border:1px solid #333; margin-top:10px; font-size:0.8rem; word-break: break-all;">${encoded}</textarea>
                <div style="color:#aaa; font-size:0.8rem; margin-top:5px;">(全選複製即可)</div>
            `);
        } catch (e) { console.error(e); this.modal("system", "錯誤", "導出失敗。"); }
    },
    importSave: function() {
        this.modal("system", "導入繼承碼", `<div>請貼上繼承碼：</div><textarea id="import-area" style="width:100%; height:100px; background:#111; color:#0f0; border:1px solid #333; margin-top:10px; font-size:0.8rem;"></textarea><button class="tech-btn" style="margin-top:10px; border-color:var(--gold); color:var(--gold);" onclick="game.confirmImport()">確認導入</button>`);
        setTimeout(() => { let btn = document.getElementById('modal-default-btn'); if(btn) btn.remove(); }, 10);
    },
    confirmImport: function() {
        const area = document.getElementById('import-area'); if(!area) return;
        const str = area.value.trim(); if(!str) return;
        try {
            const json = decodeURIComponent(escape(atob(str)));
            const data = JSON.parse(json);
            if (data.money === undefined || data.day === undefined) throw new Error("Invalid save data");
            Object.assign(this, data); this.saveGame(false); this.closeModal(); this.modal("system", "系統", "載入成功！正在重啟系統..."); setTimeout(() => location.reload(), 1500);
        } catch(e) { console.error(e); this.modal("system", "錯誤", "繼承碼無效或損壞。"); }
    },

    // --- 基礎工具 ---
    playMusic: function(audioObj) {
        if (this.currentAudio === audioObj && !audioObj.paused) return;
        const fadeOut = (audio) => {
            if(!audio) return;
            let vol = audio.volume;
            const interval = setInterval(() => {
                if (vol > 0.05) { vol -= 0.05; audio.volume = vol; } 
                else { clearInterval(interval); audio.pause(); audio.currentTime = 0; audio.volume = 0.4; }
            }, 50);
        };
        if (this.currentAudio) fadeOut(this.currentAudio);
        this.currentAudio = audioObj;
        if(audioObj) {
            audioObj.volume = 0;
            audioObj.play().catch(e => console.log("Auto-play blocked:", e));
            let vol = 0;
            const fadeIn = setInterval(() => {
                if (vol < 0.4) { vol += 0.02; audioObj.volume = vol; } else { clearInterval(fadeIn); }
            }, 50);
        }
    },

    playClick: function() {
        const audio = new Audio('https://file.garden/aWe99vhwaGcNwkok/%E6%84%9B%E9%BA%97%E7%B5%B2%E6%A8%82%E5%9C%92/%E9%9F%B3%E6%A8%82%E7%B4%A0%E6%9D%90/%E7%AC%AC%E4%B8%80%E7%AB%A0_%E9%BB%9E%E6%93%8A%E6%96%B9%E5%A1%8A.mp3');
        audio.volume = 0.6; audio.play().catch(e => {});
    },

    randomizeWeather: function() {
        const keys = Object.keys(WEATHER_TYPES);
        this.weather = keys[Math.floor(Math.random() * keys.length)];
    },

    randomizeFishingWeather: function() {
        if (typeof FISHING_ZONES === 'undefined' || typeof WEATHER_TYPES === 'undefined') return;
        const keys = Object.keys(WEATHER_TYPES);
        Object.values(FISHING_ZONES).forEach(zone => {
            zone.weather = keys[Math.floor(Math.random() * keys.length)];
        });
    },

    notify: function(type, payload) {
        payload = payload || {};
        switch (type) {
            case 'LOG': this.log(payload.msg, payload.style); break;
            case 'MODAL': this.modal(payload.faceId || 'system', payload.speaker || 'SYSTEM', payload.msg); break;
            case 'CHOICE_MODAL':
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
                    btn.style.width = 'auto'; btn.style.padding = '10px 20px'; btn.style.margin = '0 5px';
                    btn.innerText = choice.text;
                    btn.onclick = () => { if (choice.action) choice.action(); };
                    btnContainer.appendChild(btn);
                });
                modalUI.style.display = 'flex';
                break;
            case 'BGM':
                if (payload.action === 'stop') { if (this.currentAudio) { this.currentAudio.pause(); this.currentAudio = null; } } 
                else if (payload.audio) { this.playMusic(payload.audio); }
                break;
            case 'SFX':
                if (payload.vfx && payload.id && typeof this.playVFX === 'function') this.playVFX(payload.id, payload.vfx);
                else this.playClick();
                break;
            case 'ALERT':
            case 'CRISIS':
                this.log(payload.msg, "color:var(--alert); font-weight:bold;");
                if (payload.showModal) this.modal("system", "警告", payload.msg);
                break;
        }
    },

    log: function(msg, style = "") {
        let el = document.getElementById('sys-log');
        if(!el) return;
        let d = document.createElement('div');
        d.style = style; d.innerHTML = `&gt; ${msg}`;
        el.appendChild(d);
        while(el.children.length > 10) el.removeChild(el.firstChild);
        el.scrollTop = el.scrollHeight;
    },

    modal: function(faceId, speaker, msg) {
        document.getElementById('modal-overlay').style.display = 'flex';
        let imgEl = document.getElementById('modal-face');
        let fallbackEl = document.getElementById('modal-face-fallback');
        if(faceId === 'none') {
            if(imgEl) imgEl.style.display = 'none';
            if(fallbackEl) fallbackEl.style.display = 'none';
        } else if(faceId === 'system') {
            imgEl.style.display = 'none'; fallbackEl.style.display = 'flex'; 
            fallbackEl.style.alignItems = 'center'; fallbackEl.style.justifyContent = 'center';
            fallbackEl.style.lineHeight = '1'; fallbackEl.innerText = '⚙️';
        } else {
            imgEl.style.display = 'block'; fallbackEl.style.display = 'none';
            imgEl.src = getImgUrl(faceId);
        }
        document.getElementById('modal-speaker').innerText = speaker;
        document.getElementById('modal-msg').innerHTML = msg;
        const btnContainer = document.getElementById('modal-btn-container');
        if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" id="modal-default-btn" style="width:auto; padding:10px 30px;" onclick="game.closeModal()">ACKNOWLEDGE</button>`;
    },

    closeModal: function() { document.getElementById('modal-overlay').style.display = 'none'; }
});

// 全局點擊監聽
document.addEventListener('click', (e) => {
    if(e.target.closest('button') || e.target.closest('.nav-btn') || e.target.closest('.tech-card') || e.target.closest('.cmd-btn')) {
        if(window.game && window.game.playClick) window.game.playClick();
    }
});
