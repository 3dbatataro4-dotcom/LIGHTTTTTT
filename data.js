// 生成頭像 URL 或 Fallback 函數
function getImgUrl(id) {
    const map = {
        'kleion': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%85%8B%E9%87%8C%E6%98%82.png',
        'molly': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%8C%89%E8%8E%89.png',
        'lynn': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E6%9E%97%E6%81%A9.png',
        'estrella': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E6%98%9F%E6%98%9F.png',
        'nathanael': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E6%8B%BF%E4%BD%86%E6%A5%AD.png',
        'lilith': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%8E%89%E8%8E%89%E6%96%AF.png',
        'lanlan': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%98%AD%E8%98%AD.png',
        'peter': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%BD%BC%E5%BE%97.png',
        'manmu': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%B0%8F%E7%9B%AE.png',
        'lazar': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E6%8B%89%E6%89%8E%E7%88%BE.png',
        'hassel': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%93%88%E8%98%87.png',
        'philip': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%85%93%E5%8A%9B.png',
        'costa': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E7%A7%91%E7%B5%B2%E5%A1%94.png',
        'narcissus': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E7%B4%8D%E5%B8%8C%E7%91%9F%E6%96%AF.png',
        'melas': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%9C%9C%E6%8B%89%E6%80%9D.png',
        'jornona': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%96%AC%E8%AB%BE%E5%A8%9C.png',
        'adora': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E9%98%BF%E6%9C%B5%E6%8B%89.png',
        'venator': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E7%B6%AD%E7%B4%8D%E6%89%98.png',
        'novian': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E8%AB%BE%E7%B6%AD%E5%AE%89.png',
        'carlota': 'https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/%E5%8D%A1%E6%B4%9B%E7%89%B9.png'
    };
    return map[id] || `https://file.garden/aWe99vhwaGcNwkok/%E7%A0%B4%E9%A0%AD/${id}.png`;
}
// 預設 Fallback SVG
const fallbackSVG = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23111'/><text x='50%' y='50%' fill='%2300b0ff' font-size='40' font-family='monospace' text-anchor='middle' dy='15'>?</text></svg>`;

// 圖鑑資料庫
const CODEX_DB = {
    'storm': { name: '暴風雨', icon: '⛈️', desc: '狂暴的海洋天氣。' },
    'kraken': { name: '深海巨怪', icon: '🦑', desc: '來自深淵的觸手。' },
    'siren': { name: '塞壬', icon: '🧜‍♀️', desc: '致命的歌聲。' },
    'ghost_ship': { name: '幽靈船', icon: '👻', desc: '徘徊不去的亡靈。' },
    'jellyfish': { name: '發光水母', icon: '🪼', desc: '深海的微光。' },
    'treasure': { name: '沈船寶藏', icon: '👑', desc: '古代的金幣與遺物。' },
    'whisper': { name: '深淵低語', icon: '👁️', desc: '不可名狀的聲音。' },
    'whale': { name: '巨鯨', icon: '🐋', desc: '巨大的海洋哺乳類。' }
};

// BGM 定義
const BGM_PORT = new Audio('https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E5%AE%89%E5%85%A8.mp3');
const BGM_VOYAGE = new Audio('https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E5%87%BA%E8%88%AA.mp3');
const BGM_BOSS = new Audio('https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/BOSS.mp3');
[BGM_PORT, BGM_VOYAGE, BGM_BOSS].forEach(a => { a.loop = true; a.volume = 0.4; });

const WEATHER_TYPES = {
    'CLEAR': { name: '晴朗', icon: '☀', desc: '風平浪靜' },
    'TAILWIND': { name: '順風', icon: '🍃', desc: '航速 +20%' },
    'HEADWIND': { name: '逆風', icon: '💨', desc: '航速 -20%' },
    'STORM': { name: '暴雨', icon: '⛈', desc: '船體受損' },
    'FOG': { name: '濃霧', icon: '🌫', desc: '油耗增加' }
};

