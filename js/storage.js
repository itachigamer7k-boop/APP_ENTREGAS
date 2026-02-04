function salvar(entregas) {
  localStorage.setItem("entregas", JSON.stringify(entregas));
}

function carregar() {
  return JSON.parse(localStorage.getItem("entregas")) || [];
}
