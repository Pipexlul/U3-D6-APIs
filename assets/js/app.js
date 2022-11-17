const inputCLP = document.querySelector("#input-clp");
const inputCurrencies = document.querySelector("#input-currencies");
const btnSearch = document.querySelector("#btn-search");
const conversionResult = document.querySelector("#conversion-result");
const errorDisplay = document.querySelector("#error-display");

const graph = document.querySelector("#graph-last-days");
let graphElement = null;

const validCurrencies = [];

const intlObj = new Intl.NumberFormat("es-CL");

const getErrorMessage = (error, msg, person) => {
  return `Algo ha salido mal al ${msg}. Entregale este mensaje a ${person}: ${error.message}`;
};

const getGraphData = (currencyData) => {
  const result = [];

  const maxDays = 10;
  const days = currencyData.serie;

  for (let i = 0; i < days.length; ++i) {
    if (i >= maxDays) break;

    const day = days[i];
    const date = day.fecha.slice(0, day.fecha.indexOf("T"));
    const value = day.valor;

    result.push({ date, value });
  }

  result.reverse();

  return result;
};

const drawGraph = async (currencyCode) => {
  try {
    if (graphElement) {
      graphElement.destroy();
    }

    const currencyData = await getCurrencyData(currencyCode);
    const graphData = getGraphData(currencyData);

    graphElement = new Chart(graph, {
      type: "line",
      data: {
        labels: graphData.map((data) => {
          return data.date;
        }),
        datasets: [
          {
            label: `Valor de ${currencyCode} en los ultimos ${graphData.length} periodos`,
            data: graphData.map((data) => {
              return data.value;
            }),
            fill: false,
            borderColor: "rgb(0, 170, 170)",
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
      },
    });
  } catch (e) {
    const msg = getErrorMessage(e, `tratar de dibujar el gráfico`, "@Pipexlul");

    errorDisplay.textContent = msg;
  }
};

const getCurrencyData = async (currencyCode) => {
  try {
    const endpoint = `https://mindicador.cl/api/${currencyCode}/`;

    const currencyData = await fetch(endpoint);
    const jsonData = await currencyData.json();

    return jsonData;
  } catch (e) {
    const msg = getErrorMessage(
      e,
      `tratar de obtener data de la moneda de codigo: ${currencyCode}`,
      "@Pipexlul"
    );

    errorDisplay.textContent = msg;
  }
};

const findCurrencyObjBySelect = (selValue) => {
  for (let i = 0; i < validCurrencies.length; ++i) {
    const cur = validCurrencies[i];

    if (cur.codigo === selValue) {
      return cur;
    }
  }

  return null;
};

const doConversionAndDrawGraph = (ev) => {
  const clpAmount = inputCLP.value;

  if (!clpAmount.length) {
    alert("El campo de `Pesos CLP` no debe estar vacío");
    return;
  }

  const selectValue = inputCurrencies.value;
  const currencyObj = findCurrencyObjBySelect(selectValue);

  if (currencyObj) {
    const convValue = Number(clpAmount) / currencyObj.valor;

    conversionResult.textContent = intlObj.format(convValue);
  }

  drawGraph(currencyObj.codigo);
};

const firstTimeSetup = async () => {
  try {
    const mainData = await fetch("https://mindicador.cl/api/");
    const jsonData = await mainData.json();

    for (const key of Object.keys(jsonData)) {
      const toCheck = jsonData[key];

      if (typeof toCheck === "object") {
        if (toCheck.unidad_medida && toCheck.unidad_medida === "Pesos") {
          validCurrencies.push(toCheck);
        }
      }
    }

    validCurrencies.forEach((currency) => {
      const optionElem = document.createElement("option");

      optionElem.value = currency.codigo;
      optionElem.textContent = currency.nombre;

      inputCurrencies.appendChild(optionElem);
    });

    btnSearch.addEventListener("click", doConversionAndDrawGraph);
  } catch (e) {
    const msg = getErrorMessage(e, "inicializar", "@Pipexlul");

    errorDisplay.textContent = msg;
  }
};

firstTimeSetup();
