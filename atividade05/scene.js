// ==================================================
// CLASS - SCENE
// ==================================================

class Scene {

    constructor(gl, program) {

        this.renderer =
            new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();

        this.helicopterTopShaft = new HelicopterTopShaft();

        this.helicopterTail = new HelicopterTail();

        this.helicopterPropellers = new HelicopterPropellers();

        this.helicopterTailPropeller = new HelicopterTailPropeller();

        this.position = { x: 0.0, y: 0.0 };
        this.headingAngle = 0.0;
        this.propellerAngle = 0.0;
        this.keysPressed = new Set();
        this.lastTimestamp = null;

        window.addEventListener("keydown", (event) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
                event.preventDefault();
                this.keysPressed.add(event.key);
            }
        });

        window.addEventListener("keyup", (event) => {
            this.keysPressed.delete(event.key);
        });
    }

    update(timestamp) {
        const deltaTime = this.lastTimestamp === null
            ? 0
            : Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);

        this.lastTimestamp = timestamp;

        const movementSpeed = 0.8;

        if (this.keysPressed.has("ArrowUp")) {
            this.position.y += movementSpeed * deltaTime;
        }
        if (this.keysPressed.has("ArrowDown")) {
            this.position.y -= movementSpeed * deltaTime;
        }
        if (this.keysPressed.has("ArrowLeft")) {
            this.position.x -= movementSpeed * deltaTime;
            this.headingAngle = 0.0;
        }
        if (this.keysPressed.has("ArrowRight")) {
            this.position.x += movementSpeed * deltaTime;
            this.headingAngle = Math.PI;
        }

        this.propellerAngle += 12 * deltaTime;

        const helicopterTranslation = m4.translation(
            this.position.x,
            this.position.y,
            0
        );

        const helicopterTransform = m4.multiply(
            helicopterTranslation,
            m4.scaling(
                this.headingAngle === 0.0 ? 1.0 : -1.0,
                1.0,
                1.0
            )
        );

        const topPropellerRotation = m4.multiply(
            m4.translation(0, 0.35, 0),
            m4.multiply(
                m4.yRotation(this.propellerAngle),
                m4.translation(0, -0.35, 0)
            )
        );

        const tailPropellerRotation = m4.multiply(
            m4.translation(0.7, 0, 0.06),
            m4.multiply(
                m4.zRotation(this.propellerAngle),
                m4.translation(-0.7, 0, -0.06)
            )
        );

        this.helicopterBody.update(helicopterTransform);
        this.helicopterTopShaft.update(helicopterTransform);
        this.helicopterTail.update(helicopterTransform);
        this.helicopterPropellers.update(
            m4.multiply(helicopterTransform, topPropellerRotation)
        );
        this.helicopterTailPropeller.update(
            m4.multiply(helicopterTransform, tailPropellerRotation)
        );
    }

    draw() {

        gl.clear(
            gl.COLOR_BUFFER_BIT |
            gl.DEPTH_BUFFER_BIT
        );

        gl.useProgram(program);

        this.helicopterBody.draw(
            this.renderer
        );

        this.helicopterTopShaft.draw(
            this.renderer
        );

        this.helicopterTail.draw(
            this.renderer
        );

        this.helicopterPropellers.draw(
            this.renderer
        );

        this.helicopterTailPropeller.draw(
            this.renderer
        );
    }

    execute(timestamp) {

        this.update(timestamp);
        this.draw();

        requestAnimationFrame(
            (nextTimestamp) => this.execute(nextTimestamp)
        );
    }

    init() {

        requestAnimationFrame(
            (timestamp) => this.execute(timestamp)
        );
    }
}
