import swapi from "./swapi.js";
// Definição da regex que faz o parser da duração dos consumiveis
// Foram definidos dois grupos um count que captura o valor numerico e o segundo unit que registra a unidade de tempo 
// As unidades de tempo são capturadas em sua forma singular
const ConsumablesParser = /(?<count>\d+)\s+((?<unit>\w+[^s])s?)/gi;

// Define q quantidade de horas em cada unidade de tempo
// A fonte referenciada para os valores foi obtida de https://convertlive.com/pt/u/converter/anos/em/horas#1
// Os valores foram truncados para sua parte inteira

const TimeDurationInHours = {
    hour: 1,
    day: 24,
    week: 168,
    month: 730, // 730.5
    year: 8766,
};

const UNKNOWN = "unknown";

// Define um controlador de paginas para os workers que consumirão a api
const pageController = () => {
    let page = 1;
    return {
        // sempre que o método next for chamada uma nova pagina será retornada
        get next() {
            return page++;
        }
    }
}

// Registra um worker que por meio de um pageControl carrega recursivamente todos os registros da api;
const fetchSpaceshipsWorker = async ({ pageControl }) => {

    const page = pageControl
        ? pageControl.next
        : 1;
    // Recupera os itens da api
    return swapi.starships.list({ page }).then(
        async ({ next, results = [] }) => {
            let nextPageResults = [];
            if (next) {
                nextPageResults = await fetchSpaceshipsWorker({ pageControl });
            }
            return results.concat(nextPageResults);
        }).catch((error) => {
            return []
        });
}

// O método fetchStarships carrega todos as spaceships existentes na api
// O parametro numberOfWorkers determnina a quantidade de threads instanciadas para consumir a api

export const fetchSpaceships = async ({ numberOfWorkers = 2 }) => {
    const spaceships = new Map();
    const jobs = [];
    const pageControl = pageController(0);

    // Instancia os workers
    for (let worker = 0; worker < numberOfWorkers; worker++) {
        jobs.push(fetchSpaceshipsWorker({ pageControl }));
    }
    // A rotina abaixo realiza o merge dos resultados de cada worker alem de realizar 
    // algumas transformações nos objetos retornados pela api
    // Para cada spaceship são avaliados os parametros MGLT e consumables
    // Observou-se que a api retorna "unknown" em alguns casos
    // Para efeito, apenas serão consideradas as spaceships cujo os valores das 
    // propriedades anteriormente mencionadas sejam distintos de unknown.

    await Promise.all(jobs).then((resultsByWorkers = []) => {
        resultsByWorkers.map(items => items.map(starship => {
            let maxConsumablesTimeInHours = 0;
            const { name, consumables = "" } = starship;
            let { MGLT } = starship;
            // 
            const valid = MGLT !== UNKNOWN && consumables !== UNKNOWN;

            if (valid) {
                const { value } = consumables.matchAll(ConsumablesParser).next();
                const { count, unit } = value.groups;
                const countNumber = parseInt(count, 10);
                maxConsumablesTimeInHours = countNumber * TimeDurationInHours[unit]
                MGLT = parseInt(MGLT, 10);
            }

            // Substitui no objeto original os parametros atualizados 
            // além de adicionar um novo parametro "maxConsumablesTimeInHours"
            // que corresponde ao tempo maximo em horas do suprimeto da spaceship.
            // Adiciona o método "numberOfStops" que calcula a quantidade de paradas 
            // para percorrer uma distancia x em MGLT

            Object.assign(starship, {
                valid,
                MGLT,
                maxConsumablesTimeInHours,

                // Calcula a quantidade de paradas para percorrer uma distancia x em MGLT.
                // Ao multiplicar a duração dos suprimentos em horas pela distancia que a spaceship 
                // consegue percorrer em uma hora se obtem a distancia máxima sem a 
                // necessidade de reabastecer "maxDistanceWithoutRestock".
                // Para determinar a quantidade de paradas necessárias foi dividido a distancia do percurso 
                // pela maxima distancia sem a necessidade de reabastecer.

                numberOfStops(distanceInMGLT = 0) {
                    const { MGLT, maxConsumablesTimeInHours } = this;
                    let numberOfStops = 0;

                    if (maxConsumablesTimeInHours) {
                        const maxDistanceWithoutRestock = MGLT * maxConsumablesTimeInHours;
                        numberOfStops = Math.trunc(distanceInMGLT / maxDistanceWithoutRestock);
                    }

                    return numberOfStops;
                }
            });

            spaceships.set(name, starship);
        }));
    });

    // Retorna um novo objeto contendo os métodos e dados expostos 
    // spaceships corresponde a uma mapa onde a chave é o nome da spaceship e o valor são os dados referentes a ela
    return {
        spaceships,
        // O método numberOfStops calcula a quantidade de paradas para cada spaceship válida (parametros MGLT e consumables diferente de unknown)
        // A lista retornada corresponde ao formato:
        // [
        //  [ name , numberOfStops ],
        //  ...
        //  [ name , numberOfStops ],
        // ]
        numberOfStops(distanceInMGLT = 0) {
            const data = [];

            Array.from(spaceships.values())
                .filter(({ valid }) => valid)
                .map(spaceship => data.push([
                    spaceship.name,
                    spaceship.numberOfStops(distanceInMGLT),
                ]))
            console.table(data);
            return data;
        },
        // retorna uma lista contento todas as spaceships
        get items() {
            return Array.from(this.spaceships.values());
        }
    };
}