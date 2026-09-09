// Dados de conexão com o mesmo projeto Supabase usado no restante do sistema.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos usados para ler o formulário e atualizar os valores na tela.
const formulario = document.getElementById("formOrcamento");
const clienteId = document.getElementById("clienteId");
const dataOrcamento = document.getElementById("dataOrcamento");
const dataValidade = document.getElementById("dataValidade");
const listaItens = document.getElementById("listaItens");
const valorTotal = document.getElementById("valorTotal");
const mensagemGeral = document.getElementById("mensagemGeral");
const botaoSalvar = document.getElementById("botaoSalvar");
const idOrcamento = new URLSearchParams(window.location.search).get("id");
let produtos = [];

// Funções auxiliares para data, moeda e mensagens de retorno.
function hoje() { return new Date().toISOString().slice(0, 10); }
function formatarMoeda(valor) { return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function mensagem(texto, tipo) { mensagemGeral.textContent = texto; mensagemGeral.className = "mensagem " + tipo; }
function nomeCliente(cliente) { return cliente.nome || cliente.nome_cliente || cliente.name || "Cliente sem nome"; }
function valorUnitario(produto) { return Number(produto.vl_unitario ?? produto.valor_produto ?? produto.vl_produto ?? 0); }
function produtoEstaAtivo(produto) { return String(produto.status_produto || "").toLowerCase() === "ativo" || produto.status_produto === true || String(produto.status_produto) === "1"; }

// Busca os clientes para o campo de seleção.
async function carregarClientes() {
  const { data, error } = await supabaseClient.from("cliente").select("*");
  if (error) { clienteId.innerHTML = '<option value="">Não foi possível carregar clientes</option>'; mensagem("Não foi possível carregar os clientes: " + error.message, "erro"); return; }
  clienteId.innerHTML = '<option value="">Selecione um cliente</option>';
  data.forEach(function (cliente) { const opcao = document.createElement("option"); opcao.value = cliente.clienteid; opcao.textContent = "ID " + cliente.clienteid + " - " + nomeCliente(cliente); clienteId.appendChild(opcao); });
}

// Busca somente produtos ativos: produtos inativos não podem entrar em um orçamento novo.
async function carregarProdutos() {
  const { data, error } = await supabaseClient.from("produto").select("*");
  if (error) { mensagem("Não foi possível carregar os produtos: " + error.message, "erro"); return; }
  produtos = (data || []).filter(function (produto) { return produtoEstaAtivo(produto); });
}

// Escapa textos do catálogo antes de colocá-los nas opções do formulário.
function textoSeguro(valor) {
  const elemento = document.createElement("span");
  elemento.textContent = valor ?? "";
  return elemento.innerHTML;
}

// Oferece produtos ativos para novos itens.
function criarOpcoesProdutos() {
  let opcoes = '<option value="">Selecione um produto</option>';
  produtos.forEach(function (produto) {
    opcoes += `<option value="${produto.produtoid}">${textoSeguro(produto.nome_produto || "Produto sem nome")} (ID ${produto.produtoid})</option>`;
  });
  return opcoes;
}

// Cada linha guarda sua própria foto, independente do catálogo.
function adicionarItem(item) {
  const linha = document.createElement("tr");
  linha.className = "linha-item";
  linha.innerHTML = `<td><select class="produto-item" required>${criarOpcoesProdutos()}</select></td><td class="unitario"><input class="valor-unitario" type="text" readonly aria-label="Valor unitário do produto"></td><td><input class="quantidade-item" type="number" min="1" step="1" value="1" required></td><td class="subtotal"></td><td><button class="botao botao-remover" type="button">Remover</button></td>`;
  const seletor = linha.querySelector(".produto-item");

  // A opção histórica funciona mesmo quando o produto foi excluído ou inativado.
  if (item) {
    linha.fotoProduto = {
      produtoid: item.produtoid,
      nome_produto: item.nome_produto,
      ds_produto: item.ds_produto,
      vl_unitario: Number(item.vl_unitario ?? (item.qt_produto > 0 ? item.vl_total / item.qt_produto : 0))
    };
    const opcao = document.createElement("option");
    opcao.value = "historico";
    opcao.textContent = (item.nome_produto || "Produto do orçamento") + " (salvo no orçamento)";
    seletor.appendChild(opcao);
    seletor.value = "historico";
    linha.querySelector(".quantidade-item").value = item.qt_produto;
  }

  // Só a escolha de outro produto substitui a foto e utiliza o preço do catálogo.
  seletor.addEventListener("change", function () {
    if (seletor.value === "historico") {
      linha.fotoProduto = { produtoid: item.produtoid, nome_produto: item.nome_produto, ds_produto: item.ds_produto, vl_unitario: Number(item.vl_unitario ?? (item.qt_produto > 0 ? item.vl_total / item.qt_produto : 0)) };
    } else {
      const produto = produtos.find(function (produto) { return String(produto.produtoid) === seletor.value; });
      linha.fotoProduto = produto ? { produtoid: produto.produtoid, nome_produto: produto.nome_produto, ds_produto: produto.ds_produto, vl_unitario: valorUnitario(produto) } : null;
    }
    atualizarLinha(linha);
  });
  // Alterar a quantidade mantém o preço histórico; remover exclui apenas esta linha.
  linha.querySelector(".quantidade-item").addEventListener("input", function () { atualizarLinha(linha); });
  linha.querySelector(".botao-remover").addEventListener("click", function () { linha.remove(); atualizarTotal(); });
  listaItens.appendChild(linha);
  atualizarLinha(linha);
}

// Calcula o subtotal usando somente o preço guardado na linha.
function atualizarLinha(linha) {
  const unitario = linha.fotoProduto ? linha.fotoProduto.vl_unitario : 0;
  const quantidade = Number(linha.querySelector(".quantidade-item").value || 0);
  linha.querySelector(".valor-unitario").value = formatarMoeda(unitario);
  linha.querySelector(".subtotal").textContent = formatarMoeda(unitario * quantidade);
  atualizarTotal();
}

// Soma os valores das fotos, sem consultar o preço atual do catálogo.
function atualizarTotal() {
  let total = 0;
  document.querySelectorAll(".linha-item").forEach(function (linha) {
    const unitario = linha.fotoProduto ? linha.fotoProduto.vl_unitario : 0;
    total += unitario * Number(linha.querySelector(".quantidade-item").value || 0);
  });
  valorTotal.textContent = formatarMoeda(total);
  return total;
}

// Envia nome, descrição e preço para orcamento_item, inclusive dos produtos excluídos.
function obterItensFormulario() {
  const itens = [];
  document.querySelectorAll(".linha-item").forEach(function (linha) {
    const foto = linha.fotoProduto;
    const quantidade = Number(linha.querySelector(".quantidade-item").value);
    if (foto && quantidade > 0) {
      itens.push({ produtoid: foto.produtoid, nome_produto: foto.nome_produto, ds_produto: foto.ds_produto, vl_unitario: foto.vl_unitario, qt_produto: quantidade, vl_total: foto.vl_unitario * quantidade });
    }
  });
  return itens;
}
// Limpa o formulário para iniciar um novo cadastro.
function limparFormulario() {
  formulario.reset();
  dataOrcamento.value = hoje();
  dataValidade.value = "";
  listaItens.innerHTML = "";
  adicionarItem();
  mensagem("", "");
}

// Salva primeiro o cabeçalho e depois os itens ligados ao seu orcamentoid.
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const itens = obterItensFormulario();
  const total = atualizarTotal();
  if (!clienteId.value || !dataOrcamento.value || !dataValidade.value || !itens.length) { mensagem("Preencha o cliente, as datas e pelo menos um produto.", "erro"); return; }
  if (dataValidade.value < dataOrcamento.value) { mensagem("A data de validade deve ser igual ou posterior à expedição.", "erro"); return; }
  const dadosOrcamento = { clienteid: clienteId.value, dt_orcamento: dataOrcamento.value, dt_validade_orcamento: dataValidade.value, vl_total_orcamento: total };
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";
  let orcamentoid = idOrcamento;
  const resposta = idOrcamento ? await supabaseClient.from("orcamento").update(dadosOrcamento).eq("orcamentoid", idOrcamento) : await supabaseClient.from("orcamento").insert(dadosOrcamento).select("orcamentoid").single();
  if (resposta.error) { mensagem("Não foi possível salvar o orçamento: " + resposta.error.message, "erro"); botaoSalvar.disabled = false; botaoSalvar.textContent = "Salvar orçamento"; return; }
  if (!idOrcamento) orcamentoid = resposta.data.orcamentoid;
  // Na edição, os itens antigos são trocados pelos itens atuais do formulário.
  if (idOrcamento) { const { error } = await supabaseClient.from("orcamento_item").delete().eq("orcamentoid", idOrcamento); if (error) { mensagem("O cabeçalho foi salvo, mas não foi possível atualizar os itens: " + error.message, "erro"); botaoSalvar.disabled = false; botaoSalvar.textContent = "Salvar alterações"; return; } }
  const itensParaSalvar = itens.map(function (item) { return { ...item, orcamentoid: orcamentoid }; });
  const { error: erroItens } = await supabaseClient.from("orcamento_item").insert(itensParaSalvar);
  if (erroItens) { mensagem("O orçamento foi salvo, mas não foi possível salvar os itens: " + erroItens.message, "erro"); botaoSalvar.disabled = false; botaoSalvar.textContent = "Salvar orçamento"; return; }
  mensagem(idOrcamento ? "Orçamento atualizado com sucesso!" : "Orçamento cadastrado com sucesso!", "sucesso");
  setTimeout(function () { window.location.href = "orcamentos.html"; }, 700);
});

