
// Define uma abstração para acessar a api swapi.dev
export default ((baseurl) => {
    const Api = {};
    // Registra os serviços no objeto Api. Os serviços correspondem aos definidos na api do swapi.
    // Os serviços carregados devem ser especificados em uma string serparada por virgula 
    // onde cada identificador corresponde a um serviço valido da api.
    // Ex: 'starships,planets,people,films...'
    // Por motivos de simplificação foi registrado apenas o serviço starships 
    // e o método list que retorna uma pagina especificada pelo parametro page.
    // Uso:
    // import swapi from '...'
    // swapi.starships.list({ page : 1 }).then()...
    
    'starships'.split(',').map(service => {
        Object.assign(Api, {
            get [service]() {
                return {
                    list({ page }) {
                        // Para realizar a requisição foi utilizada a Fetch API definida em https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API/Using_Fetch
                        const url = `${baseurl}/${service}/?page=${page}`;
                        return fetch(url).then(response => response.json())
                    }
                    // get,
                    // create,
                    // ...
                }
            }
        })
    })
    return Api;
})(`https://swapi.dev/api`);