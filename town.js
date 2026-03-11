if (typeof window.game === 'undefined') window.game = {};

Object.assign(window.game, {
    refreshMissions: function() {
        this.missions = [];
        if (this.day === 10 && !this.flags.victory) { this.missions.push({ title: '【決戰】深淵中心', area: '深淵 (Far)', dist: 0, reward: 0, time: 12, desc: '舊日支配者已甦醒。這是一條單行道。', type: 'boss', iconId: 'kraken' }); return; }
        this.missions.push(this.genOne('near')); this.missions.push(this.genOne('near'));
        if(this.day >= 3) { this.missions.push(this.genOne('mid')); }
        if(this.day >= 6) { this.missions.push(this.genOne('far')); }
        if(Math.random() < 0.25) { this.missions.push({title:'【緊急】失聯商船救援', area:'暗礁 (Mid)', dist:250, reward:4500, time:12, desc:'某財閥的高價懸賞，極度危險。', type:'emergency', iconId:'sos'}); }
        this.flags = this.flags || {};
        if (this.day === 5 && !this.flags.adoraDone) { this.missions.unshift({title:'阿朵菈的請求', area:'暗礁 (Mid)', dist:180, reward:2000, time:8, desc:'尋找失落的玩偶', type:'adora', iconId:'adora'}); }
    },
    genOne: function(tier) {
        const g = DB.generators; const issuer = g.issuers[Math.floor(Math.random()*g.issuers.length)]; const target = g.targets[Math.floor(Math.random()*g.targets.length)];
        let a='', d=0, r=0, t=0;
        if(tier==='near'){ a='淺灘'; d=80 + Math.floor(Math.random()*40); r=600; t=6; }
        else if(tier==='mid'){ a='暗礁'; d=180 + Math.floor(Math.random()*80); r=1800; t=14; }
        else if(tier==='far'){ a='深淵'; d=350 + Math.floor(Math.random()*150); r=4000; t=24; }
        return { title: `${issuer}：${target}`, area: a, dist: d, reward: r, time: t, desc: '標準公會發布之探勘/打撈任務。', type: 'normal', iconId: 'doc' };
    },
    acceptMission: function(idx) {
        let m = this.missions[idx]; let warnings = []; let maxRange = (this.fuel / 15) * 25; 
        if (m.dist > maxRange && m.type !== 'boss') warnings.push("「你的燃料絕對不夠跑這趟。這是自殺。」");
        if (m.type === 'boss' && !this.upgrades.torpedo) warnings.push("「沒有【深淵魚雷】去打克拉肯？你瘋了嗎？」");
        if (warnings.length > 0) {
            this.modal("hassel", "哈蘇", `[申請駁回]<br><br>${warnings.join('<br><br>')} <br><br><span style="color:var(--alert)">請確認要強行接取嗎？</span>`);
            let btnContainer = document.getElementById('modal-btn-container');
            if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--alert); color:var(--alert);" onclick="game.closeModal(); game.forceAccept(${idx})">我不在乎，強行接取</button><button class="tech-btn" style="width:auto; padding:10px 15px; border-color:var(--sonar); color:var(--sonar);" onclick="game.closeModal()">取消</button>`;
        } else { this.forceAccept(idx); }
    },
    forceAccept: function(idx) { this.mission = this.missions[idx]; this.openTab('guild'); this.log(`> 已成功接取委託：${this.mission.title}`, "color:var(--gold)"); },
    cancelMission: function() { if (this.mission) { this.missions.push(this.mission); this.mission = null; this.openTab('guild'); } },
    forceRefreshGuild: function() { 
        let cost = this.crew.find(c => c.id === 'nathanael') ? 25 : 50;
        if (this.money >= cost) { this.money -= cost; this.refreshMissions(); this.log(`📜 花費 $${cost} 拜託公會釋出了新的委託情報。`, "color:var(--gold)"); this.updateUI(); this.openTab('guild'); } 
        else { this.modal("system", "警告", "資金不足，公會人員拒絕為你翻找新情報。"); } 
    },
    
    confirmUpgrade: function(type, cost) {
        if (type === 'crew' && this.crewMax >= 8) return; if (type === 'food' && this.maxFood >= 300) return; if (type === 'fuel' && this.maxFuel >= 300) return; if (this.upgrades[type] === true) return;
        if (this.money < cost) { this.modal("peter", "彼得", "資金不足。"); return; }
        const names = { light: '探照燈', armor: '強化裝甲', torpedo: '深淵魚雷', crew: '船員艙擴充', food: '糧倉擴充', fuel: '能源箱擴充' };
        this.notify('CHOICE_MODAL', { faceId: 'peter', speaker: '彼得', msg: `確定要購買【${names[type]}】嗎？<br>這將花費你 <span style="color:var(--gold)">$${cost}</span>。`, choices: [ { text: '確定購買', action: () => { this.closeModal(); this.upgrade(type, cost); } }, { text: '再想想', action: () => { this.closeModal(); } } ] });
    },
    upgrade: function(type, cost) {
        if (type === 'crew' && this.crewMax >= 8) return; if (type === 'food' && this.maxFood >= 300) return; if (type === 'fuel' && this.maxFuel >= 300) return;
        if(this.money < cost) { this.modal("peter", "彼得", "資金不足。"); return; }
        this.money -= cost;
        if(type==='crew') this.crewMax = Math.min(8, this.crewMax+1); else if(type==='food') this.maxFood += 50; else if(type==='fuel') this.maxFuel += 50; else this.upgrades[type] = true;
        this.updateUI(); this.openTab('hall');
    },
    buy: function(type) {
        let cost = type==='hp'?200:(type==='food'?150:100);
        if(this.money < cost) { this.modal("lynn", "林恩", "沒錢免談。"); return; }
        this.money -= cost;
        this.maxHp = this.maxHp || 100; // 確保 maxHp 存在
        if(type==='fuel') this.fuel = this.maxFuel; if(type==='food') this.food = this.maxFood; if(type==='hp') this.hp = this.maxHp;
        this.updateUI();
    },
    buyQuantity: function(type, amount, price) {
        amount = parseInt(amount); let totalCost = amount * price; if (amount <= 0) return;
        this.maxHp = this.maxHp || 100; // 確保 maxHp 存在
        if (this.money >= totalCost) { this.money -= totalCost; if (type === 'fuel') this.fuel = Math.min(this.maxFuel, this.fuel + amount); if (type === 'food') this.food = Math.min(this.maxFood, this.food + amount); if (type === 'hp') this.hp = Math.min(this.maxHp, this.hp + amount); this.log(`🛒 購買了 ${amount} 單位物資，花費 $${totalCost}。`, "color:var(--sonar)"); this.updateUI(); this.openTab('store'); }
    },
    
    refreshTavern: function() { this.tavernMercs = []; const pool = [...DB.mercs]; for(let i=0; i<4; i++) { if(!pool.length) break; let idx = Math.floor(Math.random()*pool.length); this.tavernMercs.push(pool[idx]); pool.splice(idx,1); } },
    forceRefreshTavern: function() { 
        let cost = this.crew.find(c => c.id === 'nathanael') ? 25 : 50;
        if (this.money >= cost) { this.money -= cost; this.refreshTavern(); this.log(`🍻 花費 $${cost} 請酒保打聽了新的傭兵情報。`, "color:var(--gold)"); this.updateUI(); this.openTab('tavern'); } 
        else { this.modal("system", "警告", "資金不足，酒保不想理你。"); } 
    },
    hire: function(id) {
        if(this.crew.length >= this.crewMax) { this.modal("lilith", "莉莉絲", "船艙已滿。"); return; }
        const m = DB.mercs.find(x=>x.id===id); if(this.money < m.cost) { this.modal("lilith", "莉莉絲", "錢不夠。"); return; }
        this.money -= m.cost; this.crew.push(m); this.updateUI(); this.openTab('tavern');
    },
    dismissCrew: function(id) {
        if (DB.coreCrew.find(x => x.id === id)) { alert("核心成員無法解僱！"); return; }
        if (confirm("確定要解僱這位船員嗎？\n(他可能會回到酒館，也可能就此離開)")) { this.crew = this.crew.filter(x => x.id !== id); this.closeModal(); this.updateUI(); if (document.getElementById('port-layer').style.display !== 'none') this.openTab('crew'); if (document.getElementById('sea-layer').style.display !== 'none') this.renderCmds(); }
    },
    
    rest: function(type = 'long') {
        // 優化：按人頭收費
        let count = this.crew.length;
        if (count === 0) { this.modal("system", "提示", "你沒有船員需要休息。"); return; }
        let perHead = type === 'long' ? 40 : 15;
        let cost = perHead * count;

        if(this.money >= cost) {
            this.money -= cost;
            if (type === 'long') { this.fatigue = Math.max(0, this.fatigue - 50); this.crew.forEach(c => { if (c.id !== 'kleion' && !c.trauma) c.san = Math.min(c.maxSan, c.san + 30); }); this.hour = parseInt(this.hour) || 0; let addH = (24 - this.hour + 8) % 24; if(addH === 0) addH = 24; if (this.addTime) this.addTime(addH); this.log(`🛏️ 全員(${count}人)在旅館休息了一夜，花費 $${cost}。`, "color:var(--sonar)"); this.modal("costa", "科絲塔", "早安，BATA。希望你們昨晚睡得安穩。"); } 
            else { this.fatigue = Math.max(0, this.fatigue - 20); this.crew.forEach(c => { if (c.id !== 'kleion' && !c.trauma) c.san = Math.min(c.maxSan, c.san + 10); }); if (this.addTime) this.addTime(2); this.log(`☕ 全員(${count}人)短暫休息了兩小時，花費 $${cost}。`, "color:var(--sonar)"); this.modal("costa", "科絲塔", "喝點熱茶吧，深淵的風是很冷的。"); }
            this.updateUI(); this.openTab('inn');
        } else { this.modal("system", "警告", `資金不足 (需要 $${cost})，科絲塔面有難色。`); }
    },
    cureTrauma: function(crewId) {
        if (this.money >= 300) { let c = this.crew.find(x => x.id === crewId); if (c && c.trauma) { this.money -= 300; let oldTrauma = c.trauma.name; c.trauma = null; c.san = c.maxSan; this.log(`💉 花費 $300 治癒了 ${c.name} 的心理創傷【${oldTrauma}】。`, "color:var(--sonar)"); this.updateUI(); this.openTab('inn'); } } 
        else { this.modal("system", "警告", "資金不足以進行高階心理治療。"); }
    },
    
    buyRod: function() {
        // 如果玩家已擁有且未損壞，則不允許購買
        if ((this.warehouse.includes('fishing_rod') || this.inventory.includes('fishing_rod')) && this.flags.rodDurability > 0) {
            this.modal("system", "提示", "你已經擁有可用的釣竿了。"); return;
        }
        // 優化：如果是替換舊釣竿，不需要檢查倉庫空間；如果是新購，則檢查
        let hasRod = this.warehouse.includes('fishing_rod') || this.inventory.includes('fishing_rod');
        if (!hasRod && this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "倉庫已滿！無法購買。"); return; }

        if(this.money >= 150) {
            this.money -= 150;
            // 優化：購買新釣竿時，自動放入舊釣竿所在的位置（背包或倉庫）
            let target = this.inventory.includes('fishing_rod') ? 'inventory' : 'warehouse';
            let whIdx = this.warehouse.indexOf('fishing_rod'); if (whIdx > -1) this.warehouse.splice(whIdx, 1);
            let invIdx = this.inventory.indexOf('fishing_rod'); if (invIdx > -1) this.inventory.splice(invIdx, 1);

            if (target === 'inventory') this.inventory.push('fishing_rod'); else this.warehouse.push('fishing_rod');
            this.flags.rodDurability = 10; // 重置耐久度
            this.log(`💰 購買了新的初級釣竿！(已放入${target === 'inventory' ? '背包' : '倉庫'})`);
            this.updateUI(); this.openTab('store');
        } else { this.modal("system", "警告", "資金不足。"); }
    },
    buyBait: function() { if(this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "倉庫已滿！無法購買。"); return; } if(this.money >= 20) { this.money -= 20; this.warehouse.push('bait'); this.log("💰 購買了特製魚餌！(已放入倉庫)"); this.updateUI(); this.openTab('store'); } else { this.modal("system", "警告", "資金不足。"); } },
    buyNet: function() { 
        if(this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "倉庫已滿！無法購買。"); return; } 
        if(this.money >= 120) { 
            this.money -= 120; 
            this.warehouse.push('fishing_net'); 
            this.log("💰 購買了捕魚網！(已放入倉庫)"); 
            this.updateUI(); this.openTab('store'); 
        } else { this.modal("system", "警告", "資金不足。"); } 
    },
    
    startFishing: function() {
        if(!this.inventory.includes('fishing_rod')) { this.modal("system", "缺少裝備", "你必須將 <span style='color:var(--sonar)'>釣竿</span> 放入【船上背包】才能開始釣魚。"); return; }
        if(this.flags.rodDurability <= 0) { this.modal("system", "裝備損壞", "你的釣竿已經損壞，無法使用。<br>請前往商店購買新的。"); return; }
        if(this.fatigue >= 100) { this.modal("system", "體力透支", "你已經累得連釣竿都拿不穩了...<br>請先去休息。"); return; }
        
        // 優化：港口釣魚同時檢查倉庫和背包
        let baitLoc = 'warehouse';
        let baitIdx = this.warehouse.indexOf('bait');
        if (baitIdx === -1) { baitIdx = this.inventory.indexOf('bait'); baitLoc = 'inventory'; }
        if (baitIdx === -1) { this.modal("system", "缺少魚餌", "沒有魚餌了！<br>請檢查倉庫或背包，或前往商店購買。"); return; }
        
        if (baitLoc === 'warehouse') this.warehouse.splice(baitIdx, 1); else this.inventory.splice(baitIdx, 1);

        // 更新 UI 狀態
        this.updateUI();
        const btn = document.getElementById('fish-btn'); 
        const msg = document.getElementById('fish-msg'); 
        if(btn) { btn.disabled = true; btn.innerText = "等待中..."; btn.onclick = null; }
        if(msg) { msg.innerText = "海面微波蕩漾... 專注看著浮標..."; msg.style.color = "#aaa"; }

        let waitTime = 2000 + Math.random() * 2500;
        
        // 清除舊的計時器以防萬一
        if (this.flags.fishingTimer) clearTimeout(this.flags.fishingTimer);
        if (this.flags.fishingFailTimer) clearTimeout(this.flags.fishingFailTimer);

        this.flags.fishingTimer = setTimeout(() => {
            // 檢查玩家是否還在釣魚介面，如果已經切換分頁則取消
            const currentBtn = document.getElementById('fish-btn');
            const currentMsg = document.getElementById('fish-msg');
            if (!currentBtn) { this.flags.isBiting = false; return; }
            
            if(currentMsg) { currentMsg.innerText = "❗ 浮標沉下去了！快拉！"; currentMsg.style.color = "var(--alert)"; currentMsg.style.fontWeight = "bold"; }
            currentBtn.disabled = false; currentBtn.innerText = "💥 猛力收線！"; this.flags.isBiting = true;
            
            this.flags.fishingFailTimer = setTimeout(() => { 
                if(this.flags.isBiting && document.getElementById('fish-btn')) { 
                    this.flags.isBiting = false; this.flags.rodDurability--; 
                    if (this.flags.rodDurability <= 0) { this.log("你的釣竿斷裂了！", "color:var(--alert)"); let rodIdx = this.inventory.indexOf('fishing_rod'); if (rodIdx > -1) this.inventory.splice(rodIdx, 1); } 
                    this.addTime(1); this.fatigue += 5; this.updateUI(); this.openTab('port'); this.log("魚跑掉了... (釣竿耐久度 -1, 疲勞 +5)", "color:#777"); 
                } 
            }, 1000);
            
            currentBtn.onclick = () => {
                if(this.flags.isBiting) {
                    this.flags.isBiting = false; if(this.flags.fishingFailTimer) clearTimeout(this.flags.fishingFailTimer);
                    this.flags.rodDurability--; if (this.flags.rodDurability <= 0) { this.log("你的釣竿斷裂了！", "color:var(--alert)"); let rodIdx = this.inventory.indexOf('fishing_rod'); if (rodIdx > -1) this.inventory.splice(rodIdx, 1); }
                    this.addTime(1); this.fatigue += 5; this.updateUI();
                    
                    // 修正：使用港口(Coast)專屬漁獲池
                    let pool = FISHING_ZONES['coast'].fish;
                    let catchId = pool[Math.floor(Math.random() * pool.length)]; this.warehouse.push(catchId); let f = ITEM_DB[catchId];
                    let logStyle = catchId === 'trash' ? "color:#777" : "color:var(--sonar)";
                    let extraMsg = catchId === 'trash' ? " (港口的垃圾真多...也許該出海了)" : "";
                    this.codex = this.codex || []; if (!this.codex.includes(catchId)) { this.codex.push(catchId); this.log(`✨ 解鎖了新的漁獲：${f.icon} ${f.name}！(疲勞 +5)`, "color:var(--gold)"); } else { this.log(`🎣 釣到了 ${f.icon} ${f.name}！${extraMsg} (已放入倉庫, 疲勞 +5)`, logStyle); }
                    this.modal("none", "釣魚成功", `<div style="text-align:center;"><div style="font-size:4rem; margin:10px 0;">${f.icon}</div><div style="font-size:1.2rem; color:var(--gold); font-weight:bold;">${f.name}</div><div style="color:#aaa; font-size:0.9rem; margin-top:5px;">${f.desc}</div><div style="margin-top:15px; color:var(--sonar); font-size:0.8rem;">(已放入小鎮倉庫)</div></div>`); this.openTab('port'); 
                }
            };
        }, waitTime);
    },
    
    // --- 新增：出航捕魚系統 ---
    openFishingSelect: function() {
        if(!this.inventory.includes('fishing_rod')) { this.modal("system", "提示", "你必須將釣竿放在【船上背包】才能出航捕魚。"); return; }
        if(this.flags.rodDurability <= 0) { this.modal("system", "提示", "你的釣竿已經損壞，無法出航。<br>請先在商店購買新的。"); return; }
        
        // 優化：出航前檢查是否有耗材 (魚餌或網子)，避免出海後無法作業
        if (!this.inventory.includes('bait') && !this.inventory.includes('fishing_net')) {
            this.modal("system", "缺少耗材", "你的【船上背包】內沒有魚餌或捕魚網。<br>出航後將無法捕魚。<br>請先從倉庫轉移物資。");
            return;
        }

        let html = `<div style="max-height:60vh; overflow-y:auto; padding:5px;"><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:15px;">`;
        Object.values(FISHING_ZONES).forEach(z => {
            let fuelReq = z.fuelCost * 2; // 來回預估
            let canGo = this.fuel >= fuelReq && this.food >= z.timeCost * 2;
            let btnStyle = canGo ? 'border-color:var(--sonar); color:var(--sonar);' : 'border-color:#555; color:#777; cursor:not-allowed;';
            let action = canGo ? `game.launchFishing('${z.id}')` : '';
            let weather = WEATHER_TYPES[z.weather] || {icon:'?', name:'未知'};
            html += `<div class="tech-card" style="${btnStyle} display:flex; flex-direction:column; height:100%;">
                <div class="card-header"><span class="card-title">${z.name}</span><span style="font-size:0.9rem;">${weather.icon} ${weather.name}</span></div>
                <div class="card-body" style="flex:1;">
                    <div>${z.desc}</div>
                    <div style="margin-top:10px; font-size:0.85rem; border-top:1px dashed #333; padding-top:5px;">
                        <div>危險指數: <span style="color:var(--alert)">${z.danger}%</span></div>
                        <div>⏱ 單程耗時: ${z.timeCost} 小時</div>
                        <div>⛽ 單程油耗: ${z.fuelCost} (來回需 ${fuelReq})</div>
                    </div>
                </div>
                <button class="tech-btn" style="margin-top:10px; ${btnStyle}" onclick="${action}" ${canGo?'':'disabled'}>${canGo ? '出航捕魚' : '物資不足'}</button>
            </div>`;
        });
        html += `</div></div>`;
        this.modal("none", "選擇捕魚海域", html);
    },

    launchFishing: function(zoneId) {
        const zone = FISHING_ZONES[zoneId];
        this.closeModal();
        
        // 優化：新增過場效果
        this.showTransition(`正在前往 ${zone.name}...`, () => {
            this.fuel -= zone.fuelCost;
            this.food -= Math.floor(zone.timeCost * 2); 
            this.fatigue = Math.min(100, this.fatigue + zone.timeCost * 2);
            this.addTime(zone.timeCost);
            this.currentFishingZone = zone;
            this.log(`🚢 抵達了 ${zone.name}。消耗燃油 ${zone.fuelCost}，經過 ${zone.timeCost} 小時。`, "color:var(--sonar)");
            
            // 切換到全新的捕魚 UI
            this.enterFishingMode();
            this.checkFishingFail();
        });
    },

    fishAtSpot: function(spotId) {
        // 顯示工具選擇選單
        let rodDur = this.flags.rodDurability || 0;
        let netCount = this.inventory.filter(i => i === 'fishing_net').length;
        
        let html = `<div style="display:flex; flex-direction:column; gap:15px;">
            <div class="tech-card" style="border-color:var(--sonar); cursor:pointer;" onclick="game.startVoyageRodFishing('${spotId}')">
                <div class="card-header"><span class="card-title">🎣 使用釣竿</span></div>
                <div class="card-body">
                    需消耗體力與時間，進行收線小遊戲。<br>
                    <span style="color:${rodDur>0?'var(--sonar)':'var(--alert)'}">耐久度: ${rodDur}/10</span>
                </div>
            </div>
            <div class="tech-card" style="border-color:var(--gold); cursor:pointer;" onclick="game.useNetAtSpot('${spotId}')">
                <div class="card-header"><span class="card-title">🕸️ 使用捕魚網</span></div>
                <div class="card-body">
                    瞬間捕獲，有機率獲得<b>雙倍漁獲</b>。<br>
                    <span style="color:${netCount>0?'var(--gold)':'#777'}">持有數量: ${netCount}</span>
                </div>
            </div>
        </div>`;
        this.modal("none", `選擇捕魚工具 (${spotId})`, html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>`; }, 10);
    },

    startVoyageRodFishing: function(spotId) {
        this.closeModal();
        if(this.fatigue >= 100 || this.fuel <= 0 || this.food <= 0) { this.checkFishingFail(); return; }
        if(!this.inventory.includes('fishing_rod')) { 
            this.modal("system", "裝備缺失", "釣竿不在背包中！<br>請先將釣竿放入船上背包。"); 
            return; 
        }
        if(this.flags.rodDurability <= 0) { 
            this.modal("system", "裝備損壞", "釣竿已損壞！無法繼續釣魚。"); 
            return; 
        }

        // 優化：下竿前先檢查背包空間
        if (this.inventory.length >= this.inventoryMax) { this.modal("system", "背包已滿", "你的背包已滿，無法容納新的漁獲。<br>請先整理背包。"); return; }

        // 優化：出航時檢查背包內的魚餌
        let baitIdx = this.inventory.indexOf('bait');
        if (baitIdx === -1) { this.modal("system", "缺少魚餌", "背包內沒有魚餌！無法下竿。<br>出航時無法使用倉庫物資。"); return; }
        this.inventory.splice(baitIdx, 1);
        this.updateUI();

        // 🌟 判定隨機危險事件
        if (this.triggerFishingEvent()) return;

        // 互動式釣魚 UI (Modal)
        this.modal("none", `🎣 ${spotId} 垂釣中...`, 
            `<div style="text-align:center; padding:20px;">
                <div id="exp-fish-msg" style="font-size:1.1rem; color:#aaa; margin-bottom:15px;">海面平靜... 等待魚兒上鉤...</div>
                <div style="font-size:3rem; margin-bottom:20px;" id="exp-fish-icon">🌊</div>
            </div>`);
        
        // 注入按鈕
        const btnContainer = document.getElementById('modal-btn-container');
        if(btnContainer) btnContainer.innerHTML = `<button id="exp-fish-btn" class="tech-btn" style="width:100%; padding:15px; font-size:1.2rem; border-color:#555; color:#777;" disabled>等待中...</button>`;

        let waitTime = 2000 + Math.random() * 2500;
        if (this.flags.fishingTimer) clearTimeout(this.flags.fishingTimer);
        if (this.flags.fishingFailTimer) clearTimeout(this.flags.fishingFailTimer);

        this.flags.fishingTimer = setTimeout(() => {
            const btn = document.getElementById('exp-fish-btn');
            const msg = document.getElementById('exp-fish-msg');
            const icon = document.getElementById('exp-fish-icon');

            if (!btn) { this.flags.isBiting = false; return; }

            if(msg) { msg.innerText = "❗ 浮標沉下去了！快拉！"; msg.style.color = "var(--alert)"; msg.style.fontWeight = "bold"; }
            if(icon) { icon.innerText = "❗"; icon.style.animation = "blink 0.2s infinite"; }
            
            btn.disabled = false; btn.style.borderColor = "var(--alert)"; btn.style.color = "var(--alert)"; btn.innerText = "💥 猛力收線！";
            this.flags.isBiting = true;

            this.flags.fishingFailTimer = setTimeout(() => {
                if (this.flags.isBiting && document.getElementById('exp-fish-btn')) {
                    this.flags.isBiting = false; this.flags.rodDurability--;
                    this.addTime(1); this.fatigue += 5;
                    this.log("魚跑掉了... (疲勞+5, 耐久-1)", "color:#777");
                    this.closeModal(); this.updateUI();
                }
            }, 1000);

            btn.onclick = () => {
                if (this.flags.isBiting) {
                    this.flags.isBiting = false; if(this.flags.fishingFailTimer) clearTimeout(this.flags.fishingFailTimer);
                    this.handleFishingSuccess(spotId);
                }
            };
        }, waitTime);
    },

    useNetAtSpot: function(spotId) {
        this.closeModal();
        let netIdx = this.inventory.indexOf('fishing_net');
        if (netIdx === -1) { 
            this.modal("system", "裝備缺失", "背包內沒有捕魚網！"); 
            return; 
        }
        
        // 優化：撒網前先檢查背包空間
        if (this.inventory.length >= this.inventoryMax) { this.modal("system", "背包已滿", "你的背包已滿，無法容納新的漁獲。<br>請先整理背包。"); return; }

        // 消耗
        this.inventory.splice(netIdx, 1);
        this.addTime(1);
        this.fatigue += 3; // 網捕比較輕鬆
        this.food -= 1;
        
        // 🌟 判定隨機危險事件 (漁網也會觸發)
        if (this.triggerFishingEvent()) { this.updateUI(); this.renderFishingDash(); return; }

        // 漁獲池
        let pool = this.currentFishingZone.fish;
        if (this.currentFishingZone.weather === 'RAIN') pool = [...pool, ...pool.filter(f => f !== 'trash')];
        else if (this.currentFishingZone.weather === 'STORM') pool = [...pool, 'trash', 'trash'];

        // 雙倍判定
        let catchCount = Math.random() < 0.4 ? 2 : 1;
        let results = [];
        
        for(let i=0; i<catchCount; i++) {
            let catchId = pool[Math.floor(Math.random() * pool.length)];
            results.push(catchId);
            if (this.inventory.length < this.inventoryMax) this.inventory.push(catchId);
            this.codex = this.codex || []; if (!this.codex.includes(catchId)) this.codex.push(catchId);
        }
        
        let msg = "";
        if (results.length > 0) {
            let f1 = ITEM_DB[results[0]]; msg = `捕獲了 ${f1.name}`;
            if (results.length > 1) { let f2 = ITEM_DB[results[1]]; msg += ` 和 ${f2.name}！ (雙倍收穫)`; } else { msg += "！"; }
            this.log(`🕸️ ${msg}`, "color:var(--gold)");
            this.modal("none", "捕魚成功", `<div style="text-align:center; font-size:1.2rem; color:var(--gold);">${msg}</div>`);
        }
        this.updateUI(); this.renderFishingDash(); this.checkFishingFail();
    },

    handleFishingSuccess: function(spotId) {
        this.flags.rodDurability--;
        if (this.flags.rodDurability <= 0) { this.log("你的釣竿斷裂了！", "color:var(--alert)"); let rodIdx = this.inventory.indexOf('fishing_rod'); if (rodIdx > -1) this.inventory.splice(rodIdx, 1); }

        this.addTime(1);
        this.fatigue += (5 + Math.floor(this.currentFishingZone.danger / 5));
        this.food -= 2;

        let pool = this.currentFishingZone.fish;
        if (this.currentFishingZone.weather === 'RAIN') pool = [...pool, ...pool.filter(f => f !== 'trash')];
        else if (this.currentFishingZone.weather === 'STORM') pool = [...pool, 'trash', 'trash'];

        let catchId = pool[Math.floor(Math.random() * pool.length)];
        
        let f = ITEM_DB[catchId];
        if (this.inventory.length < this.inventoryMax) {
            this.inventory.push(catchId);
            this.log(`🎣 在${spotId}釣到了 ${f.icon} ${f.name}！(已入背包)`, "color:var(--gold)");
            
            const msg = document.getElementById('exp-fish-msg');
            const icon = document.getElementById('exp-fish-icon');
            const btnContainer = document.getElementById('modal-btn-container');
            
            if(msg && icon && btnContainer) {
                icon.style.animation = "none"; icon.innerHTML = f.icon;
                msg.innerHTML = `<span style="color:var(--gold)">釣到了 ${f.name}！</span><br><span style="font-size:0.8rem; color:#aaa;">${f.desc}</span>`;
                btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar);" onclick="game.closeModal()">收下漁獲</button>`;
            } else { this.closeModal(); }
        } else {
            this.log(`🎣 釣到了 ${f.name}，但背包已滿，不得不放生...`, "color:#777");
            this.closeModal();
        }
        
        this.codex = this.codex || []; if (!this.codex.includes(catchId)) this.codex.push(catchId);
        this.updateUI(); this.renderFishingDash(); this.checkFishingFail();
    },

    returnFromFishing: function() {
        const zone = this.currentFishingZone;
        if (this.fuel < zone.fuelCost) {
            this.log("⛽ 燃料不足以返航！", "color:var(--alert)");
            this.checkFishingFail(); // 觸發救援
            return;
        }
        
        // 優化：新增過場效果
        this.showTransition("正在返回港口...", () => {
            this.fuel -= zone.fuelCost;
            this.fatigue = Math.min(100, this.fatigue + zone.timeCost * 2);
            this.addTime(zone.timeCost);
            this.currentFishingZone = null;
            
            // 退出捕魚 UI
            document.getElementById('fishing-layer').style.display = 'none';
            document.getElementById('port-layer').style.display = 'flex';
            
            this.updateUI();
            this.switchMode('town');
            this.openTab('port');
            this.log(`⚓ 平安返回港口。`, "color:var(--sonar)");
        });
    },

    // --- 新增：進入捕魚模式 UI ---
    enterFishingMode: function() {
        document.getElementById('port-layer').style.display = 'none';
        document.getElementById('fishing-layer').style.display = 'flex';
        
        const z = this.currentFishingZone;
        const container = document.getElementById('fishing-map-container');
        
        // 背景色調
        let bgGradient = 'radial-gradient(circle, #001e3c 0%, #000 90%)';
        if(z.id === 'shallows') bgGradient = 'radial-gradient(circle, #006064 0%, #000 90%)';
        if(z.id === 'reef') bgGradient = 'radial-gradient(circle, #1b5e20 0%, #000 90%)';
        if(z.id === 'abyss') bgGradient = 'radial-gradient(circle, #311b92 0%, #000 90%)';
        
        container.style.background = bgGradient;

        let spotsHtml = '';
        const positions = [{x:200, y:200}, {x:500, y:150}, {x:350, y:400}];
        z.spots.forEach((spot, idx) => {
            let pos = positions[idx] || {x:400, y:300};
            spotsHtml += `<g class="building-group" transform="translate(${pos.x}, ${pos.y})" onclick="game.fishAtSpot('${spot.name}')" style="cursor:pointer;">
                <circle r="40" fill="rgba(255,255,255,0.1)" stroke="var(--sonar)" stroke-width="2" class="map-building"/>
                <text y="60" fill="#fff" text-anchor="middle" font-size="16" font-weight="bold">${spot.name}</text>
                <text y="0" fill="var(--sonar)" text-anchor="middle" font-size="24">🎣</text>
            </g>`;
        });

        container.innerHTML = `<div class="scanline"></div><div style="position:absolute; top:20px; left:20px; z-index:20; color:#fff; font-size:1.5rem; font-weight:bold; text-shadow:0 0 10px var(--sonar);">🌊 ${z.name} <span style="font-size:1rem; color:#aaa;">(危險度: ${z.danger}%)</span></div><div class="map-layer"><svg viewBox="0 0 800 600"><defs><pattern id="grid-fish" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid-fish)" />${spotsHtml}</svg></div>`;
        
        this.renderFishingDash();
        // 啟用拖曳縮放
        setTimeout(() => { if(this.initMapControls) this.initMapControls(document.querySelector('#fishing-map-container svg')); }, 50);
    },

    renderFishingDash: function() {
        const setBar = (id, val, max) => {
            const el = document.getElementById(id); const txt = document.getElementById(id + '-txt');
            if(el) el.style.width = Math.min(100, Math.max(0, (val / max) * 100)) + '%';
            if(txt) txt.innerText = `${Math.floor(val)}/${max}`;
        };
        setBar('fish-bar-fuel', this.fuel, this.maxFuel);
        setBar('fish-bar-food', this.food, this.maxFood);
        setBar('fish-bar-fat', this.fatigue, 100);
    },

    // --- 新增：隨機危險事件 ---
    triggerFishingEvent: function() {
        let danger = this.currentFishingZone.danger;
        if (this.currentFishingZone.weather === 'STORM') danger += 20;
        
        // 基礎觸發率：危險度 * 0.5 (例如深淵 60 -> 30% 機率)
        if (Math.random() * 100 < danger * 0.5) {
            const events = [
                { msg: "🌊 突發大浪衝擊船體！", dmg: "(HP -10, 疲勞 +5)", effect: () => { this.hp -= 10; this.fatigue += 5; } },
                { msg: "🦑 巨大觸手拍打水面！", dmg: "(HP -15, SAN -10)", effect: () => { this.hp -= 15; this.san -= 10; } },
                { msg: "👻 聽見了溺水者的尖叫...", dmg: "(SAN -15)", effect: () => { this.san -= 15; } },
                { msg: "🦈 兇猛的鯊魚撞擊船底！", dmg: "(HP -8)", effect: () => { this.hp -= 8; } },
                { msg: "🌫️ 突然飄來一陣毒霧...", dmg: "(疲勞 +15, SAN -5)", effect: () => { this.fatigue += 15; this.san -= 5; } }
            ];
            let ev = events[Math.floor(Math.random() * events.length)];
            ev.effect();
            this.log(`⚠ 警告：${ev.msg} ${ev.dmg}`, "color:var(--alert)");
            this.modal("system", "危險遭遇", `<div style="color:var(--alert); font-size:1.2rem;">${ev.msg}</div><div style="margin-top:10px; color:#ff5252;">${ev.dmg}</div>`);
            return true; // 觸發了事件
        }
        return false;
    },

    // 新增：過場動畫輔助函式
    showTransition: function(text, callback) {
        let overlay = document.getElementById('transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'transition-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;display:flex;align-items:center;justify-content:center;color:var(--sonar);font-size:1.5rem;opacity:0;transition:opacity 0.5s;pointer-events:none;';
            document.body.appendChild(overlay);
        }
        overlay.innerText = text;
        overlay.style.opacity = '1';
        setTimeout(() => {
            callback();
            setTimeout(() => { overlay.style.opacity = '0'; }, 500);
        }, 1000);
    },

    checkFishingFail: function() {
        if (this.fuel <= 0 || this.food <= 0 || this.fatigue >= 100) {
            let reason = this.fatigue >= 100 ? "船員過度疲勞昏迷" : "物資耗盡";
            this.modal("system", "緊急救援", `⚠ ${reason}！<br>你們發出了求救訊號，被拖回了港口。<br><br><span style="color:var(--alert)">支付救援費 $500</span>`);
            this.money = Math.max(0, this.money - 500);
            this.fuel = Math.max(10, this.fuel); // 給一點點油
            this.food = Math.max(10, this.food);
            this.fatigue = 80; // 還是很累
            this.currentFishingZone = null;
            this.switchMode('town');
            document.getElementById('fishing-layer').style.display = 'none';
            document.getElementById('port-layer').style.display = 'flex';
            this.openTab('port');
        }
    },

    findFishBuyer: function() {
        let fishCounts = {}; this.warehouse.forEach(id => { if(ITEM_DB[id] && ITEM_DB[id].type === 'fish') fishCounts[id] = (fishCounts[id] || 0) + 1; });
        if(Object.keys(fishCounts).length === 0) { this.modal("system", "提示", "你的倉庫裡沒有任何漁獲可以賣。"); return; }
        this.addTime(0.5); this.updateUI();
        let roll = Math.random(); let buyerId = 'lynn'; let multiplier = 0.8; if (roll < 0.10) { buyerId = 'seagod'; multiplier = 3.0; } else if (roll < 0.40) { buyerId = 'melas'; multiplier = 1.5; } 
        const buyer = DB.npc[buyerId]; let msg = ""; if (buyerId === 'seagod') msg = `「哇！是你釣到的嗎！好漂亮的魚，我想全部買下來給大黑看！給你 3 倍的價錢！」`; else if (buyerId === 'melas') msg = `「呵呵... 居然能在這種死海釣到東西，真有趣。我用 1.5 倍的價格收購，當作研究材料吧。」`; else msg = `「就這點破魚？現在行情不好，我最多只能用 8 折收。涼拌。」`;
        this.modal(buyerId, buyer.name, msg + `<br><br><span style="color:var(--gold)">收購倍率: ${multiplier}x</span>`);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--gold); color:var(--gold);" onclick="game.openSellFishUI('${buyerId}', ${multiplier})">選擇要賣的魚</button><button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">不賣了</button>`; }, 10);
    },
    confirmSellFish: function() {
        let totalGain = 0; let itemsToRemove = [];
        document.querySelectorAll('.fish-slider').forEach(slider => { let id = slider.getAttribute('data-id'); let price = parseInt(slider.getAttribute('data-price')); let qty = parseInt(slider.value); if (qty > 0) { totalGain += qty * price; for(let i=0; i<qty; i++) itemsToRemove.push(id); } });
        if (totalGain === 0) { this.closeModal(); return; }
        itemsToRemove.forEach(id => { let idx = this.warehouse.indexOf(id); if(idx !== -1) this.warehouse.splice(idx, 1); });
        this.money += totalGain; this.updateUI(); this.closeModal(); this.log(`交易完成，獲得 $${totalGain}。`, "color:var(--gold)"); this.openTab('port');
    },
    confirmNap: function() {
        const slider = document.getElementById('nap-slider'); const hours = parseInt(slider.value); this.closeModal();
        this.addTime(hours); this.fatigue = Math.max(0, this.fatigue - (hours * 5)); this.damageAllSan(hours * 5, "露宿街頭");
        this.log(`💤 在港口角落睡了 ${hours} 小時... 身體好痛，精神更差了。`, "color:#aaa"); this.updateUI(); this.openTab('port');
    },
    requestTransferItem: function(action, itemId, maxQty) {
        if (maxQty === 1) { this.transferItemQuantity(action, itemId, 1); } else {
            const item = ITEM_DB[itemId]; const targetName = action === 'toWarehouse' ? '倉庫' : '背包';
            this.modal("none", "移動道具", `<div style="text-align:center;"><div style="font-size:2rem; margin-bottom:10px;">${item.icon}</div><div style="margin-bottom:10px;">要移動多少 <span style="color:var(--gold)">${item.name}</span> 到${targetName}？</div><div style="display:flex; gap:10px; align-items:center; justify-content:center; margin:20px 0;"><input type="range" id="transfer-slider" min="1" max="${maxQty}" value="1" style="width:60%;" oninput="document.getElementById('transfer-val').innerText = this.value"><div style="font-size:1.2rem; font-weight:bold; color:var(--sonar); width:40px;" id="transfer-val">1</div></div></div>`);
            let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:auto; padding:10px 20px; border-color:var(--sonar); color:var(--sonar);" onclick="game.confirmTransfer('${action}', '${itemId}')">確認移動</button><button class="tech-btn" style="width:auto; padding:10px 20px; border-color:#555; color:#aaa;" onclick="game.closeModal()">取消</button>`;
        }
    },
    confirmTransfer: function(action, itemId) { const slider = document.getElementById('transfer-slider'); const qty = parseInt(slider.value); this.closeModal(); this.transferItemQuantity(action, itemId, qty); },
    transferItemQuantity: function(action, itemId, qty) {
        let source = action === 'toWarehouse' ? this.inventory : this.warehouse; let target = action === 'toWarehouse' ? this.warehouse : this.inventory; let limit = action === 'toInventory' ? this.inventoryMax : this.warehouseMax;
        if (target.length + qty > limit) { let targetName = action === 'toInventory' ? "背包" : "倉庫"; this.modal("system", "系統", `${targetName}空間不足！<br>剩餘空間: ${limit - target.length} <br>嘗試移動: ${qty}`); return; }
        for(let i=0; i<qty; i++) { let idx = source.indexOf(itemId); if(idx !== -1) target.push(source.splice(idx, 1)[0]); }
        this.openTab('warehouse');
    },
    confirmDiscardItem: function(idx) {
        let itemId = this.inventory[idx]; let item = ITEM_DB[itemId]; this.modal("system", "丟棄物品", `確定要將 <span style="color:var(--alert)">${item.name}</span> 丟入深海嗎？<br>(此操作無法復原)`);
        let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="border-color:var(--alert); color:var(--alert);" onclick="game.discardItem(${idx})">確認丟棄</button><button class="tech-btn" style="border-color:#aaa; color:#aaa;" onclick="game.closeModal()">取消</button>`;
    },
    discardItem: function(idx) { this.inventory.splice(idx, 1); this.closeModal(); this.log("已丟棄物品。", "color:#aaa"); this.openBackpack(); this.updateUI(); },
    useItem: function(idx) {
        let itemId = this.inventory[idx]; let item = ITEM_DB[itemId]; let consumed = item.effect(this);
        if (consumed !== false) this.inventory.splice(idx, 1);
        this.updateUI(); this.renderDash(); if (this.isVoyaging) this.renderCmds(); this.openBackpack();
    },

    // --- 新增：酒館賭博 ---
    openGambleUI: function() {
        this.modal("none", "🎲 水手賭局", `<div style="text-align:center;"><div style="font-size:3rem; margin-bottom:10px;">🎲</div><div style="margin-bottom:15px; color:#aaa;">一群醉醺醺的水手正在玩骰子。<br>規則很簡單：比大小。贏了翻倍，輸了沒收。</div><div style="display:flex; gap:10px; justify-content:center;"><button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.commitGamble(50)">賭 $50</button><button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.commitGamble(200)">賭 $200</button><button class="tech-btn" style="width:auto; border-color:var(--alert); color:var(--alert);" onclick="game.commitGamble(1000)">豪賭 $1000</button></div><button class="tech-btn" style="margin-top:15px; border-color:#555; color:#aaa;" onclick="game.closeModal()">沒興趣</button></div>`);
        // 優化：移除預設的 ACKNOWLEDGE 按鈕，只保留自定義按鈕
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    commitGamble: function(amount) {
        if (this.money < amount) { this.modal("system", "警告", "你的錢不夠！水手們發出了嘲笑聲。"); return; }
        this.money -= amount;
        // 優化：賭博消耗時間與疲勞
        this.addTime(0.5); this.fatigue += 5;

        let playerRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        let houseRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
        
        let resultHtml = `<div style="font-size:1.2rem; margin-bottom:10px;">你擲出了 <span style="color:var(--gold); font-weight:bold;">${playerRoll}</span> 點<br>莊家擲出了 <span style="color:#aaa;">${houseRoll}</span> 點</div>`;
        
        if (playerRoll > houseRoll) {
            this.money += amount * 2;
            this.modal("none", "🎉 勝利！", `${resultHtml}<div style="color:var(--gold);">你贏得了 $${amount * 2}！</div>`);
            this.log(`🎲 賭博贏了 $${amount}！`, "color:var(--gold)");
        } else {
            this.modal("none", "💸 惜敗...", `${resultHtml}<div style="color:var(--alert);">你的錢被收走了...</div>`);
            this.log(`🎲 賭博輸掉了 $${amount}...`, "color:#777");
        }
        this.updateUI();
        
        // 新增：如果輸光了，被趕出賭場
        if (this.money <= 0) {
            setTimeout(() => { this.modal("nathanael", "拿但業", "「輸光了嗎？那就請回吧。這裡不歡迎窮光蛋。」"); this.switchMode('town'); }, 1500);
            return;
        }
    },

    // --- 新增：深海拉霸機 ---
    openSlotsUI: function() {
        this.modal("none", "🎰 深海拉霸機", `
            <div style="text-align:center;">
                <div style="font-size:1.2rem; color:#e91e63; margin-bottom:10px; font-weight:bold;">JACKPOT: 1000x</div>
                <div id="slots-display" style="display:flex; justify-content:center; gap:10px; font-size:3rem; margin:20px 0; background:#000; padding:15px; border:2px solid #e91e63; border-radius:8px; box-shadow: 0 0 15px rgba(233, 30, 99, 0.3);">
                    <div id="reel-1">❓</div><div id="reel-2">❓</div><div id="reel-3">❓</div>
                </div>
                <div style="margin-bottom:20px; color:#aaa; font-size:0.85rem; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px;">
                    <div>🦑🦑🦑 = 1000x | 💎💎💎 = 200x</div>
                    <div>🪙🪙🪙 = 50x | 🐟🐟🐟 = 20x</div>
                    <div style="color:var(--alert)">無保本獎勵，高風險！</div>
                </div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="tech-btn" style="width:auto; border-color:var(--sonar); color:var(--sonar);" onclick="game.spinSlots(100)">投入 $100</button>
                    <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.spinSlots(500)">投入 $500</button>
                </div>
                <button class="tech-btn" style="margin-top:15px; border-color:#555; color:#aaa;" onclick="game.closeModal()">離開</button>
            </div>
        `);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    spinSlots: function(bet) {
        if (this.money < bet) { this.log("資金不足！", "color:var(--alert)"); return; }
        this.money -= bet;
        this.addTime(0.1); this.fatigue += 1; // 拉霸機比較快，只消耗 0.1 小時，疲勞 +1
        this.updateUI();
        
        const reels = ['reel-1', 'reel-2', 'reel-3'];
        const symbols = ['🗑️', '🐟', '🪙', '💎', '🦑'];
        // 優化：調整機率權重 (極高風險，高回報)
        // 垃圾(60%), 魚(25%), 金幣(10%), 鑽石(4%), 克拉肯(1%)
        const getRandomSymbol = () => {
            let r = Math.random();
            if (r < 0.60) return '🗑️';
            if (r < 0.85) return '🐟';
            if (r < 0.95) return '🪙';
            if (r < 0.99) return '💎';
            return '🦑';
        };

        // 轉動動畫
        let interval = setInterval(() => {
            reels.forEach(id => { let el = document.getElementById(id); if(el) el.innerText = symbols[Math.floor(Math.random() * symbols.length)]; });
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            let results = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
            reels.forEach((id, i) => { let el = document.getElementById(id); if(el) el.innerText = results[i]; });
            
            // 結算
            let counts = {}; results.forEach(s => counts[s] = (counts[s] || 0) + 1);
            let winMult = 0;
            if (counts['🦑'] === 3) winMult = 1000;
            else if (counts['💎'] === 3) winMult = 200;
            else if (counts['🪙'] === 3) winMult = 50;
            else if (counts['🐟'] === 3) winMult = 20;
            
            if (winMult > 0) {
                let winAmount = bet * winMult;
                this.money += winAmount;
                this.log(`🎰 拉霸機中獎！獲得 $${winAmount} (x${winMult})`, "color:var(--gold)");
                let display = document.getElementById('slots-display');
                if(display) { display.style.borderColor = 'var(--gold)'; display.style.boxShadow = '0 0 20px var(--gold)'; }
            } else {
                this.log(`🎰 拉霸機：未中獎...`, "color:#777");
            }
            this.updateUI();
            
            if (this.money <= 0) { setTimeout(() => { this.modal("nathanael", "拿但業", "「輸光了嗎？那就請回吧。這裡不歡迎窮光蛋。」"); this.switchMode('town'); }, 1500); }
        }, 1000);
    },

    // --- 新增：21點 (Blackjack) ---
    openBlackjackUI: function() {
        this.modal("nathanael", "拿但業", `
            <div style="text-align:center;">
                <div style="margin-bottom:15px; color:#aaa;">「想挑戰我？」</div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="tech-btn" style="width:auto; border-color:var(--sonar); color:var(--sonar);" onclick="game.startBlackjack(100)">賭 $100</button>
                    <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.startBlackjack(500)">賭 $500</button>
                    <button class="tech-btn" style="width:auto; border-color:var(--purple); color:var(--purple);" onclick="game.startBlackjack(1000)">賭 $1000</button>
                </div>
                <button class="tech-btn" style="margin-top:15px; border-color:#555; color:#aaa;" onclick="game.closeModal()">離開</button>
            </div>
        `);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    startBlackjack: function(bet) {
        if (this.money < bet) { this.modal("system", "警告", "資金不足。"); return; }
        this.money -= bet;
        this.addTime(0.2); this.fatigue += 3; // 21點消耗 0.2 小時，疲勞 +3
        this.bjState = { deck: this.createDeck(), playerHand: [], dealerHand: [], bet: bet, gameOver: false };
        // 發牌
        this.bjState.playerHand.push(this.drawCard());
        this.bjState.dealerHand.push(this.drawCard());
        this.bjState.playerHand.push(this.drawCard());
        this.bjState.dealerHand.push(this.drawCard());
        
        this.updateBlackjackUI();
        
        // 檢查天胡 (Natural Blackjack)
        let pVal = this.getHandValue(this.bjState.playerHand);
        if (pVal === 21) { this.standBlackjack(); }
    },
    createDeck: function() {
        const suits = ['♠', '♥', '♦', '♣']; const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = []; for (let s of suits) { for (let v of values) { deck.push({ suit: s, value: v }); } }
        return deck.sort(() => Math.random() - 0.5);
    },
    drawCard: function() { return this.bjState.deck.pop(); },
    getHandValue: function(hand) {
        let val = 0; let aces = 0;
        for (let card of hand) { if (['J', 'Q', 'K'].includes(card.value)) val += 10; else if (card.value === 'A') { val += 11; aces++; } else val += parseInt(card.value); }
        while (val > 21 && aces > 0) { val -= 10; aces--; }
        return val;
    },
    updateBlackjackUI: function() {
        let pHand = this.bjState.playerHand; let dHand = this.bjState.dealerHand; let gameOver = this.bjState.gameOver;
        let pVal = this.getHandValue(pHand); let dVal = gameOver ? this.getHandValue(dHand) : this.getHandValue([dHand[0]]);
        
        let renderCards = (hand, hideSecond) => {
            return hand.map((c, i) => {
                if (hideSecond && i === 1) return `<div class="bj-card back" style="display:inline-block; padding:5px 10px; margin:2px; border-radius:4px; background:#333; border:1px solid #555; font-size:1.2rem;">🂠</div>`;
                let color = (c.suit === '♥' || c.suit === '♦') ? '#ff5252' : '#fff';
                return `<div class="bj-card" style="color:${color}; border:1px solid ${color}; display:inline-block; padding:5px 10px; margin:2px; border-radius:4px; background:#222; font-family:monospace; font-size:1.2rem;">${c.suit}${c.value}</div>`;
            }).join('');
        };

        let html = `
            <div style="text-align:center;">
                <div style="margin-bottom:10px; color:#aaa;">拿但業 (莊家)</div>
                <div style="margin-bottom:20px;">${renderCards(dHand, !gameOver)}</div>
                <div style="margin-bottom:20px; font-size:1.5rem; font-weight:bold; color:var(--gold);">VS</div>
                <div style="margin-bottom:10px; color:var(--sonar);">你 (點數: ${pVal})</div>
                <div style="margin-bottom:20px;">${renderCards(pHand, false)}</div>
                
                ${!gameOver ? `
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.hitBlackjack()">要牌 (HIT)</button>
                        <button class="tech-btn" style="width:auto; border-color:var(--sonar); color:var(--sonar);" onclick="game.standBlackjack()">停牌 (STAND)</button>
                    </div>
                ` : `<div id="bj-result" style="font-size:1.2rem; font-weight:bold; margin-bottom:15px;"></div>`}
                
                ${gameOver ? `<button class="tech-btn" style="margin-top:10px; border-color:#555; color:#aaa;" onclick="game.openBlackjackUI()">再來一局</button>` : ''}
            </div>
        `;
        this.modal("none", "🃏 21點決鬥", html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    hitBlackjack: function() {
        this.bjState.playerHand.push(this.drawCard());
        let val = this.getHandValue(this.bjState.playerHand);
        if (val > 21) { this.resolveBlackjack(false, true); } else { this.updateBlackjackUI(); }
    },
    standBlackjack: function() {
        let dVal = this.getHandValue(this.bjState.dealerHand);
        while (dVal < 17) { this.bjState.dealerHand.push(this.drawCard()); dVal = this.getHandValue(this.bjState.dealerHand); }
        this.resolveBlackjack(true, false);
    },
    resolveBlackjack: function(stand, bust) {
        this.bjState.gameOver = true; this.updateBlackjackUI();
        let pVal = this.getHandValue(this.bjState.playerHand); let dVal = this.getHandValue(this.bjState.dealerHand);
        let bet = this.bjState.bet; let resultDiv = document.getElementById('bj-result'); let msg = ""; let winAmount = 0;

        if (bust) {
            msg = `<span style="color:var(--alert)">爆牌！你輸了...</span>`; this.log(`🃏 21點：爆牌輸掉了 $${bet}`, "color:#777");
        } else if (dVal > 21) {
            winAmount = bet * 2; msg = `<span style="color:var(--gold)">莊家爆牌！你贏了 $${winAmount}！</span>`;
            this.money += winAmount; this.log(`🃏 21點：莊家爆牌，贏得 $${winAmount}`, "color:var(--gold)");
        } else if (pVal > dVal) {
            let isBJ = (pVal === 21 && this.bjState.playerHand.length === 2);
            winAmount = isBJ ? Math.floor(bet * 2.5) : bet * 2;
            msg = `<span style="color:var(--gold)">${isBJ ? 'BLACKJACK!' : '勝利！'} 你贏了 $${winAmount}！</span>`;
            this.money += winAmount; this.log(`🃏 21點：${isBJ ? 'BJ' : ''}勝利，贏得 $${winAmount}`, "color:var(--gold)");
            
            // 勝利特殊對話
            setTimeout(() => {
                let quote = isBJ ? "「21點...？哼，算你厲害。不過別以為下次還能這麼好運。」" : "「嘖... 居然贏了？看來你的運氣稍微比你的出身好一點。」";
                this.modal("nathanael", "拿但業", quote + `<br><br>${msg}`);
                setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:#555; color:#aaa;" onclick="game.openBlackjackUI()">再來一局</button><button class="tech-btn" style="width:100%; border-color:#555; color:#aaa; margin-top:10px;" onclick="game.closeModal()">離開</button>`; }, 10);
            }, 1000);
            return;
        } else if (pVal === dVal) {
            this.money += bet; msg = `<span style="color:#aaa">平局 (退還賭注)</span>`; this.log(`🃏 21點：平局`, "color:#aaa");
        } else {
            msg = `<span style="color:var(--alert)">你輸了...</span>`; this.log(`🃏 21點：輸掉了 $${bet}`, "color:#777");
        }
        if (resultDiv) resultDiv.innerHTML = msg; this.updateUI();
        if (this.money <= 0) { setTimeout(() => { this.modal("nathanael", "拿但業", "「輸光了嗎？那就滾吧。這裡不歡迎窮光蛋。」"); this.switchMode('town'); }, 2000); }
    },

    // --- 新增：海神祭壇 ---
    donateShrine: function() {
        if (this.flags.shrineBuff) { this.modal("system", "提示", "你已經獲得了海神的庇護。<br>貪得無厭並不會帶來更多好運。"); return; }
        if (this.money < 200) { this.modal("system", "提示", "捐獻箱需要 <span style='color:var(--gold)'>$200</span>。<br>心誠則靈，但沒錢免談。"); return; }
        
        this.money -= 200;
        this.flags.shrineBuff = true;
        this.log("🙏 向海神祭壇捐獻了 $200。獲得【海神庇護】(下次航行 SAN 傷害減少)。", "color:var(--sonar)");
        this.modal("none", "🙏 祈禱", `<div style="text-align:center; font-size:1.1rem; color:var(--sonar);">你將錢幣投入深不見底的箱子。<br>一陣奇異的安寧感湧上心頭...<br><br><span style="color:var(--gold);">獲得狀態：海神庇護</span><br><span style="font-size:0.8rem; color:#aaa;">(下一次出航時，受到的所有精神傷害 -2)</span></div>`);
        this.updateUI();
    },

    // --- 新增：高利貸系統 ---
    openLoanUI: function() {
        this.debt = this.debt || 0;
        let html = `<div style="text-align:center;">
            <div style="font-size:1.2rem; margin-bottom:10px;">當前債務: <span style="color:var(--alert); font-weight:bold;">$${this.debt}</span></div>
            <div style="font-size:0.9rem; color:#aaa; margin-bottom:20px;">每日利息 10%。<br>如果你還不起，後果自負。</div>
            <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.borrowMoney(500)">借 $500</button>
                <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.borrowMoney(1000)">借 $1000</button>
                <button class="tech-btn" style="width:auto; border-color:var(--gold); color:var(--gold);" onclick="game.borrowMoney(5000)">借 $5000</button>
            </div>
            <div style="margin-top:15px; border-top:1px dashed #333; padding-top:15px;">
                <button class="tech-btn" style="width:100%; border-color:var(--sonar); color:var(--sonar);" onclick="game.repayMoney()">償還所有債務</button>
            </div>
            <button class="tech-btn" style="margin-top:15px; border-color:#555; color:#aaa;" onclick="game.closeModal()">離開</button>
        </div>`;
        this.modal("nathanael", "拿但業", html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    borrowMoney: function(amount) {
        if (!this.debt || this.debt <= 0) this.debtDays = 0; // 新債務重置天數
        this.money += amount; this.debt = (this.debt || 0) + amount;
        this.log(`💰 向拿但業借了 $${amount}。`, "color:var(--gold)");
        if (this.debt >= 10000) { this.closeModal(); this.triggerDebtEnding(); return; }
        this.updateUI(); this.openLoanUI();
    },
    repayMoney: function() {
        if (!this.debt || this.debt <= 0) { this.modal("system", "提示", "你沒有債務。"); return; }
        if (this.money <= 0) { this.modal("system", "警告", "你身無分文，無法還款。"); return; }
        let pay = Math.min(this.money, this.debt);
        this.money -= pay; this.debt -= pay;
        if (this.debt <= 0) this.debtDays = 0; // 還清後重置天數
        this.log(`💸 償還了債務 $${pay}。`, "color:var(--sonar)");
        this.updateUI(); this.openLoanUI();
    },

    // --- 新增：黑市系統 ---
    buyBlackMarketItem: function(id, cost) {
        if (this.money < cost) { this.modal("system", "警告", "資金不足。"); return; }
        if (id !== 'stimulant' && (this.inventory.includes(id) || this.warehouse.includes(id))) { this.modal("system", "提示", "你已經擁有此物品了。"); return; }
        if (this.inventory.length >= this.inventoryMax && this.warehouse.length >= this.warehouseMax) { this.modal("system", "警告", "背包與倉庫都滿了！"); return; }
        
        this.money -= cost;
        if (this.inventory.length < this.inventoryMax) {
            this.inventory.push(id);
            this.log(`💰 購買了 ${ITEM_DB[id].name} (放入背包)`, "color:var(--purple)");
        } else {
            this.warehouse.push(id);
            this.log(`💰 購買了 ${ITEM_DB[id].name} (放入倉庫)`, "color:var(--gold)");
        }
        this.updateUI();
        this.openTab('blackmarket'); // 優化：刷新分頁而非彈出視窗
    },

    // --- 新增：非法改造 (船體) ---
    openIllegalModUI: function() {
        this.maxHp = this.maxHp || 100;
        let currentSpeed = this.flags.speedMod ? "已改裝 (+20%)" : "標準";
        let html = `<div style="text-align:center;">
            <div style="margin-bottom:15px; color:#aaa;">茉莉可以移除引擎的安全限制器，大幅提升出力。<br>但這會永久降低船體結構強度。</div>
            <div style="display:flex; justify-content:space-around; margin-bottom:20px; background:rgba(0,0,0,0.3); padding:10px;">
                <div><div>當前 Max HP</div><div style="color:var(--sonar); font-size:1.2rem;">${this.maxHp}</div></div>
                <div><div>航速狀態</div><div style="color:var(--gold); font-size:1.2rem;">${currentSpeed}</div></div>
            </div>
            ${!this.flags.speedMod ? 
                `<button class="tech-btn" style="border-color:var(--alert); color:var(--alert);" onclick="game.confirmIllegalMod()">
                    💀 移除限制器 ($3000)<br><span style="font-size:0.8rem;">Max HP -20 / 航速 +20%</span>
                </button>` : 
                `<button class="tech-btn" style="border-color:var(--sonar); color:var(--sonar);" onclick="game.revertIllegalMod()">
                    🔧 恢復原廠設定 ($2000)<br><span style="font-size:0.8rem;">Max HP +20 / 移除航速加成</span>
                </button>`
            }
            <button class="tech-btn" style="margin-top:15px; border-color:#555; color:#aaa;" onclick="game.closeModal()">離開</button>
        </div>`;
        this.modal("molly", "茉莉", html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = ''; }, 10);
    },
    confirmIllegalMod: function() {
        if (this.money < 3000) { this.modal("system", "警告", "資金不足 ($3000)。"); return; }
        this.maxHp = this.maxHp || 100;
        if (this.maxHp <= 40) { this.modal("system", "警告", "船體結構已達極限，再改裝會解體的。"); return; }
        this.money -= 3000; this.maxHp -= 20; this.hp = Math.min(this.hp, this.maxHp); this.flags.speedMod = true;
        this.log("💀 進行了非法引擎改造！Max HP -20，航速大幅提升。", "color:var(--alert)");
        this.updateUI(); this.openIllegalModUI();
    },
    revertIllegalMod: function() {
        if (this.money < 2000) { this.modal("system", "警告", "資金不足 ($2000)。"); return; }
        this.money -= 2000;
        this.maxHp += 20;
        this.flags.speedMod = false;
        this.log("🔧 重新安裝了安全限制器。Max HP 恢復，航速回歸正常。", "color:var(--sonar)");
        this.updateUI(); this.openIllegalModUI();
    },

    // --- 新增：非法強化 (船員) ---
    openIllegalEnhanceUI: function() {
        let html = `<div class="grid">`;
        this.crew.forEach(c => {
            if (c.id === 'kleion') return; // 幽靈不需要訓練 SAN
            html += `<div class="tech-card"><div class="card-header"><span class="card-title">${c.name}</span><span style="color:var(--sonar)">SAN: ${c.maxSan}</span></div><div class="card-body">注射深淵提取物 (Max SAN +10)</div><button class="tech-btn" style="border-color:var(--purple); color:var(--purple);" onclick="game.enhanceCrew('${c.id}')">強化 ($2500)</button></div>`;
        });
        html += `</div>`;
        this.modal("molly", "茉莉", "「這可是違禁藥品... 但如果你們想在深淵裡保持清醒，這是最快的方法。」<br>" + html);
        setTimeout(() => { let btnContainer = document.getElementById('modal-btn-container'); if(btnContainer) btnContainer.innerHTML = `<button class="tech-btn" style="width:100%; border-color:#555; color:#aaa;" onclick="game.closeModal()">離開</button>`; }, 10);
    },
    enhanceCrew: function(id) {
        if (this.money < 2500) { this.modal("system", "警告", "資金不足 ($2500)。"); return; }
        let c = this.crew.find(x => x.id === id); if (!c) return;
        this.money -= 2500; c.maxSan += 10; c.san += 10;
        this.log(`💉 ${c.name} 接受了非法強化！Max SAN 提升至 ${c.maxSan}。`, "color:var(--purple)");
        this.updateUI(); this.openIllegalEnhanceUI();
    }
});
