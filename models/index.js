'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const initModels = require('./init-models');
const associations = require('./associations');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;

sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  timezone: '+09:00', // Sequelize: JavaScript Date ↔ DB 변환 시 시간대
  dialectOptions: {
    timezone: '+09:00', // MySQL: DB 함수(NOW, current_timestamp)의 시간대
    dateStrings: true, // 날짜 문자열 형식 사용
    typeCast: true, // 데이터 타입 변환 사용
    supportBigNumbers: true, // 대수 데이터 지원
    bigNumberStrings: true // 대수 문자열 형식 사용
  },
  define: {
    timestamps: false // 타임스탬프 사용 안함
  }
});

fs.readdirSync(__dirname)
  .filter((file) => {
    if (file === 'associations.js') return false;

    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

const Models = initModels(sequelize);
// 모델 관계 설정
associations(Models);

// Sequelize는 라이브러리 자체를 의미하고, 데이터베이스 연결을 설정하기 위한 클래스
// sequelize는 Sequelize 클래스를 이용해 생성한 객체로, 실제로 데이터베이스와 상호작용하는 인스턴스입니다.

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Models = Models;

module.exports = db;
