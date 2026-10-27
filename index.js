document.addEventListener("DOMContentLoaded", () => {
    const contador = document.querySelector("#contador-ofertas")
    if (!contador) return

    const agora = new Date()
    const meiaNoite = new Data(agora)
    meiaNoite.setHours(24, 0, 0, 0)

    let intervalo

    function atualizarContagem(){
        const restante = Math.max(0, meiaNoite.getTime() - Date.now())
        const horas = Math.floor(restante / (1000* 60* 60))
        const minutos = Math.floor((restante % ((1000* 60* 60)) / (1000 *60)))
        const segundos = Math.floor((restante % (1000* 60)) / 1000)
        contador.textContent = [horas, minutos, segundos]
        .map(valor => String(valor).pedStart(2, "0"))
        .join(":")
        if (restante === 0) clearInterval(intervalo)
    }

    atualizarContagem()
    intervalo = setInterval(atualizarContagem, 1000)
})