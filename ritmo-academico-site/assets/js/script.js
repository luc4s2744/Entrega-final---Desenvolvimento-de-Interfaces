/* RITMO ACADÊMICO · script.js (um arquivo para as 5 páginas)
   Comportamentos: tema escuro, filtro, ordenação, validação com mensagem
   própria, cadastro de tarefa, concluir e excluir, tudo sem recarregar. */

const CHAVE = "ritmo2:tarefas";
const $ = seletor => document.querySelector(seletor);
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function ler() { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; } }
let tarefas = ler();
const salvar = () => localStorage.setItem(CHAVE, JSON.stringify(tarefas));

/* ---- datas (guardadas como "2026-11-25") ---- */
const paraISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deISO = iso => { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d); };
const somar = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const diasAte = iso => Math.round((deISO(iso) - deISO(paraISO(new Date()))) / 86400000);
const curta = iso => deISO(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const completa = iso => deISO(iso).toLocaleDateString("pt-BR");
function tempo(d) { return d < 0 ? "Atrasada" : d === 0 ? "Hoje" : d === 1 ? "Em 1 dia" : `Em ${d} dias`; }
const meta = t => [t.disciplina, t.tipo].filter(Boolean).join(" · ");
const pendentes = () => tarefas.filter(t => !t.concluida).sort((a, b) => a.prazo.localeCompare(b.prazo));

function el(tag, classe, texto) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.textContent = texto;
    return e;
}
function cartao(t) {                                   // <li><a class="cartao">
    const li = el("li"), a = el("a", "cartao");
    a.href = "tarefa.html?id=" + encodeURIComponent(t.id);
    const info = el("span");
    info.append(el("strong", "", t.titulo), el("small", "", meta(t) + (diasAte(t.prazo) < 0 ? " · Atrasada" : "")));
    a.append(info, el("span", "data", curta(t.prazo) + " ›"));
    li.append(a);
    return li;
}
function aviso(texto) { const p = $("#aviso"); p.textContent = texto; p.hidden = false; }

/* ---- tema escuro (aula 13: classe + localStorage) ---- */
const botaoTema = $("#tema");
function aplicarTema(escuro) {
    document.documentElement.classList.toggle("escuro", escuro);
    document.documentElement.classList.toggle("dark", escuro);   // o Tailwind não usa, mas fica compatível
    botaoTema.textContent = escuro ? "Tema claro" : "Tema escuro";
}
aplicarTema(localStorage.getItem("ritmo2:tema") === "escuro");
botaoTema.addEventListener("click", () => {
    const escuro = !document.documentElement.classList.contains("escuro");
    aplicarTema(escuro);
    localStorage.setItem("ritmo2:tema", escuro ? "escuro" : "claro");
});

