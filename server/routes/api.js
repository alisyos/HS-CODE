const express = require('express');
const router = express.Router();

// 페이지 매핑 엔드포인트
router.get('/page-mapping/:sectionPage', (req, res) => {
  try {
    const { sectionPage } = req.params;
    console.log('요청된 섹션 페이지:', sectionPage);
    
    // 테스트용 매핑 데이터
    const mappings = {
      'Ⅶ-3926-1': 558,
      'Ⅱ-1203-1': 123,
      // 다른 매핑 추가 예정
    };
    
    const actualPage = mappings[sectionPage] || 1;
    
    // CORS 헤더 추가
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Content-Type', 'application/json');
    
    // JSON 응답 전송
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

// 매핑 함수
async function getActualPageNumber(sectionPage) {
  // 여기에 실제 매핑 로직 구현
  // 예: 데이터베이스 조회 또는 매핑 테이블 참조
  return 558; // 임시 반환값
}

module.exports = router; 