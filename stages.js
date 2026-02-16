// 擴充 game 物件，專注於邏輯處理
// stages.js 應該這樣開頭，把方法合併到 window.game
if (typeof window.game === 'undefined') {
    window.game = {};
}

Object.assign(window.game, {
    // --- 港口功能邏輯 ---
    // 🌟 新增：時間推進與第十日審判
    addTime: function(hours) {
        let oldDay = this.day;
        this.hour = parseFloat(this.hour) || 0;
        this.hour += hours;
        
        if(this.hour >= 24) {
            this.day += Math.floor(this.hour / 24);
            this.hour = this.hour % 24;
        }

        // 觸發第 10 天彼得警告
        if (this.day >= 10 && oldDay < 10) {
            this.day = 10; // 強制鎖死在第 10 天
            this.refreshMissions();
            this.modal("peter", "彼得", "「第 10 天了。克拉肯已經完全甦醒。這是最後的機會，去公會接下深淵中心的委託，解決牠，或者我們一起死在這裡。」");
        }
        
        // 💀 第 10 天午夜 (24:00) 死亡判定
        if (!this.flags.victory && (this.day > 10 || (this.day === 10 && this.hour === 0 && oldDay === 10 && hours > 0))) {
            if (!this.bossMode && this.bossHp > 0) {
                this.triggerAbsoluteDeath('time');
            }
        }
        if (!this.flags.victory && this.day > 10) this.day = 10; // 只有未勝利時才鎖死時間
    },

    // --- 🌟 新增：危機處理系統 (修復 BOSS 戰卡死) ---
    addCrisis: function(id) {
        if (typeof CRISIS_DB !== 'undefined' && CRISIS_DB[id]) {
            if (!this.activeCrises.find(c => c.id === id)) {
                let c = Object.assign({id: id}, CRISIS_DB[id]);
                this.activeCrises.push(c);
                this.log(`⚠ 警告：${c.name}！${c.desc}`, "color:var(--alert)");
                this.renderCmds();
            }
        }
    },

    resolveCrisis: function(idx) {
        if (this.ap <= 0) { this.log("AP 不足！"); return; }
        let c = this.activeCrises[idx];
        let cost = 2; // 預設消耗 2 AP
        if (c.roles) {
             let hasSpecialist = this.crew.some(m => c.roles.includes(m.role));
             if (hasSpecialist) cost = 1;
        }
        if (this.ap < cost) { this.log(`AP 不足！排除此危機需要 ${cost} AP (相關專長可減免)`); return; }
        this.ap -= cost;
        this.activeCrises.splice(idx, 1);
        this.log(`🔧 已排除危機：${c.name}`, "color:var(--sonar)");
        this.renderDash(); this.renderCmds();
        // 🌟 移除自動換回合，讓玩家能清楚看到 AP 被扣除
    },

    // 🌟 修正：補上之前遺漏的勝利結算函數 (防止打贏 BOSS 後死機)
    triggerVictory: function() {
        this.isVoyaging = false;
        this.bossMode = false;
        this.mission = null;
        
        // 1. 停止戰鬥音樂，播放勝利音效 (這裡暫用 LOG 模擬音效)
        this.notify('BGM', { action: 'stop' });
        this.log("🌊 巨浪平息，陽光穿透了烏雲...", "color:var(--gold); font-weight:bold; font-size:1.2rem;");
        
        // 2. 畫面震動特效
        document.getElementById('sea-layer').classList.add('shake');
        setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 1000);

        // 3. 延遲後跳出彼得的對話
        setTimeout(() => {
            this.notify('BGM', { audio: BGM_PORT }); // 播放平靜音樂
            
            this.notify('CHOICE_MODAL', {
                faceId: 'peter',
                speaker: '彼得',
                msg: '不可思議... 海面的濃霧真的散去了。你拯救了我們所有人。<br><br>那麼，你接下來有什麼打算？要留在這個重獲新生的小鎮，還是揚帆離開，繼續你的旅程？',
                choices: [
                    {
                        text: '留在這裡生活',
                        action: () => {
                            this.closeModal();
                            this.notify('LOG', { msg: '你決定收起船錨，留在這個小鎮。陽光終於灑落在海面上...', style: 'color:var(--gold)' });
                            
                            // 切換黃色主題
                            document.body.classList.add('theme-sunny');
                            
                            // 回到小鎮介面
                            document.getElementById('sea-layer').style.display = 'none';
                            document.getElementById('port-layer').style.display = 'flex';
                            this.updateUI();
                            this.switchMode('town');
                        }
                    },
                    {
                        text: '揚帆離開',
                        action: () => {
                            this.closeModal();
                            this.checkGameOver(true); // 觸發 True Ending 結算
                        }
                    }
                ]
            });
        }, 2000);
    },

    // 🌟 新增：委託板的強制刷新功能 ($50)
    forceRefreshGuild: function() {
        if (this.money >= 50) {
            this.money -= 50;
            this.refreshMissions();
            this.log("📜 花費 $50 拜託公會釋出了新的委託情報。", "color:var(--gold)");
            this.updateUI(); this.openTab('guild');
        } else {
            this.modal("system", "警告", "資金不足，公會人員拒絕為你翻找新情報。");
        }
    },

    // --- 🌟 新增：播放特效 ---
    playVFX: function(id, type) {
        // 尋找對應船員的按鈕 (透過 onclick 屬性匹配 ID)
        let btn = document.querySelector(`.cmd-btn[onclick*="'${id}'"]`);
        if(!btn) return;
        let vfx = document.createElement('div');
        vfx.className = `vfx vfx-${type}`;
        btn.appendChild(vfx);
        setTimeout(() => vfx.remove(), 800);
    },

    refreshMissions: function() {
        this.missions = [];
        // 🌟 第 10 天決戰判定
        if (this.day === 10 && !this.flags.victory) {
            this.missions.push({
                title: '【決戰】深淵中心', area: '深淵 (Far)', dist: 0, reward: 0, time: 12,
                desc: '舊日支配者已甦醒。這是一條單行道。', type: 'boss', iconId: 'kraken'
            });
            return; // 不再生成其他任務
        }
        this.missions.push(this.genOne('near'));
        this.missions.push(this.genOne('near'));
        if(this.day >= 3) { this.missions.push(this.genOne('mid')); }
        if(this.day >= 6) { this.missions.push(this.genOne('far')); }
        
        // 🌟 新增：25% 機率出現高報酬緊急委託
        if(Math.random() < 0.25) {
            this.missions.push({title:'【緊急】失聯商船救援', area:'暗礁 (Mid)', dist:250, reward:4500, time:12, desc:'某財閥的高價懸賞，極度危險。', type:'emergency', iconId:'sos'});
        }
        
        this.flags = this.flags || {};
        if (this.day === 5 && !this.flags.adoraDone) {
            this.missions.unshift({title:'阿朵菈的請求', area:'暗礁 (Mid)', dist:180, reward:2000, time:8, desc:'尋找失落的玩偶', type:'adora', iconId:'adora'});
        }
    },
    genOne: function(tier) {
        const g = DB.generators;
        const issuer = g.issuers[Math.floor(Math.random()*g.issuers.length)];
        const target = g.targets[Math.floor(Math.random()*g.targets.length)];
        let a='', d=0, r=0, t=0;
        // 🌟 難度翻倍：拉長距離，逼迫升級資源！
        if(tier==='near'){ a='淺灘'; d=80 + Math.floor(Math.random()*40); r=600; t=6; }
        else if(tier==='mid'){ a='暗礁'; d=180 + Math.floor(Math.random()*80); r=1800; t=14; }
        else if(tier==='far'){ a='深淵'; d=350 + Math.floor(Math.random()*150); r=4000; t=24; }
        return { title: `${issuer}：${target}`, area: a, dist: d, reward: r, time: t, desc: '標準公會發布之探勘/打撈任務。', type: 'normal', iconId: 'doc' };
    },

    // 🌟 新增：購買升級前的確認彈窗
    confirmUpgrade: function(type, cost) {
        // 檢查是否已達上限 (避免重複購買或溢出)
        if (type === 'crew' && this.crewMax >= 8) return;
        if (type === 'food' && this.maxFood >= 300) return;
        if (type === 'fuel' && this.maxFuel >= 300) return;
        if (this.upgrades[type] === true) return;

        if (this.money < cost) {
            this.modal("peter", "彼得", "資金不足。");
            return;
        }

        const names = {
            light: '探照燈', armor: '強化裝甲', torpedo: '深淵魚雷',
            crew: '船員艙擴充', food: '糧倉擴充', fuel: '能源箱擴充'
        };

        this.notify('CHOICE_MODAL', {
            faceId: 'peter',
            speaker: '彼得',
            msg: `確定要購買【${names[type]}】嗎？<br>這將花費你 <span style="color:var(--gold)">$${cost}</span>。`,
            choices: [
                {
                    text: '確定購買',
                    action: () => {
                        this.closeModal();
                        this.upgrade(type, cost);
                    }
                },
                { text: '再想想', action: () => { this.closeModal(); } }
            ]
        });
    },

    upgrade: function(type, cost) {
        // 🌟 加入防呆上限
        if (type === 'crew' && this.crewMax >= 8) return;
        if (type === 'food' && this.maxFood >= 300) return;
        if (type === 'fuel' && this.maxFuel >= 300) return;

        if(this.money < cost) { this.modal("peter", "彼得", "資金不足。"); return; }
        this.money -= cost;
        if(type==='crew') this.crewMax = Math.min(8, this.crewMax+1);
        else if(type==='food') this.maxFood += 50;
        else if(type==='fuel') this.maxFuel += 50;
        else this.upgrades[type] = true;
        this.updateUI(); this.openTab('hall');
    },

    buy: function(type) {
        let cost = type==='hp'?200:(type==='food'?150:100);
        if(this.money < cost) { this.modal("lynn", "林恩", "沒錢免談。"); return; }
        this.money -= cost;
        if(type==='fuel') this.fuel = this.maxFuel;
        if(type==='food') this.food = this.maxFood;
        if(type==='hp') this.hp = 100;
        this.updateUI();
    },

    hire: function(id) {
        if(this.crew.length >= this.crewMax) { this.modal("lilith", "莉莉絲", "船艙已滿。"); return; }
        const m = DB.mercs.find(x=>x.id===id);
        if(this.money < m.cost) { this.modal("lilith", "莉莉絲", "錢不夠。"); return; }
        this.money -= m.cost;
        this.crew.push(m);
        this.updateUI(); this.openTab('tavern');
    },

    // --- 🛏️ 旅館與治療系統 (支援短暫與過夜) ---
    rest: function(type = 'long') {
        let cost = type === 'long' ? 100 : 40;
        
        if(this.money >= cost) {
            this.money -= cost;
            
            if (type === 'long') {
                this.fatigue = Math.max(0, this.fatigue - 50);
                this.crew.forEach(c => { if (c.id !== 'kleion' && !c.trauma) c.san = Math.min(c.maxSan, c.san + 30); });
                
                // 跳至次日 08:00
                this.hour = parseInt(this.hour) || 0;
                let addH = (24 - this.hour + 8) % 24;
                if(addH === 0) addH = 24; 
                if (this.addTime) this.addTime(addH);
                
                this.log("🛏️ 在旅館休息了一夜，疲勞大幅下降，理智恢復。");
                this.modal("costa", "科絲塔", "早安，BATA。希望你們昨晚睡得安穩。");
            } else {
                this.fatigue = Math.max(0, this.fatigue - 20);
                this.crew.forEach(c => { if (c.id !== 'kleion' && !c.trauma) c.san = Math.min(c.maxSan, c.san + 10); });
                
                // 經過 2 小時
                if (this.addTime) this.addTime(2);
                
                this.log("☕ 在旅館短暫休息了兩小時，恢復了些許體力。");
                this.modal("costa", "科絲塔", "喝點熱茶吧，深淵的風是很冷的。");
            }
            
            this.updateUI();
            this.openTab('inn'); // 刷新旅館介面
        } else {
            this.modal("system", "警告", "資金不足，科絲塔面有難色。");
        }
    },

    cureTrauma: function(crewId) {
        if (this.money >= 300) {
            let c = this.crew.find(x => x.id === crewId);
            if (c && c.trauma) {
                this.money -= 300;
                let oldTrauma = c.trauma.name;
                c.trauma = null;     // 清除創傷
                c.san = c.maxSan;    // 順便把 SAN 值補滿
                
                this.log(`💉 花費 $300 治癒了 ${c.name} 的心理創傷【${oldTrauma}】。`, "color:var(--sonar)");
                this.updateUI();
                this.openTab('inn'); // 刷新介面，那張治療卡片就會消失
            }
        } else {
            this.modal("system", "警告", "資金不足以進行高階心理治療。");
        }
    },

    // --- 🌟 新增：接取任務判定與哈蘇警告 ---
    acceptMission: function(idx) {
        let m = this.missions[idx];
        let warnings = [];
        
        // 🌟 嚴格判定：只有「絕對無法到達」才警告 (寬容估計：每回合推進 25KM)
        let maxRange = (this.fuel / 15) * 25; 
        
        if (m.dist > maxRange && m.type !== 'boss') {
            warnings.push("「你的燃料絕對不夠跑這趟。這是自殺。」");
        }
        if (m.type === 'boss' && !this.upgrades.torpedo) {
            warnings.push("「沒有【深淵魚雷】去打克拉肯？你瘋了嗎？」");
        }

        if (warnings.length > 0) {
            this.modal("hassel", "哈蘇", `[申請駁回]<br><br>${warnings.join('<br><br>')} <br><br><span style="color:var(--alert)">請確認要強行接取嗎？</span>`);
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--alert); color:var(--alert);" onclick="game.closeModal(); game.forceAccept(${idx})">我不在乎，強行接取</button>
                    <button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.closeModal()">取消</button>
                `;
            }
        } else {
            this.forceAccept(idx);
        }
    },

    forceAccept: function(idx) {
        this.mission = this.missions[idx];
        this.openTab('guild');
        this.log(`> 已成功接取委託：${this.mission.title}`, "color:var(--gold)");
    },

    cancelMission: function() {
        if (this.mission) {
            this.missions.push(this.mission);
            this.mission = null;
            this.openTab('guild');
        }
    },

    refreshTavern: function() {
        this.tavernMercs = []; const pool = [...DB.mercs];
        for(let i=0; i<4; i++) {
            if(!pool.length) break;
            let idx = Math.floor(Math.random()*pool.length);
            this.tavernMercs.push(pool[idx]); pool.splice(idx,1);
        }
    },

    // --- 航行核心邏輯 ---
    checkLaunch: function(forceLaunch = false) {
        if (!this.mission) { 
            // 🌟 點擊按鈕時才彈出警告
            this.modal("system", "警告", "深淵極度危險。<br><br><span style='color:var(--gold)'>請先前往公會接取委託後，再進行出航程序！</span>"); 
            return; 
        }
        
        if (this.fatigue >= 100) {
            this.modal("system", "GAME OVER", "你的疲勞值已達極限，在出航不久後便精神崩潰，連同整艘船沉入了深淵...");
            // 🌟 強制生成返回標題按鈕
            setTimeout(() => {
                let btnContainer = document.getElementById('modal-btn-container');
                if(btnContainer) {
                    btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--alert); color:var(--alert); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">重新開始 (返回標題)</button>`;
                }
            }, 10);
            return;
        }

        // ⚠ 判定 2：疲勞值 >= 85 且未確認強行出航時，科絲塔跳出警告
        if(this.fatigue >= 85 && !forceLaunch) {
            this.modal("costa", "科絲塔", "BATA... 你看起來快要崩潰了。真的不需要去旅館休息一下再出發嗎？深海裡的東西會趁虛而入的...");
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--alert); color:var(--alert);" onclick="game.closeModal(); game.checkLaunch(true)">強行出航 (極度危險)</button>
                    <button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.closeModal(); game.switchMode('town'); game.openTab('inn');">回鎮上去旅館休息</button>
                `;
            }
            return;
        }

        // 🌟 BOSS 戰特殊初始化
        if(this.mission.type === 'boss') {
            this.bossMode = true;
            this.bossHp = BOSS_DATA.hp; // 🌟 使用 data.js 設定的 5000 血量
            this.bossMaxHp = BOSS_DATA.hp; // 🌟 記錄最大血量用於階段判定
            this.flags.bossPhase2 = false; // 重置狂暴狀態
            // 🌟 啟動視覺特效
            document.body.classList.add('boss-screen'); 
            let noise = document.getElementById('boss-noise');
            if(noise) noise.style.display = 'block';
            
            this.modal("system", "緊急警報", "偵測到超巨型深淵生物反應！它來了！");
        } else {
            if(this.fuel < 20 || this.food < 20) { this.modal("system", "系統警告", "物資存量過低，拒絕出航。"); return; }
            document.body.classList.remove('boss-screen');
            let noise = document.getElementById('boss-noise');
            if(noise) noise.style.display = 'none';
            this.bossMode = false;
        }
        
        document.getElementById('port-layer').style.display = 'none';
        document.getElementById('sea-layer').style.display = 'flex';
        
        // 🌟 優化：自動生成蜜拉思訊號燈 (防止 HTML 缺少此元素導致無視覺效果)
        if (!document.getElementById('melas-signal')) {
            let sig = document.createElement('div');
            sig.id = 'melas-signal';
            sig.style.cssText = 'display:none; position:absolute; top:80px; right:20px; font-size:2rem; animation:blink 1s infinite; z-index:20; filter:drop-shadow(0 0 5px #ce93d8); cursor:help;';
            sig.innerHTML = '👾'; // 紫色外星訊號圖示
            document.getElementById('sea-layer').appendChild(sig);
        }

        if(this.bossMode) {
            this.playMusic(BGM_BOSS);
        } else {
            this.playMusic(BGM_VOYAGE); 
        }
        
        this.distTotal = this.mission.dist;
        this.distLeft = this.mission.dist;
        this.ap = (this.upgrades && this.upgrades.torpedo) ? 3 : 0; // 🌟 AP 綁定魚雷，初始 3
        this.isVoyaging = true; // 🌟 標記正式出航
        
        // 🌟 安全存取 DOM (防止報錯導致後續 renderCmds 不執行)
        const safeStyle = (id, prop, val) => { let el = document.getElementById(id); if(el) el.style[prop] = val; };
        const safeText = (id, val) => { let el = document.getElementById(id); if(el) el.innerText = val; };
        
        safeStyle('btn-anchor', 'display', 'none');
        safeStyle('dist-display', 'color', 'var(--sonar)');
        
        let radar = document.getElementById('radar-sweep');
        if(radar) radar.classList.remove('fast');
        
        let sysLog = document.getElementById('sys-log');
        if(sysLog) sysLog.innerHTML = '';
        
        try {
            if(this.bossMode) {
                safeText('target-label', 'KRAKEN STATUS');
                safeText('target-unit', 'HP REMAINING');
                safeText('dist-display', this.bossHp);
                safeStyle('dist-display', 'color', 'var(--alert)');
                this.log("遭遇舊日支配者 - 克拉肯！", "color:var(--alert); font-size:1.2rem; font-weight:bold;");
            } else {
                safeText('target-label', 'DISTANCE TO TARGET');
                safeText('target-unit', 'KILOMETERS');
                safeText('dist-display', this.distLeft);
                this.generateNodes();
                this.log(`啟動序列完成。航向：${this.mission.title}`);
            }
        } catch(e) {
            console.error("Error in launch sequence:", e);
        }

        // 🌟 關鍵：載入海圖
        try {
            if(typeof this.renderSeaMap === 'function') this.renderSeaMap(this.mission);
        } catch(e) { console.error("Error rendering sea map:", e); }

        this.renderCmds();
        this.renderDash();
        this.updateUI(); // 🌟 確保啟動時同步時間
    },

    // --- 💀 絕對死亡判定 (返回標題畫面) ---
    triggerAbsoluteDeath: function(reason) {
        this.isVoyaging = false; this.mission = null;
        let msg = reason === 'hp' ? "船體承受不住深海的水壓與怪物攻擊，徹底解體。你們沉入了無盡的黑暗..." : 
                  (reason === 'time' ? "時間到了。第十日的午夜鐘聲響起，克拉肯的巨觸將整個第七星區拖入了無盡的深海..." : "全體理智歸零，所有人都成了深淵的一部分...");
        this.modal("system", "GAME OVER", msg);
        
        // 覆寫彈窗按鈕，點擊後強制重整網頁回到標題
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--alert); color:var(--alert); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">重新開始 (返回標題)</button>`;
            }
        }, 10);
    },

    checkMelas: function() {
        const signal = document.getElementById('melas-signal');
        if (signal) signal.style.display = 'none';
        // 在深海區且機率觸發
        if(this.mission && (this.mission.area.includes('暗礁') || this.mission.area.includes('深淵')) && Math.random()<0.15) {
            if (signal) signal.style.display = 'block';
            this.log("偵測到未知紫色訊號...", "color:#ce93d8");
            
            setTimeout(() => {
                this.modal("melas", "蜜拉思", "嘻嘻... 遇見我是你的幸運。要買點好東西嗎？<br><br>【虛空藥水】$300 (免疫SAN下降)<br>【特製口糧】$150 (降低20%疲勞)");
                
                // 抓取按鈕容器並清空預設按鈕
                let btnContainer = document.getElementById('modal-btn-container');
                if (btnContainer) {
                    btnContainer.innerHTML = ''; 
                    // 生成購買與離開按鈕
                    btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--purple); color:var(--purple);" onclick="game.buyMelas('void_potion', 300)">買 虛空藥水 $300</button>`;
                    btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.buyMelas('special_ration', 150)">買 特製口糧 $150</button>`;
                    btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#555;" onclick="game.closeModal()">離開</button>`;
                }
            }, 1000);
        }
    },

    // 🌟 新增：專屬的蜜拉思購買處理函數
    buyMelas: function(itemId, price) {
        if (this.money >= price) {
            if (this.inventory.length >= this.inventoryMax) {
                this.log("背包已滿！無法購買。", "color:var(--alert)");
            } else {
                this.money -= price;
                this.inventory.push(itemId);
                this.log(`💰 購買了 ${ITEM_DB[itemId].name}，已放入背包。`, "color:var(--purple)");
                this.updateUI(); 
            }
        } else {
            this.log("資金不足。", "color:var(--alert)");
        }
        // 買完後不要關閉，讓玩家可以繼續買，如果按離開才關閉
    },

    // --- 💥 獨立的發射魚雷函數 (防卡死版) ---
    fireTorpedo: function() {
        if(!this.upgrades.torpedo) return;
        if(this.ap < 1) { this.log("AP 不足！"); return; }
        
        if (!this.bossMode) {
            this.log("⚠️ 雷達未鎖定大型敵對目標，無法發射。", "color:var(--alert)");
            return;
        }

        this.ap--;
        
        // 🌟 策略機制：打斷 BOSS 蓄力
        if (this.flags.bossCharging) {
            this.flags.bossCharging = false;
            this.bossHp -= 500; // 打斷獎勵傷害
            this.log("✨ 魚雷精準命中核心！打斷了深淵死光！(BOSS HP-500)", "color:var(--gold); font-weight:bold; font-size:1.2rem;");
        } else {
            this.bossHp -= 250;
            this.log("💥 發射深淵魚雷！造成重創！(BOSS HP-250)", "color:var(--alert); font-weight:bold;");
        }
        
        // 播放特效與震動
        document.getElementById('sea-layer').classList.add('shake');
        let tpBtn = document.querySelector('button[onclick="game.fireTorpedo()"]');
        if(tpBtn) {
            let vfx = document.createElement('div'); vfx.className = 'vfx vfx-torpedo'; tpBtn.appendChild(vfx);
            setTimeout(() => vfx.remove(), 800);
        }
        setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 600);
        
        // 🌟 立即更新 BOSS 血量顯示
        document.getElementById('dist-display').innerText = Math.max(0, this.bossHp);

        if (this.bossHp <= 0) {
            setTimeout(() => { this.triggerVictory(); }, 1000); return;
        }

        // 🌟 強制結算行動與解鎖
        setTimeout(() => {
            this.renderDash();
            this.renderCmds();
            // 🌟 移除自動換回合，改為手動
            document.querySelectorAll('.cmd-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
        }, 600);
    },

    // --- 🌟 重製船員行動邏輯 (區分一般航行與 BOSS 戰) ---
    action: function(id) {
        // 🌟 BOSS 戰限制：每回合全船只能有一人行動
        if (this.bossMode && this.flags.crewActedThisTurn) {
            this.notify('LOG', { msg: "本回合已有船員行動過！(BOSS戰限制單人行動)", style: "color:var(--alert)" });
            return;
        }
        
        let actor = this.crew.find(c => c.id === id);
        // 一般航行檢查個人是否行動過
        // if (!this.bossMode && actor && actor.hasActed) {
        //     this.notify('LOG', { msg: `${actor.name} 本回合已經行動過了。`, style: "color:#777" });
        //     return;
        // }
        
        let oldDist = this.distLeft; // 🌟 補回：記錄移動前的距離，用於動畫

        // 💀 創傷特質發作判定
        if (actor && actor.trauma) {
            if (actor.trauma.id === 'paranoid' && Math.random() < 0.2) {
                actor.hasActed = true; // 即使失敗也算行動過
                if(this.bossMode) this.flags.crewActedThisTurn = true;
                this.notify('LOG', { msg: `💢 ${actor.name} 陷入【被害妄想】，尖叫著躲在角落，拒絕執行指令！`, style: "color:var(--alert)" });
                this.renderDash();
                this.renderCmds();
                return;
            }
            if (actor.trauma.id === 'reckless') {
                this.hp -= 5;
                this.notify('LOG', { msg: `⚠ ${actor.name} 狂躁地砸碎了控制台！(船體 HP -5)`, style: "color:var(--alert)" });
            }
        }

        document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = true);
        
        let fatiguePenalty = this.fatigue > 50 ? 5 : 0;
        let prog = Math.max(0, (15 + Math.floor(Math.random()*10)) - fatiguePenalty);
        let msg = "";

        if (this.bossMode) {
            // 🦑 BOSS 戰邏輯 (極致強化版)
            if(id === 'philip') { 
                prog = 0; this.bossHp -= 150; msg = "腓力發出怒吼，用重火力轟炸克拉肯！(BOSS HP-150)"; 
                this.notify('SFX', { id: id, vfx: 'fire' }); 
            }
            else if(id === 'nathanael') { 
                if(this.crew.find(c => c.id === 'philip')) { 
                    prog = 0; this.bossHp -= 300; msg = "拿但業下達處決命令，腓力發動毀滅打擊！(BOSS HP-300)"; 
                    this.notify('SFX', { id: 'philip', vfx: 'crit' }); 
                }
                else { prog = 0; msg = "拿但業沒看到腓力，嫌觸手太噁心不想動。"; }
            }
            else if(id === 'lanlan') { prog = 0; this.bossHp -= 100; msg = "蘭蘭揮舞長戟，斬斷了襲來的觸手！(BOSS HP-100)"; this.notify('SFX', { id: id, vfx: 'slash' }); }
            else if(id === 'venator') { prog = 0; this.bossHp -= 120; msg = "維納托的機械軍團精準鎖定了克拉肯的弱點！(BOSS HP-120)"; this.notify('SFX', { id: id, vfx: 'tech' }); }
            else if(id === 'kleion') { prog = 0; this.bossHp -= 80; this.hp = Math.min(100, this.hp+15); msg = "克里昂丟出化學炸藥並修補漏洞！(BOSS HP-80, 船體+15)"; this.notify('SFX', { id: id, vfx: 'chem' }); }
            // 🌟 輔助角色強化
            else if(id === 'lazar' || id === 'jornona') { 
                prog = 0; this.healAllSan(id==='lazar'?30:20); this.fatigue = Math.max(0, this.fatigue-(id==='lazar'?15:20)); 
                msg = id==='lazar' ? "拉扎爾在戰火中穩定軍心！(全體 SAN+30, 疲勞-15)" : "喬諾娜的歌聲振奮了所有人！(全體 SAN+20, 疲勞-20)"; 
                this.notify('SFX', { id: id, vfx: 'heal' }); 
            }
            else if(id === 'molly') { prog = 0; this.hp = Math.min(100, this.hp+25); this.fatigue = Math.max(0, this.fatigue-15); msg = "茉莉極限搶救船員與裝甲！(HP+25, 疲勞-15)"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            // 🌟 特殊機制角色
            else if(id === 'carlota') { prog = 0; this.flags.dodgeNext = true; msg = "卡洛特敏銳地預判了海怪的動作！(躲避下一次攻擊)"; this.notify('SFX', { id: id, vfx: 'tech' }); }
            else if(id === 'narcissus') { prog = 0; this.bossHp -= 60; this.fatigue = Math.max(0, this.fatigue-15); msg = "納希瑟斯的魅力連觸手都遲疑了一瞬！(BOSS HP-60, 疲勞-15)"; this.notify('SFX', { id: id, vfx: 'slash' }); }
            else if(id === 'manmu') { 
                if(this.money >= 50) { this.money -= 50; this.bossHp -= 180; prog = 0; msg = "小目撒出鈔票，呼叫了軌道重砲支援！(BOSS HP-180, -$50)"; this.notify('SFX', { id: id, vfx: 'crit' }); }
                else { prog = 0; this.bossHp -= 20; msg = "小目發現沒錢了，只能用手槍射擊。(BOSS HP-20)"; }
            }
            else if(id === 'estrella' || id === 'costa') { prog = 0; this.hp = Math.min(100, this.hp+30); msg = "發揮機修天賦，穩住了爆裂的船艙！(HP+30)"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            else { prog = 0; this.bossHp -= 20; msg = "船員用手槍勉強還擊... (BOSS HP-20)"; this.notify('SFX', { id: id, vfx: 'shot' }); }
            
            document.getElementById('dist-display').innerText = Math.max(0, this.bossHp);
            
        } else {
            // 🌊 一般航行邏輯 (加入輔助角色回疲勞)
            if(id === 'lanlan') { 
                let isJornonaHere = this.crew.find(c => c.id === 'jornona');
                if(!isJornonaHere && Math.random() < 0.2) { 
                    prog = 0; 
                    this.applySanDamage(actor, 10, "怕鬼幻覺"); // 🌟 修復：精準扣除蘭蘭的個人 SAN
                    msg = "蘭蘭被幻覺嚇壞了！推進失敗"; 
                } else { 
                    this.food = Math.min(this.maxFood, this.food + 20); msg = "蘭蘭撈到了補給箱！(FOOD+20)"; 
                } 
            }
            else if(id === 'lazar') { prog += 5; this.healAllSan(20); this.fatigue = Math.max(0, this.fatigue-15); msg = "拉扎爾進行心理疏導 (全體 SAN+20, 疲勞-15)。"; }
            else if(id === 'jornona') { prog += 5; this.healAllSan(15); this.fatigue = Math.max(0, this.fatigue-15); msg = "喬諾娜唱起了歌 (全體 SAN+15, 疲勞-15)。"; }
            else if(id === 'molly') { prog += 5; this.hp = Math.min(100, this.hp+10); this.healAllSan(10); this.fatigue = Math.max(0, this.fatigue-10); msg = "茉莉分發了強效補劑 (HP+10, SAN+10, 疲勞-10)。"; }
            else if(id === 'novian') { prog += 15; msg = "諾維安親自掌舵，全速推進！"; }
            else if(id === 'philip') { prog += 20; msg = "腓力靠蠻力撞開了暗礁！"; }
            else if(id === 'nathanael') { prog = this.crew.find(c => c.id === 'philip') ? prog + 30 : 5; msg = prog > 5 ? "拿但業下達絕對命令，腓力效率爆發！" : "拿但業隨便應付了一下。"; }
            else if(id === 'carlota') { prog += 15; msg = "卡洛特敏銳地找出了安全的航線！"; }
            else if(id === 'venator') { prog += 15; msg = "維納托的機械精準計算出最佳路徑！"; }
            else if(id === 'narcissus') { prog += 20; this.fatigue = Math.max(0, this.fatigue-10); msg = "納希瑟斯不知用了什麼方法，讓航行變得順利 (疲勞-10)。"; }
            else if(id === 'kleion') { prog += 15; msg = "克里昂用化學藥劑腐蝕了前方的障礙！"; }
            else if(id === 'manmu') { prog += 5; msg = "小目用金錢解決了問題... 雖然不知道給了誰。"; }
            else if(id === 'estrella') { prog += 5; this.hp = Math.min(100, this.hp+15); msg = "星星進行了緊急維修 (HP+15)。"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            else if(id === 'costa') { prog += 5; this.hp = Math.min(100, this.hp+15); msg = "科絲塔用奈米機器修補了船艙 (HP+15)。"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            else { msg = `船員執行了操作。`; }
            
            this.distLeft = Math.max(0, this.distLeft - prog);
            this.animateDist(oldDist, this.distLeft, 600); // 🌟 修復：讓畫面上的距離數字動起來！
        }

        // 🌟 標記已行動，不扣 AP
        if(actor && this.bossMode) actor.hasActed = true; 
        if(this.bossMode) this.flags.crewActedThisTurn = true; // 標記本回合已有人行動
        this.notify('LOG', { msg: msg });
        
        if (this.bossMode && this.bossHp <= 0) {
            setTimeout(() => { this.triggerVictory(); }, 1000);
            return;
        }
        
        // 🌟 修正：確保 BOSS 戰回合能正確推進
        setTimeout(() => {
            this.renderDash();
            
            // 🌟 修正：強制解鎖所有指令按鈕 (解決背包按鈕變灰無法點擊的問題)
            document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false);

            if (!this.bossMode) {
                this.nextTurn(); // 🌟 一般航行：船員行動視為一回合，自動推進並消耗物資
            } else {
                this.renderCmds(); 
                // 🌟 強制將所有按鈕解鎖，確保下一回合可以點擊
                document.querySelectorAll('.cmd-btn').forEach(b => {
                    b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer';
                });
            }
        }, 600);
    },

    dive: function() {
        if(this.ap <= 0 || this.fuel < 20) { this.log("無法潛航 (AP/Fuel 不足)"); return; }
        this.ap--; this.fuel -= 20;
        this.log("下潛至深海層...", "color:#00e5ff");
        
        document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = true);

        setTimeout(() => {
            let rand = Math.random();
            if(rand < 0.3) {
                this.hp -= 20; this.log("⚠️ 遭遇深海壓強亂流！船體受損！", "color:var(--alert)");
            } else if (rand < 0.65) {
                let money = 600 + Math.floor(Math.random()*600);
                this.money += money; 
                this.log(`💰 發現古代沈船寶藏！獲得 $${money}`, "color:var(--gold)");
                this.unlockCodex('treasure');
            } else {
                this.san -= 15; this.log("👁️ 凝視深淵... 深淵也在凝視你。SAN 值下降。", "color:#b388ff");
                this.unlockCodex('whisper');
            }
            this.renderDash();
            document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false);
            if(this.ap <= 0) this.nextTurn();
        }, 1000);
    },

    unlockCodex: function(id) {
        if (!this.codex.includes(id) && CODEX_DB[id]) {
            this.codex.push(id);
            this.log(`【圖鑑解鎖】發現新項目：${CODEX_DB[id].name}`, "color:#00e5ff; font-weight:bold;");
        }
    },

    // --- 🎲 突發事件 (修復版) ---
    triggerRandomEvent: function() {
        // 先建立群體扣 SAN 的安全方法，避免 this 指向錯誤
        const applyGroupSanDamage = (amt, reason) => {
            if(this.crew && this.crew.length > 0) {
                this.crew.forEach(c => {
                    if (c.id !== 'kleion' && this.flags.godBuff !== 'melas') {
                        c.san -= amt;
                        this.log(`⚠ ${c.name} 受到了精神打擊 (${reason})：SAN -${amt}`, "color:#b39ddb");
                        // 發瘋判定
                        if (c.san <= 0 && !c.trauma) {
                            c.san = 0;
                            let newT = TRAUMA_DB[Math.floor(Math.random() * TRAUMA_DB.length)];
                            c.trauma = newT;
                            this.log(`💀 警告！${c.name} 理智歸零，獲得創傷：【${newT.name}】！`, "color:var(--alert); font-weight:bold;");
                        }
                    }
                });
                this.renderCmds(); // 確保 UI 更新
            }
        };

        const events = [
            { t: "暴風雨", m: "遭遇強烈風暴！船體受損，疲勞上升。", f: () => { this.hp -= 15; this.fatigue += 15; if(this.unlockCodex) this.unlockCodex('storm'); } },
            { t: "海怪襲擊", m: "巨大觸手拍打船身！SAN 值大幅下降。", f: () => { applyGroupSanDamage(20, "海怪襲擊"); this.hp -= 5; if(this.unlockCodex) this.unlockCodex('kraken'); } },
            { t: "塞壬歌聲", m: "船員聽到詭異歌聲... 精神受到侵蝕。", f: () => { applyGroupSanDamage(25, "塞壬歌聲"); if(this.unlockCodex) this.unlockCodex('siren'); } },
            { t: "漂流物", m: "發現海上漂流的補給箱！獲得物資。", f: () => { this.food += 20; this.fuel += 10; } },
            { t: "濃霧", m: "迷失方向，消耗額外燃料。", f: () => { this.fuel -= 15; } },
            { t: "幽靈船", m: "遭遇古代幽靈船... 掠奪了部分資產。", f: () => { this.money = Math.max(0, this.money - 100); applyGroupSanDamage(10, "幽靈船"); if(this.unlockCodex) this.unlockCodex('ghost_ship'); } },
            { t: "發光水母", m: "迷人的深海生物，緩解了疲勞。", f: () => { this.fatigue = Math.max(0, this.fatigue - 20); if(this.unlockCodex) this.unlockCodex('jellyfish'); } },
            { t: "深海低語", m: "無法名狀的恐懼蔓延...", f: () => { applyGroupSanDamage(15, "深海低語"); } }
        ];

        let ev = events[Math.floor(Math.random() * events.length)];
        this.log(`⚠️ 突發事件：${ev.t}`, "color:var(--alert); font-weight:bold;");
        this.log(ev.m);
        ev.f();
        
        // 確保執行完事件後更新 UI
        this.updateUI();
    },

    visitLighthouse: function() {
        if(this.fuel < 10 || this.ap <= 0) { this.log("能源不足以偏航。"); return; }
        this.fuel -= 10; this.san = 100; this.ap--;
        this.log("抵達燈塔。SAN 值重置。");
        this.renderDash();
        if(this.ap <= 0) this.nextTurn();
    },

    // --- 節點生成 ---
    generateNodes: function() {
        if(this.bossMode) return;
        if(this.distLeft <= 0) return; // 🌟 防止抵達後繼續生成
        this.currentNodes = [];
        if(typeof NODE_DB !== 'undefined') {
            for(let i=0; i<3; i++) {
                let randNode = NODE_DB[Math.floor(Math.random() * NODE_DB.length)];
                this.currentNodes.push(randNode);
            }
        }
        if(this.renderNodes) this.renderNodes();
    },

    // --- 點擊節點 (主要推進) ---
    selectNode: function(idx) {
        // 🌟 修正：點擊節點不消耗 AP，也不檢查 AP
        if(!this.currentNodes) return; // 🌟 修復：防止連點導致讀取 null 而當機
        
        let node = this.currentNodes[idx];
        let oldDist = this.distLeft;
        
        // this.ap--; // 🌟 移除 AP 消耗
        this.currentNodes = null; // 隱藏節點
        this.renderNodes(); // 🌟 立即清除畫面上節點按鈕，防止重複點擊造成數據異常
        
        // 🌟 修復 1：探索節點的壓力，改為隨機 1 人扣除個人 SAN，而不是全船扣
        let baseSanDrop = (this.upgrades.light ? 0 : 5);
        if (baseSanDrop > 0 && this.crew.length > 0) {
            let target = this.crew[Math.floor(Math.random() * this.crew.length)];
            this.applySanDamage(target, baseSanDrop, "探索未知水域");
        }

        this.renderCmds(); // 🌟 顯示帶有最新 SAN 條的船員按鈕
        
        this.distLeft = Math.max(0, this.distLeft - (node.dist || 20));
        
        this.log(`[航行] 駛入${node.name}，推進 ${node.dist} KM。`);

        if(node.type === 'storm') { this.hp -= 10; this.log("暴風雨造成船體受損！(HP-10)", "color:var(--alert)"); }
        if(node.type === 'wreckage') { this.food += 10; this.fuel += 10; this.log("打撈到殘骸物資！"); }

        let encounterChance = (node.type === 'unknown') ? 0.6 : 0.1;
        let isEncounterTriggered = Math.random() < encounterChance;

        this.animateDist(oldDist, this.distLeft, 500);

        setTimeout(() => {
            // 如果遇到異常訊號，且有載入資料庫，觸發遭遇戰
            if (isEncounterTriggered && typeof ENCOUNTER_DB !== 'undefined') {
                this.log("⚠ 雷達偵測到異常訊號！", "color:var(--alert)");
                let enc = ENCOUNTER_DB[Math.floor(Math.random() * ENCOUNTER_DB.length)];
                if(this.showEncounter) this.showEncounter(enc);
                else this.finishNodeAction();
            } else {
                this.finishNodeAction();
            }
        }, 600);
    },

    // --- 遭遇戰結算 ---
    resolveEncounter: function(choiceIdx) {
        document.getElementById('encounter-modal').style.display = 'none';
        let choice = this.currentEncounter.choices[choiceIdx];
        
        this.log(`> 選擇了：${choice.text}`, "color:var(--gold)");
        choice.action(); // 執行對應結果
        
        this.finishNodeAction();
    },

    // --- 動作結束判定 ---
    finishNodeAction: function() {
        this.renderDash();
        if(this.distLeft > 0) {
            document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false);
            // 🌟 修正：一般航行自動換回合 (因為沒有結束回合按鈕了)
            if (!this.bossMode) {
                this.nextTurn();
            } else {
                // 🌟 還有 AP 時，重新生成節點供玩家繼續探索
                this.generateNodes();
            }
        }
    },

    // --- BOSS 戰勝利 ---
    triggerVictory: function() {
        this.isVoyaging = false;
        this.bossMode = false;
        this.mission = null;
        
        // 1. 停止戰鬥音樂，播放勝利音效
        this.notify('BGM', { action: 'stop' });
        this.log("🌊 巨浪平息，陽光穿透了烏雲...", "color:var(--gold); font-weight:bold; font-size:1.2rem;");
        
        // 2. 畫面震動特效
        document.getElementById('sea-layer').classList.add('shake');
        setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 1000);

        // 3. 延遲後跳出彼得的對話
        setTimeout(() => {
            this.notify('BGM', { audio: BGM_PORT }); // 播放平靜音樂
            
            this.notify('CHOICE_MODAL', {
                faceId: 'peter',
                speaker: '彼得',
                msg: '不可思議... 海面的濃霧真的散去了。你拯救了我們所有人。<br><br>那麼，你接下來有什麼打算？要留在這個重獲新生的小鎮，還是揚帆離開，繼續你的旅程？',
                choices: [
                    {
                        text: '留在這裡生活',
                        action: () => {
                            this.closeModal();
                            this.notify('LOG', { msg: '你決定收起船錨，留在這個小鎮。陽光終於灑落在海面上...', style: 'color:var(--gold)' });
                            document.body.classList.add('theme-sunny');
                            
                            this.flags.victory = true; // 🌟 標記勝利，解除時間鎖定
                            this.refreshMissions();    // 🌟 恢復正常任務
                            
                            document.getElementById('sea-layer').style.display = 'none';
                            document.getElementById('port-layer').style.display = 'flex';
                            this.updateUI();
                            this.switchMode('town');
                        }
                    },
                    {
                        text: '揚帆離開',
                        action: () => {
                            this.closeModal();
                            this.checkGameOver(true); // 🌟 傳入 true，強制觸發 True Ending
                        }
                    }
                ]
            });
        }, 2000);
    },

    // --- 🌟 個人 SAN 值打擊與發瘋判定 (無懈可擊版) ---
    applySanDamage: function(targetCrew, amount, reason) {
        if (!targetCrew || targetCrew.id === 'kleion') return; // 幽靈免疫
        if (this.flags && this.flags.godBuff === 'melas') return; // 虛空藥水免疫
        
        // 🌟 守護玩偶 Buff：持有時 SAN 傷害減半
        if (this.inventory.includes('guardian_doll')) {
            amount = Math.ceil(amount * 0.5);
            // 機率性顯示 Buff 提示，避免洗頻
            if (Math.random() < 0.2) this.log(`🛡️ 守護玩偶抵擋了部分精神衝擊...`, "color:var(--gold); font-size:0.8rem;");
        }

        targetCrew.san -= amount;
        
        // 🌟 防呆：強制將負數歸零
        if (targetCrew.san < 0) targetCrew.san = 0;

        this.log(`⚠ ${targetCrew.name} 受到了精神打擊 (${reason})：SAN -${amount}`, "color:#b39ddb");
        
        // 💀 發瘋判定：只要等於 0 且沒有創傷，立刻發瘋！
        if (targetCrew.san === 0 && !targetCrew.trauma) {
            // 把創傷庫包在函數內，保證絕對讀得到
            const traumas = [
                { id: 'paranoid', name: '被害妄想', desc: '行動時有 20% 機率陷入恐慌，拒絕執行指令。' },
                { id: 'abyss_gaze', name: '深淵凝視', desc: '只要他在船上，深淵氣息蔓延，每回合全體疲勞額外 +5。' },
                { id: 'hallucination', name: '嚴重幻聽', desc: '回合結束時，有 15% 機率用囈語干擾另一名船員 (SAN -10)。' },
                { id: 'reckless', name: '狂躁破壞', desc: '完全失去理智，每次執行指令時會砸壞設備 (船體 HP -5)。' }
            ];
            
            let newTrauma = traumas[Math.floor(Math.random() * traumas.length)];
            targetCrew.trauma = newTrauma;
            
            this.log(`💀 警告！${targetCrew.name} 的理智歸零，獲得了永久創傷：【${newTrauma.name}】！`, "color:var(--alert); font-weight:bold;");
            
            // 跳出驚悚的警告彈窗
            this.modal("system", "理智崩潰", `${targetCrew.name} 無法承受深淵的恐怖，精神徹底崩潰了。<br><br>獲得創傷特質：<b>【${newTrauma.name}】</b><br><span style="color:#aaa">${newTrauma.desc}</span><br><br><span style="color:var(--alert)">請盡快帶回小鎮尋找科絲塔治療！</span>`);
            
            // 🌟 強制更新出航畫面的按鈕狀態
            if (typeof this.renderCmds === 'function') this.renderCmds();
        }
    },

    // --- 🌟 新增：SAN 值群體管理輔助函數 ---
    damageAllSan: function(amount, reason) {
        if(this.crew.length === 0) return;
        this.crew.forEach(c => this.applySanDamage(c, amount, reason));
    },
    
    healAllSan: function(amount) {
        this.crew.forEach(c => {
            if (c.id !== 'kleion') c.san = Math.min(c.maxSan, c.san + amount);
        });
    },

    // --- 下一回合更新 (修復時間 BUG 與沉船判定) ---
    nextTurn: function() {
        // 🌟 將原本的時間增加邏輯直接改為：
        this.addTime(1);
        
        // 💀 創傷：回合結束時的持續影響
        this.crew.forEach(c => {
            if (c.trauma) {
                if (c.trauma.id === 'abyss_gaze') {
                    this.fatigue += 5;
                    this.notify('LOG', { msg: `👁️ ${c.name} 帶來的【深淵凝視】讓人不寒而慄... (全體疲勞 +5)`, style: "color:#b39ddb" });
                }
                if (c.trauma.id === 'hallucination' && Math.random() < 0.15) {
                    // 隨機傳染給另一名船員
                    let others = this.crew.filter(x => x.id !== c.id);
                    if (others.length > 0) {
                        let victim = others[Math.floor(Math.random() * others.length)];
                        this.applySanDamage(victim, 10, `${c.name} 的瘋狂囈語`);
                    }
                }
            }
        });

        // 🌟 關鍵修復：深海環境的精神壓迫 (每回合必定掉 SAN)
        let baseSanDrop = (this.upgrades.light ? 2 : 8); // 有探照燈扣 2，沒探照燈扣 8
        if (this.crew.length > 0 && !this.bossMode) {
            // 每回合隨機讓 1~2 名船員受到黑暗壓迫
            let victims = Math.floor(Math.random() * 2) + 1;
            for(let i = 0; i < victims; i++) {
                let target = this.crew[Math.floor(Math.random() * this.crew.length)];
                this.applySanDamage(target, baseSanDrop, "深海環境壓迫");
            }
        }

        // 🦑 BOSS 戰的極端精神汙染
        if (this.bossMode && this.crew.length > 0) {
             let target = this.crew[Math.floor(Math.random() * this.crew.length)];
             this.applySanDamage(target, 15, "克拉肯的凝視");
        }

        // 🌟 修改：BOSS 戰為了操作體感，給予 2 AP！
        if (this.bossMode) {
            this.activeCrises = []; 
            if(this.upgrades.torpedo) this.ap = Math.min(3, this.ap + 1); // 🌟 有魚雷才回 AP
        } else {
            if(this.upgrades.torpedo) this.ap = Math.min(3, this.ap + 1); // 🌟 一般航行也回 AP (上限3)
            this.activeCrises.forEach(c => c.penalty(this)); // 一般危機懲罰
        }
        
        // 🌟 重置所有船員的行動狀態
        this.crew.forEach(c => c.hasActed = false);
        this.flags.crewActedThisTurn = false; // 重置 BOSS 戰單人行動限制

        // 🌀 100% 疲勞的極限懲罰 (加速掉 SAN 與暈眩)
        if (this.fatigue >= 100) {
            this.notify('ALERT', { msg: "⚠️ 疲勞度已達極限！船員們開始產生嚴重的幻覺..." });
            this.damageAllSan(15, "極度疲勞的恐怖幻象"); // 額外巨量扣除 SAN
            // 🌟 暈眩特效已移至 updateUI 統一管理，確保即時生效
        }
        
        // 🌟 關鍵修復 2：安全防當機的 BOSS 攻擊邏輯
        if (this.bossMode && this.bossHp > 0) {
            this.notify('LOG', { msg: "--- 克拉肯的回合 ---", style: "color:#555" });
            document.getElementById('sea-layer').classList.add('shake');
            setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 600);
            
            // 🌟 Phase 2: 狂暴狀態判定 (血量低於 50%)
            if (!this.flags.bossPhase2 && this.bossHp < (this.bossMaxHp || 5000) * 0.5) {
                this.flags.bossPhase2 = true;
                this.notify('MODAL', { faceId: 'system', speaker: '警告', msg: '偵測到高能反應！克拉肯進入狂暴狀態！<br>攻擊頻率與傷害大幅提升！' });
            }

            // 🌟 判定卡洛特的迴避技能
            if (this.flags.dodgeNext) {
                this.notify('LOG', { msg: "💨 船隻靈巧地閃避了克拉肯的致命攻擊！", style: "color:var(--sonar); font-weight:bold;" });
                this.flags.dodgeNext = false; // 消耗迴避狀態
            } 
            // 🌟 BOSS 蓄力釋放 (毀滅打擊)
            else if (this.flags.bossCharging) {
                this.notify('ALERT', { msg: "🦑 克拉肯釋放了【深淵死光】！船體嚴重受損！" });
                this.hp -= 50; // 沒打斷的懲罰傷害
                this.damageAllSan(40, "深淵死光");
                this.fatigue += 30;
                this.flags.bossCharging = false; // 釋放完畢
            } else {
                // 🌟 AI 決策：隨機蓄力或普通攻擊
                let roll = Math.random();
                // 狂暴狀態下，蓄力機率提升 (30% vs 15%)
                let chargeChance = this.flags.bossPhase2 ? 0.3 : 0.15;

                if (roll < chargeChance) {
                    this.flags.bossCharging = true;
                    this.notify('ALERT', { msg: "⚠️ 克拉肯正在積蓄能量... (下回合釋放極大傷害！使用魚雷可打斷！)" });
                } else {
                    let attacks = BOSS_DATA.attacks;
                    let attack = attacks[Math.floor(Math.random() * attacks.length)];
                    
                    // 狂暴狀態傷害倍率 1.5x
                    let mult = this.flags.bossPhase2 ? 1.5 : 1.0;
                    
                    this.notify('ALERT', { msg: `🦑 ${attack.msg}` });
                    attack.effect(this, mult);
                }
            }

            // 🌟 Phase 2 被動：深淵再生 (每回合回血)
            if (this.flags.bossPhase2 && !this.flags.bossCharging && this.bossHp > 0) {
                this.bossHp = Math.min(this.bossMaxHp, this.bossHp + 50);
                this.notify('LOG', { msg: "🦠 克拉肯的傷口正在癒合... (HP +50)", style: "color:#ef5350" });
                document.getElementById('dist-display').innerText = Math.max(0, this.bossHp);
            }
        }

        // 🌟 修正：BOSS 戰屬於「極限戰鬥狀態」，不扣除常規燃料與口糧，避免因物資歸零導致系統錯亂卡死
        if (!this.bossMode) {
            this.fuel -= 15; 
            this.food -= 15; 
        }
        this.fatigue += 10;

        this.notify('LOG', { msg: `時間流逝... [${this.hour < 10 ? '0'+this.hour : this.hour}:00]` });
        
        if(!this.bossMode && typeof this.generateNodes === 'function') this.generateNodes(); 

        // 🌟 自動存檔已移除 (改為全手動)
        // if (this.saveGame) this.saveGame(false);

        // 🌟 觸發蜜拉思事件判定
        if (!this.bossMode) this.checkMelas();

        this.updateUI();

        // 判定：船體爆了直接 GAME OVER
        if (this.hp <= 0) {
            this.triggerAbsoluteDeath('hp');
            return;
        }

        // 物資耗盡判定
        if(this.fuel<=0 || this.food<=0) {
            if (typeof this.triggerFail === 'function') this.triggerFail();
            else this.notify('MODAL', { faceId: "system", speaker: "警告", msg: "物資已耗盡！" });
        } else {
            this.renderDash();
            // 🌟 關鍵終極修復：在這裡呼叫 renderCmds()！
            // 當回合流逝、環境扣完 SAN 之後，重新畫出船員按鈕。
            // 這樣不僅諾維安（與所有人）的 SAN 條會瞬間下降，
            // 被上鎖的按鈕也會被正確解鎖，再也不會卡死了！
            if (this.distLeft > 0 || this.bossMode) {
                this.renderCmds(); 
            } else {
                const actionGrid = document.getElementById('action-grid');
                if(actionGrid) actionGrid.innerHTML = '';
            }
        }
    },

    triggerArrival: function() {
        this.log("⚠️ 已抵達目標座標。請拋錨完成任務。", "color:var(--gold); font-weight:bold;");
        document.getElementById('target-label').innerText = 'STATUS';
        document.getElementById('dist-display').innerText = 'ARRIVED';
        document.getElementById('dist-display').style.color = 'var(--gold)';
        document.getElementById('target-unit').innerText = 'TARGET REACHED';
        document.getElementById('btn-anchor').style.display = 'inline-block';
        document.getElementById('radar-sweep').classList.add('fast'); 
        
        // 🌟 新增：抵達後清除所有操作介面，強制玩家只能點擊拋錨
        this.currentNodes = [];
        if(this.renderNodes) this.renderNodes();
        const actionGrid = document.getElementById('action-grid');
        if(actionGrid) actionGrid.innerHTML = '';
    },

    triggerFail: function() {
        this.log("⚠️ 嚴重警告：系統崩潰。呼叫緊急救援...", "color:var(--alert); font-weight:bold;");
        setTimeout(() => { this.endVoyage(false); }, 1500);
    },

    endVoyage: function(success) {
        if(!this.mission) return; // 防止重複觸發
        this.isVoyaging = false;
        document.getElementById('sea-layer').style.display = 'none';
        document.getElementById('port-layer').style.display = 'flex';
        this.playMusic(BGM_PORT);
        this.flags.godBuff = null;

        // 🌟 徹底解決時間定格 Bug：確保型別正確
        this.hour = parseInt(this.hour) || 0;
        this.day = parseInt(this.day) || 1;
        
        // 🌟 修正：不再重複加上委託預估時間，改為只增加 1 小時的返航/停泊時間
        // 這樣總時間 = 遊玩回合數 + 1，會更符合委託單上的預估 (例如 6 小時)
        this.addTime(1);

        if(this.hour >= 22 || this.hour < 6) { this.fatigue += 20; }

        if(success) {
            let reward = this.mission.reward;
            if(this.crew.find(c=>c.id==='manmu')) reward = Math.floor(reward * 1.5);
            this.money += reward;
            
            if(this.mission.type === 'adora') {
                this.flags.adoraDone = true;
                // 🌟 獲得守護玩偶邏輯
                if(this.inventory.length < this.inventoryMax) {
                    this.inventory.push('guardian_doll');
                    this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。願它能在深淵中保護你。<br><br><span style='color:var(--gold)'>獲得道具：守護玩偶 (已放入背包)</span>");
                } else if (this.warehouse.length < this.warehouseMax) {
                    // 背包滿了則放入倉庫
                    this.warehouse.push('guardian_doll');
                    this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。<br><br><span style='color:var(--gold)'>獲得道具：守護玩偶 (背包已滿，已放入倉庫)</span>");
                } else {
                    // 倉庫也滿了 (極端情況)
                    this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。<br><br><span style='color:var(--alert)'>背包與倉庫都滿了，玩偶遺失了...</span>");
                }
            } else {
                this.modal("hassel", "哈蘇", `任務完成。獲得 $${reward}。`);
            }
        } else {
            this.money -= 1000; // 🌟 允許負債，扣除 1000 (原 2000)
            this.fuel=20; this.food=20; this.san=50; this.hp=50;
            this.hour += 2; this.fatigue += 30;
            this.modal("system", "系統", "任務失敗。物資/船體極限。已被拖回港口，扣除救援費用 $1000。");
        }
        
        this.mission = null;
        this.refreshMissions();
        this.updateUI();
        // 🌟 自動存檔已移除 (改為全手動)
        // if (this.saveGame) this.saveGame(false);
        this.checkGameOver();
    },

    checkGameOver: function(isVictory = false) {
        // 🌟 修正：勝利後繼續遊玩不觸發 BE。只有未勝利且超過天數才 BE。
        if((!this.flags.victory && this.day > 10) || isVictory) {
            let title = "", msg = "";
            if(isVictory) {
                title = "TRUE ENDING: 榮耀歸途";
                msg = "S.S. 諾埃瑪號發射了深淵魚雷，炸碎了舊日的支配者。<br>你們衝破了風暴。<br>碼頭上，小鎮的所有人都來了。<br>這是一場屬於勝利者的慶功宴。";
            } else {
                title = "BAD ENDING: 深淵葬禮";
                msg = "第 10 天，諾埃瑪號未能承受住深淵的潮汐。<br>一切歸於沉寂。";
            }
            
            this.modal("system", title, msg);
            
            setTimeout(() => {
                let btnContainer = document.getElementById('modal-btn-container');
                if(btnContainer) {
                    btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">RESTART SYSTEM</button>`;
                }
            }, 10);
        }
    },

    // --- 🎣 釣魚系統 ---
    buyRod: function() {
        if(this.money >= 150) {
            this.money -= 150;
            this.flags.rodDurability = 10;
            this.log("💰 購買了初級釣竿！");
            this.updateUI(); this.openTab('store');
        } else { this.modal("system", "警告", "資金不足。"); }
    },

    // --- 🌟 新增：自定義數量購買邏輯 ---
    buyQuantity: function(type, amount, price) {
        amount = parseInt(amount);
        let totalCost = amount * price;
        if (amount <= 0) return;
        
        if (this.money >= totalCost) {
            this.money -= totalCost;
            if (type === 'fuel') this.fuel = Math.min(this.maxFuel, this.fuel + amount);
            if (type === 'food') this.food = Math.min(this.maxFood, this.food + amount);
            if (type === 'hp') this.hp = Math.min(100, this.hp + amount);
            
            this.log(`🛒 購買了 ${amount} 單位物資，花費 $${totalCost}。`, "color:var(--sonar)");
            this.updateUI(); this.openTab('store');
        }
    },

    // --- 🌟 新增：酒館強制刷新 ---
    forceRefreshTavern: function() {
        if (this.money >= 50) {
            this.money -= 50;
            this.refreshTavern(); // 重新抽取傭兵
            this.log("🍻 花費 $50 請酒保打聽了新的傭兵情報。", "color:var(--gold)");
            this.updateUI(); this.openTab('tavern');
        } else {
            this.modal("system", "警告", "資金不足，酒保不想理你。");
        }
    },
    
    buyBait: function() {
        if(this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "倉庫已滿！無法購買。"); return; }
        if(this.money >= 20) {
            this.money -= 20;
            this.warehouse.push('bait'); // 🌟 放入小鎮倉庫
            this.log("💰 購買了特製魚餌！(已放入倉庫)");
            this.updateUI(); this.openTab('store');
        } else { this.modal("system", "警告", "資金不足。"); }
    },
    
    buyNet: function() {
        if(this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "倉庫已滿！無法購買。"); return; }
        if(this.money >= 40) {
            this.money -= 40;
            this.warehouse.push('fishing_net'); // 🌟 放入小鎮倉庫
            this.log("💰 購買了捕魚網！(已放入倉庫)");
            this.updateUI(); this.openTab('store');
        } else { this.modal("system", "警告", "資金不足。"); }
    },

    startFishing: function() {
        if(!this.flags.rodDurability || this.flags.rodDurability <= 0) {
            this.log("釣竿已損壞或未裝備！"); return;
        }
        let baitIdx = this.warehouse.indexOf('bait'); // 🌟 從倉庫扣除魚餌
        if(baitIdx === -1) {
            this.log("倉庫裡沒有魚餌了！請去找林恩購買。"); return;
        }
        
        this.warehouse.splice(baitIdx, 1);
        
        const btn = document.getElementById('fish-btn');
        const msg = document.getElementById('fish-msg');
        btn.disabled = true; btn.innerText = "等待中...";
        msg.innerText = "海面微波蕩漾... 專注看著浮標...";
        msg.style.color = "#aaa";
        
        let waitTime = 2000 + Math.random() * 2500;
        setTimeout(() => {
            msg.innerText = "❗ 浮標沉下去了！快拉！";
            msg.style.color = "var(--alert)"; msg.style.fontWeight = "bold";
            btn.disabled = false; btn.innerText = "💥 猛力收線！";
            
            this.flags.isBiting = true;
            setTimeout(() => {
                if(this.flags.isBiting) {
                    this.flags.isBiting = false;
                    this.flags.rodDurability -= 1;
                    this.addTime(1); // 🌟 釣魚經過 1 小時
                    this.updateUI(); // 🌟 更新時間顯示
                    this.openTab('port');
                    this.log("魚跑掉了... (釣竿耐久度 -1)", "color:#777");
                }
            }, 1000);
            
            btn.onclick = () => {
                if(this.flags.isBiting) {
                    this.flags.isBiting = false;
                    this.flags.rodDurability -= 1;
                    this.addTime(1); // 🌟 釣魚經過 1 小時
                    this.updateUI(); // 🌟 更新時間顯示
                    
                    // 🌟 優化：港口釣魚池 (加入變異魚種與垃圾)
                    let fishPool = ['fish_kelp', 'fish_kelp', 'fish_sardine', 'fish_sardine', 'fish_crab', 'trash'];
                    // 15% 機率釣到變異魚
                    if (Math.random() < 0.15) {
                        fishPool = ['fish_mutant_sardine', 'fish_mutant_crab'];
                    }

                    let catchId = fishPool[Math.floor(Math.random() * fishPool.length)];
                    this.warehouse.push(catchId); // 🌟 釣到的魚放入倉庫
                    let f = ITEM_DB[catchId]; // 🌟 抓取魚的資料

                    // 🌟 圖鑑解鎖判定
                    this.codex = this.codex || [];
                    if (!this.codex.includes(catchId)) {
                        this.codex.push(catchId);
                        // 🌟 顯示帶有圖標的解鎖與釣獲訊息！
                        this.log(`✨ 解鎖了新的漁獲：${f.icon} ${f.name}！`, "color:var(--gold)");
                    } else {
                        this.log(`🎣 釣到了 ${f.icon} ${f.name}！(已放入倉庫)`, "color:var(--sonar)");
                    }
                    
                    // 🌟 新增：釣魚成功彈窗提示
                    this.modal("none", "釣魚成功", `
                        <div style="text-align:center;">
                            <div style="font-size:4rem; margin:10px 0;">${f.icon}</div>
                            <div style="font-size:1.2rem; color:var(--gold); font-weight:bold;">${f.name}</div>
                            <div style="color:#aaa; font-size:0.9rem; margin-top:5px;">${f.desc}</div>
                            <div style="margin-top:15px; color:var(--sonar); font-size:0.8rem;">(已放入小鎮倉庫)</div>
                        </div>
                    `);

                    this.openTab('port'); 
                }
            };
        }, waitTime);
    },

    // --- 🐟 賣魚系統 (優化版：選擇數量) ---
    findFishBuyer: function() {
        // 1. 掃描倉庫裡的魚
        let fishCounts = {};
        this.warehouse.forEach(id => {
            if(ITEM_DB[id] && ITEM_DB[id].type === 'fish') {
                fishCounts[id] = (fishCounts[id] || 0) + 1;
            }
        });
        
        if(Object.keys(fishCounts).length === 0) {
            this.modal("system", "提示", "你的倉庫裡沒有任何漁獲可以賣。"); return;
        }

        // 2. 尋找買家
        this.addTime(0.5);
        this.updateUI();

        let roll = Math.random();
        let buyerId = 'lynn'; let multiplier = 0.8;
        if (roll < 0.10) { buyerId = 'seagod'; multiplier = 3.0; } 
        else if (roll < 0.40) { buyerId = 'melas'; multiplier = 1.5; } 

        const buyer = DB.npc[buyerId];
        
        // 3. 顯示開場白
        let msg = "";
        if (buyerId === 'seagod') msg = `「哇！是你釣到的嗎！好漂亮的魚，我想全部買下來給大黑看！給你 3 倍的價錢！」`;
        else if (buyerId === 'melas') msg = `「呵呵... 居然能在這種死海釣到東西，真有趣。我用 1.5 倍的價格收購，當作研究材料吧。」`;
        else msg = `「就這點破魚？現在行情不好，我最多只能用 8 折收。涼拌。」`;

        this.modal(buyerId, buyer.name, msg + `<br><br><span style="color:var(--gold)">收購倍率: ${multiplier}x</span>`);

        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--gold); color:var(--gold);" onclick="game.openSellFishUI('${buyerId}', ${multiplier})">選擇要賣的魚</button>
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">不賣了</button>
                `;
            }
        }, 10);
    },

    // 🌟 新增：開啟賣魚選擇介面
    openSellFishUI: function(buyerId, multiplier) {
        // 統計魚類
        let fishCounts = {};
        this.warehouse.forEach(id => {
            if(ITEM_DB[id] && ITEM_DB[id].type === 'fish') {
                fishCounts[id] = (fishCounts[id] || 0) + 1;
            }
        });

        // 🌟 優化：使用 vh 單位適配不同螢幕高度，並調整 padding
        // 🌟 修正：加入 width:100%, box-sizing:border-box 與 overflow-x:hidden 防止手機版面撐開
        let html = `<div style="width:100%; max-height:50vh; overflow-y:auto; overflow-x:hidden; padding:2px; box-sizing:border-box;">`;
        
        Object.keys(fishCounts).forEach(id => {
            let item = ITEM_DB[id];
            let count = fishCounts[id];
            let unitPrice = Math.floor(item.value * multiplier);
            
            // 🌟 優化：Flex 佈局增加 wrap 防止擠壓，增大觸控區域
            html += `
            <div class="tech-card" style="padding:8px; margin-bottom:8px; border-color:#444; width:100%; box-sizing:border-box; overflow:hidden;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; flex:1; min-width:0; overflow:hidden;">
                        <span style="font-size:1.5rem; margin-right:8px; background:rgba(0,0,0,0.3); border-radius:6px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${item.icon}</span>
                        <div style="min-width:0; flex:1; overflow:hidden;">
                            <div style="color:var(--sonar); font-weight:bold; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
                            <div style="font-size:0.75rem; color:#aaa;">$${unitPrice}</div>
                        </div>
                    </div>
                    <div style="text-align:right; flex-shrink:0;">
                        <div style="color:var(--gold); font-weight:bold; font-size:1rem;">$<span id="subtotal-${id}">0</span></div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px;">
                    <input type="range" class="fish-slider" data-id="${id}" data-price="${unitPrice}" min="0" max="${count}" value="0" style="flex:1; height:24px; min-width:0; margin:0;" oninput="game.updateSellTotal()">
                    <div style="min-width:40px; text-align:right; color:#fff; font-family:monospace; font-size:0.85rem; flex-shrink:0;"><span id="qty-${id}">0</span>/${count}</div>
                </div>
            </div>`;
        });
        html += `</div>
        <div style="border-top:1px solid #333; margin-top:10px; padding-top:10px; text-align:right;">
            總計: <span style="color:var(--gold); font-size:1.2rem; font-weight:bold;">$<span id="sell-total">0</span></span>
        </div>`;

        this.modal(buyerId, "交易選擇", html);

        // 注入確認按鈕
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--gold); color:var(--gold);" onclick="game.confirmSellFish()">確認出售</button>
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>
                `;
            }
            // 初始化計算
            this.updateSellTotal();
        }, 10);
    },

    // 🌟 新增：即時更新總價
    updateSellTotal: function() {
        let total = 0;
        document.querySelectorAll('.fish-slider').forEach(slider => {
            let id = slider.getAttribute('data-id');
            let price = parseInt(slider.getAttribute('data-price'));
            let qty = parseInt(slider.value);
            
            document.getElementById(`qty-${id}`).innerText = qty;
            document.getElementById(`subtotal-${id}`).innerText = qty * price;
            total += qty * price;
        });
        document.getElementById('sell-total').innerText = total;
    },

    // 🌟 新增：確認出售
    confirmSellFish: function() {
        let totalGain = 0;
        let itemsToRemove = [];

        document.querySelectorAll('.fish-slider').forEach(slider => {
            let id = slider.getAttribute('data-id');
            let price = parseInt(slider.getAttribute('data-price'));
            let qty = parseInt(slider.value);
            
            if (qty > 0) {
                totalGain += qty * price;
                for(let i=0; i<qty; i++) itemsToRemove.push(id);
            }
        });

        if (totalGain === 0) {
            this.closeModal();
            return;
        }

        // 移除道具
        itemsToRemove.forEach(id => {
            let idx = this.warehouse.indexOf(id);
            if(idx !== -1) this.warehouse.splice(idx, 1);
        });

        this.money += totalGain;
        this.updateUI();
        this.closeModal();
        this.log(`交易完成，獲得 $${totalGain}。`, "color:var(--gold)");
        this.openTab('port');
    },

    // --- 💤 港口小憩系統 ---
    openNapUI: function() {
        this.modal("none", "角落小憩", `
            <div style="text-align:center;">
                <div style="font-size:3rem; margin-bottom:10px;">💤</div>
                <div style="margin-bottom:10px; color:#aaa;">要在充滿魚腥味的角落睡多久？<br>(回復疲勞 / <span style="color:#b39ddb">大幅降低 SAN</span>)</div>
                
                <div style="display:flex; gap:10px; align-items:center; justify-content:center; margin:20px 0;">
                    <input type="range" id="nap-slider" min="1" max="8" value="1" style="width:60%;" oninput="game.updateNapPreview(this.value)">
                    <div style="font-size:1.2rem; font-weight:bold; color:var(--sonar); width:40px;"><span id="nap-hours">1</span>h</div>
                </div>
                <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:5px; font-size:0.9rem;">
                    <div>預計回復疲勞: <span style="color:var(--sonar)" id="nap-fatigue">-5</span>%</div>
                    <div>預計扣除 SAN: <span style="color:#b39ddb" id="nap-san">-5</span> (全體)</div>
                </div>
            </div>
        `);
        
        setTimeout(() => {
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) {
                btnContainer.innerHTML = `
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--sonar); color:var(--sonar);" onclick="game.confirmNap()">開始休息</button>
                    <button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>
                `;
            }
        }, 10);
    },

    updateNapPreview: function(val) {
        document.getElementById('nap-hours').innerText = val;
        document.getElementById('nap-fatigue').innerText = '-' + (val * 5);
        document.getElementById('nap-san').innerText = '-' + (val * 5);
    },

    confirmNap: function() {
        const slider = document.getElementById('nap-slider');
        const hours = parseInt(slider.value);
        this.closeModal();
        
        this.addTime(hours);
        this.fatigue = Math.max(0, this.fatigue - (hours * 5));
        
        // 露宿街頭懲罰：全體扣 SAN
        this.damageAllSan(hours * 5, "露宿街頭");
        
        this.log(`💤 在港口角落睡了 ${hours} 小時... 身體好痛，精神更差了。`, "color:#aaa");
        this.updateUI();
        this.openTab('port');
    }
});