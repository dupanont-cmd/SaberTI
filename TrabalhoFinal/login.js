const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
 
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);	


  const botaoEntrar = document.getElementById('botaoEntrar');
  const formulario = document.getElementById('formLogin');
  const campoUsuario = document.getElementById('campoUsuario');
  const campoSenha = document.getElementById('campoSenha');
  const inputEmail = document.getElementById('usuario');
  const inputSenha = document.getElementById('senha');
  const erroUsuario = document.getElementById('erroUsuario');
  const erroSenha = document.getElementById('erroSenha');
  const mensagemGeral = document.getElementById('mensagemGeral');

  const botaoCriarConta = document.getElementById('botaoCriarConta');
  

  function limparErros() {
    campoUsuario.classList.remove('erro');
    campoSenha.classList.remove('erro');
    erroUsuario.textContent = '';
    erroSenha.textContent = '';
    mensagemGeral.textContent = '';
  }

  botaoEntrar.addEventListener('click', async function () {
    limparErros();

    const valorEmail = inputEmail.value.trim();
    const valorSenha = inputSenha.value.trim();
    let possuiCampoVazio = false;

    if (valorEmail === '') {
      campoUsuario.classList.add('erro');
      erroUsuario.textContent = 'Preencha este campo.';
      possuiCampoVazio = true;
    }

    if (valorSenha === '') {
      campoSenha.classList.add('erro');
      erroSenha.textContent = 'Preencha este campo.';
      possuiCampoVazio = true;
    }

    if (possuiCampoVazio) {
      return;
    }

     const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('email', valorEmail)
    .eq('senha', valorSenha);

if (error) {
    mensagemGeral.textContent = 'Erro ao tentar entrar: ' + error.message;
    return;
  }
 
  // Se encontrou pelo menos uma linha, o login está correto.
  if (data.length > 0) {
  mensagemGeral.textContent = 'Login realizado com sucesso!';
  window.location.href = 'menu.html';
} else {
  mensagemGeral.textContent = 'E-mail ou senha incorretos.';
}
  });



  botaoCriarConta.addEventListener('click', function () {
    window.location.href = 'criarconta.html';
  });


