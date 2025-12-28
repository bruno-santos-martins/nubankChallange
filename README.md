# Nubank Challenge – Ganho de Capital

Implementação em Node.js de uma aplicação de linha de comando (CLI) para cálculo de imposto sobre ganho de capital em operações de compra e venda de ações, conforme o desafio "Ganho de Capital" da Nubank.

---

## 1. Resumo do desafio

- Ler, da **entrada padrão (stdin)**, **uma lista de operações por linha**, em formato JSON.
- Cada linha representa **uma simulação independente**, ou seja, o estado não é compartilhado entre linhas.
- Para cada operação de compra (`buy`) ou venda (`sell`), calcular o **imposto devido** sobre o lucro, seguindo as regras de ganho de capital.
- Para cada linha de entrada, devolver na **saída padrão (stdout)** uma lista JSON com o imposto pago em cada operação, na mesma ordem das operações de entrada.
- A última linha da entrada deve ser **vazia**, indicando o fim da execução.

---

## 2. Regras de cálculo (Ganho de Capital)

Para cada simulação (uma linha de entrada), o programa mantém um estado em memória com:

- Quantidade de ações em carteira.
- Preço médio ponderado de compra.
- Prejuízo acumulado.

As regras são:

- **Tipo de operação**
	- `buy`: compra de ações (nunca gera imposto).
	- `sell`: venda de ações (pode gerar imposto).

- **Preço médio ponderado**
	- Sempre que houver compra, o preço médio ponderado é recalculado:

		```text
		nova_media = ((qtd_atual * media_atual) + (qtd_comprada * preco_compra))
								 / (qtd_atual + qtd_comprada)
		```

- **Lucro ou prejuízo em uma venda**
	- Lucro/Prejuízo = `(preço de venda * quantidade vendida) - (preço médio * quantidade vendida)`.
	- Se for **prejuízo** (valor negativo):
		- Nenhum imposto é pago.
		- O valor absoluto do prejuízo é somado ao **prejuízo acumulado**, para abater lucros futuros.

- **Uso do prejuízo acumulado**
	- Em vendas com **lucro**, o prejuízo acumulado deve ser usado para abater o lucro, até zerar o prejuízo.
	- É possível usar um mesmo prejuízo ao longo de múltiplos lucros futuros.

- **Regra dos R$ 20.000,00**
	- Se o **valor total da operação de venda** (preço unitário × quantidade) for **menor ou igual a R$ 20.000,00**:
		- **Não há imposto**, mesmo que haja lucro.
		- **Ainda assim**, prejuízos anteriores devem ser **mantidos** para abater lucros futuros.
	- Se o total da venda for **maior que R$ 20.000,00**:
		- O lucro é reduzido pelo prejuízo acumulado.
		- Sobre o lucro que restar, aplica-se **20% de imposto**.

- **Outras regras**
	- Nenhum imposto é pago em operações de compra (`buy`).
	- Você pode assumir que nunca haverá venda de quantidade maior do que a quantidade em carteira.
	- Todos os valores monetários são arredondados para **2 casas decimais**.

---

## 3. Formato de entrada

Cada linha da entrada é um **array JSON** de operações, por exemplo:

```json
[
	{ "operation": "buy",  "unit-cost": 10.00, "quantity": 10000 },
	{ "operation": "sell", "unit-cost": 20.00, "quantity": 5000 }
]
```

Estrutura de cada operação:

```json
{
	"operation": "buy" | "sell",
	"unit-cost": number,
	"quantity": number
}
```

Exemplo simples (conteúdo de `input.txt` deste repositório):

```text
[{"operation":"buy","unit-cost":10.00,"quantity":10000},{"operation":"sell","unit-cost":20.00,"quantity":5000}]
[{"operation":"buy","unit-cost":40.00,"quantity":10000},{"operation":"sell","unit-cost":30.00,"quantity":5000}]
```

- Cada linha é independente.
- Uma linha vazia encerra o programa.

