document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector("#lista-pizzas")
    const aviso = document.querySelector("#aviso-cardapio")
    if (!container) return

    container.innerHTML = '<p class="estado-carregamento">Carregando pizzas...</p>'

    try {
        const { produtos, origem } = await Pizzaria.carregarCatalogo()
        container.innerHTML = ""
        
        produtos.forEach (Produtio => {
            const nome = Pizzaria.getNomeProduto(produto)
      const descricao = produto.descricao || "Pizza artesanal preparada com ingredientes selecionados."
      const imagem = produto.imagem || "./Imagens/pizza-5163800_1280.jpg"
      const id = Pizzaria.getId(produto)
      const preco = Pizzaria.getPreco(produto)
      const nomeHTML = Pizzaria.escapeHTML(nome)
      const descricaoHTML = Pizzaria.escapeHTML(descricao)
      const imagemHTML = Pizzaria.escapeHTML(imagem)
      const destino = id
        ? `detalhes.html?id=${encodeURIComponent(id)}&nome=${encodeURIComponent(nome)}`
        : `detalhes.html?nome=${encodeURIComponent(nome)}`

      const card = document.createElement("a")
      card.className = "pizza-card"
      card.href = destino
      card.setAttribute("aria-label", `Ver detalhes de ${nome}`)
      card.innerHTML = `
        <img src="${imagemHTML}" alt="${nomeHTML}" loading="lazy" onerror="this.src='./Imagens/pizza-5163800_1280.jpg'">
        <div class="pizza-info">
          <h3>${nomeHTML}</h3>
          <p>${descricaoHTML}</p>
          <div class="estrelas" aria-label="Avaliação ${Pizzaria.getEstrelas(produto)} de 5">${Pizzaria.montarEstrelas(Pizzaria.getEstrelas(produto))}</div>
          <div class="cardapio-rodape"><strong>${Pizzaria.moeda(preco)}</strong><span>Ver detalhes →</span></div>
        </div>`
      container.appendChild(card)
    });
    Pizzaria.avisarOrigem(aviso, origem)
  } catch (erro) {
    console.error(erro)
    container.innerHTML = '<p class="estado-erro">Não foi possível carregar o cardápio. Confira se está usando o Live Server e se o arquivo pizzas.json está na pasta do projeto.</p>'
    }
})