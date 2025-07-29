const MapKoreanToEnglish = require('../../utils/auth/MapKoreanToEnglish');

// 패스워드 변환 미들웨어
const passwordMapper = (req, res, next) => {
  if (req.body.password) {
    const originalPassword = req.body.password;
    const containsKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(originalPassword);

    if (containsKorean) {
      const mappedPassword = MapKoreanToEnglish(originalPassword);
      req.body.password = mappedPassword;
    }
  }
  next();
};

module.exports = { passwordMapper };