---

## 4. Formato de saída

Para cada linha de entrada, o programa imprime **uma linha de saída**, com um array JSON de objetos no formato:

```json
{
	"tax": number
}
```

Exemplo (para os dois casos de `input.txt`):

```text
[{"tax":0},{"tax":10000}]
[{"tax":0},{"tax":0}]
```

A lista retornada sempre tem o **mesmo tamanho** da lista de operações recebida na linha de entrada.

---

## 5. Decisões técnicas e arquiteturais

- **Linguagem**: Node.js, por ser simples para construir CLIs e lidar com stdin/stdout.
- **Leitura de entrada**: uso da API nativa `readline` do Node para ler a entrada linha a linha.
- **Simulação por linha**: cada linha é processada como uma simulação independente, com seu próprio estado em memória.
- **Estado interno** (por simulação):
	- `sharesInWallet`: quantidade de ações em carteira.
	- `weightedAveragePrice`: preço médio ponderado atual.
	- `accumulatedLoss`: prejuízo acumulado a ser usado para abater lucros futuros.
- **Cálculo do imposto**:
	- Função `calculateTaxesForSimulation(operations)` percorre a lista de operações de uma simulação e monta a lista de `{ tax }`.
	- Função auxiliar `calculateWeightedAveragePrice` aplica a fórmula de média ponderada sempre que ocorre `buy`.
	- Função `roundToCents` garante arredondamento consistente para 2 casas decimais.
- **Bibliotecas externas**: não são utilizadas bibliotecas de terceiros; apenas módulos nativos do Node (`readline`, `JSON`).

Obs.: a leitura é feita em lotes de 2 linhas por vez (`LINES_PER_BATCH = 2`), mas cada linha é processada de forma totalmente independente, respeitando o enunciado.

---

## 6. Como executar

### 6.1. Pré-requisitos

- Node.js 14+ instalado.

### 6.2. Execução com redirecionamento de arquivo (recomendado)

Na raiz do projeto, execute:

```bash
node index.js < input.txt
```

- O arquivo `input.txt` deve conter uma ou mais linhas, cada uma com uma lista JSON de operações.
- A saída será escrita na tela, uma linha para cada linha de entrada.

### 6.3. Execução interativa

Também é possível rodar de forma interativa, digitando as simulações manualmente:

```bash
node index.js
```

Em seguida:

1. Digite uma linha contendo um array JSON de operações e pressione **Enter**.
2. Digite uma segunda linha (outra simulação) e pressione **Enter**.
3. A aplicação imprimirá as saídas das duas linhas.
4. Repita o processo se quiser enviar mais duas linhas.
5. Envie uma **linha vazia** para encerrar a aplicação.

> Observação: a implementação atual processa as linhas em **lotes de 2**, mas isso é apenas uma escolha de implementação. Cada linha continua sendo uma simulação independente.

---

## 7. Testes e validação

No momento não há testes automatizados implementados neste repositório. A validação pode ser feita de forma manual usando os **Casos #1–#9** descritos no enunciado oficial.

Sugestão de validação manual:

1. Crie um arquivo, por exemplo `case1.txt`, com o JSON do caso de teste desejado.
2. Execute:

	 ```bash
	 node index.js < case1.txt
	 ```

3. Compare a saída com a saída esperada descrita no enunciado.

Caso deseje, esta base pode ser estendida com testes automatizados (por exemplo, usando Jest ou outra biblioteca de testes para Node.js).

---

## 8. Arquivos principais

- `index.js`: implementação da lógica de cálculo de imposto e leitura da entrada padrão.
- `input.txt`: exemplo simples de entrada com duas simulações.

---

## 9. Notas adicionais

- O estado da aplicação é sempre inicializado vazio a cada execução do programa.
- Não há dependência de banco de dados ou serviços externos.
- Valores monetários são sempre tratados como números JavaScript e só são arredondados no momento de compor o resultado (`tax`).
