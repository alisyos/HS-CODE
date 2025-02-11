const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// 기본 미들웨어
app.use(cors());
app.use(express.json());

// API 라우트 핸들러
app.get('/api/page-mapping/:sectionPage', (req, res) => {
  try {
    const { sectionPage } = req.params;
    console.log('요청된 섹션 페이지:', sectionPage);
    
    // 테스트용 매핑 데이터
    const mappings = {
      'Ⅶ-3926-1': 558,
      'Ⅱ-1203-1': 123,
      'Ⅶ-4203-1': 600,  // 예시 페이지 번호
    };
    
    const actualPage = mappings[sectionPage] || 1;
    
    // 명시적으로 JSON 응답 설정
    res.setHeader('Content-Type', 'application/json');
    res.json({ 
      success: true,
      actualPage,
      sectionPage 
    });
    
  } catch (error) {
    console.error('페이지 매핑 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '페이지 매핑 중 오류가 발생했습니다.' 
    });
  }
});

// PDF 파일 제공
app.get('/api/pdf', (req, res) => {
  // 기존 PDF 제공 코드
  const pdfPath = path.join(__dirname, '../data/hs_explanation.pdf');
  res.sendFile(pdfPath);
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../client/build')));

// 클라이언트 라우팅
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; 