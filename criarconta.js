// Dados do seu projeto no Supabase.
const SUPABASE_URL = 'https://zohtwkjcioqounlkziuk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl';

// Cria a conexão que será usada para cadastrar os usuários.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Pegamos os elementos da página para poder ler os campos e mostrar mensagens.
const formulario = document.getElementById('formCadastro');
const email = document.getElementById('email');
const senha = document.getElementById('senha');
const confirmarSenha = document.getElementById('confirmarSenha');
const mensagemGeral = document.getElementById('mensagemGeral');
const botaoCriarConta = document.getElementById('botaoCriarConta');

// Estes elementos representam cada campo e a mensagem de erro abaixo dele.
const campoEmail = document.getElementById('campoEmail');
const campoSenha = document.getElementById('campoSenha');
const campoConfirmarSenha = document.getElementById('campoConfirmarSenha');
const erroEmail = document.getElementById('erroEmail');
const erroSenha = document.getElementById('erroSenha');
const erroConfirmarSenha = document.getElementById('erroConfirmarSenha');

// Limpa todas as mensagens e remove a borda vermelha dos campos.
function limparErros() {
  campoEmail.classList.remove('erro');
  campoSenha.classList.remove('erro');
  campoConfirmarSenha.classList.remove('erro');
  erroEmail.textContent = '';
  erroSenha.textContent = '';
  erroConfirmarSenha.textContent = '';
  mensagemGeral.textContent = '';
  mensagemGeral.classList.remove('erro', 'sucesso');
}

// Mostra uma mensagem geral para o usuário (erro ou sucesso).
function mostrarMensagem(texto, tipo) {
  mensagemGeral.textContent = texto;
  mensagemGeral.classList.remove('erro', 'sucesso');
  mensagemGeral.classList.add(tipo);
}

// Compara as duas senhas enquanto a pessoa digita a confirmação.
  confirmarSenha.addEventListener('input', function () {
  campoConfirmarSenha.classList.remove('erro');
  erroConfirmarSenha.textContent = '';

  if (confirmarSenha.value !== '' && senha.value !== confirmarSenha.value) {
    campoConfirmarSenha.classList.add('erro');
    erroConfirmarSenha.textContent = 'As senhas não são iguais.';
  }
});

// Faz o insert do novo usuário na tabela "cliente".
async function salvarUsuario(valorEmail, valorSenha) {
  const novoUsuario = {
    email: valorEmail,
    senha: valorSenha
  };

  // A tabela "cliente" precisa ter as colunas email (text) e senha (text).
  const { error } = await supabaseClient
    .from('usuarios')
    .insert(novoUsuario);

  if (error) {
    mostrarMensagem('Erro ao salvar conta: ' + error.message, 'erro');
    return false;
  }

  mostrarMensagem('Conta criada com sucesso!', 'sucesso');
  return true;
}

// Este código é executado quando o formulário é enviado pelo botão.
formulario.addEventListener('submit', async function (evento) {
  // Impede que a página recarregue ao enviar o formulário.
  evento.preventDefault();
  limparErros();

  // Lê os valores que a pessoa digitou.
  const valorEmail = email.value.trim();
  const valorSenha = senha.value;
  const valorConfirmarSenha = confirmarSenha.value;
  let formularioEstaCorreto = true;

  // Verifica se o campo de e-mail foi preenchido e possui formato válido.
  if (valorEmail === '') {
    campoEmail.classList.add('erro');
    erroEmail.textContent = 'Preencha este campo.';
    formularioEstaCorreto = false;
  } else if (!email.validity.valid) {
    campoEmail.classList.add('erro');
    erroEmail.textContent = 'Informe um e-mail válido.';
    formularioEstaCorreto = false;
  }

  // Verifica se a senha foi preenchida.
  if (valorSenha === '') {
    campoSenha.classList.add('erro');
    erroSenha.textContent = 'Preencha este campo.';
    formularioEstaCorreto = false;
  }

  // Verifica se a confirmação foi preenchida e se é igual à senha.
  if (valorConfirmarSenha === '') {
    campoConfirmarSenha.classList.add('erro');
    erroConfirmarSenha.textContent = 'Preencha este campo.';
    formularioEstaCorreto = false;
  } else if (valorSenha !== valorConfirmarSenha) {
    campoConfirmarSenha.classList.add('erro');
    erroConfirmarSenha.textContent = 'As senhas não são iguais.';
    formularioEstaCorreto = false;
  }

  // Se houver algum erro, interrompe o cadastro aqui.
  if (!formularioEstaCorreto) {
    return;
  }

  // Evita dois cliques enquanto o Supabase está processando o cadastro.
  botaoCriarConta.disabled = true;
  botaoCriarConta.textContent = 'Criando conta...';

  const deuCerto = await salvarUsuario(valorEmail, valorSenha);

  if (deuCerto) {
    formulario.reset();
  }

  // Devolve o botão ao estado normal depois de terminar a requisição.
  botaoCriarConta.disabled = false;
  botaoCriarConta.textContent = 'Criar minha conta';
});

// Leva a pessoa de volta para a página de login ao clicar no link.
document.getElementById('botaoVoltar').addEventListener('click', function () {
  window.location.href = 'index.html';
});