// 角色與NPC資料庫
const DB = {
    coreCrew: [
        { 
            id: 'novian', name: '諾維安', role: 'CAPTAIN', 
            san: 80, maxSan: 80, trauma: null, region: 'sector7',
            desc: '【主動】全速推進：額外推進 15 KM。<br>【被動】第七星區適應：航行時較不易累積疲勞。<br>【描述】陽光開朗的第七星區船長，高抗壓性，能在高壓戰鬥中穩定軍心。' 
        },
        { 
            id: 'lanlan', name: '維爾德拉科斯(蘭蘭)', role: 'GUARD', 
            san: 40, maxSan: 40, trauma: null, region: 'sector7',
            desc: '【主動】斬擊/物資：找回 20 FOOD，戰鬥中對巨型觸手造成毀滅傷害。<br>【被動】怕鬼：20%機率被嚇到 SAN-10 (喬諾娜在場免疫)。<br>【描述】武力極高的純情龍族，物理輸出頂尖，但精神極易崩潰。' 
        },
        { 
            id: 'lazar', name: '拉扎爾', role: 'MEDIC', 
            san: 85, maxSan: 85, trauma: null, region: 'sector7',
            desc: '【主動】心理疏導：全體 SAN 恢復 20。<br>【描述】語氣溫和的船醫。面對舊日支配者的精神汙染時，他是全船的理智保底。' 
        }
    ],
    mercs: [
        { 
            id: 'carlota', name: '卡洛特', role: 'SCOUT', cost: 200, 
            san: 70, maxSan: 70, trauma: null, region: 'sector7',
            desc: '【主動】規避暗礁：推進 10 KM。<br>【被動】危險直覺：可在部分危機中提前預警。<br>【描述】諾維安的弟弟。能敏銳避開深海的環境陷阱。' 
        },
        { 
            id: 'estrella', name: '星星', role: 'ENGINEER', cost: 200, 
            san: 60, maxSan: 60, trauma: null, region: 'sector7',
            desc: '【主動】萬能維修：船體 HP 恢復 15 點。<br>【被動】技工：可處理機械危機。<br>【描述】可愛的萬能雜工，BOSS 戰中搶修船體的關鍵人物。' 
        },
        { 
            id: 'philip', name: '腓力', role: 'BRAWLER', cost: 300, 
            san: 75, maxSan: 75, trauma: null, region: 'sector7',
            desc: '【主動】暴力破障：額外推進 20 KM，BOSS戰重火力轟炸。<br>【被動】苦力：可處理勞力危機。<br>【描述】率直忠誠的保母兼打手，專門粉碎深海巨獸的重甲。' 
        },
        { 
            id: 'nathanael', name: '拿但業', role: 'NOBLE', cost: 400, 
            san: 50, maxSan: 50, trauma: null, region: 'sector7',
            desc: '【主動】絕對命令：若腓力在場，腓力效率爆發(極巨量傷害)；若不在則發懶。<br>【描述】嬌氣的少爺。雖然體質很雖，但他能讓腓力的破壞力引導至極限。' 
        },
        { 
            id: 'venator', name: '維納托', role: 'GENIUS', cost: 500, 
            san: 95, maxSan: 95, trauma: null, region: 'unknown', // 🌟 已更改為外來者
            desc: '【主動】機械軍團：穩定推進 15 KM，精準鎖定敵方弱點。<br>【描述】自信從容的機關學者。強大的理性讓他幾乎免疫深淵的精神汙染。' 
        },
        { 
            id: 'narcissus', name: '納希瑟斯', role: 'CHARMER', cost: 450, 
            san: 65, maxSan: 65, trauma: null, region: 'unknown',
            desc: '【主動】魅力交涉：推進 10 KM。<br>【被動】神仙顏值：解鎖特殊交涉選項。<br>【描述】美貌無雙的旅行者，外來人士，唯獨對維納托死心塌地。' 
        },
        { 
            id: 'jornona', name: '喬諾娜', role: 'SINGER', cost: 300, 
            san: 70, maxSan: 70, trauma: null, region: 'sector7',
            desc: '【主動】海妖之歌：全體 SAN 恢復 15。<br>【被動】愛的力量：蘭蘭的「怕鬼」失效。<br>【描述】蘭蘭的戀人。溫柔的歌聲能有效抵禦海怪的深海低語。' 
        },
        { 
            id: 'kleion', name: '克里昂', role: 'GHOST', cost: 250, 
            san: 100, maxSan: 100, trauma: null, region: 'sector7',
            desc: '【主動】化學爆破：推進 10 KM，BOSS戰化學侵蝕。<br>【被動】幽靈同類：免疫靈異威脅。<br>【描述】死去的半精靈煉金術士。身為幽靈，他的 SAN 值永遠不會動搖。' 
        },
        { 
            id: 'costa', name: '科絲塔', role: 'APPRENTICE', cost: 200, 
            san: 55, maxSan: 55, trauma: null, region: 'sector7',
            desc: '【主動】奈米修復：船體 HP 恢復 15 點。<br>【描述】善良可愛的小女孩，克里昂的夥伴，能靈巧地在危急時刻修補船艙。' 
        },
        { 
            id: 'manmu', name: '小目', role: 'CEO', cost: 600, 
            san: 85, maxSan: 85, trauma: null, region: 'sector7',
            desc: '【主動】金錢開道：推進 5 KM。<br>【被動】鈔能力：任務結算報酬 +50%。<br>【描述】手握鈔票。強大的自信讓他難以被恐懼擊倒！' 
        },
        { 
            id: 'molly', name: '茉莉', role: 'DOCTOR', cost: 300, 
            san: 60, maxSan: 60, trauma: null, region: 'sector7',
            desc: '【主動】強效急救：船體 HP+10，全體 SAN+10。<br>【描述】溫柔的醫生。全能型的後勤輔助，確保船員在決戰中不會倒下。' 
        }
    ],
    npc: {
        peter: { 
            name: '彼得 (村長)', id: 'peter', 
            msg: '10 天。修好船，或者永遠待在這裡。',
            victoryMsg: '這小鎮的空氣總算乾淨了一點，我終於可以不用每天喝潔廁靈來驅邪了，Holy shit。雖然你現在身上可能還沾著深海的細菌……但，謝謝你把小鎮打掃乾淨。'
        },
        lynn: { 
            name: '林恩 (商人)', id: 'lynn', 
            msg: '燃料、罐頭、零件。一手交錢一手交貨。',
            victoryMsg: '你們解決了？那真是太好了，總算不用聽彼得每天在那裡神神叨叨了。接下來的日子要做什麼？涼拌！我要去吃我的高熱量披薩了。'
        },
        hassel: { 
            name: '哈蘇 (紀錄員)', id: 'hassel', 
            msg: '已更新海域數據。請選擇委託。',
            victoryMsg: '……關於深淵的最終委託，已經結案了。你做到了，這非常不簡單。……如果你以後還想接一些跑腿的小委託，委託社的門隨時為你開著。謝謝。'
        },
        lilith: { 
            name: '莉莉絲 (酒館)', id: 'lilith', 
            msg: '要帶哪個孩子出去玩呢？',
            victoryMsg: '哎呀~這不是拯救了我們小鎮的大英雄嗎？快過來坐~ 今天酒館裡所有的飲料都算我的，想喝什麼隨便點~'
        },
        costa: { 
            name: '科絲塔 (旅館)', id: 'costa', 
            msg: '累了嗎BATA？這裡很安全。',
            victoryMsg: '你真的把那個不好心的海怪打敗了！真是奇怪，明明你們之前看起來還那麼累的說！不過太好啦 BATA！今天旅館的床鋪我已經鋪得軟軟的了，好好休息吧 BATA！'
        },
        adora: { name: '阿朵菈', id: 'adora', msg: '我的孩子... 在暗礁區失蹤了...' },
        melas: { name: '蜜拉思', id: 'melas', msg: '需要一點讓你看不到恐懼的藥水嗎:) ' },
        // 🌟 新增小目、海神與冥神
        manmu: { 
            name: '小目 (倉庫管理)', id: 'manmu', 
            msg: '倉庫重地。存放費一天十萬。開玩笑的，我的芒果呢？',
            victoryMsg: '沒想到你居然真的打敗了海怪！不愧是我看上的人才！從今天起，小鎮倉庫為你提供至尊 VIP 服務！這可是無價的喔！'
        },
        seagod: { name: '海神', id: 'seagod', msg: '哇！是沒看過的魚！大黑你看！' },
        hades: { name: '冥神', id: 'hades', msg: '...嗯。(抱緊浮板)' }
    },
    generators: {
        issuers: ['小目', '海神', '克里昂', '林恩', '神秘人', '喬諾娜'],
        targets: ['回收黑盒子', '採集深淵樣本', '狩獵巨大魷魚', '護送貨物', '調查信號'],
        locs: ['淺灘 (Near)', '暗礁 (Mid)', '深淵 (Far)']
    }
};

