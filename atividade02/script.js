const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const cores = [
    'blue', 'red', 'green', 'yellow', 'magenta',
    'cyan', 'orange', 'purple', 'white', 'black'
];

let linhaAtual = {
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    cor: cores[0]
};

let cliqueInicial = null;
let temLinha = false;

let espessuraLinha = 5;
const tamanhoPonto = 7;

function desenharPonto(x, y, cor, raio = tamanhoPonto) {
    ctx.beginPath();
    ctx.fillStyle = cor;
    ctx.arc(x, y, raio, 0, Math.PI * 2);
    ctx.fill();
}

function alterarCorLinha(cor) {
    linhaAtual.cor = cor;
    redesenhar();
}

function desenharLinhaBresenham(x0, y0, x1, y1, cor, espessura) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    const offset = Math.floor(espessura / 2);

    while (true) {
        ctx.fillStyle = cor;
        ctx.fillRect(x0 - offset, y0 - offset, espessura, espessura);

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

function redesenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (temLinha) {
        desenharLinhaBresenham(
            linhaAtual.x0,
            linhaAtual.y0,
            linhaAtual.x1,
            linhaAtual.y1,
            linhaAtual.cor,
            espessuraLinha
        );
    }

    if (cliqueInicial) {
        desenharPonto(cliqueInicial.x, cliqueInicial.y, linhaAtual.cor, tamanhoPonto);
    }
}

function obterCoordenada(event) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    return {
        x: Math.round((event.clientX - rect.left) * escalaX),
        y: Math.round((event.clientY - rect.top) * escalaY)
    };
}

function inicializarEventos() {
    canvas.addEventListener('click', (event) => {
        const ponto = obterCoordenada(event);

        if (!cliqueInicial) {
            cliqueInicial = ponto;
            temLinha = false; 
            redesenhar();
        } else {
            linhaAtual.x0 = cliqueInicial.x;
            linhaAtual.y0 = cliqueInicial.y;
            linhaAtual.x1 = ponto.x;
            linhaAtual.y1 = ponto.y;

            cliqueInicial = null;
            temLinha = true;
            redesenhar();
        }
    });

    document.addEventListener('keydown', (event) => {
        const numero = Number(event.key);

        if (!Number.isInteger(numero) || numero < 0 || numero > 9) {
            return;
        }

        alterarCorLinha(cores[numero]);
    });
}

function inicializarAplicacao() {
    inicializarEventos();
    redesenhar();
}

inicializarAplicacao();