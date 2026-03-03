// ===== VARIÁVEIS GLOBAIS =====
let entregas = carregar() || [];
let minhaCidade = "";
let minhaLocalizacao = null;

const nomeInput = document.getElementById("nome");
const enderecoInput = document.getElementById("endereco");
const lista = document.getElementById("lista");
const modal = document.getElementById("modal");
const relatorio = document.getElementById("relatorio");


// ===== ADICIONAR ENTREGA =====
async function adicionarEntrega() {

  const nome = nomeInput.value.trim();
  const endereco = enderecoInput.value.trim();

  if (!nome || !endereco) {
    alert("Preencha todos os campos");
    return;
  }

  try {

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(endereco)}`
    );

    const geo = await res.json();

    if (!geo || geo.length === 0) {
      alert("Endereço não encontrado");
      return;
    }

    const dados = geo[0];

    const cidadeEntrega =
      dados.address.city ||
      dados.address.town ||
      dados.address.village ||
      dados.address.municipality ||
      "";

    entregas.push({
      nome,
      endereco,
      lat: Number(dados.lat),
      lon: Number(dados.lon),
      cidade: cidadeEntrega,
      entregue: false,
      data: new Date().toISOString()
    });

    salvar(entregas);

    nomeInput.value = "";
    enderecoInput.value = "";

    fecharModal();
    atualizar();

  } catch (e) {
    alert("Erro ao localizar endereço");
  }
}


// ===== ATUALIZAR LISTA =====
function atualizar() {

  if (!minhaLocalizacao) return;

  limparMarkers();
  lista.innerHTML = "";

  // 🔥 FILTRA APENAS ENTREGAS DA MINHA CIDADE
  const entregasFiltradas = entregas.filter(e =>
    e.cidade &&
    minhaCidade &&
    e.cidade.toLowerCase() === minhaCidade.toLowerCase()
  );

  if (entregasFiltradas.length === 0) {
    lista.innerHTML = "<li>Nenhuma entrega na sua cidade</li>";
    return;
  }

  // 🔥 CALCULA DISTÂNCIA
  entregasFiltradas.forEach(e => {
    e.dist = distancia(
      minhaLocalizacao.latitude,
      minhaLocalizacao.longitude,
      e.lat,
      e.lon
    );
  });

  // 🔥 ORDENA POR DISTÂNCIA
  entregasFiltradas.sort((a, b) => a.dist - b.dist);

  // 🔥 MOSTRA NA TELA
  entregasFiltradas.forEach((e, i) => {

    addMarker(e.lat, e.lon, e.nome);

    lista.innerHTML += `
      <li class="${e.entregue ? "entregue" : ""}">
        <div class="num ${e.entregue ? "red" : "green"}">${i + 1}</div>

        <b>${e.nome}</b><br>
        ${e.endereco}<br>
        📏 ${e.dist.toFixed(2)} km

        <a class="card-btn"
           target="_blank"
           href="https://www.google.com/maps?q=${e.lat},${e.lon}">
          🧭 IR PARA ENTREGA
        </a>

        <button onclick="marcar(${entregas.indexOf(e)})">
          ${e.entregue ? "✔ Entregue" : "Confirmar entrega"}
        </button>
      </li>
    `;
  });
}


// ===== MARCAR ENTREGA =====
function marcar(i) {
  entregas[i].entregue = true;
  salvar(entregas);
  atualizar();
}


// ===== MODAL =====
function abrirModal() {
  modal.style.display = "block";
}

function fecharModal() {
  modal.style.display = "none";
}


// ===== ROTA AUTOMÁTICA =====
function iniciarRota() {

  const pendentes = entregas.filter(e =>
    !e.entregue &&
    e.cidade &&
    e.cidade.toLowerCase() === minhaCidade.toLowerCase()
  );

  if (pendentes.length === 0) {
    alert("Nenhuma entrega pendente 🚚");
    return;
  }

  let url = `https://www.google.com/maps/dir/${minhaLocalizacao.latitude},${minhaLocalizacao.longitude}`;

  pendentes.forEach(e => {
    url += `/${e.lat},${e.lon}`;
  });

  window.open(url, "_blank");
}


// ===== RELATÓRIO =====
function abrirRelatorio() {

  const daCidade = entregas.filter(e =>
    e.cidade &&
    e.cidade.toLowerCase() === minhaCidade.toLowerCase()
  );

  const total = daCidade.length;
  const entregues = daCidade.filter(e => e.entregue).length;
  const pendentes = total - entregues;

  let distanciaTotal = 0;

  daCidade.forEach(e => {
    if (e.entregue && e.dist) {
      distanciaTotal += e.dist;
    }
  });

  document.getElementById("conteudoRelatorio").innerHTML = `
    <p>📦 Total: <b>${total}</b></p>
    <p>✅ Entregues: <b>${entregues}</b></p>
    <p>⏳ Pendentes: <b>${pendentes}</b></p>
    <p>🛣️ Distância estimada: <b>${distanciaTotal.toFixed(2)} km</b></p>
  `;

  relatorio.style.display = "block";
}

function fecharRelatorio() {
  relatorio.style.display = "none";
}

function resetarDia() {
  if (!confirm("Deseja apagar todas as entregas?")) return;

  entregas = [];
  salvar(entregas);
  atualizar();
  fecharRelatorio();
}


// ===== INICIALIZAÇÃO =====
window.onload = async () => {

  try {

    minhaLocalizacao = await getLocalizacao();

    iniciarMapa(
      minhaLocalizacao.latitude,
      minhaLocalizacao.longitude
    );

    minhaCidade = await obterEndereco(
      minhaLocalizacao.latitude,
      minhaLocalizacao.longitude
    );

    console.log("Minha cidade:", minhaCidade);

    atualizar();

  } catch (e) {

    alert("Erro ao obter localização");

  }
};
