const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// dayjs 설정
dayjs.extend(utc); // utc 플러그인 추가
dayjs.extend(timezone); // timezone 플러그인 추가
dayjs.locale('ko'); // 한국 언어 설정

/**
 *
 * @returns {object} koreanDate - 한국 날짜
 *
 * @description
 * krDate 함수는 한국 시간을 반환
 *
 * @example
 * const { koreanDate, koreanTime, orderDate, iso8601 } = krDate();
 * console.log(koreanDate); // 2021-09-02
 * console.log(koreanTime); // 15:00
 * console.log(orderDate); // 20210902150000000
 * console.log(iso8601); // 2021-09-02T15:00:00+09:00
 */
const krDate = () => {
  const krCurrentDate = dayjs().tz('Asia/Seoul');

  const koreanDate = krCurrentDate.format('YYYY-MM-DD');
  const koreanTime = krCurrentDate.format('HH:mm');
  const orderDate = krCurrentDate.format('YYYYMMDDHHmmssSSS');
  const iso8601 = krCurrentDate.toISOString();

  return {
    koreanDate,
    koreanTime,
    orderDate,
    iso8601
  };
};

module.exports = { krDate };