/* ---- páginas ---- */
const paginas = {

    hoje() {
        const texto = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        $("#data-hoje").textContent = texto.charAt(0).toUpperCase() + texto.slice(1);

        const mensagens = { salva: "Tarefa salva", excluida: "Tarefa excluída" };
        const parametro = new URLSearchParams(location.search).get("aviso");
        if (mensagens[parametro]) { aviso(mensagens[parametro]); history.replaceState(null, "", "index.html"); }

        function desenhar() {
            const lista = pendentes();
            const tem = lista.length > 0;
            $("#com-tarefas").hidden = !tem;
            $("#cta").hidden = !tem;
            $("#vazio").hidden = tem;
            $("#exemplos").hidden = tarefas.length > 0;
            if (!tem) return;
            const p = lista[0];
            const d = $("#destaque");
            d.replaceChildren();
            const a = el("a", "cartao destaque");
            a.href = "tarefa.html?id=" + encodeURIComponent(p.id);
            const topo = el("span", "topo");
            topo.append(el("small", "", "Faltam"), el("strong", "", tempo(diasAte(p.prazo))));
            a.append(topo, el("strong", "", p.titulo), el("small", "", `${meta(p)} · ${completa(p.prazo)}`));
            d.append(a);
            const ul = $("#lista-depois");
            ul.replaceChildren();
            lista.slice(1).forEach(t => ul.append(cartao(t)));
            $("#h-dep").hidden = lista.length < 2;
        }
        $("#exemplos").addEventListener("click", () => {
            const base = [["Entrega do projeto em grupo", "Programação Web", "Trabalho", 2], ["Prova de Algoritmos", "Algoritmos", "Prova", 4],
                          ["Ler o artigo da semana", "Inglês", "Leitura", 5], ["Lista de exercícios 2", "Estatística", "Trabalho", 7]];
            tarefas = base.map((b, i) => ({ id: "ex" + Date.now() + i, titulo: b[0], disciplina: b[1], tipo: b[2], prazo: paraISO(somar(new Date(), b[3])), notas: "", concluida: false }));
            salvar();
            desenhar();
        });
        desenhar();
    },

    agenda() {
        let filtro = "todos";
        function desenhar() {
            const ordem = $("#ordem").value;
            const lista = pendentes().filter(t => filtro === "todos" || t.tipo === filtro);
            if (ordem !== "data") lista.sort((a, b) => a[ordem].localeCompare(b[ordem], "pt-BR"));
            const ul = $("#lista-agenda");
            ul.replaceChildren();
            lista.forEach(t => ul.append(cartao(t)));
            $("#contagem").textContent = lista.length === 0 ? "Nenhuma tarefa encontrada."
                : lista.length === 1 ? "Mostrando 1 tarefa" : `Mostrando ${lista.length} tarefas`;
        }
        for (const b of document.querySelectorAll("[data-filtro]")) {
            b.addEventListener("click", () => {
                filtro = b.dataset.filtro;
                document.querySelectorAll("[data-filtro]").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
                desenhar();
            });
        }
        $("#ordem").addEventListener("change", desenhar);
        desenhar();
    },

    nova() {
        const form = $("#form"), prazo = $("#prazo");
        prazo.min = paraISO(new Date());

        // sugestões de disciplina (datalist) e atalhos de data
        [...new Set(tarefas.map(t => t.disciplina))].forEach(nome => { const o = el("option"); o.value = nome; $("#disciplinas").append(o); });
        const atalhos = [["Hoje", 0], ["Amanhã", 1], [`${DIAS[somar(new Date(), 2).getDay()]} ${curta(paraISO(somar(new Date(), 2)))}`, 2]];
        for (const [rotulo, n] of atalhos) {
            const b = el("button", "chip", rotulo);
            b.type = "button";
            b.addEventListener("click", () => { prazo.value = paraISO(somar(new Date(), n)); limpar(prazo); });
            $("#atalhos").append(b);
        }

        // validação nativa + mensagem própria (evento "invalid")
        const mensagens = {
            titulo: "Escreva um título com pelo menos 3 letras.",
            disciplina: "Informe a disciplina.",
            prazo: "Escolha um prazo a partir de hoje."
        };
        function limpar(campo) {
            campo.removeAttribute("aria-invalid");
            const e = $("#erro-" + campo.id);
            if (e) e.hidden = true;
        }
        let focou = false;
        for (const campo of form.querySelectorAll("input, textarea")) {
            campo.addEventListener("invalid", evento => {
                evento.preventDefault();                       // troca o balão do navegador pela mensagem da página
                const e = $("#erro-" + campo.id);
                if (!e) return;
                e.textContent = mensagens[campo.id];
                e.hidden = false;
                campo.setAttribute("aria-invalid", "true");
                if (!focou) { campo.focus(); focou = true; setTimeout(() => { focou = false; }); }
            });
            campo.addEventListener("input", () => limpar(campo));
        }

        form.addEventListener("submit", evento => {
            evento.preventDefault();
            const tipo = form.querySelector('input[name="tipo"]:checked');
            tarefas.push({
                id: String(Date.now()), titulo: $("#titulo").value.trim(), disciplina: $("#disciplina").value.trim(),
                tipo: tipo ? tipo.value : "", prazo: prazo.value, notas: $("#notas").value.trim(), concluida: false
            });
            salvar();
            location.href = "index.html?aviso=salva";
        });
    },

    tarefa() {
        const id = new URLSearchParams(location.search).get("id");
        const t = tarefas.find(x => x.id === id);
        if (!t) { $("#detalhe").hidden = true; $("#nao-achou").hidden = false; return; }

        function desenhar() {
            $("#t-titulo").textContent = t.titulo;
            $("#t-disciplina").textContent = t.disciplina;
            $("#t-tipo").textContent = t.tipo || "Não informado";
            $("#t-prazo").textContent = completa(t.prazo);
            $("#t-tempo").textContent = t.concluida ? "Concluída" : tempo(diasAte(t.prazo));
            $("#t-notas").textContent = t.notas || "—";
            $("#concluir").textContent = t.concluida ? "Reabrir tarefa" : "Marcar como concluída";
        }
        $("#concluir").addEventListener("click", () => {
            t.concluida = !t.concluida;
            salvar();
            desenhar();
            aviso(t.concluida ? "Tarefa concluída" : "Tarefa reaberta");
        });
        const dialogo = $("#dialogo");
        $("#excluir").addEventListener("click", () => dialogo.showModal());
        $("#d-cancelar").addEventListener("click", () => dialogo.close());
        $("#d-confirmar").addEventListener("click", () => {
            tarefas = tarefas.filter(x => x.id !== id);
            salvar();
            location.href = "index.html?aviso=excluida";
        });
        desenhar();
    },

    sobre() {}
};

paginas[document.body.dataset.pagina]();