// --- 新增：雷達節點資料庫 ---
const NODE_DB = [
    { type: 'safe', name: '平靜水域', icon: '🌊', desc: '安全的航線。', dist: 20, apCost: 1 },
    { type: 'storm', name: '暴風雨', icon: '⛈️', desc: '船體會受損。', dist: 30, apCost: 1 },
    { type: 'wreckage', name: '殘骸區', icon: '📦', desc: '能找到物資。', dist: 15, apCost: 1 },
    { type: 'unknown', name: '未知訊號', icon: '❓', desc: '充滿未知與危險。', dist: 25, apCost: 1 }
];

// --- 新增：互動式遭遇戰資料庫 ---
const ENCOUNTER_DB = [
    {
        id: 'ghost_ship',
        title: "幽靈船",
        desc: "濃霧中浮現出一艘散發綠光的破舊帆船。雷達上沒有生命訊號...",
        choices: [
            { text: "全速避開 (燃料 -15)", req: null, action: () => { window.game.fuel -= 15; window.game.log("加速避開了幽靈船。"); } },
            { text: "登船搜刮 (高風險)", req: null, action: () => { 
                if(Math.random() < 0.5) { window.game.money += 300; window.game.log("找到沈船金幣！", "color:var(--gold)"); } 
                else { window.game.san -= 20; window.game.hp -= 10; window.game.log("遭遇亡靈！受傷逃離。", "color:var(--alert)"); } 
            }},
            // 需求條件：填寫船員的 ID
            { text: "幽靈交涉 (獲得大量物資)", req: 'kleion', action: () => { 
                window.game.fuel += 20; window.game.food += 20; 
                window.game.log("克里昂和對方聊得很開心，帶回了土產。", "color:var(--sonar)"); 
            }}
        ]
    },
    {
        id: 'vortex',
        title: "深淵漩渦",
        desc: "巨大的漩渦阻擋了去路，強行穿越需要極高的運氣或駕駛技巧。",
        choices: [
            { text: "強行穿越 (機率判定)", req: null, action: () => {
                let roll = Math.floor(Math.random() * 100) + 1; // 擲骰 1-100
                if(roll > 50) {
                    window.game.log(`[判定 ${roll}>50] 成功穿越漩渦！`, "color:var(--sonar)");
                } else {
                    window.game.hp -= 20;
                    window.game.log(`[判定 ${roll}<=50] 船體被漩渦撕裂！(HP-20)`, "color:var(--alert)");
                }
            }},
            { text: "繞道而行 (燃料 -20)", req: null, action: () => {
                window.game.fuel -= 20;
                window.game.log("雖然浪費了燃料，但安全通過了。");
            }}
        ]
    }
    // 未來你可以在這裡繼續新增「海妖」、「巨大漩渦」等事件
];

