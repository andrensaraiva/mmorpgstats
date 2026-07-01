/* =========================================================
   BuildsWar :: dados demonstrativos + modelo de poder
   Ids/versões estáveis; nada aqui é balanceamento final.
   ========================================================= */

const DB = {
  meta: { league: "Cinzas do Abismo", engine: "sim-0.1.0", seed: "0x9F3C-AB12" },

  // base por build (dps-base em milhões antes de multiplicadores da build;
  // ehp = vida efetiva; fireBase = res. fogo %)
  baseStats: {
    balanced:  { dps: 1.7, ehp: 7800,  fireBase: 30, name: "Equilibrada" },
    offensive: { dps: 2.2, ehp: 5200,  fireBase: 22, name: "Ofensiva" },
    defensive: { dps: 1.2, ehp: 11000, fireBase: 38, name: "Defensiva" },
  },

  character: {
    name: "Vheyra, a Cinza",
    className: "Marcial — Rompe-Ferro",
    level: 42,
    activeBuild: "offensive",
    builds: [
      { id: "balanced",  name: "Equilibrada", note: "conclui a dungeon com folga" },
      { id: "offensive", name: "Ofensiva",    note: "chega rápido ao chefe — frágil ao fogo" },
      { id: "defensive", name: "Defensiva",   note: "vence mais devagar, sobrevive ao chefe" },
    ],
    resources: [
      { id: "hp", label: "Vida", cur: 2840, max: 3120, cls: "rbar--hp" },
      { id: "mp", label: "Recurso", cur: 96, max: 140, cls: "rbar--mp" },
      { id: "rs", label: "Reserva", cur: 55, max: 100, cls: "rbar--rs" },
    ],
    attrs: [
      { k: "Força", v: "214" }, { k: "Destreza", v: "88" }, { k: "Inteligência", v: "61" },
      { k: "Vel. de ataque", v: "1.42/s" }, { k: "Crítico", v: "38% · x2.1" }, { k: "Bloqueio", v: "41%" },
      { k: "Armadura", v: "6.420" }, { k: "Evasão", v: "1.180" }, { k: "Regen. vida", v: "84/s" },
    ],
  },

  // habilidades ativas + soquetes de suporte
  skills: [
    { id:"sk_strike", name:"Golpe Rompedor", type:"atk", glyph:"⚔",
      tags:["ataque","corpo-a-corpo","físico"], meta:"ATIVA · custo 8 · exec 0.7s",
      desc:"Ataque pesado de alvo único que ignora parte da armadura.", base: 0.42,
      sockets:["s_blood","s_brutal"] },
    { id:"sk_wave", name:"Onda Sísmica", type:"spell", glyph:"◈",
      tags:["ataque","área","físico","atordoamento"], meta:"ATIVA · custo 18 · rec 3.5s",
      desc:"Fende o solo à frente, dano em área e atordoa grupos.", base: 0.33,
      sockets:["s_aoe","s_concuss"] },
    { id:"sk_stance", name:"Postura de Ferro", type:"def", glyph:"◉",
      tags:["defesa","persistente","bloqueio"], meta:"ATIVA · rec 9s · dur 4s",
      desc:"Reduz o dano recebido e eleva o bloqueio por um curto período.", base: 0,
      sockets:["s_dur"] },
    { id:"sk_banner", name:"Estandarte do Bastião", type:"aura",
      glyph:"†", tags:["persistente","reserva","aura","defesa"], meta:"RESERVA · reserva 55",
      desc:"Efeito persistente: concede armadura e regeneração enquanto ativo.", base: 0,
      sockets:[] },
  ],

  // banca de suportes (compatível por interseção de tags)
  supports: [
    { id:"s_blood",   name:"Sede de Sangue",       match:["ataque"],               dps:0.15, note:"+15% dano de ataque" },
    { id:"s_brutal",  name:"Impacto Brutal",       match:["físico"],               dps:0.20, note:"+20% dano físico" },
    { id:"s_crit",    name:"Precisão Mortal",      match:["ataque"],               dps:0.12, note:"+crítico e multiplicador" },
    { id:"s_concuss", name:"Concussão",            match:["ataque","atordoamento"],dps:0.06, note:"acumula atordoamento" },
    { id:"s_aoe",     name:"Alcance Ampliado",     match:["área"],                 dps:0.04, note:"+40% área de efeito" },
    { id:"s_cleave",  name:"Fenda Profunda",       match:["área","físico"],        dps:0.14, note:"+14% dano em área" },
    { id:"s_dur",     name:"Duração Estendida",    match:["persistente","defesa"], dps:0.00, note:"+50% duração", ehp:0.04 },
    { id:"s_fort",    name:"Reforço",              match:["defesa"],               dps:0.00, note:"+8% vida efetiva", ehp:0.08 },
    { id:"s_reserve", name:"Eficiência de Reserva",match:["reserva","persistente"],dps:0.00, note:"-15% reserva" },
  ],

  behavior: [
    { when: "SE vida < 40%", then: "usar Poção de Vida" },
    { when: "SE inimigos ≥ 3", then: "usar Onda Sísmica" },
    { when: "SE alvo for CHEFE", then: "manter Postura de Ferro" },
    { when: "SE recurso < 20%", then: "usar ataque básico" },
    { when: "AO bloquear", then: "usar Golpe Rompedor" },
  ],

  // 9 slots POE-style. grid 3x3 (ver equip layout no app)
  equipment: {
    "Arma": { slot:"Arma", name:"Britadora do Fosso", base:"Machado de Guerra", rarity:"rare",
      ilvl:74, implicit:"+18% dano físico",
      affixes:[{t:"P·T4",x:"Adiciona 44–72 dano físico"},{t:"P·T3",x:"+62% dano físico aumentado"},{t:"S·T5",x:"+9% velocidade de ataque"},{t:"S·T4",x:"+26% multiplicador de crítico"}],
      req:"Nível 68 · Força 155" },
    "Cabeça": { slot:"Cabeça", name:"Elmo do Vigia", base:"Elmo de Placas", rarity:"magic",
      ilvl:66, implicit:"+120 armadura",
      affixes:[{t:"P·T3",x:"+186 vida máxima"},{t:"S·T4",x:"+31% res. a frio"}], req:"Nível 60 · Força 98" },
    "Secundária": { slot:"Secundária", name:"—", base:"vazio (arma de 2 mãos)", rarity:"empty" },
    "Luvas": { slot:"Luvas", name:"Manoplas Rachadas", base:"Manoplas de Placas", rarity:"magic",
      ilvl:60, implicit:"+64 armadura",
      affixes:[{t:"P·T4",x:"+12% dano físico"},{t:"S·T5",x:"+8% velocidade de ataque"}], req:"Nível 55 · Força 84" },
    "Torso": { slot:"Torso", name:"Couraça das Cinzas", base:"Peitoral de Placas", rarity:"rare",
      ilvl:72, implicit:"+220 armadura",
      affixes:[{t:"P·T2",x:"+312 vida máxima"},{t:"P·T4",x:"+18% armadura aumentada"},{t:"S·T3",x:"+38% res. a raio"},{t:"S·T6",x:"+14% res. a fogo"}],
      req:"Nível 66 · Força 140" },
    "Amuleto": { slot:"Amuleto", name:"Selo do Juramento", base:"Amuleto de Âmbar", rarity:"rare",
      ilvl:70, implicit:"+24 Força",
      affixes:[{t:"P·T3",x:"+42 Força"},{t:"S·T3",x:"+28% res. a raio"},{t:"S·T5",x:"+9% res. a fogo"}], req:"Nível 64" },
    "Anel II": { slot:"Anel II", name:"Elo Trincado", base:"Anel de Cobre", rarity:"common",
      ilvl:40, implicit:"+12% res. a todos elementos", affixes:[], req:"—", isWeak:true },
    "Botas": { slot:"Botas", name:"Passos de Brasa", base:"Grevas de Malha", rarity:"rare",
      ilvl:68, implicit:"+15% vel. de movimento",
      affixes:[{t:"P·T3",x:"+158 vida máxima"},{t:"S·T4",x:"+30% res. a frio"},{t:"S·T5",x:"+11% res. a fogo"}], req:"Nível 58 · Destreza 70" },
    "Anel I": { slot:"Anel I", name:"Aro de Ferro-Vivo", base:"Anel de Ferro", rarity:"magic",
      ilvl:62, implicit:"+2 dano físico",
      affixes:[{t:"P·T4",x:"+88 vida máxima"},{t:"S·T5",x:"+22% res. a frio"}], req:"—" },
  },

  // layout do manequim (3 colunas x 3 linhas)
  dollLayout: [
    ["Arma","Cabeça","Secundária"],
    ["Luvas","Torso","Amuleto"],
    ["Anel II","Botas","Anel I"],
  ],

  // item do inventário que resolve a derrota por fogo
  fireRing: {
    slot:"Anel II", name:"Guarda-Chama", base:"Anel de Rubi", rarity:"unique",
    ilvl:72, implicit:"+28% res. a fogo",
    affixes:[
      {t:"único",x:"+49% res. a fogo"},
      {t:"único",x:"Imune a Queimadura com a vida cheia"},
      {t:"único",x:"Regenera 2% da vida por segundo em chamas"},
    ],
    req:"Nível 70", uniqueFlavor:"\"O fogo lembra quem o desafiou.\"",
  },

  // árvore: nós com pesos de poder (w)
  passives: {
    maxPoints: 8,
    preAlloc: ["s0","o1","o2","o3"],
    nodes: [
      { id:"s0", x:400, y:300, type:"start", path:"start", name:"Origem Marcial", stat:"+10 Força", w:{} },

      { id:"o1", x:492, y:262, type:"small",    path:"off", name:"Lâmina Afiada", stat:"+12% dano físico", w:{dps:0.06} },
      { id:"o2", x:576, y:228, type:"small",    path:"off", name:"Fúria",         stat:"+8% vel. de ataque", w:{dps:0.06} },
      { id:"o6", x:582, y:312, type:"small",    path:"off", name:"Precisão",      stat:"+140 precisão", w:{dps:0.05} },
      { id:"o3", x:664, y:262, type:"notable",  path:"off", name:"Carniceiro",    stat:"+28% dano físico, +12% crítico", w:{dps:0.16} },
      { id:"o4", x:748, y:232, type:"small",    path:"off", name:"Impiedade",     stat:"+18% multi. de crítico", w:{dps:0.08} },
      { id:"o5", x:812, y:276, type:"keystone", path:"off", name:"Coração de Brasa", stat:"KEYSTONE: +40% dano, mas não regenera vida", w:{dps:0.40, ehpPen:0.15} },

      { id:"d1", x:314, y:352, type:"small",    path:"def", name:"Pele Dura",     stat:"+140 armadura", w:{ehp:0.05} },
      { id:"d2", x:242, y:394, type:"small",    path:"def", name:"Vigor",         stat:"+80 vida máxima", w:{ehp:0.06} },
      { id:"d6", x:256, y:318, type:"small",    path:"def", name:"Baluarte",      stat:"+4% bloqueio", w:{ehp:0.03} },
      { id:"d3", x:172, y:378, type:"notable",  path:"def", name:"Muralha Viva",  stat:"+18% armadura, +6% bloqueio", w:{ehp:0.12} },
      { id:"d4", x:112, y:414, type:"small",    path:"def", name:"Cerne Térmico", stat:"+16% res. a fogo", w:{fire:16} },
      { id:"d5", x:52,  y:378, type:"keystone", path:"def", name:"Juramento de Pedra", stat:"KEYSTONE: bloqueio 75%, mas -30% dano", w:{ehp:0.10, dpsPen:0.30} },

      { id:"u1", x:414, y:214, type:"small",    path:"util", name:"Fôlego",       stat:"+12% recurso máx.", w:{} },
      { id:"u2", x:436, y:140, type:"small",    path:"util", name:"Reserva",      stat:"-10% custo de reserva", w:{} },
      { id:"u3", x:372, y:96,  type:"notable",  path:"util", name:"Estrategista", stat:"+1 soquete de suporte por habilidade", w:{supportCap:1} },
      { id:"u4", x:456, y:72,  type:"small",    path:"util", name:"Presteza",     stat:"+8% vel. de conjuração", w:{dps:0.03} },
      { id:"u5", x:372, y:34,  type:"keystone", path:"util", name:"Mente Fria",   stat:"KEYSTONE: +5% dano, gatilhos custam metade", w:{dps:0.05} },
    ],
    edges: [
      ["s0","o1"],["o1","o2"],["o2","o3"],["o3","o4"],["o4","o5"],["o1","o6"],["o6","o3"],
      ["s0","d1"],["d1","d2"],["d2","d3"],["d3","d4"],["d4","d5"],["d1","d6"],["d6","d3"],
      ["s0","u1"],["u1","u2"],["u2","u3"],["u3","u4"],["u4","u5"],
    ],
  },

  // dungeons: diff = poder exigido; fireThreat = chefe/área ígnea; fireReq = res. mínima
  dungeons: [
    { id:"d-crypt",   name:"Cripta dos Suspiros", biome:"Necrópole",   lvl:44, diff:5.6, fireThreat:true,  fireReq:45, sel:true,
      mods:["Grupos numerosos","Dano físico elevado","Chefe ígneo (fase 2)"],
      desc:"Corredores estreitos e mortos-vivos em bando; o carrasco incendeia a arena na fase final." },
    { id:"d-forge",   name:"Fornalha Rachada", biome:"Caverna Ígnea", lvl:46, diff:6.6, fireThreat:true,  fireReq:55,
      mods:["Dano de fogo intenso","Chão em chamas","Elite adicional"],
      desc:"Rios de lava e sentinelas de brasa. Pune quem entra com pouca resistência a fogo." },
    { id:"d-glacier", name:"Sepulcro Glacial", biome:"Geleira",       lvl:45, diff:5.9, fireThreat:false, fireReq:0,
      mods:["Lentidão","Dano de frio","Recurso reduzido"],
      desc:"O frio drena o recurso e retarda ataques. Exige gestão de recurso e mitigação de frio." },
    { id:"d-abyss",   name:"Fenda das Cinzas", biome:"Abismo Sazonal", lvl:48, diff:8.0, fireThreat:true, fireReq:60, season:true,
      mods:["Mecânica sazonal","Inimigos fortalecidos","Fragmentos exclusivos"],
      desc:"Encontro opcional da temporada: aceite o risco, colha fragmentos e enfrente o chefe sazonal." },
  ],

  rankings: {
    depth: [
      { nm:"Kaelros", cls:"Precisão", sc:"Prof. 214" },
      { nm:"Vheyra, a Cinza", cls:"Marcial", sc:"Prof. 198", you:true },
      { nm:"Nyx Umbral", cls:"Arcana", sc:"Prof. 187" },
      { nm:"Dain Ferro-Vivo", cls:"Marcial", sc:"Prof. 176" },
      { nm:"Sella Vento", cls:"Precisão", sc:"Prof. 170" },
    ],
    dps: [
      { nm:"Nyx Umbral", cls:"Arcana", sc:"4.82 M" },
      { nm:"Corvo Cego", cls:"Precisão", sc:"4.11 M" },
      { nm:"Vheyra, a Cinza", cls:"Marcial", sc:"3.74 M", you:true },
    ],
    hardcore: [
      { nm:"Ossian", cls:"Marcial", sc:"Nv. 91" },
      { nm:"Lira Prateada", cls:"Arcana", sc:"Nv. 88" },
      { nm:"Torv", cls:"Precisão", sc:"Nv. 84" },
    ],
  },

  market: [
    { name:"Guarda-Chama", base:"Anel de Rubi", rarity:"unique", price:"420", coin:"Selos", seller:"vendedor_ashen", lvl:70 },
    { name:"Ceifador Trovejante", base:"Foice Curva", rarity:"rare", price:"1.240", coin:"Selos", seller:"tradehall_02", lvl:72 },
    { name:"Manto do Náufrago", base:"Túnica de Seda", rarity:"rare", price:"860", coin:"Selos", seller:"nyx_market", lvl:68 },
    { name:"Elo de Safira", base:"Anel de Safira", rarity:"magic", price:"95", coin:"Selos", seller:"cold_dealer", lvl:60 },
    { name:"Coração do Vulcão", base:"Amuleto de Rubi", rarity:"unique", price:"2.100", coin:"Selos", seller:"tradehall_02", lvl:74 },
    { name:"Grevas Ligeiras", base:"Botas de Couro", rarity:"magic", price:"55", coin:"Selos", seller:"swift_boots", lvl:52 },
  ],

  news: [
    { date:"01 JUL", cat:"Temporada", title:"Cinzas do Abismo começou!",
      body:"A liga oficial reiniciou economia e rankings. A mecânica 'Fenda das Cinzas' concede fragmentos e um chefe com tabela de drop própria." },
    { date:"28 JUN", cat:"Motor", title:"Tempo de dungeon agora escala com o poder do herói",
      body:"Quanto mais forte a build, menor o tempo simulado de conclusão — mas defesa insuficiente ainda mata, por mais dano que você tenha." },
    { date:"25 JUN", cat:"Ligas", title:"Ligas privadas: proíba classes, raridades ou o comércio",
      body:"Crie um campeonato entre amigos com regras congeladas e ladder isolada." },
  ],

  ticker: [
    { txt:"Guarda-Chama", c:"un", who:"ashen_v" },
    { txt:"Ceifador Trovejante", c:"rc", who:"tradehall_02" },
    { txt:"Elo de Safira", c:"mg", who:"cold_dealer" },
    { txt:"Coração do Vulcão", c:"un", who:"nyx_market" },
    { txt:"Britadora do Fosso", c:"rc", who:"você" },
  ],
};
