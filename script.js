const startButton = document.getElementById("startButton");
const continueButton = document.getElementById("continueButton");
const interlude = document.getElementById("interlude");
const cafe = document.getElementById("cafe");

function show(section) {
    section.classList.add("visible");
    section.setAttribute("aria-hidden", "false");
}

function hide(section) {
    section.classList.remove("visible");
    section.setAttribute("aria-hidden", "true");
}

// 1. Teatro -> se abre el telón -> interludio
startButton.addEventListener("click", () => {
    startButton.disabled = true;
    document.body.classList.add("opening");

    // Espera a que el telón termine de abrirse (2s)
    setTimeout(() => show(interlude), 2200);
});

// 2. Interludio -> cafetería
continueButton.addEventListener("click", () => {
    continueButton.disabled = true;
    hide(interlude);

    setTimeout(() => {
        show(cafe);
        Cafe.start(); // arranca el pixel art y sus luces
    }, 1500);
});

// 3. Cuando toquen los 4 objetos (calendario, cuadro, radio, ventana)
document.addEventListener("cafe:complete", () => {
    // Aquí irá el final de la historia
});