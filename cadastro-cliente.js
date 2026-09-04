// Dados da conexão com o Supabase fornecidos para este projeto.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Referências aos campos e botões usados mais de uma vez no código.
const formulario = document.getElementById("formCliente");
const tipoPessoa = document.getElementById("tipoPessoa");
const nome = document.getElementById("nome");
const cpfCnpj = document.getElementById("cpfCnpj");
const telefone = document.getElementById("telefone");
const mensagemGeral = document.getElementById("mensagemGeral");
const botaoSalvar = document.getElementById("botaoSalvar");
const idCliente = new URLSearchParams(window.location.search).get("clienteid");

// Mostra uma mensagem de sucesso ou erro abaixo do título do formulário.
function mostrarMensagem(texto, tipo) {
  mensagemGeral.textContent = texto;
  mensagemGeral.className = "mensagem " + tipo;
}

// Máscara simples para CPF: remove o que não for número e coloca . e - automaticamente.
function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  let cpfFormatado = numeros.slice(0, 3);
  if (numeros.length >= 3) cpfFormatado += ".";
  cpfFormatado += numeros.slice(3, 6);
  if (numeros.length >= 6) cpfFormatado += ".";
  cpfFormatado += numeros.slice(6, 9);
  if (numeros.length >= 9) cpfFormatado += "-";
  cpfFormatado += numeros.slice(9, 11);
  return cpfFormatado;
}

// Enquanto for pessoa física, aplica a máscara a cada número digitado no CPF.
cpfCnpj.addEventListener("input", function () {
  if (tipoPessoa.value !== "J") cpfCnpj.value = formatarCPF(cpfCnpj.value);
});

// Ao trocar para pessoa física, também formata um CPF que já tenha sido digitado.
tipoPessoa.addEventListener("change", function () {
  if (tipoPessoa.value === "F") cpfCnpj.value = formatarCPF(cpfCnpj.value);
});

// Com Enter, o foco vai para o próximo campo, deixando o preenchimento mais rápido.
const campos = [tipoPessoa, nome, cpfCnpj, telefone];
campos.forEach(function (campo, indice) {
  campo.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" && indice < campos.length - 1) {
      evento.preventDefault();
      campos[indice + 1].focus();
    }
  });
});

// Limpa todos os campos e devolve o foco ao primeiro deles.
document.getElementById("botaoLimpar").addEventListener("click", function () {
  formulario.reset();
  mensagemGeral.textContent = "";
  tipoPessoa.focus();
});

// Volta para a página que contém a listagem de clientes.
document.getElementById("botaoVoltar").addEventListener("click", function () {
  window.location.href = "clientes.html";
});

// Salva um novo cliente ou, se a URL tiver ?id=..., atualiza o cliente escolhido.
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const dadosCliente = {
    tipo_cliente: tipoPessoa.value,
    nome_cliente: nome.value.trim(),
    cpf_cnpj_cliente: cpfCnpj.value.trim(),
    telefone: telefone.value.trim(),
  };

  if (
    !dadosCliente.tipo_cliente ||
    !dadosCliente.nome_cliente ||
    !dadosCliente.cpf_cnpj_cliente ||
    !dadosCliente.telefone
  ) {
    mostrarMensagem("Preencha todos os campos antes de salvar.", "erro");
    return;
  }

  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Salvando...";

  let resposta;
  if (idCliente) {
    resposta = await supabaseClient
      .from("cliente")
      .update(dadosCliente)
      .eq("clienteid", idCliente);
  } else {
    resposta = await supabaseClient.from("cliente").insert(dadosCliente);
  }

  if (resposta.error) {
    mostrarMensagem(
      "Não foi possível salvar: " + resposta.error.message,
      "erro",
    );
    botaoSalvar.disabled = false;
    botaoSalvar.textContent = "Salvar cliente";
    return;
  }

  mostrarMensagem(
    "Cliente salvo com sucesso! Voltando para a lista...",
    "sucesso",
  );
  setTimeout(function () {
    window.location.href = "clientes.html";
  }, 900);
});

// Quando vier da edição, busca os dados atuais para preencher o formulário.
async function carregarClienteParaEditar() {
  if (!idCliente) return;

  document.getElementById("tituloPagina").textContent = "Editar cliente";
  botaoSalvar.textContent = "Salvar alterações";
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("*")
    .eq("clienteid", idCliente)
    .single();

  if (error) {
    mostrarMensagem(
      "Não foi possível carregar este cliente: " + error.message,
      "erro",
    );
    return;
  }
  tipoPessoa.value = data.tipo_cliente || "";
  nome.value = data.nome || data.nome_cliente || "";
  cpfCnpj.value = data.cpf_cnpj_cliente || "";
  // Um CPF que já veio do banco também aparece no formato correto na edição.
  if (tipoPessoa.value === "F") cpfCnpj.value = formatarCPF(cpfCnpj.value);
  telefone.value = data.telefone || "";
}

// Botão de sair e funcionamento dos dropdowns do menu lateral.
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});
document.querySelectorAll(".dropdown-btn").forEach(function (botao) {
  botao.addEventListener("click", function () {
    botao.parentElement.classList.toggle("active");
  });
});

// A chamada é feita ao abrir a página; sem id, ela simplesmente não faz nada.
carregarClienteParaEditar();
