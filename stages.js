if (typeof window.game === 'undefined') window.game = {};

Object.assign(window.game, {
    addTime: function(hours) {
        let oldDay = this.day; this.hour = parseFloat(this.hour) || 0; this.hour += hours;
        if(this.hour >= 24) { 
            this.day += Math.floor(this.hour / 24); this.hour = this.hour % 24; 
            if (this.randomizeWeather) this.randomizeWeather();
            if (this.randomizeFishingWeather) this.randomizeFishingWeather();
            // 優化：高利貸動態利率與討債事件
            if (this.debt && this.debt > 0) {
                this.debtDays = (this.debtDays || 0) + 1;
                let rate = this.debtDays <= 3 ? 0.05 : 0.15; // 前3天5%，之後15%
                let interest = Math.ceil(this.debt * rate);
                this.debt += interest;
                this.log(`📉 [高利貸] Day ${this.debtDays} (利率 ${(rate*100).toFixed(0)}%) 利息 $${interest} (欠款: $${this.debt})`, "color:var(--alert)");
                
                if (this.debt >= 10000) { this.triggerDebtEnding(); return; }

                // 討債人事件 (腓力)
                if (this.debt > 6000 && Math.random() < 0.5) {
                    let take = Math.min(this.money, Math.floor(this.debt * 0.1)); // 強制徵收 10% 債務額或全部現金
                    if (take > 0) {
                        this.money -= take; this.debt -= take;
                        this.notify('MODAL', { faceId: 'philip', speaker: '腓力 (討債人)', msg: `「我少主讓我來收點利息。別讓場面變得難看。」<br><br><span style="color:var(--alert)">被強行徵收了 $${take} 用於抵債。</span>` });
                        this.log(`📉 腓力強行收走了 $${take} 抵債。`, "color:var(--alert)");
                    } else {
                        this.notify('MODAL', { faceId: 'philip', speaker: '腓力 (討債人)', msg: `「沒錢？我少主會不高興的。你們最好快點籌錢。」<br><br><span style="color:var(--alert)">腓力面有難色地看了你們一眼。(身無分文，僥倖逃過一劫)</span>` });
                    }
                }
            } else { this.debtDays = 0; }
            }
        if (this.day >= 10 && oldDay < 10) { this.day = 10; this.refreshMissions(); this.modal("peter", "彼得", "「第 10 天了。克拉肯已經完全甦醒。這是最後的機會，去公會接下深淵中心的委託，解決牠，或者我們一起死在這裡。」"); }
        if (!this.flags.victory && (this.day > 10 || (this.day === 10 && this.hour === 0 && oldDay === 10 && hours > 0))) { if (!this.bossMode && this.bossHp > 0) this.triggerAbsoluteDeath('time'); }
        if (!this.flags.victory && this.day > 10) this.day = 10;
    },
    addCrisis: function(id) {
        if (typeof CRISIS_DB !== 'undefined' && CRISIS_DB[id]) {
            if (!this.activeCrises.find(c => c.id === id)) {
                let c = Object.assign({id: id}, CRISIS_DB[id]);
                if (this.bossMode && id === 'engine_fire') c.desc = "每回合 HP -15";
                this.activeCrises.push(c); this.log(`⚠ 警告：${c.name}！${c.desc}`, "color:var(--alert)"); this.renderDash(); this.renderCmds();
            }
        }
    },
    resolveCrisis: function(idx) {
        if (this.ap <= 0) { this.log("AP 不足！"); return; }
        let c = this.activeCrises[idx]; let cost = 2; if (c.roles) { let hasSpecialist = this.crew.some(m => c.roles.includes(m.role)); if (hasSpecialist) cost = 1; }
        if (this.ap < cost) { this.log(`AP 不足！排除此危機需要 ${cost} AP (相關專長可減免)`); return; }
        this.ap -= cost; this.activeCrises.splice(idx, 1); this.log(`🔧 已排除危機：${c.name}`, "color:var(--sonar)"); this.renderDash(); this.renderCmds();
    },
    checkLaunch: function(forceLaunch = false) {
        if (!this.mission) { this.modal("system", "警告", "深淵極度危險。<br><br><span style='color:var(--gold)'>請先前往公會接取委託後，再進行出航程序！</span>"); return; }
        if (this.fatigue >= 100) { this.modal("system", "GAME OVER", "你的疲勞值已達極限，在出航不久後便精神崩潰，連同整艘船沉入了深淵..."); setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--alert); color:var(--alert); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">重新開始 (返回標題)</button>`; }, 10); return; }
        if(this.fatigue >= 85 && !forceLaunch) { this.modal("costa", "科絲塔", "BATA... 你看起來快要崩潰了。真的不需要去旅館休息一下再出發嗎？深海裡的東西會趁虛而入的..."); let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--alert); color:var(--alert);" onclick="game.closeModal(); game.checkLaunch(true)">強行出航 (極度危險)</button><button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.closeModal(); game.switchMode('town'); game.openTab('inn');">回鎮上去旅館休息</button>`; return; }
        if(this.mission.type === 'boss') { this.bossMode = true; this.bossHp = BOSS_DATA.hp; this.bossMaxHp = BOSS_DATA.hp; this.flags.bossPhase2 = false; this.selectedActorId = null; document.body.classList.add('boss-screen'); let noise = document.getElementById('boss-noise'); if(noise) noise.style.display = 'block'; this.modal("system", "緊急警報", "偵測到超巨型深淵生物反應！它來了！"); } 
        else { if(this.fuel < 20 || this.food < 20) { this.modal("system", "系統警告", "物資存量過低，拒絕出航。"); return; } document.body.classList.remove('boss-screen'); let noise = document.getElementById('boss-noise'); if(noise) noise.style.display = 'none'; this.bossMode = false; }
        document.getElementById('port-layer').style.display = 'none'; document.getElementById('sea-layer').style.display = 'flex';
        if (!document.getElementById('melas-signal')) { let sig = document.createElement('div'); sig.id = 'melas-signal'; sig.style.cssText = 'display:none; position:absolute; top:80px; right:20px; font-size:2rem; animation:blink 1s infinite; z-index:20; filter:drop-shadow(0 0 5px #ce93d8); cursor:help;'; sig.innerHTML = '👾'; document.getElementById('sea-layer').appendChild(sig); }
        if(this.bossMode) this.playMusic(BGM_BOSS); else this.playMusic(BGM_VOYAGE); 
        this.distTotal = this.mission.dist; this.distLeft = this.mission.dist; this.ap = (this.upgrades && this.upgrades.torpedo) ? 3 : 0; this.isVoyaging = true;
        const safeStyle = (id, prop, val) => { let el = document.getElementById(id); if(el) el.style[prop] = val; }; const safeText = (id, val) => { let el = document.getElementById(id); if(el) el.innerText = val; };
        safeStyle('btn-anchor', 'display', 'none'); safeStyle('dist-display', 'color', 'var(--sonar)'); let radar = document.getElementById('radar-sweep'); if(radar) radar.classList.remove('fast'); let sysLog = document.getElementById('sys-log'); if(sysLog) sysLog.innerHTML = '';
        try { if(this.bossMode) { safeText('target-label', 'KRAKEN STATUS'); safeText('target-unit', 'HP REMAINING'); safeText('dist-display', this.bossHp); safeStyle('dist-display', 'color', 'var(--alert)'); this.log("遭遇舊日支配者 - 克拉肯！", "color:var(--alert); font-size:1.2rem; font-weight:bold;"); } else { safeText('target-label', 'DISTANCE TO TARGET'); safeText('target-unit', 'KILOMETERS'); safeText('dist-display', this.distLeft); this.generateNodes(); this.log(`啟動序列完成。航向：${this.mission.title}`); } } catch(e) { console.error("Error in launch sequence:", e); }
        try { if(typeof this.renderSeaMap === 'function') this.renderSeaMap(this.mission); } catch(e) { console.error("Error rendering sea map:", e); }
        this.renderCmds(); this.renderDash(); this.updateUI();
    },
    triggerAbsoluteDeath: function(reason) {
        this.isVoyaging = false; this.mission = null;
        let msg = reason === 'hp' ? "船體承受不住深海的水壓與怪物攻擊，徹底解體。你們沉入了無盡的黑暗..." : (reason === 'time' ? "時間到了。第十日的午夜鐘聲響起，克拉肯的巨觸將整個第七星區拖入了無盡的深海..." : "全體理智歸零，所有人都成了深淵的一部分...");
        this.modal("system", "GAME OVER", msg);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--alert); color:var(--alert); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">重新開始 (返回標題)</button>`; }, 10);
    },
    triggerDebtEnding: function() {
        this.isVoyaging = false; this.mission = null; this.notify('BGM', { action: 'stop' });
        this.modal("nathanael", "拿但業", "「嘖嘖嘖... 看看這筆爛帳。超過 $10,000 了？你以為我是開慈善機構的嗎？」<br><br>拿但業身後走出了幾個彪形大漢，手裡拿著鐐銬。<br><br>「既然還不出錢，那就用你這副身體來抵債吧。聽說黑市最近很缺『活體材料』... 帶走。」");
        setTimeout(() => { 
            let btnContainer = document.getElementById('modal-btn-container'); 
            if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--alert); color:var(--alert); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">BAD ENDING: 抵債品</button>`; 
        }, 10);
    },
    checkMelas: function() {
        const signal = document.getElementById('melas-signal'); if (signal) signal.style.display = 'none';
        if(this.mission && (this.mission.area.includes('暗礁') || this.mission.area.includes('深淵')) && Math.random()<0.15) {
            if (signal) signal.style.display = 'block'; this.log("偵測到未知紫色訊號...", "color:#ce93d8");
            setTimeout(() => { this.modal("melas", "蜜拉思", "嘻嘻... 遇見我是你的幸運。要買點好東西嗎？<br><br>【虛空藥水】$300 (免疫SAN下降)<br>【特製口糧】$150 (降低20%疲勞)"); let btnContainer = document.getElementById('modal-btn-container'); if (btnContainer) { btnContainer.innerHTML = ''; btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--purple); color:var(--purple);" onclick="game.buyMelas('void_potion', 300)">買 虛空藥水 $300</button>`; btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.buyMelas('special_ration', 150)">買 特製口糧 $150</button>`; btnContainer.innerHTML += `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#555;" onclick="game.closeModal()">離開</button>`; } }, 1000);
        }
    },
    buyMelas: function(itemId, price) { if (this.money >= price) { if (this.inventory.length >= this.inventoryMax) { this.log("背包已滿！無法購買。", "color:var(--alert)"); } else { this.money -= price; this.inventory.push(itemId); this.log(`💰 購買了 ${ITEM_DB[itemId].name}，已放入背包。`, "color:var(--purple)"); this.updateUI(); } } else { this.log("資金不足。", "color:var(--alert)"); } },
    fireTorpedo: function() {
        if(!this.upgrades.torpedo) return; if(this.ap < 1) { this.log("AP 不足！"); return; } if (!this.bossMode) { this.log("⚠️ 雷達未鎖定大型敵對目標，無法發射。", "color:var(--alert)"); return; }
        this.ap--;
        if (this.flags.bossCharging) { this.flags.bossCharging = false; this.bossHp -= 500; this.log("✨ 魚雷精準命中核心！打斷了深淵死光！(BOSS HP-500)", "color:var(--gold); font-weight:bold; font-size:1.2rem;"); } else { this.bossHp -= 250; this.log("💥 發射深淵魚雷！造成重創！(BOSS HP-250)", "color:var(--alert); font-weight:bold;"); }
        document.getElementById('sea-layer').classList.add('shake'); let tpBtn = document.querySelector('button[onclick="game.fireTorpedo()"]'); if(tpBtn) { let vfx = document.createElement('div'); vfx.className = 'vfx vfx-torpedo'; tpBtn.appendChild(vfx); setTimeout(() => vfx.remove(), 800); } setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 600);
        document.getElementById('dist-display').innerText = Math.max(0, this.bossHp);
        if (this.bossHp <= 0) { setTimeout(() => { this.triggerVictory(); }, 1000); return; }
        setTimeout(() => { this.renderDash(); this.renderCmds(); document.querySelectorAll('.cmd-btn').forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; }); }, 600);
    },
    action: function(id) {
        if (this.bossMode) { if (this.flags.crewActedThisTurn) return; this.selectedActorId = id; this.renderCmds(); let actor = this.crew.find(c => c.id === id); this.log(`[戰術預備] 已選擇：${actor.name} (請點擊下方按鈕執行)`, "color:var(--sonar)"); return; }
        let actor = this.crew.find(c => c.id === id); let oldDist = this.distLeft;
        if (actor && actor.trauma) { if (actor.trauma.id === 'paranoid' && Math.random() < 0.2) { actor.hasActed = true; if(this.bossMode) this.flags.crewActedThisTurn = true; this.notify('LOG', { msg: `💢 ${actor.name} 陷入【被害妄想】，尖叫著躲在角落，拒絕執行指令！`, style: "color:var(--alert)" }); this.renderDash(); this.renderCmds(); return; } if (actor.trauma.id === 'reckless') { this.hp -= 5; this.notify('LOG', { msg: `⚠ ${actor.name} 狂躁地砸碎了控制台！(船體 HP -5)`, style: "color:var(--alert)" }); } }
        document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = true);
        let fatiguePenalty = this.fatigue > 50 ? 5 : 0; let prog = Math.max(0, (15 + Math.floor(Math.random()*10)) - fatiguePenalty); let msg = "";
        // 🌟 非法改造效果：推進效率 +20%
        if (this.flags.speedMod) prog = Math.floor(prog * 1.2);

        if (!this.bossMode) {
            if(id === 'lanlan') { let isJornonaHere = this.crew.find(c => c.id === 'jornona'); if(!isJornonaHere && Math.random() < 0.2) { prog = 0; this.applySanDamage(actor, 10, "怕鬼幻覺"); msg = "蘭蘭被幻覺嚇壞了！推進失敗"; } else { this.food = Math.min(this.maxFood, this.food + 20); msg = "蘭蘭撈到了補給箱！(FOOD+20)"; } }
            else if(id === 'lazar') { prog += 5; this.healAllSan(20); this.fatigue = Math.max(0, this.fatigue-15); msg = "拉扎爾進行心理疏導 (全體 SAN+20, 疲勞-15)。"; }
            else if(id === 'jornona') { prog += 5; this.healAllSan(15); this.fatigue = Math.max(0, this.fatigue-15); msg = "喬諾娜唱起了歌 (全體 SAN+15, 疲勞-15)。"; }
            else if(id === 'molly') { prog += 5; let buff = this.crew.find(c => c.id === 'manmu') ? 2 : 1; this.hp = Math.min(100, this.hp+(10*buff)); this.healAllSan(10*buff); this.fatigue = Math.max(0, this.fatigue-10); msg = buff > 1 ? "在小目的全力資助下，茉莉使用了頂級醫療設備！(HP+20, SAN+20)" : "茉莉分發了強效補劑 (HP+10, SAN+10, 疲勞-10)。"; }
            else if(id === 'novian') { let bonus = this.crew.find(c => c.id === 'carlota') ? 10 : 0; prog += 15 + bonus; msg = bonus ? "諾維安與卡洛特兄弟齊心，航速突破極限！(25KM)" : "諾維安親自掌舵，全速推進！"; }
            else if(id === 'philip') { prog += 20; msg = "腓力靠蠻力撞開了暗礁！"; }
            else if(id === 'nathanael') { prog = this.crew.find(c => c.id === 'philip') ? prog + 30 : 5; msg = prog > 5 ? "拿但業下達絕對命令，腓力效率爆發！" : "拿但業隨便應付了一下。"; }
            else if(id === 'carlota') { prog += 15; msg = "卡洛特敏銳地找出了安全的航線！"; }
            else if(id === 'venator') { prog += 15; msg = "維納托的機械精準計算出最佳路徑！"; }
            else if(id === 'narcissus') { prog += 20; this.fatigue = Math.max(0, this.fatigue-10); msg = "納希瑟斯不知用了什麼方法，讓航行變得順利 (疲勞-10)。"; }
            else if(id === 'kleion') { prog += 15; msg = "克里昂用化學藥劑腐蝕了前方的障礙！"; }
            else if(id === 'manmu') { prog += 5; msg = "小目用金錢解決了問題... 雖然不知道給了誰。"; }
            else if(id === 'estrella') { prog += 5; this.hp = Math.min(100, this.hp+15); msg = "星星進行了緊急維修 (HP+15)。"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            else if(id === 'costa') { prog += 5; let heal = this.crew.find(c => c.id === 'kleion') ? 25 : 15; this.hp = Math.min(100, this.hp+heal); msg = heal > 15 ? "科絲塔與克里昂靈魂共鳴，修復效率大增！(HP+25)" : "科絲塔用奈米機器修補了船艙 (HP+15)。"; this.notify('SFX', { id: id, vfx: 'repair' }); }
            else { msg = `船員執行了操作。`; }
            this.distLeft = Math.max(0, this.distLeft - prog); this.animateDist(oldDist, this.distLeft, 600);
        }
        this.notify('LOG', { msg: msg });
        setTimeout(() => { this.renderDash(); document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false); this.nextTurn(); }, 600);
    },
    executeBossAction: function() {
        if (!this.selectedActorId) { this.log("請先選擇一名船員行動！", "color:var(--alert)"); return; }
        let id = this.selectedActorId; this.flags.crewActedThisTurn = true; this.selectedActorId = null; let msg = ""; let prog = 0;
        if(id === 'philip') { this.bossHp -= 150; msg = "腓力發出怒吼，用重火力轟炸克拉肯！(BOSS HP-150)"; this.notify('SFX', { id: id, vfx: 'fire' }); }
        else if(id === 'nathanael') { if(this.crew.find(c => c.id === 'philip')) { this.bossHp -= 300; msg = "拿但業下達處決命令，腓力發動毀滅打擊！(BOSS HP-300)"; this.notify('SFX', { id: 'philip', vfx: 'crit' }); } else { msg = "拿但業沒看到腓力，嫌觸手太噁心不想動。"; } }
        else if(id === 'lanlan') { this.bossHp -= 100; msg = "蘭蘭揮舞長戟，斬斷了襲來的觸手！(BOSS HP-100)"; this.notify('SFX', { id: id, vfx: 'slash' }); }
        else if(id === 'venator') { let dmg = this.crew.find(c => c.id === 'narcissus') ? 180 : 120; this.bossHp -= dmg; msg = dmg > 120 ? "納希瑟斯在旁注視，維納托的機械軍團火力全開！(BOSS HP-180)" : "維納托的機械軍團精準鎖定了克拉肯的弱點！(BOSS HP-120)"; this.notify('SFX', { id: id, vfx: 'tech' }); }
        else if(id === 'kleion') { this.bossHp -= 80; this.hp = Math.min(100, this.hp+15); msg = "克里昂丟出化學炸藥並修補漏洞！(BOSS HP-80, 船體+15)"; this.notify('SFX', { id: id, vfx: 'chem' }); }
        else if(id === 'lazar' || id === 'jornona') { this.healAllSan(id==='lazar'?30:20); this.fatigue = Math.max(0, this.fatigue-(id==='lazar'?15:20)); msg = id==='lazar' ? "拉扎爾在戰火中穩定軍心！(全體 SAN+30, 疲勞-15)" : "喬諾娜的歌聲振奮了所有人！(全體 SAN+20, 疲勞-20)"; this.notify('SFX', { id: id, vfx: 'heal' }); }
        else if(id === 'molly') { let hpHeal = this.crew.find(c => c.id === 'manmu') ? 40 : 25; this.hp = Math.min(100, this.hp+hpHeal); this.fatigue = Math.max(0, this.fatigue-15); msg = hpHeal > 25 ? "小目撒錢掩護，茉莉冒死進行了奇蹟手術！(HP+40, 疲勞-15)" : "茉莉極限搶救船員與裝甲！(HP+25, 疲勞-15)"; this.notify('SFX', { id: id, vfx: 'repair' }); }
        else if(id === 'carlota') { this.flags.dodgeNext = true; msg = "卡洛特敏銳地預判了海怪的動作！(躲避下一次攻擊)"; this.notify('SFX', { id: id, vfx: 'tech' }); }
        else if(id === 'narcissus') { this.bossHp -= 60; this.fatigue = Math.max(0, this.fatigue-15); msg = "納希瑟斯的魅力連觸手都遲疑了一瞬！(BOSS HP-60, 疲勞-15)"; this.notify('SFX', { id: id, vfx: 'slash' }); }
        else if(id === 'manmu') { if(this.money >= 50) { this.money -= 50; this.bossHp -= 180; msg = "小目撒出鈔票，呼叫了軌道重砲支援！(BOSS HP-180, -$50)"; this.notify('SFX', { id: id, vfx: 'crit' }); } else { this.bossHp -= 20; msg = "小目發現沒錢了，只能用手槍射擊。(BOSS HP-20)"; } }
        else if(id === 'estrella' || id === 'costa') { let heal = (id === 'costa' && this.crew.find(c => c.id === 'kleion')) ? 45 : 30; this.hp = Math.min(100, this.hp+heal); msg = heal > 30 ? "科絲塔在克里昂的指導下進行了完美修復！(HP+45)" : "發揮機修天賦，穩住了爆裂的船艙！(HP+30)"; this.notify('SFX', { id: id, vfx: 'repair' }); }
        else { this.bossHp -= 20; msg = "船員用手槍勉強還擊... (BOSS HP-20)"; this.notify('SFX', { id: id, vfx: 'shot' }); }
        document.getElementById('dist-display').innerText = Math.max(0, this.bossHp); this.notify('LOG', { msg: msg });
        if (this.bossHp <= 0) { setTimeout(() => { this.triggerVictory(); }, 1000); return; }
        setTimeout(() => { this.renderDash(); document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false); this.nextTurn(); }, 600);
    },
    dive: function() {
        if(this.ap <= 0 || this.fuel < 20) { this.log("無法潛航 (AP/Fuel 不足)"); return; }
        this.ap--; this.fuel -= 20; this.log("下潛至深海層...", "color:#00e5ff"); document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = true);
        setTimeout(() => { let rand = Math.random(); if(rand < 0.3) { this.hp -= 20; this.log("⚠️ 遭遇深海壓強亂流！船體受損！", "color:var(--alert)"); } else if (rand < 0.65) { let money = 600 + Math.floor(Math.random()*600); this.money += money; this.log(`💰 發現古代沈船寶藏！獲得 $${money}`, "color:var(--gold)"); this.unlockCodex('treasure'); } else { this.san -= 15; this.log("👁️ 凝視深淵... 深淵也在凝視你。SAN 值下降。", "color:#b388ff"); this.unlockCodex('whisper'); } this.renderDash(); document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false); if(this.ap <= 0) this.nextTurn(); }, 1000);
    },
    unlockCodex: function(id) { if (!this.codex.includes(id) && CODEX_DB[id]) { this.codex.push(id); this.log(`【圖鑑解鎖】發現新項目：${CODEX_DB[id].name}`, "color:#00e5ff; font-weight:bold;"); } },
    triggerRandomEvent: function() {
        const applyGroupSanDamage = (amt, reason) => { if(this.crew && this.crew.length > 0) { this.crew.forEach(c => { if (c.id !== 'kleion' && this.flags.godBuff !== 'melas') { c.san -= amt; this.log(`⚠ ${c.name} 受到了精神打擊 (${reason})：SAN -${amt}`, "color:#b39ddb"); if (c.san <= 0 && !c.trauma) { c.san = 0; let newT = TRAUMA_DB[Math.floor(Math.random() * TRAUMA_DB.length)]; c.trauma = newT; this.log(`💀 警告！${c.name} 理智歸零，獲得創傷：【${newT.name}】！`, "color:var(--alert); font-weight:bold;"); } } }); this.renderCmds(); } };
        const events = [ 
            { t: "暴風雨", m: "遭遇強烈風暴！船體受損，疲勞上升。", f: () => { this.hp -= 15; this.fatigue += 15; if(this.unlockCodex) this.unlockCodex('storm'); } }, 
            { t: "海怪襲擊", m: "巨大觸手拍打船身！SAN 值大幅下降。", f: () => { applyGroupSanDamage(20, "海怪襲擊"); this.hp -= 5; if(this.unlockCodex) this.unlockCodex('kraken'); } }, 
            { t: "塞壬歌聲", m: "船員聽到詭異歌聲... 精神受到侵蝕。", f: () => { applyGroupSanDamage(25, "塞壬歌聲"); if(this.unlockCodex) this.unlockCodex('siren'); } }, 
            { t: "漂流物", m: "發現海上漂流的補給箱！獲得物資。", f: () => { this.food += 20; this.fuel += 10; } }, 
            { t: "濃霧", m: "迷失方向，消耗額外燃料。", f: () => { this.fuel -= 15; } }, 
            { t: "幽靈船", m: "遭遇古代幽靈船... 掠奪了部分資產。", f: () => { this.money = Math.max(0, this.money - 100); applyGroupSanDamage(10, "幽靈船"); if(this.unlockCodex) this.unlockCodex('ghost_ship'); } }, 
            { t: "發光水母", m: "迷人的深海生物，緩解了疲勞。", f: () => { this.fatigue = Math.max(0, this.fatigue - 20); if(this.unlockCodex) this.unlockCodex('jellyfish'); } }, 
            { t: "深海低語", m: "無法名狀的恐懼蔓延...", f: () => { applyGroupSanDamage(15, "深海低語"); } },
            { t: "機械故障", m: "船艙傳來刺耳的金屬摩擦聲！關鍵齒輪卡住了...", f: () => { let mechanic = this.crew.find(c => c.id === 'estrella' || c.id === 'costa'); if (mechanic) { this.log(`🔧 ${mechanic.name} 迅速更換了損壞的零件，船隻運轉正常。`, "color:var(--sonar)"); } else { this.fuel -= 15; this.hp -= 5; this.log("⚠ 無人懂得維修... 引擎受損且洩漏了燃料！(Fuel -15, HP -5)", "color:var(--alert)"); } } }
        ];
        let ev = events[Math.floor(Math.random() * events.length)]; this.log(`⚠️ 突發事件：${ev.t}`, "color:var(--alert); font-weight:bold;"); this.log(ev.m); ev.f(); this.updateUI();
    },
    visitLighthouse: function() { if(this.fuel < 10 || this.ap <= 0) { this.log("能源不足以偏航。"); return; } this.fuel -= 10; this.san = 100; this.ap--; this.log("抵達燈塔。SAN 值重置。"); this.renderDash(); if(this.ap <= 0) this.nextTurn(); },
    generateNodes: function() { if(this.bossMode) return; if(this.distLeft <= 0) return; this.currentNodes = []; if(typeof NODE_DB !== 'undefined') { for(let i=0; i<3; i++) { let randNode = NODE_DB[Math.floor(Math.random() * NODE_DB.length)]; this.currentNodes.push(randNode); } } if(this.renderNodes) this.renderNodes(); },
    selectNode: function(idx) {
        if(!this.currentNodes) return; let node = this.currentNodes[idx]; let oldDist = this.distLeft; this.currentNodes = null; this.renderNodes();
        let baseSanDrop = (this.upgrades.light ? 0 : 5); if (baseSanDrop > 0 && this.crew.length > 0) { let target = this.crew[Math.floor(Math.random() * this.crew.length)]; this.applySanDamage(target, baseSanDrop, "探索未知水域"); }
        this.renderCmds(); this.distLeft = Math.max(0, this.distLeft - (node.dist || 20)); this.log(`[航行] 駛入${node.name}，推進 ${node.dist} KM。`);
        if(node.type === 'storm') { 
            if(this.crew.find(c => c.id === 'carlota')) {
                this.log("卡洛特提前發現了風暴中心，成功規避了船體損傷！", "color:var(--sonar)");
            } else {
                this.hp -= 10; this.log("暴風雨造成船體受損！(HP-10)", "color:var(--alert)"); 
            }
        } 
        if(node.type === 'wreckage') { this.food += 10; this.fuel += 10; this.log("打撈到殘骸物資！"); }
        let encounterChance = (node.type === 'unknown') ? 0.6 : 0.1; let isEncounterTriggered = Math.random() < encounterChance; this.animateDist(oldDist, this.distLeft, 500);
        setTimeout(() => { if (isEncounterTriggered && typeof ENCOUNTER_DB !== 'undefined') { this.log("⚠ 雷達偵測到異常訊號！", "color:var(--alert)"); let enc = ENCOUNTER_DB[Math.floor(Math.random() * ENCOUNTER_DB.length)]; if(this.showEncounter) this.showEncounter(enc); else this.finishNodeAction(); } else { this.finishNodeAction(); } }, 600);
    },
    resolveEncounter: function(choiceIdx) { document.getElementById('encounter-modal').style.display = 'none'; let choice = this.currentEncounter.choices[choiceIdx]; this.log(`> 選擇了：${choice.text}`, "color:var(--gold)"); choice.action(); this.finishNodeAction(); },
    finishNodeAction: function() { this.renderDash(); if(this.distLeft > 0) { document.querySelectorAll('.cmd-btn').forEach(b => b.disabled = false); if (!this.bossMode) { this.nextTurn(); } else { this.generateNodes(); } } },
    triggerVictory: function() {
        this.isVoyaging = false; this.bossMode = false; this.mission = null; this.notify('BGM', { action: 'stop' }); this.log("🌊 巨浪平息，陽光穿透了烏雲...", "color:var(--gold); font-weight:bold; font-size:1.2rem;"); document.getElementById('sea-layer').classList.add('shake'); setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 1000);
        setTimeout(() => { this.notify('BGM', { audio: BGM_PORT }); this.notify('CHOICE_MODAL', { faceId: 'peter', speaker: '彼得', msg: '不可思議... 海面的濃霧真的散去了。你拯救了我們所有人。<br><br>那麼，你接下來有什麼打算？要留在這個重獲新生的小鎮，還是揚帆離開，繼續你的旅程？', choices: [ { text: '留在這裡生活', action: () => { this.closeModal(); this.notify('LOG', { msg: '你決定收起船錨，留在這個小鎮。陽光終於灑落在海面上...', style: 'color:var(--gold)' }); document.body.classList.add('theme-sunny'); this.flags.victory = true; this.refreshMissions(); document.getElementById('sea-layer').style.display = 'none'; document.getElementById('port-layer').style.display = 'flex'; this.updateUI(); this.switchMode('town'); } }, { text: '揚帆離開', action: () => { this.closeModal(); this.checkGameOver(true); } } ] }); }, 2000);
    },
    applySanDamage: function(targetCrew, amount, reason) {
        if (!targetCrew || targetCrew.id === 'kleion') return; if (this.flags && this.flags.godBuff === 'melas') return;
        if (this.inventory.includes('guardian_doll')) { amount = Math.ceil(amount * 0.5); if (Math.random() < 0.2) this.log(`🛡️ 守護玩偶抵擋了部分精神衝擊...`, "color:var(--gold); font-size:0.8rem;"); }
        if (this.flags.shrineBuff) { amount = Math.max(0, amount - 2); } // 海神庇護效果
        if (targetCrew.id === 'venator') amount = Math.ceil(amount * 0.5); // 維納托被動：SAN 傷害減半
        targetCrew.san -= amount; if (targetCrew.san < 0) targetCrew.san = 0; this.log(`⚠ ${targetCrew.name} 受到了精神打擊 (${reason})：SAN -${amount}`, "color:#b39ddb");
        if (targetCrew.san === 0 && !targetCrew.trauma) { const traumas = [ { id: 'paranoid', name: '被害妄想', desc: '行動時有 20% 機率陷入恐慌，拒絕執行指令。' }, { id: 'abyss_gaze', name: '深淵凝視', desc: '只要他在船上，深淵氣息蔓延，每回合全體疲勞額外 +5。' }, { id: 'hallucination', name: '嚴重幻聽', desc: '回合結束時，有 15% 機率用囈語干擾另一名船員 (SAN -10)。' }, { id: 'reckless', name: '狂躁破壞', desc: '完全失去理智，每次執行指令時會砸壞設備 (船體 HP -5)。' } ]; let newTrauma = traumas[Math.floor(Math.random() * traumas.length)]; targetCrew.trauma = newTrauma; this.log(`💀 警告！${targetCrew.name} 的理智歸零，獲得了永久創傷：【${newTrauma.name}】！`, "color:var(--alert); font-weight:bold;"); this.modal("system", "理智崩潰", `${targetCrew.name} 無法承受深淵的恐怖，精神徹底崩潰了。<br><br>獲得創傷特質：<b>【${newTrauma.name}】</b><br><span style="color:#aaa">${newTrauma.desc}</span><br><br><span style="color:var(--alert)">請盡快帶回小鎮尋找科絲塔治療！</span>`); if (typeof this.renderCmds === 'function') this.renderCmds(); }
    },
    damageAllSan: function(amount, reason) { if(this.crew.length === 0) return; this.crew.forEach(c => this.applySanDamage(c, amount, reason)); },
    healAllSan: function(amount) { this.crew.forEach(c => { if (c.id !== 'kleion') c.san = Math.min(c.maxSan, c.san + amount); }); },
    nextTurn: function() {
        this.addTime(1);
        this.crew.forEach(c => { if (c.trauma) { if (c.trauma.id === 'abyss_gaze') { this.fatigue += 5; this.notify('LOG', { msg: `👁️ ${c.name} 帶來的【深淵凝視】讓人不寒而慄... (全體疲勞 +5)`, style: "color:#b39ddb" }); } if (c.trauma.id === 'hallucination' && Math.random() < 0.15) { let others = this.crew.filter(x => x.id !== c.id); if (others.length > 0) { let victim = others[Math.floor(Math.random() * others.length)]; this.applySanDamage(victim, 10, `${c.name} 的瘋狂囈語`); } } } });
        let baseSanDrop = (this.upgrades.light ? 2 : 8); if (this.crew.length > 0 && !this.bossMode) { let victims = Math.floor(Math.random() * 2) + 1; for(let i = 0; i < victims; i++) { let target = this.crew[Math.floor(Math.random() * this.crew.length)]; this.applySanDamage(target, baseSanDrop, "深海環境壓迫"); } }
        if (this.bossMode && this.crew.length > 0) { let target = this.crew[Math.floor(Math.random() * this.crew.length)]; this.applySanDamage(target, 15, "克拉肯的凝視"); }
        if(this.upgrades.torpedo) this.ap = Math.min(3, this.ap + 1);
        this.activeCrises.forEach(c => c.penalty(this));
        // 🌟 新增：維修機器人效果
        if((this.inventory.includes('auto_bot') || this.warehouse.includes('auto_bot')) && Math.random() < 0.2) {
            this.hp = Math.min(100, this.hp + 5);
            this.notify('LOG', { msg: "🤖 維修機器人自動修復了船體 (HP+5)", style: "color:var(--sonar)" });
        }
        this.crew.forEach(c => c.hasActed = false); this.flags.crewActedThisTurn = false; this.selectedActorId = null;
        if (this.fatigue >= 100) { this.notify('ALERT', { msg: "⚠️ 疲勞度已達極限！船員們開始產生嚴重的幻覺..." }); this.damageAllSan(15, "極度疲勞的恐怖幻象"); }
        if (this.bossMode && this.bossHp > 0) {
            this.notify('LOG', { msg: "--- 克拉肯的回合 ---", style: "color:#555" }); document.getElementById('sea-layer').classList.add('shake'); setTimeout(() => document.getElementById('sea-layer').classList.remove('shake'), 600);
            if (!this.flags.bossPhase2 && this.bossHp < (this.bossMaxHp || 5000) * 0.5) { this.flags.bossPhase2 = true; this.notify('MODAL', { faceId: 'system', speaker: '警告', msg: '偵測到高能反應！克拉肯進入狂暴狀態！<br>攻擊頻率與傷害大幅提升！' }); }
            if (this.flags.dodgeNext) { this.notify('LOG', { msg: "💨 船隻靈巧地閃避了克拉肯的致命攻擊！", style: "color:var(--sonar); font-weight:bold;" }); this.flags.dodgeNext = false; } 
            else if (this.flags.bossCharging) { this.notify('ALERT', { msg: "🦑 克拉肯釋放了【深淵死光】！船體嚴重受損！" }); this.hp -= 50; this.damageAllSan(40, "深淵死光"); this.fatigue += 30; this.flags.bossCharging = false; } 
            else { let roll = Math.random(); let chargeChance = this.flags.bossPhase2 ? 0.3 : 0.15; if (roll < chargeChance) { this.flags.bossCharging = true; this.notify('ALERT', { msg: "⚠️ 克拉肯正在積蓄能量... (下回合釋放極大傷害！使用魚雷可打斷！)" }); } else { let attacks = BOSS_DATA.attacks; let attack = attacks[Math.floor(Math.random() * attacks.length)]; let mult = this.flags.bossPhase2 ? 1.5 : 1.0; this.notify('ALERT', { msg: `🦑 ${attack.msg}` }); attack.effect(this, mult); } }
            if (this.flags.bossPhase2 && !this.flags.bossCharging && this.bossHp > 0) { this.bossHp = Math.min(this.bossMaxHp, this.bossHp + 150); this.notify('LOG', { msg: "🦠 克拉肯的傷口正在癒合... (HP +150)", style: "color:#ef5350" }); document.getElementById('dist-display').innerText = Math.max(0, this.bossHp); }
        }
        // 平衡修正：降低每回合資源消耗 (15 -> 8)，避免初期難度過高
        let fatigueGain = this.crew.find(c => c.id === 'novian') ? 7 : 10;
        if (!this.bossMode) { this.fuel -= 8; this.food -= 8; } this.fatigue += fatigueGain;
        this.notify('LOG', { msg: `時間流逝... [${this.hour < 10 ? '0'+this.hour : this.hour}:00]` });
        if(!this.bossMode && typeof this.generateNodes === 'function') this.generateNodes(); 
        if (!this.bossMode) this.checkMelas();
        this.updateUI();
        if (this.hp <= 0) { this.triggerAbsoluteDeath('hp'); return; }
        if (this.san <= 0) { this.triggerAbsoluteDeath('san'); return; }
        if(this.fuel<=0 || this.food<=0) { if (typeof this.triggerFail === 'function') this.triggerFail(); else this.notify('MODAL', { faceId: "system", speaker: "警告", msg: "物資已耗盡！" }); } 
        else { this.renderDash(); if (this.distLeft > 0 || this.bossMode) { this.renderCmds(); } else { const actionGrid = document.getElementById('action-grid'); if(actionGrid) actionGrid.innerHTML = ''; } }
    },
    triggerArrival: function() {
        this.log("⚠️ 已抵達目標座標。請拋錨完成任務。", "color:var(--gold); font-weight:bold;"); document.getElementById('target-label').innerText = 'STATUS'; document.getElementById('dist-display').innerText = 'ARRIVED'; document.getElementById('dist-display').style.color = 'var(--gold)'; document.getElementById('target-unit').innerText = 'TARGET REACHED'; document.getElementById('btn-anchor').style.display = 'inline-block'; document.getElementById('radar-sweep').classList.add('fast'); 
        this.currentNodes = []; if(this.renderNodes) this.renderNodes(); const actionGrid = document.getElementById('action-grid'); if(actionGrid) actionGrid.innerHTML = '';
    },
    triggerFail: function() { this.log("⚠️ 嚴重警告：系統崩潰。呼叫緊急救援...", "color:var(--alert); font-weight:bold;"); setTimeout(() => { this.endVoyage(false); }, 1500); },
    endVoyage: function(success) {
        if(!this.mission) return; this.isVoyaging = false; document.getElementById('sea-layer').style.display = 'none'; document.getElementById('port-layer').style.display = 'flex'; this.playMusic(BGM_PORT); this.flags.godBuff = null; this.flags.shrineBuff = false;
        this.hour = parseInt(this.hour) || 0; this.day = parseInt(this.day) || 1; this.addTime(1); if(this.hour >= 22 || this.hour < 6) { this.fatigue += 20; }
        if(success) {
            let reward = this.mission.reward; if(this.crew.find(c=>c.id==='manmu')) reward = Math.floor(reward * 1.5); this.money += reward;
            // 🌟 新增：幸運金幣效果
            if(this.inventory.includes('lucky_coin') || this.warehouse.includes('lucky_coin')) { reward = Math.floor(reward * 1.2); this.money += (Math.floor(this.mission.reward * 0.2)); this.log("🪙 幸運金幣生效！獲得額外報酬。", "color:var(--gold)"); }
            if(this.mission.type === 'adora') { this.flags.adoraDone = true; if(this.inventory.length < this.inventoryMax) { this.inventory.push('guardian_doll'); this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。願它能在深淵中保護你。<br><br><span style='color:var(--gold)'>獲得道具：守護玩偶 (已放入背包)</span>"); } else if (this.warehouse.length < this.warehouseMax) { this.warehouse.push('guardian_doll'); this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。<br><br><span style='color:var(--gold)'>獲得道具：守護玩偶 (背包已滿，已放入倉庫)</span>"); } else { this.modal("adora", "阿朵菈", "謝謝... 這是『守護玩偶』。<br><br><span style='color:var(--alert)'>背包與倉庫都滿了，玩偶遺失了...</span>"); } } else { this.modal("hassel", "哈蘇", `任務完成。獲得 $${reward}。`); }
        } else { this.money -= 1000; this.fuel=20; this.food=20; this.san=50; this.hp=50; this.hour += 2; this.fatigue += 30; this.modal("system", "系統", "任務失敗。物資/船體極限。已被拖回港口，扣除救援費用 $1000。"); }
        this.mission = null; this.refreshMissions(); this.updateUI(); this.checkGameOver();
    },
    checkGameOver: function(isVictory = false) {
        if((!this.flags.victory && this.day > 10) || isVictory) {
            let title = "", msg = ""; if(isVictory) { title = "TRUE ENDING: 榮耀歸途"; msg = "S.S. 諾埃瑪號發射了深淵魚雷，炸碎了舊日的支配者。<br>你們衝破了風暴。<br>碼頭上，小鎮的所有人都來了。<br>這是一場屬於勝利者的慶功宴。"; } else { title = "BAD ENDING: 深淵葬禮"; msg = "第 10 天，諾埃瑪號未能承受住深淵的潮汐。<br>一切歸於沉寂。"; }
            this.modal("system", title, msg); setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar); padding:15px; font-size:1.1rem; font-weight:bold;" onclick="location.reload()">RESTART SYSTEM</button>`; }, 10);
        }
    },
    playVFX: function(id, type) { let btn = document.querySelector(`.cmd-btn[onclick*="'${id}'"]`); if(!btn) return; let vfx = document.createElement('div'); vfx.className = `vfx vfx-${type}`; btn.appendChild(vfx); setTimeout(() => vfx.remove(), 800); }
});
