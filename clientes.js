// Dados do projeto Supabase. A chave "publishable" pode ser usada no navegador.
const SUPABASE_URL = "https://zohtwkjcioqounlkziuk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8tGzbYUFSr4_wBgu24E97w_H_d_N1Rl";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos da página que serão atualizados pelo JavaScript.
const listaClientes = document.getElementById("listaClientes");
const campoBusca = document.getElementById("campoBusca");
const seletorOrdem = document.getElementById("seletorOrdem");

// Guarda a lista recebida para pesquisar sem precisar consultar o banco a cada letra digitada.
let clientes = [];

// Retorna o nome, aceitando alguns nomes de coluna comuns no banco de dados.
function pegarNome(cliente) {
  return (
    cliente.nome || cliente.nome_cliente || cliente.name || "Nome não informado"
  );
}

// Aceita alguns nomes comuns para a coluna que guarda a data de cadastro.
function pegarDataCadastro(cliente) {
  return cliente.data_registro;
}

// Transforma a data que vem do Supabase em uma data fácil de ler.
function formatarData(data) {
  if (!data) return "Não informada";
  return new Date(data).toLocaleDateString("pt-BR");
}

// Cria uma linha na tabela para cada cliente encontrado.
function mostrarClientes(lista) {
  if (lista.length === 0) {
    listaClientes.innerHTML =
      '<tr><td class="mensagem" colspan="5">Nenhum cliente encontrado.</td></tr>';
    return;
  }

  listaClientes.innerHTML = "";
  lista.forEach(function (cliente) {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${pegarNome(cliente)}</td>
      <td>${cliente.tipo_cliente || "Não informado"}</td>
      <td>${mascararCPF(cliente.cpf_cnpj_cliente) || "Não informado"}</td>
      <td>${formatarData(pegarDataCadastro(cliente))}</td>
      <td><div class="acoes">
        <button class="botao-acao" type="button">Editar</button>
        <button class="botao-acao botao-excluir" type="button">Excluir</button>
      </div></td>`;

    // A tela de formulário receberá o id do cliente para saber qual registro editar.
    linha.querySelector(".botao-acao").addEventListener("click", function () {
      window.location.href = "cadastro-cliente.html?id=" + cliente.clienteid;
    });
    linha
      .querySelector(".botao-excluir")
      .addEventListener("click", function () {
        excluirCliente(cliente.clienteid, pegarNome(cliente));
      });
    listaClientes.appendChild(linha);
  });
}

// Busca a tabela "clientes" no Supabase. A ordenação é feita logo abaixo.
async function carregarClientes() {
  listaClientes.innerHTML =
    '<tr><td class="mensagem" colspan="5">Carregando clientes...</td></tr>';
  const ordemCrescente = seletorOrdem.value === "asc";
  const { data, error } = await supabaseClient.from("cliente").select("*");

  if (error) {
    listaClientes.innerHTML = `<tr><td class="mensagem erro" colspan="5">Não foi possível carregar os clientes: ${error.message}</td></tr>`;
    return;
  }
  // Converte a data em número para comparar e muda a direção conforme o seletor.
  clientes = data.sort(function (primeiro, segundo) {
    const dataPrimeiro = new Date(pegarDataCadastro(primeiro) || 0).getTime();
    const dataSegundo = new Date(pegarDataCadastro(segundo) || 0).getTime();
    return ordemCrescente
      ? dataPrimeiro - dataSegundo
      : dataSegundo - dataPrimeiro;
  });
  pesquisarClientes();
}

// Filtra a lista pelo nome digitado, ignorando maiúsculas e minúsculas.
function pesquisarClientes() {
  const textoDigitado = campoBusca.value.toLowerCase().trim();
  const clientesFiltrados = clientes.filter(function (cliente) {
    return pegarNome(cliente).toLowerCase().includes(textoDigitado);
  });
  mostrarClientes(clientesFiltrados);
}

// Pede confirmação e remove o registro com o id escolhido.
async function excluirCliente(clienteid, nome) {
  const confirmou = window.confirm(
    `Deseja realmente excluir o cliente "${nome}"?`,
  );
  if (!confirmou) return;

  // 1. Buscar todos os orcamentoid vinculados a esse cliente
  const { data: orcamentos, error: erroBusca } = await supabaseClient
    .from("orcamento")
    .select("orcamentoid")
    .eq("clienteid", clienteid);

  if (erroBusca) {
    alert(
      "Não foi possível buscar os orçamentos do cliente: " + erroBusca.message,
    );
    return;
  }

  // 2. Apagar de orcamento_item cada linha ligada a esses orcamentoid
  if (orcamentos.length > 0) {
    const idsOrcamentos = orcamentos.map((o) => o.orcamentoid);
    const { error: erroItem } = await supabaseClient
      .from("orcamento_item")
      .delete()
      .in("orcamentoid", idsOrcamentos);

    if (erroItem) {
      alert(
        "Não foi possível excluir os itens do orçamento: " + erroItem.message,
      );
      return;
    }
  }
  // 3. Apagar de orcamento
  const { error: erroOrcamento } = await supabaseClient
    .from("orcamento")
    .delete()
    .eq("clienteid", clienteid);

  if (erroOrcamento) {
    alert("Não foi possível excluir o orçamento: " + erroOrcamento.message);
    return;
  }

  // 4. Apagar o cliente
  const { error: erroCliente } = await supabaseClient
    .from("cliente")
    .delete()
    .eq("clienteid", clienteid);

  if (erroCliente) {
    alert("Não foi possível excluir o cliente: " + erroCliente.message);
    return;
  }

  carregarClientes();
}

// MASCARA DO CPF
function mascararCPF(cpf) {
  const digits = cpf.replace(/\D/g, ''); // remove pontos e traço
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

// Eventos simples: digitação pesquisa e mudança de ordem consulta novamente o banco.
campoBusca.addEventListener("input", pesquisarClientes);
seletorOrdem.addEventListener("change", carregarClientes);
document.getElementById("botaoSair").addEventListener("click", function () {
  window.location.href = "index.html";
});

// Assim que a página abre, os clientes são carregados.
carregarClientes();
