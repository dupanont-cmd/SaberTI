// Dados de conexão usados pelas demais telas do projeto.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos atualizados enquanto a pessoa busca, ordena e seleciona orçamentos.
const listaOrcamentos = document.getElementById("listaOrcamentos");
const campoBusca = document.getElementById("campoBusca");
const seletorOrdem = document.getElementById("seletorOrdem");
const selecionarTodos = document.getElementById("selecionarTodos");
const botaoExcluirSelecionados = document.getElementById("botaoExcluirSelecionados");
let orcamentos = [], itensPorOrcamento = {}, produtosPorId = {}, idsSelecionados = [];

// Formata valores recebidos do Supabase antes de os colocar no HTML.
function textoSeguro(valor) { const elemento = document.createElement("span"); elemento.textContent = valor ?? "Não informado"; return elemento.innerHTML; }
function formatarData(data) { return data ? new Date(String(data).slice(0, 10) + "T00:00:00").toLocaleDateString("pt-BR") : "Não informada"; }
function formatarMoeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function valorUnitario(produto) { return Number(produto?.vl_unitario ?? produto?.valor_produto ?? produto?.vl_produto ?? 0); }

// Carrega e agrupa os dados necessários para uma lista completa de orçamentos.
async function carregarDadosRelacionados() {
  const [respostaItens, respostaProdutos] = await Promise.all([supabaseClient.from("orcamento_item").select("*"), supabaseClient.from("produto").select("*")]);
  if (respostaItens.error) throw respostaItens.error;
  if (respostaProdutos.error) throw respostaProdutos.error;
  itensPorOrcamento = {}; produtosPorId = {};
  respostaItens.data.forEach(function (item) { if (!itensPorOrcamento[item.orcamentoid]) itensPorOrcamento[item.orcamentoid] = []; itensPorOrcamento[item.orcamentoid].push(item); });
  respostaProdutos.data.forEach(function (produto) { produtosPorId[produto.produtoid] = produto; });
}

// Mostra um orçamento por linha, com todos os detalhes de seus itens.
function mostrarOrcamentos(lista) {
  if (!lista.length) { listaOrcamentos.innerHTML = '<tr><td class="mensagem" colspan="8">Nenhum orçamento encontrado.</td></tr>'; return; }
  listaOrcamentos.innerHTML = "";
  lista.forEach(function (orcamento) {
    const id = orcamento.orcamentoid, itens = itensPorOrcamento[id] || [];
    const detalhes = itens.length ? itens.map(function (item) { const produto = produtosPorId[item.produtoid], quantidade = Number(item.qt_produto || 0), unitario = valorUnitario(produto), subtotal = item.vl_total ?? unitario * quantidade, nome = produto?.nome_produto || "Produto ID " + item.produtoid; return `<li><strong>${textoSeguro(nome)}</strong> (ID ${textoSeguro(item.produtoid)})<br>Qtd.: ${textoSeguro(quantidade)} · Unit.: ${formatarMoeda(unitario)} · Total: ${formatarMoeda(subtotal)}</li>`; }).join("") : "<li>Nenhum item cadastrado.</li>";
    const linha = document.createElement("tr");
    linha.innerHTML = `<td><input class="checkbox selecionar-orcamento" type="checkbox" value="${textoSeguro(id)}" ${idsSelecionados.includes(String(id)) ? "checked" : ""}></td><td>${textoSeguro(id)}</td><td>${textoSeguro(orcamento.clienteid)}</td><td>${formatarData(orcamento.dt_orcamento)}</td><td>${formatarData(orcamento.dt_validade_orcamento)}</td><td><ul class="itens">${detalhes}</ul></td><td>${formatarMoeda(orcamento.vl_total_orcamento)}</td><td><div class="acoes"><button class="botao editar" type="button">Editar</button><button class="botao botao-excluir excluir" type="button">Excluir</button></div></td>`;
    linha.querySelector(".selecionar-orcamento").addEventListener("change", atualizarSelecionados);
    linha.querySelector(".editar").addEventListener("click", function () { window.location.href = "cadastro-orcamento.html?id=" + id; });
    linha.querySelector(".excluir").addEventListener("click", function () { excluirOrcamentos([id]); });
    listaOrcamentos.appendChild(linha);
  }); atualizarSelecionados();
}

// Busca as três tabelas antes de filtrar ou ordenar a lista exibida.
async function carregarOrcamentos() {
  listaOrcamentos.innerHTML = '<tr><td class="mensagem" colspan="8">Carregando orçamentos...</td></tr>';
  const respostaOrcamentos = await supabaseClient.from("orcamento").select("*");
  if (respostaOrcamentos.error) { listaOrcamentos.innerHTML = `<tr><td class="mensagem erro" colspan="8">Não foi possível carregar os orçamentos: ${textoSeguro(respostaOrcamentos.error.message)}</td></tr>`; return; }
  try { await carregarDadosRelacionados(); } catch (erro) { listaOrcamentos.innerHTML = `<tr><td class="mensagem erro" colspan="8">Não foi possível carregar os itens ou produtos: ${textoSeguro(erro.message)}</td></tr>`; return; }
  orcamentos = respostaOrcamentos.data || []; filtrarOrcamentos();
}

// Busca somente no clienteid e ordena pela data de expedição escolhida.
function filtrarOrcamentos() { const busca = campoBusca.value.trim().toLowerCase(); const resultado = orcamentos.filter(function (orcamento) { return String(orcamento.clienteid ?? "").toLowerCase().includes(busca); }); resultado.sort(function (a, b) { const dataA = new Date(a.dt_orcamento || 0).getTime(), dataB = new Date(b.dt_orcamento || 0).getTime(); return seletorOrdem.value === "asc" ? dataA - dataB : dataB - dataA; }); mostrarOrcamentos(resultado); }

// Guarda as caixas marcadas e habilita a exclusão em lote.
function atualizarSelecionados() { idsSelecionados = Array.from(document.querySelectorAll(".selecionar-orcamento:checked")).map(function (caixa) { return caixa.value; }); const caixas = document.querySelectorAll(".selecionar-orcamento"); botaoExcluirSelecionados.disabled = idsSelecionados.length === 0; selecionarTodos.checked = caixas.length > 0 && caixas.length === idsSelecionados.length; }

// Exclui os itens antes dos orçamentos para respeitar a ligação entre as tabelas.
async function excluirOrcamentos(ids) { if (!window.confirm(`Deseja realmente excluir ${ids.length > 1 ? ids.length + " orçamentos" : "este orçamento"}?`)) return; const { error: erroItens } = await supabaseClient.from("orcamento_item").delete().in("orcamentoid", ids); if (erroItens) { alert("Não foi possível excluir os itens: " + erroItens.message); return; } const { error } = await supabaseClient.from("orcamento").delete().in("orcamentoid", ids); if (error) { alert("Os itens foram excluídos, mas não foi possível excluir o orçamento: " + error.message); return; } idsSelecionados = []; selecionarTodos.checked = false; carregarOrcamentos(); }

// Eventos dos controles da página e carregamento inicial.
campoBusca.addEventListener("input", filtrarOrcamentos); seletorOrdem.addEventListener("change", filtrarOrcamentos); selecionarTodos.addEventListener("change", function () { document.querySelectorAll(".selecionar-orcamento").forEach(function (caixa) { caixa.checked = selecionarTodos.checked; }); atualizarSelecionados(); }); botaoExcluirSelecionados.addEventListener("click", function () { excluirOrcamentos(idsSelecionados); }); document.getElementById("botaoSair").addEventListener("click", function () { window.location.href = "index.html"; }); carregarOrcamentos();
