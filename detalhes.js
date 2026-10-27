document.addEventListener("DOMContentLoaded", async () => {
  const container = document.querySelector("#lista-detalhes")
  const aviso = document.querySelector("#aviso-detalhes")
  const parametros = new URLSearchParams(window.location.search)
  const idSelecionado = parametros.get("id")
  const nomeSelecionado = parametros.get("nome") || ""
  if (!container) return

  container.innerHTML = '<p class="estado-carregamento">Carregando detalhes das pizzas...</p>'

  let catalogo
  try {
    catalogo = await Pizzaria.carregarCatalogo()
  } catch (erro) {
    console.error(erro)
    container.innerHTML = '<p class="estado-erro">Não foi possível ler pizzas.json. Abra o projeto pelo Live Server.</p>'
    return
  }

  let produtos = catalogo.produtos
  let selecionado = null
  if (idSelecionado) {
    try {
      
      const respostaApi = await Pizzaria.buscarPorId(idSelecionado)
      if (respostaApi) {
        const nomeApi = Pizzaria.getNomeProduto(respostaApi)
        selecionado = produtos.find(p => Pizzaria.normalizar(Pizzaria.getNomeProduto(p)) === Pizzaria.normalizar(nomeApi)) || respostaApi
        selecionado = { ...(selecionado || {}), ...respostaApi, id: Pizzaria.getId(respostaApi) || idSelecionado }
        const indice = produtos.findIndex(p => Pizzaria.normalizar(Pizzaria.getNomeProduto(p)) === Pizzaria.normalizar(nomeApi))
        if (indice >= 0) produtos[indice] = { ...produtos[indice], ...selecionado };
      }
    } catch (erro) {
      console.warn("A consulta individual pelo ID falhou. Os seis cards continuam visíveis usando os dados do catálogo.", erro.message)
    }
  }

  if (!selecionado && nomeSelecionado) {
    selecionado = produtos.find(p => Pizzaria.normalizar(Pizzaria.getNomeProduto(p)) === Pizzaria.normalizar(nomeSelecionado)) || null
  }
  const nomeParaDestacar = selecionado ? Pizzaria.getNomeProduto(selecionado) : nomeSelecionado
  if (nomeParaDestacar) {
    produtos.sort((a, b) => {
      const aSelecionada = Pizzaria.normalizar(Pizzaria.getNomeProduto(a)) === Pizzaria.normalizar(nomeParaDestacar)
      const bSelecionada = Pizzaria.normalizar(Pizzaria.getNomeProduto(b)) === Pizzaria.normalizar(nomeParaDestacar)
      return Number(bSelecionada) - Number(aSelecionada)
    });
  }

  container.innerHTML = ""
  produtos.forEach(produto => {
    const nome = Pizzaria.getNomeProduto(produto)
    const descricao = produto.descricao || "Ingredientes selecionados e massa artesanal."
    const imagem = produto.imagem || "./Imagens/pizza-5163800_1280.jpg"
    const preco = Pizzaria.getPreco(produto)
    const estrelas = Pizzaria.getEstrelas(produto)
    const selecionada = nomeParaDestacar && Pizzaria.normalizar(nome) === Pizzaria.normalizar(nomeParaDestacar)
    const nomeHTML = Pizzaria.escapeHTML(nome)
    const descricaoHTML = Pizzaria.escapeHTML(descricao)
    const imagemHTML = Pizzaria.escapeHTML(imagem)
    const card = document.createElement("article")
    card.className = `detalhe-card${selecionada ? " detalhe-selecionado" : ""}`
    card.innerHTML = `
      <div class="detalhe-imagem-wrap">
        <img class="detalhe-imagem" src="${imagemHTML}" alt="Pizza ${nomeHTML}" loading="lazy" onerror="this.src='./Imagens/pizza-5163800_1280.jpg'">
        <span class="categoria">PIZZA ESPECIAL</span>
      </div>
      <div class="info-pizza">
        <h2>${nomeHTML}</h2>
        <p class="descricao">${descricaoHTML}</p>
        <div class="estrelas" aria-label="Avaliação ${estrelas} de 5">${Pizzaria.montarEstrelas(estrelas)}</div>
        <div class="preco">
          <h3>${Pizzaria.moeda(preco)}</h3>
          <button type="button" class="pedido" data-adicionar="${encodeURIComponent(nome)}">FAZER PEDIDO</button>
        </div>
        <div class="promo">
          <h3>Receber promoções</h3>
          <p>Cadastre seu e-mail e receba promoções exclusivas deste produto!</p>
          <form class="form-promocao" data-pizza="${encodeURIComponent(nome)}">
            <label class="campo-email">
              <span class="sr-only">Seu e-mail</span>
              <input type="email" name="email" placeholder="seuemail@exemplo.com" autocomplete="email" required>
            </label>
            <div class="checkbox">
              <input type="checkbox" id="termos-${Pizzaria.normalizar(nome)}" name="termos" required>
              <label for="termos-${Pizzaria.normalizar(nome)}">Aceito os termos de uso</label>
            </div>
            <button type="submit" class="enviar">ENVIAR</button>
          </form>
          <p class="mensagem" role="status" hidden>E-mail cadastrado com sucesso neste navegador!</p>
        </div>
      </div>`
    container.appendChild(card)
  });

  Pizzaria.avisarOrigem(aviso, catalogo.origem)

  container.addEventListener("click", event => {
    const botao = event.target.closest("button[data-adicionar]")
    if (!botao) return;
    const nome = decodeURIComponent(botao.dataset.adicionar)
    const produto = produtos.find(p => Pizzaria.normalizar(Pizzaria.getNomeProduto(p)) === Pizzaria.normalizar(nome))
    if (!produto) return
    Pizzaria.adicionarCarrinho(produto)
    window.location.href = "carrinho.html"
  });

  container.addEventListener("submit", event => {
    const form = event.target.closest(".form-promocao")
    if (!form) return
    event.preventDefault()
    const email = form.elements.email.value.trim().toLowerCase()
    try {
      Pizzaria.salvarEmailPromocao(email)
      const mensagem = form.parentElement.querySelector(".mensagem")
      mensagem.hidden = false
      mensagem.textContent = "E-mail cadastrado com sucesso neste navegador!"
      form.reset()
    } catch (erro) {
      alert("Não foi possível salvar o e-mail neste navegador.")
    }
  });
});
