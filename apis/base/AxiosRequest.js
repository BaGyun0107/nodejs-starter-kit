const axios = require('axios');

const axiosInstance = axios.create({
  timeout: 60000 // 타임아웃 시간을 60초로 설정
});

/**
 * 요청 인터셉터
 * - 필요 시 로깅이나 공통 헤더 추가 등 작업 수행 가능
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // console.log(`Request [${config.method.toUpperCase()}] ${config.url}`, config);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * - 응답 데이터에 status 값이 없으면 HTTP status 코드 할당
 * - 에러 응답을 일관된 형식으로 반환
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (!response.data.status) {
      response.data.status = response.status;
    }
    return response;
  },
  (error) => {
    // 타임아웃이나 socket hang up (ECONNRESET) 에러 처리
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
      const err = new Error('시스템이 혼잡하오니 잠시 후 다시 시도해주세요.');
      err.status = 500;
      err.originalError = error;
      return Promise.reject(err);
    }

    if (error.response) {
      const customError = {
        status: error.response.status,
        message:
          error.response.data && error.response.data.message
            ? error.response.data.message
            : error.message,
        originalError: error
      };

      const err = new Error(customError.message);
      err.status = customError.status;
      err.originalError = customError.originalError;
      return Promise.reject(err);
    }

    const err = new Error(error.message || '알 수 없는 에러가 발생했습니다.');
    err.status = 500;
    err.originalError = error;
    return Promise.reject(err);
  }
);

/**
 * @param {string} url - 요청 URL
 * @param {string} method - HTTP 메소드 (GET, POST, PUT, DELETE)
 * @param {object} [options={}] - 옵션 객체
 * @param {object} [options.headers] - 헤더 정보
 * @param {object} [options.data] - 요청 데이터
 * @param {string} [options.urlType] - URL 타입 (account, toss)
 *
 * @returns {Promise} - axios 요청 결과
 *
 * @description
 * axiosRequest 함수는 axios를 사용하여 서버로 요청을 보내며,
 * 내부적으로 요청/응답 인터셉터, 에러 처리를 수행
 *
 * @example
 * const response = await axiosRequest('/api/endpoint', 'POST', { data, headers: {} });
 */
const AxiosRequest = async (url, method = 'GET', options = {}) => {
  if (!url) throw new Error('url이 필요합니다.');
  if (!method) throw new Error('method가 필요합니다.');

  const { headers = null, data = null } = options;

  const config = {
    method,
    url,
    headers,
    ...(method.toUpperCase() === 'GET' ? { params: data } : { data })
  };

  try {
    const response = await axiosInstance(config);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = AxiosRequest;
