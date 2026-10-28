import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const TAMANHO = 64;

export function gerarHashSenha(senha: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, TAMANHO);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function conferirSenha(senha: string, guardado: string) {
  const [algoritmo, saltHex, hashHex] = guardado.split(":");
  if (algoritmo !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = scryptSync(senha, Buffer.from(saltHex, "hex"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}
