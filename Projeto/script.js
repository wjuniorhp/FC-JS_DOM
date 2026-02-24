/* VARIAVEIS */

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

let cepValido = false;

let operadorAtual = sessionStorage.getItem("operador");
let clientes = [];

/* UUID */
function gerarUUID() {
    return crypto.randomUUID();
}

/* LOGIN */
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
function chaveOperador() {
    return "clientes_" + operadorAtual;
}

function carregarClientes() {
    clientes = JSON.parse(localStorage.getItem(chaveOperador())) || [];
}

function salvarClientes() {
    localStorage.setItem(chaveOperador(), JSON.stringify(clientes));
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
        img.src = "https://via.placeholder.com/60";
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
form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!cepValido) {
        alert("CEP inválido. Verifique antes de salvar.");
        return;
    }

    const novoCliente = {
        id: crypto.randomUUID(),
        nome: nomeInput.value,
        email: emailInput.value,
        plano: planoSelect.value,
        cep: cepInput.value,
        endereco: ruaInput.value,
        cidade: cidadeInput.value,
        estado: estadoInput.value,
        avatar: gerarAvatar(nomeInput.value)
    };

    clientes.push(novoCliente);
    salvarClientes();
    renderizarCards();
    form.reset();
});

/* REMOVER COM ANIMAÇÃO */
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
cepInput.addEventListener("blur", async () => {

    const cep = cepInput.value.replace(/\D/g, "");

    if (cep.length !== 8) {
        mostrarErroCEP("CEP inválido.");
        return;
    }

    try {

        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

        if (!response.ok) {
            throw new Error("Erro na requisição.");
        }

        const data = await response.json();

        if (data.erro) {
            throw new Error("CEP não encontrado.");
        }

        ruaInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;

        cepInput.classList.remove("erro");
        cepValido = true;

    } catch (error) {

        mostrarErroCEP("Não foi possível buscar o CEP.");
        cepValido = false;
    }
});

function mostrarErroCEP(msg) {
    cepInput.classList.add("erro");
    ruaInput.value = "";
    bairroInput.value = "";
    cidadeInput.value = "";
    estadoInput.value = "";
}
/* GERAR AVATAR */
function gerarAvatar(nome) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}`;
}
