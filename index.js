// Lê N linhas (cada linha = JSON array de operações) e SÓ ENTÃO imprime as saídas
// quando receber uma linha vazia (fim da entrada). Lote indeterminado.

// ---------------------Exemplo de Entrada -----------------
// [{"operation":"buy","unit-cost":10.00,"quantity":10000},{"operation":"sell","unit-cost":20.00,"quantity":5000}]
// [{"operation":"buy","unit-cost":20.00,"quantity":10000},{"operation":"sell","unit-cost":60.00,"quantity":5000}]
//

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// --------------------
// Constantes
// --------------------
const ALIQUOTA_IMPOSTO = 0.2;
const LIMITE_ISENCAO_VENDA = 20000;

// --------------------
// Utils
// --------------------
function arredondar2Casas(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function objetoImposto(valor) {
  return { tax: arredondar2Casas(valor) };
}

class Carteira {
  constructor() {
    this.acoes = 0;
    this.precoMedio = 0;
    this.prejuizoAcumulado = 0;
  }

  comprar(quantidade, precoUnitario) {
    const custoAntes = this.acoes * this.precoMedio;
    const custoCompra = quantidade * precoUnitario;

    const novasAcoes = this.acoes + quantidade;
    this.precoMedio =
      novasAcoes === 0 ? 0 : arredondar2Casas((custoAntes + custoCompra) / novasAcoes);

    this.acoes = novasAcoes;
  }

  vender(quantidade, precoUnitario) {
    const totalVenda = precoUnitario * quantidade;
    const custoBase = this.precoMedio * quantidade;
    const lucro = totalVenda - custoBase;

    this.acoes -= quantidade;
    if (this.acoes === 0) this.precoMedio = 0;

    if (lucro < 0) {
      this.prejuizoAcumulado = arredondar2Casas(
        this.prejuizoAcumulado + Math.abs(lucro)
      );
      return 0;
    }

    if (lucro === 0) return 0;

    if (totalVenda <= LIMITE_ISENCAO_VENDA) return 0;

    let lucroTributavel = lucro;

    if (this.prejuizoAcumulado > 0) {
      const usado = Math.min(this.prejuizoAcumulado, lucroTributavel);
      lucroTributavel -= usado;
      this.prejuizoAcumulado = arredondar2Casas(this.prejuizoAcumulado - usado);
    }

    return lucroTributavel > 0 ? lucroTributavel * ALIQUOTA_IMPOSTO : 0;
  }
}

function calcularImpostosDaSimulacao(operacoes) {
  const carteira = new Carteira();
  const saida = [];

  for (const op of operacoes) {
    const tipo = op.operation;
    const quantidade = op.quantity;
    const precoUnitario = op["unit-cost"];

    if (tipo === "buy") {
      carteira.comprar(quantidade, precoUnitario);
      saida.push(objetoImposto(0));
      continue;
    }

    if (tipo === "sell") {
      const imposto = carteira.vender(quantidade, precoUnitario);
      saida.push(objetoImposto(imposto));
      continue;
    }

    saida.push(objetoImposto(0));
  }

  return saida;
}

let linhasPendentes = [];

function processarTudoEImprimir(linhas) {
  for (const linha of linhas) {
    const operacoes = JSON.parse(linha);
    const resultado = calcularImpostosDaSimulacao(operacoes);
    console.log(JSON.stringify(resultado));
  }
}

rl.on("line", (linha) => {
  const limpa = linha.trim();

  if (!limpa) {
    processarTudoEImprimir(linhasPendentes);
    rl.close();
    return;
  }

  linhasPendentes.push(limpa);
});
