const SequelizeAuto = require('sequelize-auto');
const dotenv = require('dotenv');
const fs = require('fs');

const env = process.env.NODE_ENV || 'local';

// 해당 환경의 .env 파일 로드
const envFilePath = `./.env.${env}`;
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
  console.log(`환경변수 ${envFilePath} 파일 로드 완료`);
}

const auto = new SequelizeAuto(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: 'mysql',
    noAlias: true // as 별칭 미설정 여부
  }
);

auto.run((err) => {
  if (err) throw err;
});
