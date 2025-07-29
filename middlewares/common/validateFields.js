const { validationResult } = require('express-validator');
const CreateError = require('../../utils/common/Error');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 *
 * @description
 * area 검증
 */
const validateAreaFields = (req, res, next) => {
  const areaCode = req.body.area_code;
  const areaLocation = req.body.area_location;
  // todo : area_code_option이 모두 할당되면 검증 로직 추가
  // const areaCodeOption = req.body.area_code_option;

  const areaFields = [areaCode, areaLocation];

  // areaCode, areaLocation, areaCodeOption 중 하나라도 존재하면, 나머지 모두 존재해야 함
  // .every 메서드는 배열의 모든 요소가 주어진 판별 함수를 통과하는지 테스트 return 값은 boolean
  const allFieldsFilled = areaFields.every((field) => {
    return field !== undefined && field !== '' && field !== null;
  });
  const allFieldsEmpty = areaFields.every((field) => {
    return field === undefined || field === '' || field === null;
  });

  if (!allFieldsFilled && !allFieldsEmpty) {
    const field = ['area_code', 'area_location'];
    const msg = '지역 코드, 지역 위치은 함께 존재하거나 함께 없어야 합니다.';
    const value = areaFields;

    return res.status(400).send({
      message: `${field} ${msg} <${value}>`
    });
  }

  return next();
};

/**
 * 유효성 검사 결과 처리 미들웨어
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 프로덕션 환경에서는 문자열을 반환하여 에러 메시지를 숨김
    if (process.env.NODE_ENV === 'production') {
      const msg = errors.array()[0].msg;
      return next(CreateError(400, msg || '필수 값을 확인해주세요.'));
    }

    const message = errors.array().map((err) => {
      return `[${err.path}] ${err.msg} <${err.value}>`;
    });

    return next(CreateError(400, message));
  }

  return next();
};

module.exports = {
  validateAreaFields,
  handleValidationErrors
};
