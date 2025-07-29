// const { QueryTypes } = require('sequelize');
// const { sequelize } = require('../models');
// const { Op } = require('sequelize');

// const initModels = require('../models/init-models');
// const Models = initModels(sequelize);

// const createError = require('../utils/error');

// const locationList = async (areaCode, next) => {
//   try {
//     let sql_where = '';

//     if (areaCode) {
//       const cityCodeObj = {
//         SEL: '11',
//         INC: '23',
//         KYG: '31',
//       };

//       if (cityCodeObj[areaCode]) {
//         sql_where = `AND location_data.city_code = '${cityCodeObj[areaCode]}'`;
//       }
//     }

//     const query = `
//         WITH location_data AS (
//             SELECT CODE_IN AS city_code, CODE_OUT AS city_name
//             FROM DB_CODE
//             WHERE CODE_NAME = 'Location' AND CODE_CATE = 'kr' AND LENGTH(CODE_IN) = 2 AND CODE_FLAG = 'ACTIVE'
//         ),
//         location_city AS (
//             SELECT CODE_IN AS city_code, CODE_OUT AS city_name
//             FROM DB_CODE
//             WHERE CODE_NAME = 'Location' AND CODE_CATE = 'kr' AND LENGTH(CODE_IN) = 4 AND CODE_FLAG = 'ACTIVE'
//         )
//         SELECT c1.CODE_IN, c1.CODE_OUT, CONCAT(location_data.city_name, ' ', IFNULL(location_city.city_name, CONCAT(location_city_parent.city_name, ' ', c1.CODE_OUT))) AS location, c1.CODE_POS, c1.CODE_OPTION, c1.EXTRA_1, c1.EXTRA_2
//         FROM DB_CODE c1
//         JOIN location_data ON LEFT(c1.CODE_IN, 2) = location_data.city_code
//         LEFT JOIN location_city ON c1.CODE_IN = location_city.city_code
//         LEFT JOIN location_city AS location_city_parent ON LEFT(c1.CODE_IN, 4) = location_city_parent.city_code
//         WHERE c1.CODE_NAME = 'Location' AND c1.CODE_CATE = 'kr' AND LENGTH(c1.CODE_IN) > 2 AND c1.CODE_FLAG = 'ACTIVE'
//         ${sql_where} AND c1.CODE_OPTION REGEXP '^kbs_[0-9]+$'
//         ORDER BY location;
//     `;

//     const result = await sequelize.query(query, {
//       type: QueryTypes.SELECT,
//     });

//     return result;
//   } catch (error) {
//     return createError(500, '서버 오류');
//   }
// };

// const locationList2 = async (areaCode, next) => {
//   try {
//     let sql_where = '';

//     if (areaCode) {
//       const cityCodeObj = {
//         SEL: '11',
//         INC: '23',
//         KYG: '31',
//       };

//       if (cityCodeObj[areaCode]) {
//         sql_where = `AND location_data.city_code = '${cityCodeObj[areaCode]}'`;
//       }
//     }

//     const query = `
//         SELECT CODE_OPTION,
//         CASE WHEN COUNT(CASE WHEN CODE_FLAG = 'DISABL' THEN 1 END) = COUNT(*) THEN '준비중'
//         ELSE GROUP_CONCAT(CASE WHEN CODE_FLAG = 'DISABL' THEN NULL ELSE CODE_OUT END SEPARATOR ',')
//         END AS CODE_OUT,
//         GROUP_CONCAT(CODE_IN SEPARATOR ',') AS CODE_IN,
//         CONCAT_WS(',', NULLIF(EXTRA_1, ''), NULLIF(EXTRA_2, '')) AS extras
//         FROM DB_CODE
//         WHERE CODE_NAME = 'Location' AND CODE_CATE = 'kr' AND CODE_OPTION REGEXP '^kbs_[0-9]+$' AND (CODE_FLAG = 'ACTIVE' OR CODE_FLAG = 'DISABL') ${sql_where}
//         GROUP BY CODE_OPTION
//     `;

//     const result = await sequelize.query(query, {
//       type: QueryTypes.SELECT,
//     });

//     return result;
//   } catch (error) {
//     return createError(500, '서버 오류');
//   }
// };

// module.exports = { locationList, locationList2 };
