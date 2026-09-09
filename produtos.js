// Conexão com o projeto Supabase.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos usados para desenhar, pesquisar, filtrar e excluir produtos.
const listaProdutos = document.getElementById("listaProdutos");
const campoBusca = document.getElementById("campoBusca");
const filtroStatus = document.getElementById("filtroStatus");
// Seleção da categoria usada para filtrar os produtos da tabela.
const filtroCategoria = document.getElementById("filtroCategoria");
const seletorOrdem = document.getElementById("seletorOrdem");
const selecionarTodos = document.getElementById("selecionarTodos");
const botaoExcluirSelecionados = document.getElementById(
  "botaoExcluirSelecionados",
);
let produtos = [];
let idsSelecionados = [];
let categoriasPorId = {};

function textoSeguro(valor) {
  const caixa = document.createElement("div");
  caixa.textContent = valor ?? "Não informado";
  return caixa.innerHTML;
}
function formatarData(data) {
  return data ? new Date(data).toLocaleDateString("pt-BR") : "Não informada";
}
function pegarValor(produto) {
  return Number(produto.valor_produto ?? produto.vl_produto ?? 0);
}
function formatarValor(produto) {
  return pegarValor(produto).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
function estaAtivo(status) {
  return (
    String(status || "").toLowerCase() === "ativo" ||
    status === true ||
    String(status) === "1"
  );
}

// Lê as categorias e guarda nome + id para mostrar a categoria de cada produto.
async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("*");
  // Informa quando as categorias não puderem ser carregadas.
  if (error) {
    filtroCategoria.innerHTML = '<option value="">Não foi possível carregar categorias</option>';
    filtroCategoria.disabled = true;
    return;
  }
  // Guarda a escolha atual para mantê-la quando a lista for recarregada.
  const categoriaEscolhida = filtroCategoria.value;
  filtroCategoria.disabled = false;
  filtroCategoria.innerHTML = '<option value="">Todas as categorias</option>';
  categoriasPorId = {};
  data.forEach(function (categoria) {
    const id = categoria.categoriaprodutoid ?? categoria.categoriaid;
    categoriasPorId[id] =
      categoria.nome_categoria || categoria.ds_categoria_produto || "Sem nome";

    // Cria uma opção com o nome visível e o id da categoria como valor.
    const opcao = document.createElement("option");
    opcao.value = id;
    opcao.textContent = categoriasPorId[id];
    filtroCategoria.appendChild(opcao);
  });
  // Se a categoria anterior deixou de existir, volta a mostrar todas.
  filtroCategoria.value = categoriaEscolhida;
  if (filtroCategoria.selectedIndex === -1) filtroCategoria.value = "";
}

// Cria uma linha para cada produto da lista informada.
function mostrarProdutos(lista) {
  if (!lista.length) {
    listaProdutos.innerHTML =
      '<tr><td class="mensagem" colspan="10">Nenhum produto encontrado.</td></tr>';
    return;
  }
  listaProdutos.innerHTML = "";
  lista.forEach(function (produto) {
    const id = produto.produtoid;
    const ativo = estaAtivo(produto.status_produto);
    const nomeCategoria =
      categoriasPorId[produto.categoriaprodutoid] || "Não informada";
    const linha = document.createElement("tr");
    linha.innerHTML = `<td><input class="checkbox selecionar-produto" type="checkbox" value="${id}" ${idsSelecionados.includes(String(id)) ? "checked" : ""}></td><td>${textoSeguro(id)}</td><td>${textoSeguro(produto.nome_produto)}</td><td>${textoSeguro(produto.ds_produto)}</td><td>${textoSeguro(nomeCategoria)}</td><td>${textoSeguro(produto.obs_produto)}</td><td>${formatarData(produto.dt_cadastro_produto)}</td><td><span class="status"><span class="bolinha ${ativo ? "ativo" : ""}"></span>${ativo ? "Ativo" : "Inativo"}</span></td><td>${formatarValor(produto)}</td><td><div class="acoes"><button class="botao editar" type="button">Editar</button><button class="botao botao-excluir excluir" type="button">Excluir</button></div></td>`;
    linha
      .querySelector(".selecionar-produto")
      .addEventListener("change", atualizarSelecionados);
    linha.querySelector(".editar").addEventListener("click", function () {
      window.location.href = "cadastro-produto.html?id=" + id;
    });
    linha.querySelector(".excluir").addEventListener("click", function () {
      excluirProdutos([id]);
    });
    listaProdutos.appendChild(linha);
  });
  atualizarBotaoSelecionados();
}

