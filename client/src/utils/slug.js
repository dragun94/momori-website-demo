// slug / SKU 자동 생성
// 한글은 로마자로 바꿔서 사용 (국어의 로마자 표기법 기본 규칙, 발음 변화는 일부만 반영)
// 예: "모모리 방수 턱받이" → "momori-bangsu-teokbadi", SKU: "MOMORI-BANGSU-TEOKBADI-PINGKEU"

export const SLUG_PATTERN = /^[a-z0-9-]+$/;
export const SKU_PATTERN = /^[A-Z0-9-]+$/;

const INITIALS = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const MEDIALS = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae",
  "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
];
// 받침 (뒤에 자음이 오거나 끝날 때)
const FINALS = [
  "", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l",
  "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t",
];
// 받침 (뒤에 'ㅇ'으로 시작하는 글자가 와서 소리가 넘어갈 때: 받이 → badi)
const FINALS_LINKED = [
  "", "g", "kk", "ks", "n", "nj", "n", "d", "r", "lg", "lm", "lb", "ls", "lt",
  "lp", "r", "m", "b", "ps", "s", "ss", "ng", "j", "ch", "k", "t", "p", "",
];

const HANGUL_START = 0xac00;
const HANGUL_COUNT = 11172;

function decompose(char) {
  const code = (char?.charCodeAt(0) ?? 0) - HANGUL_START;
  if (code < 0 || code >= HANGUL_COUNT) return null;
  return { initial: Math.floor(code / 588), medial: Math.floor((code % 588) / 28), final: code % 28 };
}

export function romanize(text) {
  const chars = [...text];
  return chars
    .map((char, i) => {
      const syllable = decompose(char);
      if (!syllable) return char;
      const next = decompose(chars[i + 1]);
      const linked = next?.initial === 11; // 다음 글자가 ㅇ으로 시작
      const final = (linked ? FINALS_LINKED : FINALS)[syllable.final];
      return INITIALS[syllable.initial] + MEDIALS[syllable.medial] + final;
    })
    .join("");
}

/** "모모리 턱받이!" → "momori-teokbadi" */
export function slugify(text) {
  return romanize(String(text ?? ""))
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** ("momori-bib", "핑크") → "MOMORI-BIB-PINGKEU" */
export function toSku(...parts) {
  return parts.map(slugify).filter(Boolean).join("-").toUpperCase();
}
