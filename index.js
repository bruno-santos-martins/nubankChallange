// index.js
// Lê 2 linhas do terminal (cada linha = um JSON array de operações) e só então imprime
// as 2 saídas correspondentes. Depois repete o ciclo (mais 2 linhas -> imprime).

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

// --------------------
// Helpers (dinheiro / formatação)
// --------------------

/**
 * Arredonda para 2 casas decimais (boa prática para valores monetários).
 */
function roundToCents(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Monta o objeto esperado pelo output do desafio.
 */
function formatTax(taxValue) {
  return { tax: roundToCents(taxValue) };
}

// --------------------
// Regras do desafio (processamento por simulação)
// --------------------

/**
 * Calcula a nova média ponderada após uma compra.
 */
function calculateWeightedAveragePrice({
  currentShares,
  currentAveragePrice,
  boughtShares,
  boughtUnitPrice,
}) {
  const totalCostBefore = currentShares * currentAveragePrice;
  const totalCostAfter = boughtShares * boughtUnitPrice;

  const newTotalShares = currentShares + boughtShares;
  const newAverage = (totalCostBefore + totalCostAfter) / newTotalShares;

  return roundToCents(newAverage);
}

/**
 * Processa UMA simulação (uma linha).
 * Retorna uma lista de impostos (mesmo tamanho da lista de operações).
 */
function calculateTaxesForSimulation(operations) {
  // Estado interno da simulação
  let sharesInWallet = 0;
  let weightedAveragePrice = 0;
  let accumulatedLoss = 0;

  const taxes = [];

  for (const operation of operations) {
    const operationType = operation.operation;
    const unitPrice = operation["unit-cost"];
    const quantity = operation.quantity;

    // --------------------
    // BUY
    // --------------------
    if (operationType === "buy") {
      weightedAveragePrice = calculateWeightedAveragePrice({
        currentShares: sharesInWallet,
        currentAveragePrice: weightedAveragePrice,
        boughtShares: quantity,
        boughtUnitPrice: unitPrice,
      });

      sharesInWallet += quantity;
      taxes.push(formatTax(0));
      continue;
    }

    // --------------------
    // SELL
    // --------------------
    const totalSellValue = unitPrice * quantity;
    const totalCostBasis = weightedAveragePrice * quantity;
    const profitOrLoss = totalSellValue - totalCostBasis;

    // Atualiza carteira após a venda
    sharesInWallet -= quantity;
    if (sharesInWallet === 0) {
      weightedAveragePrice = 0;
    }

    // 1) Prejuízo: acumula e imposto 0
    if (profitOrLoss < 0) {
      accumulatedLoss = roundToCents(accumulatedLoss + Math.abs(profitOrLoss));
      taxes.push(formatTax(0));
      continue;
    }

    // 2) Zero lucro: imposto 0
    if (profitOrLoss === 0) {
      taxes.push(formatTax(0));
      continue;
    }

    // 3) Lucro com venda <= 20k: imposto 0 e NÃO abate prejuízo acumulado
    if (totalSellValue <= 20000) {
      taxes.push(formatTax(0));
      continue;
    }

    // 4) Lucro com venda > 20k: abate prejuízo e aplica 20%
    let taxableProfit = profitOrLoss;

    if (accumulatedLoss > 0) {
      const lossUsed = Math.min(accumulatedLoss, taxableProfit);
      taxableProfit -= lossUsed;
      accumulatedLoss = roundToCents(accumulatedLoss - lossUsed);
    }

    const taxToPay = taxableProfit > 0 ? taxableProfit * 0.2 : 0;
    taxes.push(formatTax(taxToPay));
  }

  return taxes;
}

// --------------------
// Leitura de 2 linhas e impressão em lote
// --------------------

const LINES_PER_BATCH = 2;
let pendingLines = [];

/**
 * Processa um lote (batch) de linhas JSON e imprime as saídas.
 */
function processBatchAndPrint(lines) {
  for (const jsonLine of lines) {
    const operations = JSON.parse(jsonLine);
    const output = calculateTaxesForSimulation(operations);
    console.log(JSON.stringify(output));
  }
}

rl.on("line", (line) => {
  const cleanLine = line.trim();

  // Linha vazia encerra (como o enunciado pede)
  if (!cleanLine) {
    rl.close();
    return;
  }

  pendingLines.push(cleanLine);

  // Quando juntar 2 linhas, processa as 2 e imprime as 2 saídas
  if (pendingLines.length === LINES_PER_BATCH) {
    processBatchAndPrint(pendingLines);
    pendingLines = [];
  }
});
