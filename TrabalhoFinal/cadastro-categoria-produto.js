// Conexão com o mesmo projeto Supabase usado nas telas de clientes.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Campos, botões e o id usado quando a página estiver no modo de edição.
const formulario = document.getElementById("formCategoria");
const nomeCategoria = document.getElementById("nomeCategoria");
const descricaoCategoria = document.getElementById("descricaoCategoria");
const dataCategoria = document.getElementById("dataCategoria");
const mensagemGeral = document.getElementById("mensagemGeral");
const botaoSalvar = document.getElementById("botaoSalvar");
const idCategoria = new URLSearchParams(window.location.search).get("id");

function mostrarMensagem(texto, tipo) {
  mensagemGeral.textContent = texto;
  mensagemGeral.className = "mensagem " + tipo;
}
function dataDeHoje() {
  return new Date().toISOString().split("T")[0];
}

// Limpa o formulário e mantém o foco no primeiro campo para um novo cadastro.
document.getElementById("botaoLimpar").addEventListener("click", function () {
  formulario.reset();
  dataCategoria.value = dataDeHoje();
  mensagemGeral.textContent = "";
  nomeCategoria.focus();
});
document.getElementById("botaoVoltar").addEventListener("click", function () {
  window.location.href = "categorias-produto.html";
});
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});

// Envia os dados para o Supabase. Sem id insere; com id atualiza o registro existente.
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  const dadosCategoria = {
    nome_categoria: nomeCategoria.value.trim(),
    ds_categoria_produto: descricaoCategoria.value.trim(),
    data_categoria: dataCategoria.value,
  };
  if (
    !dadosCategoria.nome_categoria ||
    !dadosCategoria.ds_categoria_produto ||
    !dadosCategoria.data_categoria
  ) {
    mostrarMensagem("Preencha todos os campos antes de salvar.", "erro");
    return;
  }
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";
  const resposta = idCategoria
    ? await supabaseClient
        .from("categoria_produto")
        .update(dadosCategoria)
        .eq("categoriaprodutoid", idCategoria)
    : await supabaseClient.from("categoria_produto").insert(dadosCategoria);
  if (resposta.error) {
    mostrarMensagem(
      "Não foi possível salvar: " + resposta.error.message,
      "erro",
    );
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = idCategoria
      ? "Salvar alterações"
      : "Salvar e cadastrar outra";
    return;
  }
  if (idCategoria) {
    mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
    setTimeout(function () {
      window.location.href = "categorias-produto.html";
    }, 800);
    return;
  }
  mostrarMensagem(
    "Categoria salva com sucesso! Você já pode cadastrar outra.",
    "sucesso",
  );
  formulario.reset();
  dataCategoria.value = dataDeHoje();
  nomeCategoria.focus();
  botaoSalvar.disabled = false;
  botaoSalvar.textContent = "Salvar e cadastrar outra";
});

// Quando a página recebe ?id=..., busca a categoria para preencher os campos.
async function carregarCategoriaParaEditar() {
  if (!idCategoria) {
    dataCategoria.value = dataDeHoje();
    return;
  }
  document.getElementById("tituloPagina").textContent = "Editar categoria";
  document.getElementById("subtituloPagina").textContent =
    "Altere os dados da categoria e salve as mudanças.";
  botaoSalvar.textContent = "Salvar alterações";
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("*")
    .eq("categoriaprodutoid", idCategoria)
    .single();
  if (error) {
    mostrarMensagem(
      "Não foi possível carregar esta categoria: " + error.message,
      "erro",
    );
    return;
  }
  
  nomeCategoria.value = data.nome_categoria || "";
  descricaoCategoria.value = data.ds_categoria_produto || "";
  dataCategoria.value = data.data_categoria
    ? String(data.data_categoria).slice(0, 10)
    : "";
}
carregarCategoriaParaEditar();