// Carrega o orçamento e seus itens quando a página foi aberta pelo botão Editar.
async function carregarOrcamentoParaEditar() {
  if (!idOrcamento) { limparFormulario(); return; }
  document.getElementById("tituloPagina").textContent = "Editar orçamento";
  document.getElementById("subtituloPagina").textContent = "Altere os dados e salve as mudanças.";
  botaoSalvar.textContent = "Salvar alterações";
  const { data: orcamento, error } = await supabaseClient.from("orcamento").select("*").eq("orcamentoid", idOrcamento).single();
  if (error) { mensagem("Não foi possível carregar o orçamento: " + error.message, "erro"); return; }
  const { data: itens, error: erroItens } = await supabaseClient.from("orcamento_item").select("*").eq("orcamentoid", idOrcamento);
  if (erroItens) { mensagem("Não foi possível carregar os itens: " + erroItens.message, "erro"); return; }
  clienteId.value = orcamento.clienteid;
  dataOrcamento.value = String(orcamento.dt_orcamento || "").slice(0, 10);
  dataValidade.value = String(orcamento.dt_validade_orcamento || "").slice(0, 10);
  listaItens.innerHTML = "";
  (itens || []).forEach(function (item) { adicionarItem(item); });
  if (!itens?.length) adicionarItem();
}

// Botões auxiliares e carregamento inicial das informações necessárias.
document.getElementById("botaoAdicionarItem").addEventListener("click", function () { adicionarItem(); });
document.getElementById("botaoLimpar").addEventListener("click", limparFormulario);
document.getElementById("botaoVoltar").addEventListener("click", function () { window.location.href = "orcamentos.html"; });
document.getElementById("botaoSair").addEventListener("click", function () { window.location.href = "index.html"; });
async function iniciarPagina() { await Promise.all([carregarClientes(), carregarProdutos()]); await carregarOrcamentoParaEditar(); }
iniciarPagina();
