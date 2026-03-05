/* DECLARANDO AS VARIAVEIS QUE SERÃO UTILIZADAS */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");
const loginBtn = document.getElementById("loginBtn");
const operadorInput = document.getElementById("operadorInput");
const operadorInfo = document.getElementById("operadorInfo");
const logoutBtn = document.getElementById("logoutBtn");

const form = document.getElementById("clienteForm");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const planoSelect = document.getElementById("plano");
const container = document.getElementById("clientesContainer");
const buscaInput = document.getElementById("busca");

const cepInput = document.getElementById("cep");
const ruaInput = document.getElementById("rua");
const bairroInput = document.getElementById("bairro");
const cidadeInput = document.getElementById("cidade");
const estadoInput = document.getElementById("estado");
const operadoresAdmins = ["admin", "Wellington", "Anderson", "Alexandre"];

let timeLimite01 = 3000;
let timeLimite02 = 3000;
let operadorAtual = sessionStorage.getItem("operador");
let clientes = [];

/* FUNÇÃO DE LOGIN */
function iniciarSistema(nome) {
    operadorAtual = nome;
    sessionStorage.setItem("operador", nome);
    operadorInfo.textContent = "Operador(a): " + nome;

    // Remove completamente a tela de login do DOM
    loginScreen.remove();

    // Mostra tela de login
    app.classList.remove("hidden");

    carregarClientes();
    renderizarCards();
}

loginBtn.addEventListener("click", () => {
    if (operadorInput.value.trim() !== "") {
        iniciarSistema(operadorInput.value.trim());
    }
});

logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("operador");
    location.reload();
});

if (operadorAtual) {
    iniciarSistema(operadorAtual);
}

/* LOCAL STORAGE POR OPERADOR */
function carregarClientes() {
    todosClientes = JSON.parse(localStorage.getItem("clientes_db")) || [];
    for (let cliente of todosClientes) {
        if (cliente.operador == operadorAtual || operadoresAdmins.includes(operadorAtual)) {
            clientes.push(cliente);
        }
    }
}

/* SALVAR CLIENTE */
function salvarClientes() {
    const todosClientes = JSON.parse(localStorage.getItem("clientes_db")) || [];

    // Remove clientes do operador atual
    const outrosClientes = todosClientes.filter(c => c.operador !== operadorAtual);

    // Junta com os clientes atuais
    const atualizado = [...outrosClientes, ...clientes];

    localStorage.setItem("clientes_db", JSON.stringify(atualizado));
}


/* CRIAR CARD */
function criarCard(cliente) {

    const card = document.createElement("div");
    card.classList.add("card", cliente.plano.toLowerCase());

    const img = document.createElement("img");
    img.src = cliente.avatar;
    img.classList.add("avatar");

    // Se avatar falhar
    img.onerror = () => {
        img.src = "./images/placeholder.jpg";
    };

    const nome = document.createElement("h3");
    nome.textContent = cliente.nome;

    const email = document.createElement("p");
    email.textContent = cliente.email;

    const endereco = document.createElement("p");
    endereco.textContent = `${cliente.endereco} - ${cliente.cidade}/${cliente.estado}`;

    const cep = document.createElement("p");
    cep.textContent = `CEP:${cliente.cep}`;


    const btn = document.createElement("button");
    btn.textContent = "Remover";
    btn.addEventListener("click", () => removerCliente(cliente.id));

    card.appendChild(img);
    card.appendChild(nome);
    card.appendChild(email);
    card.appendChild(endereco);
    card.appendChild(cep);
    card.appendChild(btn);

    container.appendChild(card);
}


/* RENDER */
function renderizarCards(lista = clientes) {
    container.innerHTML = "";
    lista.forEach(cliente => criarCard(cliente));
}

