const express = require('express');
const cors = require('cors');
const app = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우터
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// ... 나머지 코드 ... 