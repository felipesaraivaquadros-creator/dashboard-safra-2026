export function numeroPorExtenso(valor: number): string {
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezena1 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function converter(n: number): string {
    if (n === 0) return "";
    if (n === 100) return "cem";
    
    let res = "";
    if (n >= 100) {
      res += centenas[Math.floor(n / 100)];
      n %= 100;
      if (n > 0) res += " e ";
    }

    if (n >= 20) {
      res += dezenas[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) res += " e ";
    } else if (n >= 10) {
      res += dezena1[n - 10];
      n = 0;
    }

    if (n > 0) {
      res += unidades[n];
    }
    return res;
  }

  if (valor === 0) return "zero reais";

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let partes = [];

  // Milhões (simplificado para o contexto de fretes)
  if (inteiro >= 1000000) {
    const milhoes = Math.floor(inteiro / 1000000);
    partes.push(converter(milhoes) + (milhoes > 1 ? " milhões" : " milhão"));
  }

  // Milhares
  const milhares = Math.floor((inteiro % 1000000) / 1000);
  if (milhares > 0) {
    partes.push(converter(milhares) + " mil");
  }

  // Centenas/Dezenas/Unidades
  const resto = inteiro % 1000;
  if (resto > 0) {
    partes.push(converter(resto));
  }

  let resultado = partes.join(" e ");
  resultado += inteiro === 1 ? " real" : " reais";

  if (centavos > 0) {
    resultado += " e " + converter(centavos) + (centavos === 1 ? " centavo" : " centavos");
  }

  return resultado;
}