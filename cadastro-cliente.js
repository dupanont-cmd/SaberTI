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
// Lê o id enviado pelo botão Editar, seguindo o mesmo padrão dos produtos.
const idCliente = new URLSearchParams(window.location.search).get("id");

// Na edição, permite salvar somente depois que os dados atuais forem carregados.
let clienteCarregado = !idCliente;

// Mostra uma mensagem de sucesso ou erro abaixo do título do formulário.
function mostrarMensagem(texto, tipo) {
  mensagemGeral.textContent = texto;
  mensagemGeral.className = "mensagem " + tipo;
}

// Máscara simples para CPF: remove o que não for número e coloca . e - automaticamente.
function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  // Só adiciona separadores quando existe um número depois deles, evitando travar o Backspace.
  let cpfFormatado = numeros.slice(0, 3);
  if (numeros.length > 3) cpfFormatado += ".";
  cpfFormatado += numeros.slice(3, 6);
  if (numeros.length > 6) cpfFormatado += ".";
  cpfFormatado += numeros.slice(6, 9);
  if (numeros.length > 9) cpfFormatado += "-";
  cpfFormatado += numeros.slice(9, 11);
  return cpfFormatado;
}

// Formata o CNPJ numérico com pontos, barra e traço: 00.000.000/0000-00.
function formatarCNPJ(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  let cnpjFormatado = numeros.slice(0, 2);
  if (numeros.length > 2) cnpjFormatado += ".";
  cnpjFormatado += numeros.slice(2, 5);
  if (numeros.length > 5) cnpjFormatado += ".";
  cnpjFormatado += numeros.slice(5, 8);
  if (numeros.length > 8) cnpjFormatado += "/";
  cnpjFormatado += numeros.slice(8, 12);
  if (numeros.length > 12) cnpjFormatado += "-";
  cnpjFormatado += numeros.slice(12, 14);
  return cnpjFormatado;
}

// Usa o tipo escolhido para definir a máscara, o exemplo e o limite do campo.
function atualizarDocumento() {
  if (tipoPessoa.value === "F") {
    cpfCnpj.placeholder = "000.000.000-00";
    cpfCnpj.maxLength = 14;
    cpfCnpj.value = formatarCPF(cpfCnpj.value);
  } else if (tipoPessoa.value === "J") {
    cpfCnpj.placeholder = "00.000.000/0000-00";
    cpfCnpj.maxLength = 18;
    cpfCnpj.value = formatarCNPJ(cpfCnpj.value);
  } else {
    cpfCnpj.placeholder = "Digite o CPF ou CNPJ";
    cpfCnpj.maxLength = 18;
  }
}

// Atualiza a formatação ao digitar, colar um documento ou trocar o tipo de pessoa.
cpfCnpj.addEventListener("input", atualizarDocumento);
tipoPessoa.addEventListener("change", atualizarDocumento);

// Mantém apenas os números do telefone brasileiro, com DDD e até 11 dígitos.
function formatarTelefone(valor) {
  const numeros = String(valor).replace(/\D/g, "").slice(0, 11);
  if (numeros.length === 0) return "";
  if (numeros.length <= 2) return "(" + numeros;

  // Se houver 11 dígitos, usa cinco números antes do traço; no fixo, usa quatro.
  const fimPrimeiraParte = numeros.length === 11 ? 7 : 6;
  let telefoneFormatado = "(" + numeros.slice(0, 2) + ") ";
  telefoneFormatado += numeros.slice(2, fimPrimeiraParte);

  // Acrescenta o traço somente quando houver números para mostrar depois dele.
  if (numeros.length > fimPrimeiraParte) {
    telefoneFormatado += "-" + numeros.slice(fimPrimeiraParte);
  }
  return telefoneFormatado;
}

// Aplica a máscara automaticamente ao digitar ou colar um telefone.
telefone.addEventListener("input", function () {
  telefone.value = formatarTelefone(telefone.value);
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
  // Restaura o exemplo e o limite do documento depois de limpar o formulário.
  atualizarDocumento();
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

  // Evita salvar um formulário de edição que ainda não carregou o cliente.
  if (!clienteCarregado) {
    mostrarMensagem("Aguarde o carregamento do cliente antes de salvar.", "erro");
    return;
  }

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
  // Com id, altera apenas o cliente escolhido; sem id, cadastra um novo cliente.
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
    // Mantém o texto do botão de acordo com o cadastro ou a edição.
    botaoSalvar.textContent = idCliente ? "Salvar alterações" : "Salvar cliente";
    return;
  }

  // Confirma se o cliente foi atualizado ou cadastrado antes de voltar à lista.
  mostrarMensagem(
    idCliente
      ? "Cliente atualizado com sucesso! Voltando para a lista..."
      : "Cliente salvo com sucesso! Voltando para a lista...",
    "sucesso",
  );
  setTimeout(function () {
    window.location.href = "clientes.html";
  }, 900);
});

// Quando vier da edição, busca os dados atuais para preencher o formulário.
async function carregarClienteParaEditar() {
  if (!idCliente) return;

  // Identifica a tela de edição e bloqueia o botão enquanto busca os dados.
  document.getElementById("tituloPagina").textContent = "Editar cliente";
  document.getElementById("subtituloPagina").textContent =
    "Altere os dados e salve as mudanças.";
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = "Carregando cliente...";
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("*")
    .eq("clienteid", idCliente)
    .single();

  if (error) {
    // Mantém o salvamento bloqueado se não foi possível encontrar ou carregar o cliente.
    botaoSalvar.textContent = "Cliente não carregado";
    mostrarMensagem(
      "Não foi possível carregar este cliente: " + error.message,
      "erro",
    );
    return;
  }
  // Preenche os campos com os dados do registro escolhido na listagem.
  tipoPessoa.value = data.tipo_cliente || "";
  nome.value = data.nome_cliente || data.nome || "";
  cpfCnpj.value = data.cpf_cnpj_cliente || "";
  // Formata o documento recebido do banco conforme o tipo de pessoa na edição.
  atualizarDocumento();
  // Mostra o telefone já formatado ao carregar os dados para edição.
  telefone.value = formatarTelefone(data.telefone || "");

  // Libera o salvamento depois de preencher todos os campos da edição.
  clienteCarregado = true;
  botaoSalvar.disabled = false;
  botaoSalvar.textContent = "Salvar alterações";
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
