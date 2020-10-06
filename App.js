
import {
    html,
    render,
    Component
} from "https://unpkg.com/htm/preact/standalone.module.js";

import { fetchSpaceships } from "./spaceships.js";


class App extends Component {

    textInput = null;

    constructor() {
        super();

        this.state = {
            ready: false,
            spaceshipsStopsList: [],
        };

        // A  chamada carrega todos as spaceships da api
        fetchSpaceships({ numberOfWorkers: 2 }).then(swapi => {
            this.swapi = swapi;
            this.setState({ ready: true })
        })
    }

    // A ação calculateStops é chamada quando o usuário preciona o botão calcular paradas
    calculateStops() {
        this.setState({
            spaceshipsStopsList: this.swapi.numberOfStops(this.textInput.value)
        });
    }
    // 
    renderSplashScreen({ ready }) {
        const classes = ["app__splash-screen"];
        if (ready) { classes.push("app__splash-screen--hidden") }

        return html`
        <div className="${classes.join(" ")}">
            <img class="app__logo" src="https://w7.pngwing.com/pngs/723/1016/png-transparent-star-wars-logo-star-wars-text-logo-silhouette.png"/> 
            <div>Carregando ...</div>
        </div>
            `;
    }

    renderListOfSpaceships({ spaceshipsStopsList = [] }) {

        if (spaceshipsStopsList.length === 0) {
            return '';
        } else {
            return html`
            <div class="app__list">
                <div class="app__list-item">
                    <div>Spaceship</div>
                    <div class="app__list-stop">Quantidade de paradas</div>
                </div>
                ${spaceshipsStopsList.map(([name, stops]) => html`
                <div class="app__list-item">
                    <div>${name}</div>
                    <div class="app__list-stop">${stops}</div>
                </div>
                `)}
            </div>
            `;
        }

    }

    render(props, state) {
        return html`
        ${this.renderSplashScreen(state)}
        
        <header class="app__header">
            <img class="app__logo" src="https://w7.pngwing.com/pngs/723/1016/png-transparent-star-wars-logo-star-wars-text-logo-silhouette.png"/> 
        </header>

        <div class="app__input-container">
            <input class="app__input" ref="${el => this.textInput = el}" type="text" placeholder="Informe a distancia a ser percorrida em MGLT" value=""/>
            <button class="app_button" onClick="${() => this.calculateStops()}">Calcular Paradas</button>
        </div>

        ${this.renderListOfSpaceships(state)}
        `;
    }

}

render(html`<${App} />`, window.app);