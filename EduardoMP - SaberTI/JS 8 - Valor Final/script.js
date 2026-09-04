const item1 = 0;
const item2 = 0;
const item3 = 90;
let total = item1 + item2 + item3;

if (total >= 100) {
    total = total * 0.9;
    console.log("VOÇÊ GANHOU DESCONTO!!! O NOVO VALOR É : " + total);
} else {
    console.log("O valor continua o mesmo: " + total);
}