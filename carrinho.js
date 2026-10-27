document.addEventListener("DOMContentLoaded", () => {
  const lista = document.querySelector("#itens-carrinho")
  const resumo = document.querySelector("#resumo-carrinho")
  const mensagemVazio = document.querySelector("#carrinho-vazio")
  const formulario = document.querySelector("#form-finalizar")
  const status = document.querySelector("#status-pedido")
  const TAXA_ENTREGA = 5.00

  const elementos = {
    subtotal: document.querySelector("#subtotal"),
    entrega: document.querySelector("#taxa-entrega"),
    total: document.querySelector("#total"),
    preparo: document.querySelector("#prazo-preparo"),
    entregaPrazo: document.querySelector("#prazo-entrega"),
    chegada: document.querySelector("#previsao-chegada"),
    trocoGrupo: document.querySelector("#troco-grupo"),
    pagamento: document.querySelector("#pagamento")
  }

  function somarSubtotal(carrinho) {
    return carrinho.reduce((soma, item) => soma + Number(item.preco || 0) * Number(item.quantidade || 0), 0)
  }

  function renderizar() {
    const carrinho = Pizzaria.lerCarrinho()
    lista.innerHTML = ""
    const vazio = carrinho.length === 0
    mensagemVazio.hidden = !vazio
    resumo.hidden = vazio
    formulario.hidden = vazio
    document.querySelector("#limpar-carrinho").hidden = vazio

    if (vazio) {
      Pizzaria.atualizarBadgeCarrinho()
      return;
    }

    carrinho.forEach(item => {
      const linha = document.createElement("article")
      linha.className = "item-carrinho"
      const imagem = Pizzaria.escapeHTML(item.imagem || "./Imagens/pizza-5163800_1280.jpg")
      const nomeHTML = Pizzaria.escapeHTML(item.nome)
      linha.innerHTML = `
        <img src="${imagem}" alt="${nomeHTML}" onerror="this.src='./Imagens/pizza-5163800_1280.jpg'">
        <div class="item-carrinho-info">
          <h3>${nomeHTML}</h3>
          <p>${Pizzaria.moeda(item.preco)} cada</p>
          <strong>${Pizzaria.moeda(Number(item.preco) * Number(item.quantidade))}</strong>
        </div>
        <div class="quantidade-controle" aria-label="Quantidade de ${item.nome}">
          <button type="button" data-acao="diminuir" data-nome="${encodeURIComponent(item.nome)}" aria-label="Diminuir quantidade">−</button>
          <span>${item.quantidade}</span>
          <button type="button" data-acao="aumentar" data-nome="${encodeURIComponent(item.nome)}" aria-label="Aumentar quantidade">+</button>
          <button type="button" class="remover-item" data-acao="remover" data-nome="${encodeURIComponent(item.nome)}">Remover</button>
        </div>`
      lista.appendChild(linha)
    })

    const subtotal = somarSubtotal(carrinho)
    elementos.subtotal.textContent = Pizzaria.moeda(subtotal)
    elementos.entrega.textContent = Pizzaria.moeda(TAXA_ENTREGA)
    elementos.total.textContent = Pizzaria.moeda(subtotal + TAXA_ENTREGA)
    atualizarPrevisao()
    Pizzaria.atualizarBadgeCarrinho()
  }

  function atualizarPrevisao() {
    const agora = new Date()
    const prontoMin = new Date(agora.getTime() + 25 * 60000)
    const prontoMax = new Date(agora.getTime() + 35 * 60000)
    const chegaMin = new Date(agora.getTime() + 40 * 60000)
    const chegaMax = new Date(agora.getTime() + 60 * 60000)
    const hora = data => data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    elementos.preparo.textContent = "25–35 minutos"
    elementos.entregaPrazo.textContent = "15–25 minutos após o preparo"
    elementos.chegada.textContent = `Entre ${hora(chegaMin)} e ${hora(chegaMax)} (estimativa)`
  }

  lista.addEventListener("click", event => {
    const botao = event.target.closest("button[data-acao]")
    if (!botao) return
    const nome = decodeURIComponent(botao.dataset.nome)
    let carrinho = Pizzaria.lerCarrinho()
    const item = carrinho.find(p => Pizzaria.normalizar(p.nome) === Pizzaria.normalizar(nome))
    if (!item) return

    if (botao.dataset.acao === "aumentar") item.quantidade += 1
    if (botao.dataset.acao === "diminuir") item.quantidade -= 1
    if (botao.dataset.acao === "remover" || item.quantidade <= 0) {
      carrinho = carrinho.filter(p => Pizzaria.normalizar(p.nome) !== Pizzaria.normalizar(nome))
    }
    Pizzaria.salvarCarrinho(carrinho)
    renderizar()
  })

  document.querySelector("#limpar-carrinho").addEventListener("click", () => {
    Pizzaria.salvarCarrinho([])
    renderizar();
  })

  elementos.pagamento.addEventListener("change", () => {
    elementos.trocoGrupo.hidden = elementos.pagamento.value !== "dinheiro";
  })

  formulario.addEventListener("submit", event => {
    event.preventDefault()
    const carrinho = Pizzaria.lerCarrinho()
    if (!carrinho.length) return
    const dados = new FormData(formulario)
    const nomeCliente = String(dados.get("cliente") || "Cliente").trim()
    const total = somarSubtotal(carrinho) + TAXA_ENTREGA
    status.hidden = false
    status.innerHTML = `<h3>Pedido demonstrativo preparado, ${nomeCliente}!</h3><p>Valor total: <strong>${Pizzaria.moeda(total)}</strong>.</p><p>Este projeto é apenas front-end: nenhum pedido real foi enviado e nenhum pagamento foi processado.</p>`
    Pizzaria.salvarCarrinho([])
    renderizar()
    status.scrollIntoView({ behavior: "smooth", block: "center" })
    formulario.reset()
    elementos.trocoGrupo.hidden = true;
  })

  renderizar()
});
