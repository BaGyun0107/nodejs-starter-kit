const { env } = require('node:process');
const axios = require('axios');
const CreateError = require('../../utils/common/Error');

let tokenExpires = '';
let xAuthToken = '';

const OsTokenCreate = async (req, res, next) => {
  try {
    if (tokenExpires) {
      const now = new Date();
      const tokenExpiresDate = new Date(tokenExpires);

      if (now < tokenExpiresDate) {
        req.xAuthToken = xAuthToken;
        return next();
      }
    }

    const result = await axios.post(
      'https://api-identity-infrastructure.nhncloudservice.com/v2.0/tokens',
      {
        auth: {
          tenantId: `${env.NHN_TENANT_ID}`,
          passwordCredentials: {
            username: `${env.NHN_USERNAME}`,
            password: `${env.NHN_PASSWORD}`
          }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    tokenExpires = result.data.access.token.expires;

    xAuthToken = result.data.access.token.id;

    if (!result.data) {
      return next(CreateError(401, 'Object Storage 토큰 생성 실패'));
    }

    req.xAuthToken = xAuthToken;
    return next();
  } catch (err) {
    console.error(err);
    return next(CreateError(500, '서버 에러'));
  }
};

module.exports = { OsTokenCreate };
