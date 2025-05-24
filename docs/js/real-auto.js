
// Auto calc for Densidade Real dos Grãos
document.addEventListener('DOMContentLoaded', () => {
    function calcularReal() {
        const su = [];
        const ss = [];
        const ta = [];
        for (let i = 1; i <= 3; i++) {
            su[i] = Number(document.getElementById(`solo-umido-tara-real-${i}`).value) || 0;
            ss[i] = Number(document.getElementById(`solo-seco-tara-real-${i}`).value) || 0;
            ta[i] = Number(document.getElementById(`tara-real-${i}`).value) || 0;
        }
        const seco = [], agua = [], um = [];
        for (let i = 1; i <= 3; i++) {
            seco[i] = ss[i] - ta[i];
            agua[i] = su[i] - ss[i];
            um[i] = seco[i] ? (agua[i]/seco[i])*100 : 0;
            document.getElementById(`solo-seco-real-${i}`).value = seco[i].toFixed(2);
            document.getElementById(`agua-real-${i}`).value = agua[i].toFixed(2);
            document.getElementById(`umidade-real-${i}`).value = um[i].toFixed(1);
        }
        const media = (um[1] + um[2] + um[3]) / 3;
        document.getElementById('umidade-media-real').value = media.toFixed(1);
    }
    // attach listeners
    for (let i = 1; i <= 3; i++) {
        ['solo-umido-tara-real-', 'solo-seco-tara-real-', 'tara-real-']
          .forEach(prefix => {
            const el = document.getElementById(prefix + i);
            if (el) el.addEventListener('input', calcularReal);
          });
    }
});
