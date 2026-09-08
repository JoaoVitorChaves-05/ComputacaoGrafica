const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(-0.9, 0.0);

let MbarraDireita = m3.translation(0.9, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;


// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        const error = gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(instante){
    
    atualizaAnimacao(instante);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

let tyBE = 0.0;
let tyBD = 0.0;
let txBola = 0.0;
let tyBola = 0.0;
let velocidadeBolaX = 0.55;
let velocidadeBolaY = 0.35;
const velocidadeBarra = 0.9;
const raioBola = 0.05;
const meioAlturaBarra = 0.2;
const limiteBarra = 1.0 - meioAlturaBarra;
let pontuacaoEsquerda = 0;
let pontuacaoDireita = 0;
let teclasPressionadas = {};
let ultimoInstante = 0;

window.addEventListener("keydown", (evento) => {
    if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(evento.code)) {
        evento.preventDefault();
    }
    teclasPressionadas[evento.code] = true;
});

window.addEventListener("keyup", (evento) => {
    teclasPressionadas[evento.code] = false;
});

function atualizaPlacar() {
    document.getElementById("placar").textContent =
        `${pontuacaoEsquerda}   -   ${pontuacaoDireita}`;
}

function reiniciaBola(direcao) {
    txBola = 0;
    tyBola = 0;
    velocidadeBolaX = 0.55 * direcao;
    velocidadeBolaY = (Math.random() * 0.5 + 0.25) *
        (Math.random() < 0.5 ? -1 : 1);
}

function atualizaAnimacao(instante){
    const deltaTime = ultimoInstante === 0
        ? 0
        : Math.min((instante - ultimoInstante) / 1000, 0.05);
    ultimoInstante = instante;

    if (teclasPressionadas.KeyW) tyBE += velocidadeBarra * deltaTime;
    if (teclasPressionadas.KeyS) tyBE -= velocidadeBarra * deltaTime;
    if (teclasPressionadas.ArrowUp) tyBD += velocidadeBarra * deltaTime;
    if (teclasPressionadas.ArrowDown) tyBD -= velocidadeBarra * deltaTime;

    tyBE = Math.max(-limiteBarra, Math.min(limiteBarra, tyBE));
    tyBD = Math.max(-limiteBarra, Math.min(limiteBarra, tyBD));
    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);

    txBola += velocidadeBolaX * deltaTime;
    tyBola += velocidadeBolaY * deltaTime;

    if (tyBola + raioBola >= 1.0 || tyBola - raioBola <= -1.0) {
        velocidadeBolaY = -velocidadeBolaY;
        tyBola = Math.max(-1.0 + raioBola, Math.min(1.0 - raioBola, tyBola));
    }

    const bolaAlinhadaComBarraEsquerda =
        Math.abs(tyBola - tyBE) <= meioAlturaBarra + raioBola;
    const bolaAlinhadaComBarraDireita =
        Math.abs(tyBola - tyBD) <= meioAlturaBarra + raioBola;

    if (velocidadeBolaX < 0 && txBola - raioBola <= -0.85 && bolaAlinhadaComBarraEsquerda) {
        velocidadeBolaX = Math.abs(velocidadeBolaX);
        txBola = -0.85 + raioBola;
    }

    if (velocidadeBolaX > 0 && txBola + raioBola >= 0.85 && bolaAlinhadaComBarraDireita) {
        velocidadeBolaX = -Math.abs(velocidadeBolaX);
        txBola = 0.85 - raioBola;
    }

    if (txBola < -1.0 - raioBola) {
        pontuacaoDireita++;
        atualizaPlacar();
        reiniciaBola(1);
    } else if (txBola > 1.0 + raioBola) {
        pontuacaoEsquerda++;
        atualizaPlacar();
        reiniciaBola(-1);
    }

    MbolaCentro = m3.translation(txBola,tyBola);
}


// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

drawScene(performance.now());