const express = require('express');
const app = express();
const apiRouter = require('./routes/api');

// API 라우터 설정
app.use('/api', apiRouter);

// ... 나머지 코드 ... 