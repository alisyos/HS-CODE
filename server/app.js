const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// CORS 및 JSON 미들웨어 설정
app.use(cors());
app.use(express.json());

// API 라우터
const apiRouter = require('./routes/api');

// API 요청 처리
app.use('/api', (req, res, next) => {
  console.log('API 요청:', req.path);
  apiRouter(req, res, next);
});

// 정적 파일 제공 설정 (API 요청이 아닌 경우에만)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    express.static(path.join(__dirname, '../client/build'))(req, res, next);
  } else {
    next();
  }
});

// 클라이언트 라우팅을 위한 폴백 (API 요청이 아닌 경우에만)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('API 경로:', '/api/*');
});

module.exports = app; 