// Busca todos os registros existentes na tabela produto.
async function carregarProdutos() {
  listaProdutos.innerHTML =
    '<tr><td class="mensagem" colspan="10">Carregando produtos...</td></tr>';
  await carregarCategorias();
  const { data, error } = await supabaseClient.from("produto").select("*");
  if (error) {
    listaProdutos.innerHTML = `<tr><td class="mensagem erro" colspan="9">Não foi possível carregar os produtos: ${textoSeguro(error.message)}</td></tr>`;
    return;
  }
  produtos = data;
  filtrarProdutos();
}

// Aplica pesquisa, categoria, status e ordenação sobre os produtos carregados.
function filtrarProdutos() {
  const busca = campoBusca.value.toLowerCase().trim();
  const statusEscolhido = filtroStatus.value;
  // O valor vazio representa a opção Todas as categorias.
  const categoriaEscolhida = filtroCategoria.value;
  const resultado = produtos.filter(function (produto) {
    // Inclui o id na pesquisa junto com o nome e a descrição do produto.
    const texto =
      `${produto.produtoid ?? ""} ${produto.nome_produto || ""} ${produto.ds_produto || ""}`.toLowerCase();
    const statusCorreto =
      statusEscolhido === "todos" ||
      (statusEscolhido === "ativo" && estaAtivo(produto.status_produto)) ||
      (statusEscolhido === "inativo" && !estaAtivo(produto.status_produto));
    // Compara os ids como texto, pois o valor do select é sempre uma string.
    const categoriaCorreta =
      categoriaEscolhida === "" ||
      String(produto.categoriaprodutoid) === categoriaEscolhida;
    return texto.includes(busca) && statusCorreto && categoriaCorreta;
  });
  const [campo, direcao] = seletorOrdem.value.split("-");
  resultado.sort(function (a, b) {
    const primeiro =
      campo === "data"
        ? new Date(a.dt_cadastro_produto || 0).getTime()
        : pegarValor(a);
    const segundo =
      campo === "data"
        ? new Date(b.dt_cadastro_produto || 0).getTime()
        : pegarValor(b);
    return direcao === "asc" ? primeiro - segundo : segundo - primeiro;
  });
  mostrarProdutos(resultado);
}

// Guarda os IDs das caixas marcadas e libera a exclusão em massa.
function atualizarSelecionados() {
  idsSelecionados = Array.from(
    document.querySelectorAll(".selecionar-produto:checked"),
  ).map(function (caixa) {
    return caixa.value;
  });
  atualizarBotaoSelecionados();
}
function atualizarBotaoSelecionados() {
  const caixas = document.querySelectorAll(".selecionar-produto");
  botaoExcluirSelecionados.disabled = idsSelecionados.length === 0;
  selecionarTodos.checked =
    caixas.length > 0 && caixas.length === idsSelecionados.length;
}

// Exclui no Supabase um produto, ou vários produtos selecionados.
async function excluirProdutos(ids) {
  if (
    !confirm(
      `Deseja realmente excluir ${ids.length > 1 ? ids.length + " produtos" : "este produto"}?`,
    )
  )
    return;
  // O banco remove somente o vínculo com o catálogo e mantém a foto dos itens.
  const { error } = await supabaseClient
    .from("produto")
    .delete()
    .in("produtoid", ids);
  if (error) {
    alert("Não foi possível excluir: " + error.message);
    return;
  }
  idsSelecionados = [];
  selecionarTodos.checked = false;
  carregarProdutos();
}
campoBusca.addEventListener("input", filtrarProdutos);
filtroStatus.addEventListener("change", filtrarProdutos);
// Atualiza a tabela ao escolher outra categoria, mantendo os demais filtros.
filtroCategoria.addEventListener("change", filtrarProdutos);
seletorOrdem.addEventListener("change", filtrarProdutos);
selecionarTodos.addEventListener("change", function () {
  document.querySelectorAll(".selecionar-produto").forEach(function (caixa) {
    caixa.checked = selecionarTodos.checked;
  });
  atualizarSelecionados();
});
botaoExcluirSelecionados.addEventListener("click", function () {
  excluirProdutos(idsSelecionados);
});
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});
carregarProdutos();
