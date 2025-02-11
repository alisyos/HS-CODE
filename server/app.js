const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// 기본 미들웨어
app.use(cors());
app.use(express.json());

// PDF 파일 제공
app.get('/pdf', (req, res) => {
  // PDF 파일 경로 수정
  const pdfPath = path.join(__dirname, '../public/pdfs/HS해설서_전문.pdf');
  
  // Content-Type 및 Content-Disposition 헤더 설정
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename=HS해설서_전문.pdf');
  
  // PDF 파일 존재 여부 확인 후 전송
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF 파일을 찾을 수 없습니다:', pdfPath);
    return res.status(404).send('PDF 파일을 찾을 수 없습니다.');
  }
  
  // PDF 파일 전송
  res.sendFile(pdfPath, (err) => {
    if (err) {
      console.error('PDF 파일 전송 오류:', err);
      res.status(500).send('PDF 파일을 불러올 수 없습니다.');
    }
  });
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;