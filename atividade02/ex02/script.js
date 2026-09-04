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

let corAtual = cores[0];
let modoAtual = 'reta';
let pontosClicados = [];

let figuraAtual = {
    tipo: 'reta',
    pontosPixel: bresenhamLinha(0, 0, 0, 0),
    cor: cores[0]
};

function pixelParaNDC(x, y) {
    const ndcX = (x / canvas.width) * 2 - 1;
    const ndcY = 1 - (y / canvas.height) * 2;
    return [ndcX, ndcY];
}

function bresenhamLinha(x0, y0, x1, y1) {
    const pontos = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
        pontos.push(...pixelParaNDC(x0, y0));
        if (x0 === x1 && y0 === y1) break;

        let e2 = 2 * err;
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

function tracarLinha(x0, y0, x1, y1, cor) {
    figuraAtual = {
        tipo: 'reta',
        pontosPixel: bresenhamLinha(x0, y0, x1, y1),
        cor: cor
    };
    renderizar();
}

function mudarCor(novaCor) {
    corAtual = novaCor;
    if (figuraAtual) {
        figuraAtual.cor = novaCor;
    }
    renderizar();
}

function tracarTriangulo(v1, v2, v3, cor) {
    const l1 = bresenhamLinha(v1.x, v1.y, v2.x, v2.y);
    const l2 = bresenhamLinha(v2.x, v2.y, v3.x, v3.y);
    const l3 = bresenhamLinha(v3.x, v3.y, v1.x, v1.y);

    figuraAtual = {
        tipo: 'triangulo',
        pontosPixel: [...l1, ...l2, ...l3],
        cor: cor
    };
    renderizar();
}

function renderizar() {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (figuraAtual && figuraAtual.pontosPixel.length > 0) {
        gl.uniform4fv(colorUniformLocation, figuraAtual.cor);
        gl.uniform1f(pointSizeUniformLocation, 3.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(figuraAtual.pontosPixel), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, figuraAtual.pontosPixel.length / 2);
    }

    if (pontosClicados.length > 0) {
        const pontosNDCTemp = [];
        for (let p of pontosClicados) {
            pontosNDCTemp.push(...pixelParaNDC(p.x, p.y));
        }
        gl.uniform4fv(colorUniformLocation, corAtual);
        gl.uniform1f(pointSizeUniformLocation, 7.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pontosNDCTemp), gl.STATIC_DRAW);
        gl.drawArrays(gl.POINTS, 0, pontosNDCTemp.length / 2);
    }
}

function obterCoordenada(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top)
    };
}

function inicializarEventos() {
    canvas.addEventListener('click', (event) => {
        const p = obterCoordenada(event);
        pontosClicados.push(p);

        if (modoAtual === 'reta' && pontosClicados.length === 2) {
            tracarLinha(pontosClicados[0].x, pontosClicados[0].y, pontosClicados[1].x, pontosClicados[1].y, corAtual);
            pontosClicados = [];
        } else if (modoAtual === 'triangulo' && pontosClicados.length === 3) {
            tracarTriangulo(pontosClicados[0], pontosClicados[1], pontosClicados[2], corAtual);
            pontosClicados = [];
        } else {
            renderizar();
        }
    });

    document.addEventListener('keydown', (event) => {
        const tecla = event.key.toLowerCase();

        if (tecla === 'r') {
            modoAtual = 'reta';
            pontosClicados = [];
            renderizar();
        } else if (tecla === 't') {
            modoAtual = 'triangulo';
            pontosClicados = [];
            renderizar();
        } else {
            const num = Number(tecla);
            if (Number.isInteger(num) && num >= 0 && num <= 9) {
                mudarCor(cores[num]);
            }
        }
    });
}

function inicializar() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    inicializarEventos();
    renderizar();
}

inicializar();