// --- 新增：異常危機資料庫 (Crisis) ---
const CRISIS_DB = {
    'engine_fire': { 
        name: "引擎過熱", 
        desc: "每回合 Fuel -15", 
        roles: ['ENGINEER', 'ANDROID'], // 星星或科絲塔可以快速解決
        penalty: (game) => { game.fuel -= 15; game.log("⚠ 引擎持續過熱！額外消耗燃料！", "color:var(--alert)"); } 
    },
    'hull_leak': { 
        name: "船艙進水", 
        desc: "每回合 HP -10", 
        roles: ['ENGINEER', 'ANDROID', 'BRAWLER'], // 腓力可以用力氣強行堵住
        penalty: (game) => { game.hp -= 10; game.log("⚠ 船艙進水！船體持續受損！", "color:var(--alert)"); } 
    },
    'abyss_whisper': { 
        name: "深海幻音", 
        desc: "每回合 SAN -15", 
        roles: ['MEDIC', 'SINGER'], // 拉扎爾或喬諾娜可以安撫
        penalty: (game) => { game.san -= 15; game.log("⚠ 深淵的低語在腦海中迴盪... (SAN下降)", "color:var(--alert)"); } 
    }
};

// --- 新增：實體道具資料庫 (Item DB) ---
const ITEM_DB = {
    'void_potion': { 
        id: 'void_potion', name: '虛空藥水', icon: '🧪', 
        desc: '這趟航程中免疫 SAN 值下降。', 
        effect: (game) => { 
            game.flags.godBuff = 'melas'; 
            game.log("飲用虛空藥水，恐懼感被抽離了。", "color:#ce93d8"); 
        } 
    },
    'special_ration': { 
        id: 'special_ration', name: '特製口糧', icon: '🍖', 
        desc: '立即降低 20% 疲勞度 (Fatigue)。', 
        effect: (game) => { 
            game.fatigue = Math.max(0, game.fatigue - 20); 
            game.log("食用了蜜拉思的特製口糧，疲勞大幅緩解！", "color:var(--sonar)"); 
            game.renderDash(); 
        } 
    },
    'unknown_treasure': {
        id: 'unknown_treasure', name: '未知深海殘骸', icon: '📦',
        desc: '海上無法使用，需帶回小鎮倉庫處理。',
        effect: (game) => {
            game.log("這東西在海上打不開，得帶回鎮上。", "color:var(--alert)");
            return false; // 返回 false 代表道具不會被消耗
        }
    },
    // 🌟 新增：捕魚網
    'fishing_net': {
        id: 'fishing_net', name: '捕魚網', icon: '🕸️',
        desc: '出航時可用。撒網捕撈深海魚類 (消耗品)。',
        effect: (game) => {
            if (!game.isVoyaging) {
                game.log("這東西只能在出航時對著大海使用。", "color:var(--alert)");
                return false;
            }
            
            let area = game.mission.area;
            let fishPool = [];

            // 🌟 根據海域決定掉落池
            if (area.includes('淺灘')) {
                // 淺灘池：海草(通用)、水母、海膽
                // 15% 機率變異
                if (Math.random() < 0.15) {
                    fishPool = ['fish_mutant_jellyfish', 'fish_mutant_urchin', 'fish_mutant_wrymouth'];
                } else {
                    fishPool = ['fish_kelp', 'fish_kelp', 'fish_jellyfish', 'fish_jellyfish', 'fish_urchin', 'fish_flounder'];
                }
            } else if (area.includes('暗礁')) {
                // 暗礁池：海鰻、獅子魚、章魚
                // 15% 機率變異
                if (Math.random() < 0.15) {
                    fishPool = ['fish_mutant_eel', 'fish_mutant_lionfish', 'fish_mutant_octopus'];
                } else {
                    fishPool = ['fish_moray', 'fish_moray', 'fish_lionfish', 'fish_lionfish', 'fish_octopus'];
                }
            } else {
                // 🌟 深淵區域 (Abyss)
                // 15% 機率變異
                if (Math.random() < 0.15) {
                    fishPool = ['fish_mutant_angler', 'fish_mutant_glass'];
                } else {
                    fishPool = ['fish_angler', 'fish_angler', 'fish_glass_scale', 'fish_glass_scale', 'fish_kelp'];
                }
            }

            let catchId = fishPool[Math.floor(Math.random() * fishPool.length)];
            let f = ITEM_DB[catchId];
            
            game.inventory.push(catchId);
            game.log(`🕸️ 捕獲了 ${f.icon} ${f.name}！`, "color:var(--sonar)");
            
            if (game.codex && !game.codex.includes(catchId)) {
                game.codex.push(catchId);
                game.log(`✨ 圖鑑解鎖：${f.name}`, "color:var(--gold)");
            }
            return true; // 消耗道具
        }
    },
    // 🌟 新增：阿朵菈的守護玩偶
    'guardian_doll': {
        id: 'guardian_doll', name: '守護玩偶', 
        icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/%E7%8E%A9%E5%81%B6.png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '阿朵菈贈送的玩偶。帶在身上時，似乎能抵擋深淵的惡意 (SAN傷害減半)。',
        effect: (game) => { game.log("這是一個被動道具，放在背包即可生效。", "color:var(--sonar)"); return false; }
    },
    // --- 實體道具資料庫 (Item DB) 裡面新增以下內容 ---
    'bait': { 
        id: 'bait', name: '特製魚餌', icon: '🪱', 
        desc: '釣魚必備的消耗品，散發著奇妙的腥味。', 
        effect: (game) => { game.log("魚餌不能直接吃！", "color:var(--alert)"); return false; } 
    },
    'trash': {
        id: 'trash', name: '濕黏的垃圾', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_1%20(2).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '不知道是誰丟的，毫無價值。', type: 'fish', value: 1, habitat: '港口',
        effect: (game) => { return false; }
    },
    'fish_kelp': { 
        id: 'fish_kelp', name: '微光海草', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/%E6%B5%B7%E8%8D%89.png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '發著微光的植物，雖然不是魚但能賣點小錢。', type: 'fish', value: 35, habitat: '淺灘',
        effect: (game) => { return false; } 
    },
    'fish_sardine': { 
        id: 'fish_sardine', name: '鏽鱗沙丁魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/ffhh.png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '沿海常見的小魚，鱗片帶有金屬光澤。', type: 'fish', value: 75, habitat: '港口',
        effect: (game) => { return false; } 
    },
    'fish_crab': { 
        id: 'fish_crab', name: '斑駁海岸蟹', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/ttyh.png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '外殼堅硬的變異螃蟹，肉質鮮美。', type: 'fish', value: 150, habitat: '港口',
        effect: (game) => { return false; } 
    },
    'fish_mutant_crab': { 
        id: 'fish_mutant_crab', name: '詭異海岸蟹', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_4%20(1).png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '【變異】牠身上的甲殼受到侵蝕，看起來食用會中毒。', type: 'fish', value: 300, habitat: '港口',
        effect: (game) => { return false; } 
    },
    'fish_mutant_sardine': { 
        id: 'fish_mutant_sardine', name: '多眼沙丁魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_5%20(2).png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '【變異】魚身兩側長滿了不停轉動的混濁眼球。', type: 'fish', value: 180, habitat: '港口',
        effect: (game) => { return false; } 
    },
    // 🌟 新增：淺灘區域漁獲
    'fish_jellyfish': { 
        id: 'fish_jellyfish', name: '微光水母', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_2%20(4).png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '在淺水區隨波逐流，觸手散發著微弱的藍光。', type: 'fish', value: 70, habitat: '淺灘',
        effect: (game) => { return false; } 
    },
    'fish_mutant_jellyfish': { 
        id: 'fish_mutant_jellyfish', name: '神經索水母', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_4%20(2).png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '【變異】傘帽透明，裡面跳動著宛如人類大腦的組織。', type: 'fish', value: 200, habitat: '淺灘',
        effect: (game) => { return false; } 
    },
    'fish_urchin': { 
        id: 'fish_urchin', name: '鐵樹海膽', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_4%20(3).png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '長著如鋼鐵般堅硬黑刺的海膽，極難處理。', type: 'fish', value: 120, habitat: '淺灘',
        effect: (game) => { return false; } 
    },
    'fish_mutant_urchin': { 
        id: 'fish_mutant_urchin', name: '血肉海膽', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_8.png" style="width:1.2em;height:1.2em;vertical-align:middle;">', 
        desc: '【變異】刺是軟的骨骼，核心是一團不斷搏動的心臟。', type: 'fish', value: 280, habitat: '淺灘',
        effect: (game) => { return false; } 
    },
    'fish_flounder': {
        id: 'fish_flounder', name: '灰沙比目魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_3%20(2).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '完美的保護色讓牠能隱藏在淺灘的灰沙中。', type: 'fish', value: 95, habitat: '淺灘',
        effect: (game) => { return false; }
    },
    'fish_mutant_wrymouth': {
        id: 'fish_mutant_wrymouth', name: '裂口歪嘴魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_4%20(4).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】整張臉只有一張長滿了倒刺獠牙的巨大裂口。', type: 'fish', value: 240, habitat: '淺灘',
        effect: (game) => { return false; }
    },
    // 🌟 新增：暗礁區域漁獲
    'fish_moray': {
        id: 'fish_moray', name: '剃刀海鰻', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_1%20(3).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '牙齒像剃刀一樣鋒利，性格極度兇猛。', type: 'fish', value: 160, habitat: '暗礁',
        effect: (game) => { return false; }
    },
    'fish_mutant_eel': {
        id: 'fish_mutant_eel', name: '脊骨蛇鰻', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_1%20(4).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】皮肉已經腐爛脫落，完全靠著某種邪惡的能量驅動著蒼白的脊椎骨游動。', type: 'fish', value: 380, habitat: '暗礁',
        effect: (game) => { return false; }
    },
    'fish_lionfish': {
        id: 'fish_lionfish', name: '淵色獅子魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_10.png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '極具觀賞性但也極具毒性，是貴族喜歡的收藏品。', type: 'fish', value: 220, habitat: '暗礁',
        effect: (game) => { return false; }
    },
    'fish_mutant_lionfish': {
        id: 'fish_mutant_lionfish', name: '肉鬚畸變體', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_3%20(3).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】華麗的魚鰭變成了濕滑的肉色觸鬚，散發著令人作嘔的腥臭。', type: 'fish', value: 500, habitat: '暗礁',
        effect: (game) => { return false; }
    },
    'fish_octopus': {
        id: 'fish_octopus', name: '墨氅章魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_8%20(1).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '能噴出帶有強烈腐蝕性的高濃度墨汁。', type: 'fish', value: 280, habitat: '暗礁',
        effect: (game) => { return false; }
    },
    'fish_mutant_octopus': {
        id: 'fish_mutant_octopus', name: '非歐何畸變幼體', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_6.png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】牠的觸手數量和角度不符合常理的幾何學，看久了會讓人頭暈目眩。', type: 'fish', value: 650, habitat: '暗礁',
        effect: (game) => { return false; } 
    },
    // 🌟 新增：深淵區域漁獲
    'fish_angler': {
        id: 'fish_angler', name: '誘光鮟鱇', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_6%20(1).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '在漆黑深海中用幽藍的光芒吸引獵物，體型龐大。', type: 'fish', value: 350, habitat: '深淵',
        effect: (game) => { return false; }
    },
    'fish_mutant_angler': {
        id: 'fish_mutant_angler', name: '亡者提燈', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_6%20(1).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】牠頭頂的發光體裡，似乎困著無數微小的人影在痛苦掙扎。', type: 'fish', value: 800, habitat: '深淵',
        effect: (game) => { return false; }
    },
    'fish_glass_scale': {
        id: 'fish_glass_scale', name: '琉璃鱗毒魚', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_6%20(2).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '深海的高壓讓牠的鱗片像玻璃一樣透明且堅硬。', type: 'fish', value: 450, habitat: '深淵',
        effect: (game) => { return false; }
    },
    'fish_mutant_glass': {
        id: 'fish_mutant_glass', name: '溶血毒牙', icon: '<img src="https://file.garden/aWe99vhwaGcNwkok/%E6%B7%B1%E6%B5%B7%E8%BF%B7%E8%88%AA/%E9%81%93%E5%85%B7/item_5%20(3).png" style="width:1.2em;height:1.2em;vertical-align:middle;">',
        desc: '【變異】釣上來時牠吐出的唾液直接融穿了甲板，血液是螢光綠色的。', type: 'fish', value: 950, habitat: '深淵',
        effect: (game) => { return false; }
    }
};

