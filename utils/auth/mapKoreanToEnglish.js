const Hangul = require('hangul-js');

const koreanToEnglishMap = {
  ㅂ: 'q',
  ㅈ: 'w',
  ㄷ: 'e',
  ㄱ: 'r',
  ㅅ: 't',
  ㅛ: 'y',
  ㅕ: 'u',
  ㅑ: 'i',
  ㅐ: 'o',
  ㅔ: 'p',
  ㅁ: 'a',
  ㄴ: 's',
  ㅇ: 'd',
  ㄹ: 'f',
  ㅎ: 'g',
  ㅗ: 'h',
  ㅓ: 'j',
  ㅏ: 'k',
  ㅣ: 'l',
  ㅋ: 'z',
  ㅌ: 'x',
  ㅊ: 'c',
  ㅍ: 'v',
  ㅠ: 'b',
  ㅜ: 'n',
  ㅡ: 'm'
  // 필요에 따라 추가 매핑
};

const mapKoreanToEnglish = (input) => {
  // 한글을 자모 단위로 분해
  const decomposed = Hangul.disassemble(input, true).flat();

  // 각 자모를 매핑
  return decomposed
    .map((char) => {
      return koreanToEnglishMap[char] || char;
    })
    .join('');
};

module.exports = mapKoreanToEnglish;
