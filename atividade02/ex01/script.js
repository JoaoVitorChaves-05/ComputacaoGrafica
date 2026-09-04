const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL 2.0 não está disponível no seu navegador.');
}

const vsSource = `#version 300 es
in vec2 a_position;
uniform float u_pointSize;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = u_pointSize;
}`;

const fsSource = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 fragColor;

void main() {
    fragColor = u_color;
}`;

function criarShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = criarShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = criarShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");
const pointSizeUniformLocation = gl.getUniformLocation(program, "u_pointSize");

const positionBuffer = gl.createBuffer();
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
gl.enableVertexAttribArray(positionAttributeLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

const cores = [
    [0.0, 0.0, 1.0, 1.0],
    [1.0, 0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0, 1.0],
    [1.0, 1.0, 0.0, 1.0],
    [1.0, 0.0, 1.0, 1.0],
    [0.0, 1.0, 1.0, 1.0],
    [1.0, 0.5, 0.0, 1.0],
    [0.5, 0.0, 0.5, 1.0],
    [1.0, 1.0, 1.0, 1.0],
    [0.0, 0.0, 0.0, 1.0]
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
const tamanhoPixelLinha = 3.0;
const tamanhoPontoClique = 7.0;

function pixelParaNDC(x, y) {
    const ndcX = (x / canvas.width) * 2 - 1;
    const ndcY = 1 - (y / canvas.height) * 2;
    return [ndcX, ndcY];
}

function calcularLinhaBresenham(x0, y0, x1, y1) {
    const pontos = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        pontos.push(...pixelParaNDC(x0, y0));

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
    return pontos;
}

function alterarCorLinha(cor) {
    linhaAtual.cor = cor;
    redesenhar();
}

function redesenhar() {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (temLinha) {
        const pontosLinha = calcularLinhaBresenham(
            linhaAtual.x0,
            linhaAtual.y0,
            linhaAtual.x1,
            linhaAtual.y1
        );

        gl.uniform4fv(colorUniformLocation, linhaAtual.cor);
        gl.uniform1f(pointSizeUniformLocation, tamanhoPixelLinha);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pontosLinha), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, pontosLinha.length / 2);
    }

    if (cliqueInicial) {
        const pontoNDC = pixelParaNDC(cliqueInicial.x, cliqueInicial.y);

        gl.uniform4fv(colorUniformLocation, linhaAtual.cor);
        gl.uniform1f(pointSizeUniformLocation, tamanhoPontoClique);

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pontoNDC), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, 1);
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    inicializarEventos();
    redesenhar();
}

inicializarAplicacao();