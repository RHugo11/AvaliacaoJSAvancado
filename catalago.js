window.PIZZAS_INFO = [
  { nome: "Calabresa Supreme", preco: 39.90, estrelas: 4 },
  { nome: "Frango Catupiry", preco: 42.90, estrelas: 3 },
  { nome: "Portuguesa Especial", preco: 44.90, estrelas: 5 },
  { nome: "Bacon com Mussarela", preco: 42.90, estrelas: 5 },
  { nome: "4 Queijos", preco: 45.90, estrelas: 3 },
  { nome: "Camarão", preco: 49.90, estrelas: 2 }
]

window.Pizzaria = (() => {
  const API_BASE = "https://tech4produtos.fly.dev/produtos"
  const RESTAURANTE = "Pizzaria Our Taste"
  const STORAGE_CART = "ourTasteCarrinho"
  const STORAGE_EMAILS = "ourTasteEmailsPromocoes"

  function normalizar(texto = "") {
    return String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
  }

  function informacaoLocal(nome) {
    const chave = normalizar(nome)
    return window.PIZZAS_INFO.find(p => normalizar(p.nome) === chave) || null
  }

  function getNomeProduto(produto) {
    if (!produto || typeof produto !== "object") return String(produto || "Pizza")
    const candidatos = [produto.produto, produto.nome, produto.name, produto.title]
      .filter(valor => typeof valor === "string" && valor.trim())
    for (const candidato of candidatos) {
      const info = informacaoLocal(candidato)
      if (info) return info.nome
    }
    return candidatos[0] || "Pizza"
    }

  function getId(produto) {
    const id = produto?.id ?? produto?._id ?? produto?.produtoId ?? produto?.productId;
    if (id && typeof id === "object") return id.$oid || id.id || "";
    return id == null ? "" : String(id)
  }

  function getPreco(produto) {
    const valorApi = Number(produto?.preco ?? produto?.price ?? produto?.valor)
    if (Number.isFinite(valorApi) && valorApi > 0) return valorApi
    return informacaoLocal(getNomeProduto(produto))?.preco ?? 0
  }

  function getEstrelas(produto) {
    const valorApi = Number(produto?.estrelas ?? produto?.rating ?? produto?.avaliacao)
    if (Number.isFinite(valorApi) && valorApi >= 1 && valorApi <= 5) return Math.round(valorApi)
    return informacaoLocal(getNomeProduto(produto))?.estrelas ?? 5
  }

  function escapeHTML(valor = "") {
    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  function montarEstrelas(quantidade) {
    const nota = Math.max(0, Math.min(5, Number(quantidade) || 0));
    return `<span class="estrelas-cheias">${"★".repeat(nota)}</span><span class="estrelas-vazias">${"★".repeat(5 - nota)}</span>`;
  }

  function extrairLista(payload) {
    if (Array.isArray(payload)) return payload
    if (!payload || typeof payload !== "object") return [];
    for (const chave of ["produtos", "pizzas", "data", "resultados", "results", "items", "content"]) {
      if (Array.isArray(payload[chave])) return payload[chave]
    }
    if (payload.produto || payload.nome || payload.id || payload._id) return [payload]
    return [];
  }

  async function carregarJSONLocal() {
    const resposta = await fetch("./pizzas.json")
    if (!resposta.ok) throw new Error("Não foi possível ler pizzas.json");
    return extrairLista(await resposta.json());
  }

  function mesclarCatalogo(local, api) {
    const usados = new Set()
    const resultado = local.map(pizzaLocal => {
      const nomeLocal = getNomeProduto(pizzaLocal)
      const correspondencia = api.find(item => normalizar(getNomeProduto(item)) === normalizar(nomeLocal))
      if (correspondencia) usados.add(correspondencia);
     
      return {
        ...pizzaLocal,
        ...(correspondencia || {}),
        nome: pizzaLocal.nome || correspondencia?.nome,
        produto: nomeLocal,
        imagem: correspondencia?.imagem || pizzaLocal.imagem,
        descricao: correspondencia?.descricao || pizzaLocal.descricao,
        id: getId(correspondencia || {}) || getId(pizzaLocal)
      }
    })
    
    return resultado
  }

  async function carregarCatalogo() {
    const local = await carregarJSONLocal();
    try {
      const url = `${API_BASE}/restaurante=${encodeURIComponent(RESTAURANTE)}`
      const resposta = await fetch(url)
      if (!resposta.ok) throw new Error(`API respondeu com status ${resposta.status}`)
      const api = extrairLista(await resposta.json())
      if (!api.length) throw new Error("A API ainda não tem produtos para este restaurante")
      return { produtos: mesclarCatalogo(local, api), origem: "api" }
    } catch (erro) {
      console.warn("Usando pizzas.json como catálogo de apoio:", erro.message);
      return { produtos: mesclarCatalogo(local, []), origem: "local" }
    }
  }

  async function buscarPorId(id) {
    if (!id) return null
    const resposta = await fetch(`${API_BASE}/${encodeURIComponent(id)}`)
    if (!resposta.ok) throw new Error(`Não foi possível consultar o produto ${id} na API.`)
    const payload = await resposta.json()
    return extrairLista(payload)[0] || payload
  }

  function lerCarrinho() {
    try {
      const conteudo = JSON.parse(localStorage.getItem(STORAGE_CART) || "[]")
      return Array.isArray(conteudo) ? conteudo : []
    } catch {
      return []
    }
  }

  function salvarCarrinho(carrinho) {
    localStorage.setItem(STORAGE_CART, JSON.stringify(carrinho))
    atualizarBadgeCarrinho()
  }

  function adicionarCarrinho(produto) {
    const nome = getNomeProduto(produto)
    const preco = getPreco(produto)
    const id = getId(produto)
    const carrinho = lerCarrinho()
    const existente = carrinho.find(item => normalizar(item.nome) === normalizar(nome))
    if (existente) {
      existente.quantidade += 1
      if (id) existente.id = id
    } else {
      carrinho.push({
        id,
        nome,
        preco,
        imagem: produto.imagem || informacaoLocal(nome)?.imagem || "",
        quantidade: 1,
        descricao: produto.descricao || ""
      });
    }
    salvarCarrinho(carrinho)
  }

  function atualizarBadgeCarrinho() {
    const quantidade = lerCarrinho().reduce((total, item) => total + Number(item.quantidade || 0), 0)
    document.querySelectorAll(".cart-count").forEach(elemento => {
      elemento.textContent = String(quantidade)
      elemento.hidden = quantidade === 0
      elemento.setAttribute("aria-label", `${quantidade} itens no carrinho`)
    })
  }

  function avisarOrigem(elemento, origem) {
    if (!elemento) return
    if (origem === "api") {
      elemento.textContent = "Cardápio atualizado com dados da API."
      elemento.classList.remove("aviso-local")
    } else {
      elemento.textContent = "Exibindo o catálogo local de apoio. Cadastre as seis pizzas na API pelo Postman para testar a integração completa."
      elemento.classList.add("aviso-local")
    }
  }

  function salvarEmailPromocao(email) {
    const emails = JSON.parse(localStorage.getItem(STORAGE_EMAILS) || "[]")
    if (!emails.includes(email)) emails.push(email)
    localStorage.setItem(STORAGE_EMAILS, JSON.stringify(emails))
  }

  document.addEventListener("DOMContentLoaded", atualizarBadgeCarrinho)

  return {
    API_BASE, RESTAURANTE, STORAGE_CART, normalizar, informacaoLocal,
    getNomeProduto, getId, getPreco, getEstrelas, moeda, escapeHTML, montarEstrelas,
    extrairLista, carregarJSONLocal, carregarCatalogo, buscarPorId,
    lerCarrinho, salvarCarrinho, adicionarCarrinho, atualizarBadgeCarrinho,
    avisarOrigem, salvarEmailPromocao
  }
})()
