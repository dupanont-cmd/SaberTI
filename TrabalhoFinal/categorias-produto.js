// Dados do Supabase: esta chave pública pode ser usada nas páginas do navegador.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da tela e lista que guarda os dados recebidos do banco.
const listaCategorias = document.getElementById("listaCategorias");
const campoBusca = document.getElementById("campoBusca");
const selecionarTodas = document.getElementById("selecionarTodas");
const botaoExcluirSelecionadas = document.getElementById(
  "botaoExcluirSelecionadas",
);
let categorias = [];
let idsSelecionados = [];

// Formata a data do banco para o padrão brasileiro.
function formatarData(data) {
  return data ? new Date(data).toLocaleDateString("pt-BR") : "Não informada";
}

// Evita que textos cadastrados sejam interpretados como HTML dentro da tabela.
function textoSeguro(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto || "Não informado";
  return elemento.innerHTML;
}

// Desenha na tabela somente as categorias da lista recebida.
function mostrarCategorias(lista) {
  if (!lista.length) {
    listaCategorias.innerHTML =
      '<tr><td class="mensagem" colspan="6">Nenhuma categoria encontrada.</td></tr>';
    return;
  }
  listaCategorias.innerHTML = "";
  lista.forEach(function (categoria) {
    const id = categoria.categoriaprodutoid;
    const linha = document.createElement("tr");
    linha.innerHTML = `<td><input class="checkbox selecionar-categoria" type="checkbox" value="${id}" ${idsSelecionados.includes(String(id)) ? "checked" : ""} aria-label="Selecionar categoria"></td><td>${textoSeguro(id)}</td><td>${textoSeguro(categoria.nome_categoria)}</td><td>${textoSeguro(categoria.ds_categoria_produto)}</td><td>${formatarData(categoria.data_categoria)}</td><td><div class="acoes"><button class="botao editar" type="button">Editar</button><button class="botao botao-excluir excluir" type="button">Excluir</button></div></td>`;
    linha
      .querySelector(".selecionar-categoria")
      .addEventListener("change", atualizarSelecionados);
    linha.querySelector(".editar").addEventListener("click", function () {
      window.location.href = "cadastro-categoria-produto.html?id=" + id;
    });
    linha.querySelector(".excluir").addEventListener("click", function () {
      excluirCategorias([id]);
    });
    listaCategorias.appendChild(linha);
  });
  atualizarBotaoSelecionadas();
}

// Busca os registros da tabela categoria_produto no Supabase.
async function carregarCategorias() {
  listaCategorias.innerHTML =
    '<tr><td class="mensagem" colspan="6">Carregando categorias...</td></tr>';
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("*")
    .order("categoriaprodutoid", { ascending: false });
  if (error) {
    listaCategorias.innerHTML = `<tr><td class="mensagem erro" colspan="6">Não foi possível carregar as categorias: ${textoSeguro(error.message)}</td></tr>`;
    return;
  }
  categorias = data;
  pesquisarCategorias();
}

// Filtra por nome ou descrição sem fazer nova consulta ao banco.
function pesquisarCategorias() {
  const busca = campoBusca.value.toLowerCase().trim();
  mostrarCategorias(
    categorias.filter(function (categoria) {
      return (
        String(categoria.nome_categoria || "")
          .toLowerCase()
          .includes(busca) ||
        String(categoria.ds_categoria_produto || "")
          .toLowerCase()
          .includes(busca)
      );
    }),
  );
}

// Lê as caixas marcadas e habilita/desabilita o botão de exclusão em massa.
function atualizarSelecionados() {
  idsSelecionados = Array.from(
    document.querySelectorAll(".selecionar-categoria:checked"),
  ).map(function (caixa) {
    return caixa.value;
  });
  atualizarBotaoSelecionadas();
}
function atualizarBotaoSelecionadas() {
  botaoExcluirSelecionadas.disabled = idsSelecionados.length === 0;
  selecionarTodas.checked =
    document.querySelectorAll(".selecionar-categoria").length > 0 &&
    document.querySelectorAll(".selecionar-categoria").length ===
      idsSelecionados.length;
}

// Apaga uma ou várias categorias após a confirmação do usuário.
async function excluirCategorias(ids) {
  if (
    !window.confirm(
      `Deseja realmente excluir ${ids.length > 1 ? ids.length + " categorias" : "esta categoria"}?`,
    )
  )
    return;
  const { error } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .in("produtoid", ids);
    
    
    await supabaseClient
    .from("produto")
    .delete()
    .in("categoriaprodutoid", ids);

  await supabaseClient
    .from("categoria_produto")
    .delete()
    .in("categoriaprodutoid", ids);
  if (error) {
    alert("Não foi possível excluir: " + error.message);
    return;
  }
  idsSelecionados = [];
  selecionarTodas.checked = false;
  carregarCategorias();
}

campoBusca.addEventListener("input", pesquisarCategorias);
selecionarTodas.addEventListener("change", function () {
  document.querySelectorAll(".selecionar-categoria").forEach(function (caixa) {
    caixa.checked = selecionarTodas.checked;
  });
  atualizarSelecionados();
});
botaoExcluirSelecionadas.addEventListener("click", function () {
  excluirCategorias(idsSelecionados);
});
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});
carregarCategorias();
