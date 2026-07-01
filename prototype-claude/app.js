/* =========================================================
   BuildsWar :: app (vanilla, sem build, roda em file://)
   ========================================================= */

(function () {
  "use strict";

  var C = DB.character;

  /* ---------- lookups ---------- */
  var supportById = {}; DB.supports.forEach(function (s) { supportById[s.id] = s; });
  var skillById = {};   DB.skills.forEach(function (s) { skillById[s.id] = s; });
  var nodeById = {};    DB.passives.nodes.forEach(function (n) { nodeById[n.id] = n; });
  var adjacency = {};
  DB.passives.edges.forEach(function (e) {
    (adjacency[e[0]] = adjacency[e[0]] || []).push(e[1]);
    (adjacency[e[1]] = adjacency[e[1]] || []).push(e[0]);
  });

  /* ---------- state ---------- */
  var state = {
    page: "portal",
    selectedDungeon: "d-crypt",
    fireEquipped: false,
    alloc: null,
    sockets: null,
    tree: { scale: 1, tx: 0, ty: 0 },
  };
  function initStateOnce() {
    if (!state.alloc) { state.alloc = {}; DB.passives.preAlloc.forEach(function (id) { state.alloc[id] = true; }); }
    if (!state.sockets) { state.sockets = {}; DB.skills.forEach(function (s) { state.sockets[s.id] = s.sockets.slice(); }); }
  }

  /* ---------- helpers ---------- */
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function rarClass(r) { return "rar-" + r; }
  function borderClass(r) { return "b-" + r; }
  function glyphFor(base) { return (base || "?").trim().charAt(0).toUpperCase(); }
  function fmtTime(sec) {
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    if (m <= 0) return s + "s";
    return m + "m " + (s < 10 ? "0" + s : s) + "s";
  }

  /* ===================== POWER MODEL ===================== */
  function computeStats() {
    initStateOnce();
    var b = DB.baseStats[C.activeBuild];
    var dpsMult = 1, ehpMult = 1, fire = b.fireBase, dpsPen = 0, ehpPen = 0, supportCap = 2;

    Object.keys(state.alloc).forEach(function (id) {
      var w = (nodeById[id] || {}).w || {};
      dpsMult += w.dps || 0; ehpMult += w.ehp || 0; fire += w.fire || 0;
      dpsPen += w.dpsPen || 0; ehpPen += w.ehpPen || 0; supportCap += w.supportCap || 0;
    });

    var supDps = 0, supEhp = 0;
    Object.keys(state.sockets).forEach(function (sk) {
      state.sockets[sk].forEach(function (sid) {
        var sup = supportById[sid]; if (!sup) return;
        supDps += sup.dps || 0; supEhp += sup.ehp || 0;
      });
    });
    dpsMult += supDps; ehpMult += supEhp;
    if (state.fireEquipped) fire += 49;

    var dps = b.dps * dpsMult * (1 - dpsPen);
    var ehp = Math.round(b.ehp * ehpMult * (1 - ehpPen));
    fire = Math.max(-60, Math.min(75, Math.round(fire)));
    return { dps: dps, ehp: ehp, fireRes: fire, supportCap: supportCap };
  }

  function skillDps(skill) {
    var mult = 1;
    (state.sockets[skill.id] || []).forEach(function (sid) { mult += (supportById[sid] || {}).dps || 0; });
    return skill.base * mult; // relativo
  }

  function powerbar(stats) {
    var fireWarn = stats.fireRes < 45;
    return '<div class="powerbar">' +
      pstat("Poder (DPS)", "dmg", stats.dps.toFixed(2) + " M", "dano por segundo") +
      pstat("Vida efetiva", "def", stats.ehp.toLocaleString("pt-BR"), "sobrevivência") +
      pstat("Res. Fogo", fireWarn ? "warn" : "fire", stats.fireRes + "%", fireWarn ? "baixa — risco ígneo" : "adequada") +
      pstat("Soquetes", "", stats.supportCap + "/hab.", "suportes por habilidade") +
    "</div>";
  }
  function pstat(k, cls, v, sub) {
    return '<div class="pstat"><div class="pk">' + k + '</div><div class="pv ' + cls + '">' + v + '</div><div class="psub">' + sub + "</div></div>";
  }

  /* ---------- item tooltip ---------- */
  function itemTip(it) {
    var aff = (it.affixes || []).map(function (a) {
      if (a.t === "único") return '<div class="it-uniq">' + a.x + "</div>";
      return '<div class="it-aff"><span class="t">' + a.t + "</span> " + a.x + "</div>";
    }).join("");
    var impl = it.implicit ? '<div class="it-impl">' + it.implicit + "</div>" : "";
    var uf = it.uniqueFlavor ? '<div class="it-uniq" style="margin-top:6px">' + it.uniqueFlavor + "</div>" : "";
    return '<div class="itip">' +
      '<div class="it-name ' + rarClass(it.rarity) + '">' + it.name + "</div>" +
      '<div class="it-base">' + it.base + (it.ilvl ? " · nv item " + it.ilvl : "") + "</div>" +
      (impl || aff ? '<div class="it-sep"></div>' : "") + impl + aff + uf +
      (it.req ? '<div class="it-req">Requisitos: ' + it.req + "</div>" : "") + "</div>";
  }

  function panel(title, body, right) {
    return '<section class="panel"><div class="panel__head"><span class="ph-l">' + title + "</span>" +
      (right ? "<span>" + right + "</span>" : "") + '</div><div class="panel__body">' + body + "</div></section>";
  }
  function pageHead(title, crumb) {
    return '<div class="page-head"><div class="crumb">BuildsWar / ' + crumb + '</div><h2>' + title + "</h2></div>";
  }
  function ladder(rows) {
    return '<table class="ladder"><thead><tr><th></th><th>Herói</th><th style="text-align:right">Recorde</th></tr></thead><tbody>' +
      rows.map(function (row, i) {
        return '<tr class="' + (row.you ? "you" : "") + '"><td class="rk">' + (i + 1) + "</td>" +
          '<td><span class="nm">' + row.nm + '</span><br><span class="cls">' + row.cls + "</span></td>" +
          '<td class="sc">' + row.sc + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  /* ===================== PAGES ===================== */
  var PAGES = {};

  /* ---- Portal ---- */
  PAGES.portal = function () {
    var news = DB.news.map(function (n) {
      return '<div class="news__item"><span class="news__date">' + n.date + '</span><span class="news__cat">' + n.cat +
        '</span><div class="news__title">' + n.title + '</div><div class="news__body">' + n.body + "</div></div>";
    }).join("");
    var builds = C.builds.map(function (b) {
      return '<div class="dcard' + (b.id === C.activeBuild ? " sel" : "") + '" data-build="' + b.id + '">' +
        '<div class="dname">' + b.name + (b.id === C.activeBuild ? ' <span class="tiny" style="color:var(--blood-hi)">ATIVA</span>' : "") + "</div>" +
        '<div class="ddesc">' + b.note + "</div></div>";
    }).join("");
    var t = DB.ticker.map(function (d) { return '<b>' + d.who + '</b> obteve <span class="' + d.c + '">' + d.txt + "</span>"; }).join("&nbsp;&nbsp;&#10022;&nbsp;&nbsp;");
    var stats = computeStats();

    return pageHead("Portal", "Notícias da Liga Cinzas do Abismo") +
      '<div class="layout-2"><div>' +
        panel('<span>Boas-vindas, estrategista</span>',
          '<div class="small">Você não controla os golpes — constrói a máquina que vence. Escolha uma build, envie a heroína à dungeon e leia o relatório. O combate é calculado pelo servidor.</div>' +
          '<div class="hr-orn"></div><div class="eyebrow" style="margin-bottom:8px">Trocar loadout de build</div><div class="dsel">' + builds + "</div>") +
        panel("Poder de combate atual", powerbar(stats) +
          '<div class="tiny muted" style="margin-top:8px">Reforce dano na árvore ou nos suportes e as dungeons ficam mais rápidas — mas mantenha a resistência a fogo, ou o chefe ígneo te mata.</div>') +
        panel("Diário da Liga", '<div class="news">' + news + "</div>") +
      '</div><div>' +
        panel("Ladder — Profundidade", ladder(DB.rankings.depth)) +
        panel("Últimos Drops", '<div class="ticker"><div class="ticker__track">' + t + "&nbsp;&nbsp;&#10022;&nbsp;&nbsp;" + t + "</div></div>") +
        panel("Estado do Servidor",
          '<div class="attr"><span class="k"><span class="dot dot--on"></span> Liga</span><span class="v">ONLINE</span></div>' +
          '<div class="attr"><span class="k">Motor</span><span class="v">' + DB.meta.engine + "</span></div>" +
          '<div class="attr"><span class="k">Tentativas hoje</span><span class="v">18.402</span></div>') +
      "</div></div>";
  };

  /* ---- Personagem ---- */
  PAGES.personagem = function () {
    var stats = computeStats();
    var attrs = C.attrs.map(function (a) { return '<div class="attr"><span class="k">' + a.k + '</span><span class="v">' + a.v + "</span></div>"; }).join("");
    var rbars = C.resources.map(function (b) {
      var pct = Math.round((b.cur / b.max) * 100);
      return '<div class="rbar ' + b.cls + '"><div class="rbar__label"><span>' + b.label + "</span><span>" + b.cur + " / " + b.max + '</span></div><div class="rbar__track"><div class="rbar__fill" style="width:' + pct + '%"></div></div></div>';
    }).join("");
    var resList = [
      { k: "Res. Fogo", v: stats.fireRes + "%", cls: "res-fire" },
      { k: "Res. Frio", v: "48%", cls: "res-cold" },
      { k: "Res. Raio", v: "40%", cls: "res-lit" },
      { k: "Res. Corrupção", v: "-12%", cls: "res-chaos" },
    ].map(function (a) { return '<div class="attr ' + a.cls + '"><span class="k">' + a.k + '</span><span class="v">' + a.v + "</span></div>"; }).join("");

    return pageHead("Personagem", "Ficha & Atributos") +
      panel("Poder derivado da build", powerbar(stats)) +
      '<section class="panel"><div class="panel__head"><span class="ph-l">Ficha da Heroína</span><span class="tiny">Build: ' + DB.baseStats[C.activeBuild].name + '</span></div><div class="panel__body"><div class="sheet"><div>' +
        '<div class="portrait"><div class="fig"></div><div class="frame-name">' + C.name + '</div></div>' +
        '<div style="margin-top:10px" class="charmeta"><div style="font-family:Cinzel;color:var(--gold-hi)">' + C.className + '</div><div class="tiny muted">Nível ' + C.level + " · " + DB.meta.league + '</div></div>' +
        '<div style="margin-top:12px">' + rbars + "</div></div><div>" +
        '<div class="eyebrow">Atributos</div><div class="attrgrid">' + attrs + '</div>' +
        '<div class="hr-orn"></div><div class="eyebrow">Resistências</div><div class="attrgrid">' + resList + '</div>' +
        (stats.fireRes < 45 ? '<div class="tiny" style="color:var(--blood-hi);margin-top:10px">Res. a fogo abaixo de 45% — chefes ígneos podem matar independentemente do seu dano.</div>' : '<div class="tiny" style="color:var(--teal-hi);margin-top:10px">Res. a fogo adequada para os chefes ígneos atuais.</div>') +
      "</div></div></div></section>";
  };

  /* ---- Habilidades (soquetes) ---- */
  PAGES.habilidades = function () {
    var stats = computeStats();
    var cards = DB.skills.map(function (sk) {
      var tags = sk.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("");
      var socketed = state.sockets[sk.id] || [];
      var isDmg = sk.base > 0;

      var socketBoxes = "";
      for (var i = 0; i < stats.supportCap; i++) {
        var sid = socketed[i];
        if (sid) {
          var sup = supportById[sid];
          socketBoxes += '<div class="socket filled" data-remove="' + sk.id + "|" + sid + '" data-tip="Clique para remover"><span class="s-gem"></span>' + sup.name + (sup.dps ? ' <span style="color:#ff9a5a">+' + Math.round(sup.dps * 100) + "%</span>" : "") + "</div>";
        } else {
          socketBoxes += '<div class="socket empty">soquete vazio</div>';
        }
      }

      var compat = DB.supports.filter(function (s) {
        return s.match.some(function (t) { return sk.tags.indexOf(t) >= 0; });
      });
      var palette = compat.map(function (s) {
        var on = socketed.indexOf(s.id) >= 0;
        var full = !on && socketed.filter(Boolean).length >= stats.supportCap;
        return '<span class="pal-chip' + (on ? " on" : "") + (full ? " off-limit" : "") + '" data-socket="' + sk.id + "|" + s.id + '">' +
          '<span class="s-gem"></span>' + s.name + (s.dps ? ' <span class="pd">+' + Math.round(s.dps * 100) + '%</span>' : "") + "</span>";
      }).join("");

      var dpsTag = isDmg
        ? '<div class="skill-dps"><div class="sd-k">Dano relativo</div><div class="sd-v">' + skillDps(sk).toFixed(2) + "</div></div>"
        : '<div class="skill-dps"><div class="sd-k">Tipo</div><div class="sd-v" style="color:var(--teal-hi);font-size:14px">apoio</div></div>';

      return '<div class="skill-card"><div class="skill-card__top">' +
        '<div class="skill-gem gem--' + sk.type + '">' + sk.glyph + "</div>" +
        '<div class="skill-main"><div class="nm">' + sk.name + '</div><div class="meta">' + sk.meta + '</div><div class="desc">' + sk.desc + '</div><div class="tags">' + tags + "</div></div>" +
        dpsTag + "</div>" +
        '<div class="socket-area"><div class="socket-row"><span class="socket-lbl">Suportes</span>' + socketBoxes + "</div>" +
        '<div class="palette"><div class="pal-lbl">Banca de suportes compatíveis (clique para encaixar/remover)</div>' + palette + "</div></div></div>";
    }).join("");

    var beh = DB.behavior.map(function (b) {
      return '<div class="rule"><span class="when">' + b.when + '</span><span class="arrow">&#10230;</span><span class="then">' + b.then + "</span></div>";
    }).join("");

    return pageHead("Habilidades", "Encaixe suportes e veja o dano mudar") +
      panel("Poder de combate", powerbar(stats) +
        '<div class="tiny muted" style="margin-top:8px">Suportes de dano aumentam o DPS total — e portanto reduzem o tempo das dungeons. O nó <b>Estrategista</b> na árvore libera um 3º soquete.</div>') +
      panel("Habilidades equipadas", cards) +
      panel("Regras de comportamento",
        '<div class="tiny muted" style="margin-bottom:8px">Sem linguagem livre: você escolhe gatilhos, condições e ações em listas controladas. O servidor obedece a estas prioridades.</div>' + beh);
  };

  /* ---- Equipamento (paperdoll) ---- */
  PAGES.equipamento = function () {
    var stats = computeStats();
    function slotFor(name) {
      if (name === "Anel II" && state.fireEquipped) return DB.fireRing;
      return DB.equipment[name];
    }
    var grid = DB.dollLayout.map(function (row) {
      return row.map(function (name) {
        var it = slotFor(name);
        if (!it || it.rarity === "empty") {
          return '<div class="slot empty"><div class="slot__type">' + name + '</div><div class="slot__icon">—</div><div class="slot__name">' + (it ? it.base : "vazio") + "</div></div>";
        }
        return '<div class="slot ' + rarClass(it.rarity) + " " + borderClass(it.rarity) + '"><div class="slot__type">' + name + '</div>' +
          '<div class="slot__icon">' + glyphFor(it.base) + '</div><div class="slot__name">' + it.name + "</div>" + itemTip(it) + "</div>";
      }).join("");
    }).join("");

    return pageHead("Equipamento", "Manequim · passe o mouse para inspecionar") +
      '<div class="doll-wrap">' +
        '<section class="panel"><div class="panel__head"><span class="ph-l">Manequim</span><span class="tiny">9 slots</span></div><div class="panel__body">' +
          '<div class="doll"><div class="doll__fig"></div><div class="doll__grid">' + grid + "</div></div></div></section>" +
        '<div>' +
          panel("Poder de combate", powerbar4vert(stats)) +
          panel("Inventário & Loot",
            '<div class="small">Cada item nasce de uma <b>base</b> + raridade + afixos sorteados. Um raro excelente pode superar um único em números — o único muda uma regra.</div>' +
            '<div class="hr-orn"></div><div class="eyebrow" style="margin-bottom:6px">No baú</div>' +
            '<div class="loot-row ' + rarClass(DB.fireRing.rarity) + '"><div class="ic ' + rarClass(DB.fireRing.rarity) + '">' + glyphFor(DB.fireRing.base) + '</div>' +
            '<div style="flex:1"><div class="' + rarClass(DB.fireRing.rarity) + '" style="font-family:Cinzel;font-weight:700">' + DB.fireRing.name + '</div><div class="tiny muted">' + DB.fireRing.base + '</div></div>' + itemTip(DB.fireRing) + "</div>" +
            '<button class="btn" id="equipFireBtn" style="width:100%;margin-top:8px">' + (state.fireEquipped ? "Desequipar Guarda-Chama" : "Equipar Guarda-Chama (Anel II)") + "</button>" +
            '<div class="tiny muted" style="margin-top:6px">' + (state.fireEquipped ? "Res. a fogo elevada (+49%). Chefes ígneos agora são viáveis." : "Substitui o \"Elo Trincado\" e sobe muito a resistência a fogo.") + "</div>") +
        "</div></div>";
  };
  function powerbar4vert(stats) {
    var fireWarn = stats.fireRes < 45;
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      pstat("DPS", "dmg", stats.dps.toFixed(2) + "M", "") +
      pstat("Vida efetiva", "def", stats.ehp.toLocaleString("pt-BR"), "") +
      pstat("Res. Fogo", fireWarn ? "warn" : "fire", stats.fireRes + "%", "") +
      pstat("Soquetes", "", stats.supportCap + "", "por hab.") + "</div>";
  }

  /* ---- Árvore ---- */
  PAGES.arvore = function () {
    return pageHead("Árvore Passiva", "Grafo por dados · zoom com a roda, arraste para mover · limite de " + DB.passives.maxPoints + " pontos") +
      '<section class="panel"><div class="panel__head"><span class="ph-l">Planejamento de Build</span><span class="tiny" id="treeDpsHint"></span></div><div class="panel__body">' +
        '<div class="tree-hud"><div class="tree-points">Pontos: <b id="ptsUsed">0</b> / ' + DB.passives.maxPoints + '</div>' +
          '<div><button class="btn btn--sm" id="zoomOut">–</button> <button class="btn btn--sm" id="zoomIn">+</button> <button class="btn btn--sm" id="treeCenter">Centralizar</button> <button class="btn btn--sm" id="resetTree">Reembolsar tudo</button></div></div>' +
        '<div class="tree-stage" id="treeStage"></div>' +
        '<div class="tree-legend">' +
          '<span class="lg"><span class="sw" style="border-color:#7a3020"></span>Ofensivo</span>' +
          '<span class="lg"><span class="sw" style="border-color:#2e6a7a"></span>Defensivo</span>' +
          '<span class="lg"><span class="sw" style="border-color:#7a6520"></span>Utilitário</span>' +
          '<span class="lg"><span class="sw" style="border-color:var(--blood-hi)"></span>Keystone</span></div>' +
        '<div class="tree-detail" id="treeDetail"><span class="muted">Passe o mouse ou clique num nó. Só é possível alocar nós conectados aos já alocados.</span></div>' +
      "</div></section>";
  };

  /* ---- Masmorra ---- */
  PAGES.masmorra = function () {
    var stats = computeStats();
    var cards = DB.dungeons.map(function (d) {
      var info = dungeonInfo(d, stats);
      var mods = d.mods.map(function (m) { return '<span class="dmod">' + m + "</span>"; }).join("");
      var etaCls = info.survivable ? "" : "eta-warn";
      var etaLabel = info.survivable ? "Tempo estimado (seu poder)" : "Tempo — mas você morre no fogo";
      return '<div class="dcard' + (d.id === state.selectedDungeon ? " sel" : "") + '" data-dungeon="' + d.id + '">' +
        (d.fireThreat ? '<span class="badge-risk">ÍGNEO · res≥' + d.fireReq + "%</span>" : "") +
        '<div class="dbiome">' + d.biome + " · Nv " + d.lvl + (d.season ? " · SAZONAL" : "") + "</div>" +
        '<div class="dname">' + d.name + '</div><div class="dmods">' + mods + '</div><div class="ddesc">' + d.desc + "</div>" +
        '<div class="dcard__eta"><span class="etak ' + etaCls + '">' + etaLabel + '</span><span class="etav ' + etaCls + '">' + fmtTime(info.seconds) + "</span></div></div>";
    }).join("");

    return pageHead("Masmorra", "Tentativa assíncrona — o tempo escala com a força do herói") +
      panel("Poder de combate", powerbar(stats) +
        '<div class="tiny muted" style="margin-top:8px">O tempo estimado de cada dungeon cai conforme seu DPS sobe. Mas se a res. a fogo ficar abaixo do exigido, a tentativa termina em morte, por mais dano que você tenha.</div>') +
      panel("Escolher destino", '<div class="dsel">' + cards + "</div>") +
      '<section class="panel"><div class="panel__head"><span class="ph-l">Enviar Herói</span></div><div class="panel__body" id="attemptZone"></div></section>';
  };

  /* ---- Ranking ---- */
  PAGES.ranking = function () {
    return pageHead("Rankings", "Cada ranking mede uma capacidade específica — não existe 'melhor build' única") +
      '<div class="grid-2">' + panel("Maior Profundidade", ladder(DB.rankings.depth)) + panel("Maior DPS (encontro padrão)", ladder(DB.rankings.dps)) + "</div>" +
      '<div class="grid-2">' + panel("Hardcore (liga privada)", ladder(DB.rankings.hardcore)) +
        panel("Integridade dos recordes", '<ul class="linklist small"><li>Snapshot imutável da build</li><li>Versão do motor: ' + DB.meta.engine + "</li><li>Seed do encontro: " + DB.meta.seed + "</li><li>Log verificável e reexecutável</li><li>Data, liga e regras aplicáveis</li></ul>") + "</div>";
  };

  /* ---- Mercado ---- */
  PAGES.mercado = function () {
    var rows = DB.market.map(function (m) {
      return "<tr><td><div class=\"item-cell\"><div class=\"ic " + rarClass(m.rarity) + "\">" + glyphFor(m.base) + "</div>" +
        '<div><div class="' + rarClass(m.rarity) + '" style="font-family:Cinzel;font-weight:700">' + m.name + '</div><div class="tiny muted">' + m.base + " · nv " + m.lvl + "</div></div>" +
        itemTip({ name: m.name, base: m.base, rarity: m.rarity, ilvl: m.lvl, req: "Nível " + m.lvl, affixes: m.rarity === "unique" ? [{ t: "único", x: "efeito exclusivo — inspecione no jogo" }] : [{ t: "P·T?", x: "afixos sorteados" }] }) +
        "</div></td><td class=\"seller\">" + m.seller + "</td><td class=\"price\">" + m.price + ' <span class="coin">' + m.coin + "</span></td>" +
        '<td><button class="btn btn--sm" data-tip="Compra demonstrativa">Comprar</button></td></tr>';
    }).join("");
    return pageHead("Mercado", "Anúncios por preço fixo · economia isolada por liga") +
      panel("Mercado da Liga",
        '<div class="market-tools"><select><option>Todos os tipos-base</option><option>Anéis</option><option>Armas</option></select>' +
        '<select><option>Qualquer raridade</option><option>Único</option><option>Raro</option></select>' +
        '<input placeholder="filtrar afixo (ex.: res. fogo)" style="flex:1;min-width:160px" />' +
        '<select><option>Preço ↑</option><option>Preço ↓</option></select></div>' +
        '<table class="mtable"><thead><tr><th>Item</th><th>Vendedor</th><th>Preço</th><th></th></tr></thead><tbody>' + rows + "</tbody></table>");
  };

  /* ===================== NAV ===================== */
  var NAV = [
    { id: "portal", label: "Portal" }, { id: "personagem", label: "Personagem" },
    { id: "habilidades", label: "Habilidades" }, { id: "equipamento", label: "Equipamento" },
    { id: "arvore", label: "Árvore", tag: "NEW" }, { id: "masmorra", label: "Masmorra", tag: "HOT" },
    { id: "ranking", label: "Ranking" }, { id: "mercado", label: "Mercado" },
  ];
  function renderNav() {
    q("#mainnav").innerHTML = NAV.map(function (n) {
      return '<button class="navbtn' + (n.id === state.page ? " is-active" : "") + '" data-page="' + n.id + '">' + n.label + (n.tag ? '<span class="nb-tag">' + n.tag + "</span>" : "") + "</button>";
    }).join("");
  }
  function initPage(page) {
    if (page === "arvore") initTree();
    if (page === "masmorra") initDungeon();
    if (page === "habilidades") { /* delegated clicks handle it */ }
  }
  function renderCurrent() { q("#content").innerHTML = PAGES[state.page](); initPage(state.page); }
  function go(page) { state.page = page; renderNav(); renderCurrent(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  /* ===================== PASSIVE TREE ===================== */
  function connectedToStart(set) {
    var seen = {}, stack = ["s0"];
    while (stack.length) { var cur = stack.pop(); if (seen[cur]) continue; seen[cur] = true;
      (adjacency[cur] || []).forEach(function (nb) { if (set[nb] && !seen[nb]) stack.push(nb); }); }
    return Object.keys(set).every(function (id) { return seen[id]; });
  }
  function pointsUsed() { return Object.keys(state.alloc).length - 1; }

  function initTree() {
    initStateOnce();
    drawTree();
    var stage = q("#treeStage");

    q("#resetTree").addEventListener("click", function () { state.alloc = { s0: true }; drawTree(); setDetail(null); });
    q("#zoomIn").addEventListener("click", function () { zoom(1.2); });
    q("#zoomOut").addEventListener("click", function () { zoom(1 / 1.2); });
    q("#treeCenter").addEventListener("click", function () { state.tree = { scale: 1, tx: 0, ty: 0 }; applyTransform(); });

    stage.addEventListener("wheel", function (e) { e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });

    var dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;
    stage.addEventListener("mousedown", function (e) {
      dragging = true; moved = false; sx = e.clientX; sy = e.clientY; ox = state.tree.tx; oy = state.tree.ty; stage.classList.add("grabbing");
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      state.tree.tx = ox + dx; state.tree.ty = oy + dy; applyTransform();
    });
    window.addEventListener("mouseup", function () { dragging = false; stage.classList.remove("grabbing"); setTimeout(function () { moved = false; }, 0); });
    stage.__movedRef = function () { return moved; };
  }
  function zoom(f) { state.tree.scale = Math.max(0.5, Math.min(2.4, state.tree.scale * f)); applyTransform(); }
  function applyTransform() {
    var g = q("#treeStage .tree-view"); if (!g) return;
    g.setAttribute("transform", "translate(" + state.tree.tx + "," + state.tree.ty + ") scale(" + state.tree.scale + ")");
  }

  function drawTree() {
    var P = DB.passives, used = pointsUsed();
    var edges = P.edges.map(function (e) {
      var a = nodeById[e[0]], b = nodeById[e[1]];
      var on = state.alloc[e[0]] && state.alloc[e[1]];
      return '<line class="tree-edge' + (on ? " on" : "") + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    }).join("");
    var nodes = P.nodes.map(function (n) {
      var isAlloc = !!state.alloc[n.id];
      var adjAlloc = (adjacency[n.id] || []).some(function (nb) { return state.alloc[nb]; });
      var canAlloc = !isAlloc && adjAlloc && used < P.maxPoints;
      var cls = ["tnode", n.path + "-path"];
      if (n.type === "notable") cls.push("notable"); if (n.type === "keystone") cls.push("keystone");
      if (isAlloc) cls.push("alloc"); if (canAlloc) cls.push("can");
      var shape, gsize;
      if (n.type === "keystone") { shape = '<rect class="kd" x="' + (n.x - 15) + '" y="' + (n.y - 15) + '" width="30" height="30" transform="rotate(45 ' + n.x + " " + n.y + ')"/>'; gsize = 13; }
      else { var rr = n.type === "notable" ? 18 : (n.type === "start" ? 16 : 12); shape = '<circle class="ring" cx="' + n.x + '" cy="' + n.y + '" r="' + rr + '"/>'; gsize = n.type === "notable" ? 14 : 11; }
      var g = n.path === "off" ? "⚔" : n.path === "def" ? "⛊" : n.path === "util" ? "✦" : "◆";
      var labelY = n.y + (n.type === "keystone" ? 34 : (n.type === "notable" ? 34 : 27));
      return '<g class="' + cls.join(" ") + '" data-node="' + n.id + '">' + shape +
        '<text class="glyph" x="' + n.x + '" y="' + n.y + '" style="font-size:' + gsize + 'px">' + g + "</text>" +
        '<text class="lbl" x="' + n.x + '" y="' + labelY + '">' + (n.type === "keystone" ? "◆ " : "") + n.name + "</text></g>";
    }).join("");

    q("#treeStage").innerHTML =
      '<svg class="tree-svg" viewBox="0 0 860 470" preserveAspectRatio="xMidYMid meet">' +
        '<defs><linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d288"/><stop offset="1" stop-color="#8a6524"/></linearGradient></defs>' +
        '<g class="tree-view">' + edges + nodes + "</g></svg>";
    applyTransform();
    var pu = q("#ptsUsed"); if (pu) pu.textContent = used;
    var hint = q("#treeDpsHint"); if (hint) { var s = computeStats(); hint.textContent = "DPS " + s.dps.toFixed(2) + "M · Vida ef. " + s.ehp.toLocaleString("pt-BR") + " · Fogo " + s.fireRes + "%"; }

    qa("#treeStage .tnode").forEach(function (gEl) {
      var id = gEl.getAttribute("data-node");
      gEl.addEventListener("mouseenter", function () { setDetail(id); });
      gEl.addEventListener("click", function () {
        var stage = q("#treeStage");
        if (stage && stage.__movedRef && stage.__movedRef()) return; // ignore click after drag
        toggleNode(id);
      });
    });
  }

  function toggleNode(id) {
    var n = nodeById[id]; if (n.type === "start") return;
    if (state.alloc[id]) {
      var test = Object.assign({}, state.alloc); delete test[id];
      if (connectedToStart(test)) state.alloc = test;
      else { flashDetail("Não é possível reembolsar: quebraria o caminho até outro nó alocado."); drawTree(); return; }
    } else {
      var adjAlloc = (adjacency[id] || []).some(function (nb) { return state.alloc[nb]; });
      if (!adjAlloc) { flashDetail("Nó desconectado: aloque primeiro um vizinho."); return; }
      if (pointsUsed() >= DB.passives.maxPoints) { flashDetail("Sem pontos: limite de " + DB.passives.maxPoints + " atingido."); return; }
      state.alloc[id] = true;
    }
    drawTree(); setDetail(id);
  }
  function setDetail(id) {
    var box = q("#treeDetail"); if (!box) return;
    if (!id) { box.innerHTML = '<span class="muted">Passe o mouse ou clique num nó. Só é possível alocar nós conectados aos já alocados.</span>'; return; }
    var n = nodeById[id];
    var st = state.alloc[id] ? '<span style="color:var(--gold-hi)">ALOCADO</span>' : '<span class="muted">não alocado</span>';
    var w = n.w || {}, impact = [];
    if (w.dps) impact.push("+" + Math.round(w.dps * 100) + "% dano");
    if (w.ehp) impact.push("+" + Math.round(w.ehp * 100) + "% vida ef.");
    if (w.fire) impact.push("+" + w.fire + "% res. fogo");
    if (w.dpsPen) impact.push("−" + Math.round(w.dpsPen * 100) + "% dano");
    if (w.ehpPen) impact.push("−" + Math.round(w.ehpPen * 100) + "% vida ef.");
    if (w.supportCap) impact.push("+" + w.supportCap + " soquete");
    box.innerHTML = '<span class="tdn">' + n.name + '</span> — ' + st + '<br><span class="small">' + n.stat + "</span>" +
      (impact.length ? '<br><span class="impact">' + impact.join("  ·  ") + "</span>" : "");
  }
  function flashDetail(msg) { var box = q("#treeDetail"); if (box) box.innerHTML = '<span style="color:var(--blood-hi)">' + msg + "</span>"; }

  /* ===================== DUNGEON / ATTEMPT ===================== */
  var attemptTimer = null;
  function currentDungeon() { return DB.dungeons.filter(function (d) { return d.id === state.selectedDungeon; })[0]; }
  function dungeonInfo(d, stats) {
    var seconds = Math.max(45, Math.min(900, (d.diff / stats.dps) * 60));
    var survivable = !d.fireThreat || stats.fireRes >= d.fireReq;
    return { seconds: seconds, survivable: survivable };
  }

  function initDungeon() {
    qa("#content .dcard").forEach(function (c) {
      c.addEventListener("click", function () { state.selectedDungeon = c.getAttribute("data-dungeon"); renderCurrent(); });
    });
    renderAttempt("idle");
  }

  function renderAttempt(phase, pct) {
    var zone = q("#attemptZone"); if (!zone) return;
    var d = currentDungeon(); var stats = computeStats(); var info = dungeonInfo(d, stats);

    if (phase === "idle") {
      zone.innerHTML = '<div class="attempt-box"><div class="eyebrow">Destino selecionado</div>' +
        '<div style="font-family:Cinzel;font-weight:900;font-size:20px;color:var(--gold-hi);margin:2px 0">' + d.name + "</div>" +
        '<div class="snap">build: ' + DB.baseStats[C.activeBuild].name + " · DPS " + stats.dps.toFixed(2) + "M · res.fogo " + stats.fireRes + "% · seed " + DB.meta.seed + "</div>" +
        '<div class="snap" style="margin-top:4px">tempo estimado: <b style="color:var(--teal-hi)">' + fmtTime(info.seconds) + "</b>" + (info.survivable ? "" : ' <b style="color:var(--blood-hi)">· mas morte provável por fogo</b>') + "</div>" +
        '<div style="margin:14px 0"><button class="btn btn--blood" id="startAttempt" style="font-size:14px;padding:12px 30px">Enviar Herói</button></div>' +
        (info.survivable ? '<div class="tiny muted">O servidor cria um snapshot imutável e simula. Espera de teste reduzida.</div>'
          : '<div class="tiny" style="color:var(--blood-hi)">Aviso: res. a fogo ' + stats.fireRes + "% < exigido " + d.fireReq + "%. Alto risco de morte.</div>") + "</div>";
      q("#startAttempt").addEventListener("click", runAttempt);
      return;
    }
    if (phase === "running") {
      zone.innerHTML = '<div class="attempt-box"><div class="progress-label">Simulando combate…</div>' +
        '<div class="progress-track"><div class="progress-fill" id="pf" style="width:' + pct + '%"></div></div>' +
        '<div class="snap" id="simSnap">tempo simulado 0s · ' + d.name + "</div></div>";
      return;
    }
    if (phase === "report") {
      zone.innerHTML = buildReport(d, stats, info);
      var again = q("#retryBtn"); if (again) again.addEventListener("click", function () { renderAttempt("idle"); });
      var eq = q("#reportEquip"); if (eq) eq.addEventListener("click", function () { state.fireEquipped = true; renderAttempt("idle"); });
    }
  }

  function runAttempt() {
    var d = currentDungeon(); var stats = computeStats(); var info = dungeonInfo(d, stats);
    var realMs = Math.max(900, Math.min(2600, info.seconds * 7));
    var stepMs = 40, steps = Math.max(6, Math.round(realMs / stepMs)), i = 0;
    renderAttempt("running", 0);
    attemptTimer = setInterval(function () {
      i++; var pct = Math.min(100, (i / steps) * 100);
      var pf = q("#pf"); if (pf) pf.style.width = pct + "%";
      var snap = q("#simSnap"); if (snap) snap.textContent = "tempo simulado " + fmtTime((pct / 100) * info.seconds) + " · " + d.name;
      if (i >= steps) { clearInterval(attemptTimer); renderAttempt("report"); }
    }, stepMs);
  }

  function dmgRow(label, cls, pct, val) {
    return '<div class="dmg-row"><div class="dr-top"><span>' + label + '</span><span>' + val + "</span></div>" +
      '<div class="dr-track"><div class="dr-fill ' + cls + '" style="width:' + pct + '%"></div></div></div>';
  }

  function buildReport(d, stats, info) {
    var win = info.survivable;
    var dur = win ? info.seconds : info.seconds * 0.68;
    var banner = win ? '<div class="report__banner win">VITÓRIA</div>' : '<div class="report__banner lose">DERROTA — MORTE POR FOGO</div>';
    var cause = win
      ? '<div class="report__cause">Concluído em ' + fmtTime(dur) + " com res. a fogo de " + stats.fireRes + "%. O bloqueio segurou os picos físicos e a fase ígnea foi resistida.</div>"
      : '<div class="report__cause">Você chegou ao chefe em ' + fmtTime(dur * 0.7) + ", mas recebeu o pico de dano como <b style=\"color:#e0702a\">FOGO</b> com apenas <b>" + stats.fireRes + "%</b> de resistência (a dungeon exige " + d.fireReq + "%).</div>";

    var dmgTotal = (stats.dps * (dur / 60)).toFixed(2);
    var statsTbl = [
      ["Duração (simulada)", fmtTime(dur)], ["DPS médio", stats.dps.toFixed(2) + " M"],
      ["Dano total causado", dmgTotal + " bi"], ["Vida efetiva", stats.ehp.toLocaleString("pt-BR")],
      ["Res. a fogo", stats.fireRes + "%"], ["Resultado", win ? "Dungeon concluída" : "Herói tombou"],
    ].map(function (s) { return '<div class="stat-big"><span class="k">' + s[0] + '</span><span class="v">' + s[1] + "</span></div>"; }).join("");

    var dmgTaken = win
      ? dmgRow("Físico", "f-phys", 46, "44%") + dmgRow("Fogo", "f-fire", 30, "30%") + dmgRow("Raio", "f-lit", 16, "16%") + dmgRow("Frio", "f-cold", 8, "10%")
      : dmgRow("Fogo", "f-fire", 68, "68%") + dmgRow("Físico", "f-phys", 22, "22%") + dmgRow("Raio", "f-lit", 7, "7%") + dmgRow("Frio", "f-cold", 3, "3%");
    var dmgDealt = dmgRow("Golpe Rompedor", "f-phys", 58, "58%") + dmgRow("Onda Sísmica", "f-phys", 33, "33%") + dmgRow("Outros", "f-lit", 9, "9%");

    var facts = win
      ? ["A Postura de Ferro absorveu o pico da fase 2 do chefe.", "DPS de " + stats.dps.toFixed(2) + "M reduziu o tempo total para " + fmtTime(dur) + ".", "Res. a fogo de " + stats.fireRes + "% (exigido " + d.fireReq + "%) evitou a morte."]
      : ["Dano não foi o problema: você chegou rápido ao chefe.", "Morte na fase ígnea — res. a fogo " + stats.fireRes + "% abaixo do exigido " + d.fireReq + "%.", "Suba a resistência a fogo (árvore \"Cerne Térmico\", anel de fogo ou build defensiva) e tente de novo."];
    var factHtml = '<ul class="facts">' + facts.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>";

    var loot = win ? { name: "Ceifador Trovejante", base: "Foice Curva", rarity: "rare" } : { name: "Fragmento das Cinzas", base: "Material de crafting", rarity: "magic" };
    var lootHtml = '<div class="loot-row ' + rarClass(loot.rarity) + '"><div class="ic ' + rarClass(loot.rarity) + '">' + glyphFor(loot.base) + '</div><div><div class="' + rarClass(loot.rarity) + '" style="font-family:Cinzel;font-weight:700">' + loot.name + "</div><div class=\"tiny muted\">" + loot.base + "</div></div></div>";

    var actions = win
      ? '<button class="btn" id="retryBtn">Nova tentativa</button>'
      : (state.fireEquipped ? "" : '<button class="btn btn--blood" id="reportEquip">Equipar Guarda-Chama e tentar de novo</button> ') + '<button class="btn" id="retryBtn">Voltar</button>';

    return '<div class="report">' + banner + cause +
      '<div class="report__grid"><div class="report__col"><div class="eyebrow" style="margin-bottom:6px">Resumo</div>' + statsTbl +
        '<div class="hr-orn"></div><div class="eyebrow" style="margin-bottom:6px">Dano causado por habilidade</div>' + dmgDealt + "</div>" +
      '<div class="report__col"><div class="eyebrow" style="margin-bottom:6px">Dano recebido por tipo</div>' + dmgTaken +
        '<div class="hr-orn"></div><div class="eyebrow" style="margin-bottom:6px">Fatos da tentativa</div>' + factHtml +
        '<div class="eyebrow" style="margin:10px 0 6px">Loot obtido</div>' + lootHtml + "</div></div>" +
      '<div style="padding:14px;text-align:center;border-top:1px solid var(--line2)">' + actions + "</div></div>";
  }

  /* ===================== GLOBAL EVENTS ===================== */
  document.addEventListener("click", function (e) {
    var nav = e.target.closest("[data-page]"); if (nav) { go(nav.getAttribute("data-page")); return; }
    var goto = e.target.closest("[data-goto]"); if (goto) { e.preventDefault(); go(goto.getAttribute("data-goto")); return; }
    var eqf = e.target.closest("#equipFireBtn"); if (eqf) { state.fireEquipped = !state.fireEquipped; renderCurrent(); return; }
    var build = e.target.closest("[data-build]"); if (build) { C.activeBuild = build.getAttribute("data-build"); renderCurrent(); return; }

    var sock = e.target.closest("[data-socket]");
    if (sock) { socketToggle(sock.getAttribute("data-socket")); return; }
    var rem = e.target.closest("[data-remove]");
    if (rem) { var p = rem.getAttribute("data-remove").split("|"); removeSocket(p[0], p[1]); return; }
  });

  function socketToggle(pair) {
    var parts = pair.split("|"), skId = parts[0], supId = parts[1];
    var arr = state.sockets[skId], cap = computeStats().supportCap;
    var idx = arr.indexOf(supId);
    if (idx >= 0) { arr.splice(idx, 1); }
    else { if (arr.filter(Boolean).length >= cap) return; arr.push(supId); }
    renderCurrent();
  }
  function removeSocket(skId, supId) {
    var arr = state.sockets[skId], idx = arr.indexOf(supId);
    if (idx >= 0) arr.splice(idx, 1);
    renderCurrent();
  }

  /* floating tooltip */
  var tip = q("#tooltip");
  document.addEventListener("mouseover", function (e) { var t = e.target.closest("[data-tip]"); if (t) { tip.textContent = t.getAttribute("data-tip"); tip.hidden = false; } });
  document.addEventListener("mousemove", function (e) { if (!tip.hidden) { tip.style.left = (e.clientX + 14) + "px"; tip.style.top = (e.clientY + 14) + "px"; } });
  document.addEventListener("mouseout", function (e) { if (e.target.closest("[data-tip]")) tip.hidden = true; });

  /* fake online counter */
  setInterval(function () { var on = q("#onlineCount"); if (on) on.textContent = (2481 + Math.floor(Math.sin(Date.now() / 9000) * 40)).toLocaleString("pt-BR"); }, 3000);

  /* ===================== BOOT ===================== */
  initStateOnce();
  renderNav();
  go("portal");
})();
