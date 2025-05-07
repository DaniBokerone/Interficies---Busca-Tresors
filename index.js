const readline = require('readline').promises;
const fs = require('fs');

const TESOROS_TOTALES = 16;
const TURNOS_MAXIMOS = 32;

function crearTablero() {
    return Array.from({ length: 6 }, () => Array(8).fill(""));
}

function colocarTesoros(tablero) {
    let colocados = 0;
    while (colocados < TESOROS_TOTALES) {
        const fila = Math.floor(Math.random() * 6);
        const columna = Math.floor(Math.random() * 8);
        if (tablero[fila][columna] !== "T") {
            tablero[fila][columna] = "T";
            colocados++;
        }
    }
    return tablero;
}

function mostrarTablero(tablero, mostrarTesoros = false) {
    const filas = ["A", "B", "C", "D", "E", "F"];
    console.log(" 01234567");
    tablero.forEach((fila, idx) => {
        let linea = filas[idx];
        fila.forEach(celda => {
            if (celda === "T" && !mostrarTesoros) {
                linea += "·";
            } else {
                linea += celda === "" ? "·" : celda;
            }
        });
        console.log(linea);
    });
}

function distanciaMasCercana(tablero, fila, columna) {
    let menor = Infinity;
    for (let i = 0; i < tablero.length; i++) {
        for (let j = 0; j < tablero[i].length; j++) {
            if (tablero[i][j] === "T") {
                const dist = Math.abs(i - fila) + Math.abs(j - columna);
                if (dist < menor) menor = dist;
            }
        }
    }
    return menor;
}

function mostrarAyuda() {
    console.log(`
    ------------------------------
    COMANDES DISPONIBLES
    ------------------------------
    ajuda
        Mostra la llista de comandes.
    
    carregar partida <nom_arxiu.json>
        Carrega una partida guardada.
    
    guardar partida <nom_guardar.json>
        Desa la partida actual.
    
    activar trampa
        Mostra les caselles amb tresors.
    
    desactivar trampa
        Oculta els tresors del taulell.
    
    destapar <coordenada>
        Destapa una casella (ex: B3).
    
    puntuació
        Mostra la puntuació i les tirades restants.
    ------------------------------
        `);
}

async function guardarPartida(nombre, estado) {
    try {
        fs.writeFileSync(nombre, JSON.stringify(estado));
        console.log("Partida desada correctament a", nombre);
    } catch (err) {
        console.error("Error en desar la partida:", err);
    }
}

async function carregarPartida(nombre) {
    try {
        const contenido = fs.readFileSync(nombre);
        console.log("Partida carregada de", nombre);
        return JSON.parse(contenido);
    } catch (err) {
        console.error("No s'ha pogut carregar la partida:", err);
        return null;
    }
}

async function iniciarJoc() {
    let mapa = colocarTesoros(crearTablero());
    let descoberts = 0;
    let restants = TURNOS_MAXIMOS;
    let trampes = false;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        mostrarTablero(mapa, trampes);
        const entrada = await rl.question("Entra una comanda: ");

        if (entrada.startsWith("ajuda")) {
            mostrarAyuda();
        } else if (entrada.startsWith("carregar partida")) {
            const fitxer = entrada.split(" ")[2];
            const estat = await carregarPartida(fitxer);
            if (estat) {
                mapa = estat.mapa;
                descoberts = estat.descoberts;
                restants = estat.restants;
                trampes = estat.trampes;
            }
        } else if (entrada.startsWith("guardar partida")) {
            const fitxer = entrada.split(" ")[2];
            await guardarPartida(fitxer, { mapa, descoberts, restants, trampes });
        } else if (entrada === "activar trampa") {
            trampes = true;
            console.log("Mode trampa actiu.");
        } else if (entrada === "desactivar trampa") {
            trampes = false;
            console.log("Mode trampa desactivat.");
        } else if (entrada.startsWith("destapar")) {
            const coords = entrada.split(" ")[1];
            const fila = coords.charCodeAt(0) - (coords.charCodeAt(0) >= 97 ? 97 : 65);
            const columna = parseInt(coords.slice(1));

            if (mapa[fila][columna] === "T") {
                console.log("Has trobat un tresor!");
                mapa[fila][columna] = "X";
                descoberts++;
            } else {
                const dist = distanciaMasCercana(mapa, fila, columna);
                mapa[fila][columna] = dist.toString();
                restants--;
            }
        } else if (entrada === "puntuació") {
            console.log(`Tresors trobats: ${descoberts}/${TESOROS_TOTALES}, Tornades restants: ${restants}`);
        } else {
            console.log("Comanda no vàlida. Escriu 'ajuda' per veure opcions.");
        }

        if (descoberts === TESOROS_TOTALES) {
            console.log(`Enhorabona! Has guanyat amb ${TURNOS_MAXIMOS - restants} tirades.`);
            break;
        } else if (restants === 0) {
            console.log(`Has perdut. Faltaven ${TESOROS_TOTALES - descoberts} tresors.`);
            break;
        }
    }

    rl.close();
}

mostrarAyuda();
console.log("Iniciant el joc...");
iniciarJoc();