// --- 新增：BOSS 資料 ---
const BOSS_DATA = {
    name: '舊日支配者 - 克拉肯',
    hp: 3000, // BOSS 血量 (優化體驗)
    attacks: [
        { msg: "巨大的觸手重擊船體！(HP -25)", effect: (game)=>{ game.hp-=25; } },
        { msg: "克拉肯發出精神衝擊！(SAN -30)", effect: (game)=>{ game.san-=30; } },
        { msg: "深淵凝視著你們... (全體疲勞 +25)", effect: (game)=>{ game.fatigue+=25; } },
        { msg: "觸手纏繞住引擎！(觸發危機：引擎過熱)", effect: (game)=>{ game.addCrisis('engine_fire'); } }
    ]
};

// --- 新增：創傷資料庫 ---
const TRAUMA_DB = [
    { id: 'paranoid', name: '被害妄想', desc: '拒絕執行指令' },
    { id: 'reckless', name: '狂躁', desc: '破壞船體' },
    { id: 'abyss_gaze', name: '深淵凝視', desc: '增加全體疲勞' },
    { id: 'hallucination', name: '幻覺', desc: '傳染瘋狂' }
];

// --- 💬 沉浸式對話資料庫 (Chat DB) ---
const CHAT_DB = {
    'peter_win': {
        0: {
            face: 'peter', speaker: '彼得',
            msg: '「你們居然真的活著回來了...而且還帶著那頭怪物的死訊。」<br><br>彼得長長地吐出一口氣。他頭上那頂王冠今天看起來稍微端正了一點。',
            choices: [
                { text: '「你腰間那瓶『聖水』到底是什麼？」', next: 1 },
                { text: '「你頭上那頂王冠挺別緻的。」', next: 2 },
                { text: '「第七星區接下來會怎樣？」', next: 3 }
            ]
        },
        1: {
            face: 'peter', speaker: '彼得',
            msg: '「咳... 這是極度純化的工業級除靈液！對抗深淵邪祟有奇效！」<br><br><span style="color:#aaa">（瞥了一眼標籤，上面隱約寫著『強效潔廁靈』，決定還是不要拆穿他比較好。）</span>',
            choices: [{ text: '「...真有你的，村長。」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'peter', speaker: '彼得',
            msg: '「這個？只是一個... 用來維持秩序的象徵罷了。在這種瘋狂的地方，總得有人扮演國王，人們才會有依靠。」<br><br>他的眼神閃過一絲深沉，但很快又恢復了原本的模樣。',
            choices: [{ text: '「你們做得很好。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'peter', speaker: '彼得',
            msg: '「航線會重新開放，那些該死的觸手不會再掀翻商船了。<br>我們... 我們終於不用在等死了。這座小鎮欠你們一個巨大的人情。」',
            choices: [{ text: '「這是我們該做的。」 (結束對話)', next: -1 }]
        }
    },
    'lynn_win': {
        0: {
            face: 'lynn', speaker: '林恩',
            msg: '「彼得那傢伙剛才居然笑了，真是見鬼了。」<br><br>林恩整理著櫃台的物資，連頭都沒抬，但嘴角卻微微上揚。「既然深淵威脅解除了，以後進貨的路也會好走一點。」',
            choices: [
                { text: '「看在我拯救小鎮的份上，打個折吧？」', next: 1 },
                { text: '「你跟彼得的關係滿好的嘛。」', next: 2 },
                { text: '「你還要收購那些畸變的漁獲嗎？」', next: 3 }
            ]
        },
        1: {
            face: 'lynn', speaker: '林恩',
            msg: '「你在作夢嗎？但我可以之後『考慮』少坑你一點，但，現在考慮還沒開始。特製魚餌不打折，要買快買。」',
            choices: [{ text: '「還是一樣黑心啊...」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'lynn', speaker: '林恩',
            msg: '「誰跟他關係好？他只是把我當成某種『不會中邪的護身符』而已。我留在這裡純粹是因為他給的租金很便宜。」',
            choices: [{ text: '「口是心非。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'lynn', speaker: '林恩',
            msg: '「收啊，為什麼不收？外面那些變態貴族對這種深淵生物可是出價極高。你最好多釣一點，別讓我無聊。」',
            choices: [{ text: '「......知道了。」 (結束對話)', next: -1 }]
        }
    },
    'costa_win': {
        0: {
            face: 'costa', speaker: '科絲塔',
            msg: '「你們做到了！」<br><br>小女孩抱著一隻粉色的小馬玩偶，高興地在原地轉圈。「我本來以為... 之後要去海上幫你們掃墓了BATA！」',
            choices: [
                { text: '「妳抱著的那個PONY玩偶是哪來的？」', next: 1 },
                { text: '「不用再趕時間了，科絲塔。」', next: 2 },
                { text: '「妳現在是甚麼身分？」', next: 3 }
            ]
        },
        1: {
            face: 'costa', speaker: '科絲塔',
            msg: '「一點都不重！這可是我的寶貝！它可以把引擎修好，也可以把那些想偷溜上岸的變異螃蟹敲碎喔！」<br><br>她露出了一個天真但略帶殺氣的笑容。',
            choices: [{ text: '「...真可靠。」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'costa', speaker: '科絲塔',
            msg: '「因為海浪平靜下來了，這是小目哥哥跟那邊的商人買給我的BATA！」',
            choices: [{ text: '「好哦。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'costa', speaker: '科絲塔',
            msg: '「嗯？小瓜現在是被創造出來的機關學徒喔！我不需要像你們一樣吃東西，但我很喜歡看著大家一起吃飯的樣子！」',
            choices: [{ text: '「妳是很棒的同伴。」 (結束對話)', next: -1 }]
        }
    },
    'lilith_win': {
        0: {
            face: 'lilith', speaker: '莉莉絲',
            msg: '「哎呀~看看是誰成了第七星區的英雄？」<br><br>莉莉絲優雅地擦著酒杯，為你倒了一杯散發著微光的烈酒。「這座港口已經很久沒有這麼充滿生機了。」',
            choices: [
                { text: '「這杯發光的酒是什麼？」', next: 1 },
                { text: '「傭兵們反應如何？」', next: 2 },
                { text: '「莉莉絲，妳的過去是？」', next: 3 }
            ]
        },
        1: {
            face: 'lilith', speaker: '莉莉絲',
            msg: '「這叫『深淵之吻』，用微光海草釀的。第一杯免費請你，第二杯... 可能就要用你們的靈魂來換哦~」',
            choices: [{ text: '「那我們......先婉拒。」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'lilith', speaker: '莉莉絲',
            msg: '「他們都在為你歡呼呢。拿但業少爺甚至還贏了腓力五十塊錢，因為他們打賭你能不能活著回來。」',
            choices: [{ text: '「真是群無聊的傢伙。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'lilith', speaker: '莉莉絲',
            msg: '「我？我只是一個普通的酒館老闆娘呀~我傾聽、我倒酒、我在亂世中生存下來... 各位英雄，知道這點就夠了~」',
            choices: [{ text: '「敬妳一杯。」 (結束對話)', next: -1 }]
        }
    },
    'manmu_win': {
        0: {
            face: 'manmu', speaker: '小目',
            msg: '「哼，區區一隻深海大章魚，也敢攔本總裁的路？我可是世界上最棒的總裁！只要有我在，就絕對不允許它傷害我的芒果一根頭髮！✨」<br><br>小目隨手撥了一下他粉黃漸層的短髮，擺出一個自認非常帥氣的姿勢。',
            choices: [
                { text: '「你剛剛呼叫軌道重砲到底花了多少錢...」', next: 1 },
                { text: '「芒果是指... 茉莉？」', next: 2 },
                { text: '「既然你這麼有錢，能幫我付修船費嗎？」', next: 3 }
            ]
        },
        1: {
            face: 'manmu', speaker: '小目',
            msg: '「這點小錢算什麼！為了愛與和平，就算把第七星區的武裝衛星全買下來，我連眉頭都不會皺一下！當然，發票我已經讓助理寄給林恩了，畢竟本總裁可是很注重現金流的！」',
            choices: [{ text: '「林恩看到發票會殺了你吧。」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'manmu', speaker: '小目',
            msg: '「沒錯！我的芒果是全世界最好心、最可愛的先生！💖 我努力賺錢、成為呼風喚雨的總裁，就是為了讓他能安心依靠我！哎呀，不說了，我要趕快去向他撒嬌了～」',
            choices: [{ text: '「祝你們幸福。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'manmu', speaker: '小目',
            msg: '「那可不行，一碼歸一碼。雖然我現在滿心滿眼只有我的芒果，但我可是個精明的生意人。不過看在我們剛拯救了世界的份上，下次搭我的私人潛艇，算你們八折！」',
            choices: [{ text: '「還真是謝謝你喔總裁。」 (結束對話)', next: -1 }]
        }
    },
    'hassel_win': {
        0: {
            face: 'hassel', speaker: '哈蘇',
            msg: '「目標：舊日支配者克拉肯，生命體徵已確認歸零。航行任務狀態：完成，我有記。」',
            choices: [
                { text: '「你在記什麼？」', next: 1 },
                { text: '「你為什麼說話總是這麼... 制式化？」', next: 2 },
                { text: '「接下來有什麼打算？」', next: 3 }
            ]
        },
        1: {
            face: 'hassel', speaker: '哈蘇',
            msg: '「我正在記錄克拉肯觸手的幾何不規則性。這種超出邏輯的構造... 讓我有些過載。（他微微皺起眉頭）不過，這是不錯的觀察經驗。我有記。」',
            choices: [{ text: '「你別當機就好。」 (結束對話)', next: -1 }]
        },
        2: {
            face: 'hassel', speaker: '哈蘇',
            msg: '「...... 別人似乎常覺得跟我溝通很費時間。但這不妨礙我記錄那些溫馨的事物。」',
            choices: [{ text: '「其實聽久了還滿習慣的。」 (結束對話)', next: -1 }]
        },
        3: {
            face: 'hassel', speaker: '哈蘇',
            msg: '「找一個溫馨的地方，整理筆記本。小瓜（科絲塔）提過，這裡的旅館大廳有一個不錯的暖爐。旅館，溫馨，安全。不錯的地點，我有記。」',
            choices: [{ text: '「去吧，好好休息。」 (結束對話)', next: -1 }]
        }
    }
};