/* ADICIONAR CLIENTE */
const btnSalvar = document.getElementById("btnSalvar");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {

        if (!nomeInput.value || !emailInput.value || !cepInput.value || !planoSelect.value) {
            throw new Error("Preencha todos os campos obrigatórios.");
        }

        btnSalvar.disabled = true;
        statusEl.style.display = "block";
        btnSalvar.textContent = "Processando...";
        btnSalvar.className = "btn_processando";
        statusEl.className = "status loading";
        statusEl.textContent = "Consultando CEP...";
        await esperar(timeLimite01);

        // Buscar CEP
        const enderecoData = await buscarCEP(cepInput.value);

        ruaInput.value = enderecoData.logradouro;
        bairroInput.value = enderecoData.bairro;
        cidadeInput.value = enderecoData.localidade;
        estadoInput.value = enderecoData.uf;

        // Análise de Crédito
        statusEl.textContent = "Realizando análise de crédito...";
        await simularAnaliseCredito(nomeInput.value, planoSelect.value);

        // Gerar Avatar
        statusEl.textContent = "Gerando avatar...";
        await esperar(timeLimite01);
        const avatarUrl = gerarAvatar(nomeInput.value);

        // Criar Cliente
        const novoCliente = {
            id: Date.now(),
            nome: nomeInput.value,
            email: emailInput.value,
            plano: planoSelect.value,
            cep: cepInput.value,
            endereco: enderecoData.logradouro,
            cidade: enderecoData.localidade,
            estado: enderecoData.uf,
            avatar: avatarUrl,
            operador: operadorAtual
        };

        clientes.push(novoCliente);
        salvarClientes();
        renderizarCards();

        statusEl.className = "status sucesso";
        statusEl.textContent = "Cadastro concluído com sucesso!";
        form.reset();



    } catch (error) {

        statusEl.className = "status erro";
        statusEl.textContent = "Cadastro negado - " + error.message;


    } finally {
        btnSalvar.textContent = "Processado!";
        await esperar(timeLimite02);
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Salvar";
        btnSalvar.classList.remove("btn_processando");
        statusEl.style.display = "none";
       // statusEl.textContent = "";
       // statusEl.classList.remove("status");
    }
});

/* REMOVER CLIENTE */
function removerCliente(id) {
    clientes = clientes.filter(c => c.id !== id);
    salvarClientes();
    renderizarCards();
}

/* FILTRO POR NOME E EMAIL */
buscaInput.addEventListener("input", () => {
    const termo = buscaInput.value.toLowerCase();
    const filtrados = clientes.filter(c =>
        c.nome.toLowerCase().includes(termo) ||
        c.email.toLowerCase().includes(termo)
    );
    renderizarCards(filtrados);
});

/* VALIDAÇÃO EMAIL */
emailInput.addEventListener("blur", () => {
    if (!emailInput.value.includes("@")) {
        emailInput.classList.add("erro");
    } else {
        emailInput.classList.remove("erro");
    }
});

/* BUSCAR CEP - ViaCEP API */
async function buscarCEP(cep) {

    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        throw new Error("CEP inválido.");
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

    if (!response.ok) {
        throw new Error("Erro ao consultar CEP.");  
    }

    const data = await response.json();

    if (data.erro) {
        throw new Error("CEP não encontrado.");
    }

    return data;
}

function mostrarErroCEP() {
    cepInput.classList.add("erro");
    ruaInput.removeAttribute('readonly');
    ruaInput.value = "";
    bairroInput.value = "";
    cidadeInput.value = "";
    estadoInput.value = "";
}

/* GERAR AVATAR */
function gerarAvatar(nome) {
   return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}`;  
}

/* ANALISE DE CREDITO */
function simularAnaliseCredito(nome, plano) {
    return new Promise((resolve, reject) => {

        if (plano === "Silver" || plano === "Bronze") {
            return resolve(`Cliente ${nome}: Análise de Crédito Aprovada`);
        }else{
            setTimeout(() => {
                if (Math.random() < 0.2) {
                    reject(new Error(`Cliente ${nome}: Análise de Crédito Reprovada`));
                } else {
                    resolve(`Cliente ${nome}: Análise de Crédito Aprovada`);
                }

            }, timeLimite01);
        }

    });
}
function formatCEP(input) { 
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }    
    input.value = value;
}
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}