// Dados da conexão com o Supabase.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Campos do formulário e o id usado quando a página abre para editar.
const formulario = document.getElementById("formProduto");
const nomeProduto = document.getElementById("nomeProduto");
const descricaoProduto = document.getElementById("descricaoProduto");
const categoriaProduto = document.getElementById("categoriaProduto");
const valorProduto = document.getElementById("valorProduto");
const observacaoProduto = document.getElementById("observacaoProduto");
const statusProduto = document.getElementById("statusProduto");
const dataCadastroProduto = document.getElementById("dataCadastroProduto");
const mensagemGeral = document.getElementById("mensagemGeral");
const botaoSalvar = document.getElementById("botaoSalvar");
const idProduto = new URLSearchParams(window.location.search).get("id");

function hoje() {
  return new Date().toISOString().split("T")[0];
}
function mensagem(texto, tipo) {
  mensagemGeral.textContent = texto;
  mensagemGeral.className = "mensagem " + tipo;
}

// Preenche o select com as categorias cadastradas na outra tela.
async function carregarCategorias() {
  const { data, error } = await supabaseClient.from("categoria_produto").select("*");
  if (error) {
    categoriaProduto.innerHTML = '<option value="">Não foi possível carregar categorias</option>';
    return;
  }
  categoriaProduto.innerHTML = '<option value="">Selecione uma categoria</option>';
  data.forEach(function (categoria) {
    const opcao = document.createElement("option");
    opcao.value = categoria.categoriaprodutoid ?? categoria.categoriaprodutoid;
    opcao.textContent = categoria.nome_categoria || categoria.ds_categoria_produto;
    categoriaProduto.appendChild(opcao);
  });
}
function limparFormulario() {
  formulario.reset();
  dataCadastroProduto.value = hoje();
  mensagemGeral.textContent = "";
  nomeProduto.focus();
}

document
  .getElementById("botaoLimpar")
  .addEventListener("click", limparFormulario);
document.getElementById("botaoVoltar").addEventListener("click", function () {
  window.location.href = "produtos.html";
});
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});

// Insere um produto novo; se houver id na URL, atualiza o registro existente.
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const dadosProduto = {
    nome_produto: nomeProduto.value.trim(),
    // Apesar dos IDs antigos do HTML, os valores seguem os rótulos visíveis na tela.
    ds_produto: descricaoProduto.value.trim(),
    categoriaprodutoid: categoriaProduto.value,
    valor_produto: Number(valorProduto.value),
    obs_produto: observacaoProduto.value.trim(),
    status_produto: statusProduto.value,
    dt_cadastro_produto: dataCadastroProduto.value,
  };
  if (
    !dadosProduto.nome_produto ||
    !dadosProduto.ds_produto ||
    !dadosProduto.categoriaprodutoid ||
    !dadosProduto.dt_cadastro_produto ||
    Number.isNaN(dadosProduto.valor_produto)
  ) {
    mensagem("Preencha todos os campos obrigatórios.", "erro");
    return;
  }
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";
  const resposta = idProduto
    ? await supabaseClient
        .from("produto")
        .update(dadosProduto)
        .eq("produtoid", idProduto)
    : await supabaseClient.from("produto").insert(dadosProduto);
  if (resposta.error) {
    mensagem("Não foi possível salvar: " + resposta.error.message, "erro");
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = idProduto
      ? "Salvar alterações"
      : "Salvar e cadastrar outro";
    return;
  }
  if (idProduto) {
    mensagem("Produto atualizado com sucesso!", "sucesso");
    setTimeout(function () {
      window.location.href = "produtos.html";
    }, 800);
    return;
  }
  mensagem("Produto salvo com sucesso! Você pode cadastrar outro.", "sucesso");
  limparFormulario();
  botaoSalvar.disabled = false;
  botaoSalvar.textContent = "Salvar e cadastrar outro";
});

// Preenche o formulário com os dados atuais ao clicar no botão Editar.
async function carregarProdutoParaEditar() {
  if (!idProduto) {
    dataCadastroProduto.value = hoje();
    return;
  }
  document.getElementById("tituloPagina").textContent = "Editar produto";
  document.getElementById("subtituloPagina").textContent =
    "Altere os dados e salve as mudanças.";
  botaoSalvar.textContent = "Salvar alterações";
  const { data, error } = await supabaseClient
    .from("produto")
    .select("*")
    .eq("produtoid", idProduto)
    .single();
  if (error) {
    mensagem(
      "Não foi possível carregar este produto: " + error.message,
      "erro",
    );
    return;
  }
  nomeProduto.value = data.nome_produto || "";
  // Preenche cada campo conforme os novos rótulos: observação primeiro, descrição depois.
  descricaoProduto.value = data.ds_produto || "";
  categoriaProduto.value = data.categoriaprodutoid || "";
  valorProduto.value = data.valor_produto ?? data.vl_produto ?? "";
  observacaoProduto.value = data.obs_produto || "";
  statusProduto.value = data.status_produto || "Ativo";
  dataCadastroProduto.value = data.dt_cadastro_produto
    ? String(data.dt_cadastro_produto).slice(0, 10)
    : "";
}
async function iniciarPagina() {
  await carregarCategorias();
  carregarProdutoParaEditar();
}
iniciarPagina();
