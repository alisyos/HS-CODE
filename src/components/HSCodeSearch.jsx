import React, { useState } from 'react';
import './HSCodeSearch.css';

const HSCodeSearch = () => {
  const [productInfo, setProductInfo] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
  
    try {
      const response = await fetch('/api/search-hscode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: productInfo })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('백엔드 서버 에러: ' + response.status + ' - ' + errorText);
      }
  
      const data = await response.json();
      console.log("전체 API 응답:", data);
      if (data.choices && data.choices.length > 0) {
        console.log("message 객체:", data.choices[0].message);
        const content = data.choices[0].message.content;
        console.log("message content:", content);
        
        const parsedResults = parseOpenAIResponse(content);
        setResults(parsedResults);
      } else {
        throw new Error('API 응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setErrorMsg('검색 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * OpenAI의 응답 메시지를 파싱하는 함수
   * 형식 예시:
   * 1. **HS 코드: 3822.00**
   *    - 3822.00 코드는 ... 사용되는 경우 해당 코드가 적절할 수 있습니다.
   * 2. **HS 코드: 3811.19**
   *    - 3811.19 코드는 ... 사용된 경우 해당 코드가 적합할 수 있습니다.
   */
  const parseOpenAIResponse = (content) => {
    if (!content) return [];
    const results = [];
    
    // [시작]과 [끝] 태그 제거
    const cleanContent = content
      .replace('[시작]', '')
      .replace('[끝]', '')
      .trim();
    
    // 응답 내용을 줄 단위로 분리
    const lines = cleanContent.split('\n');
    let currentCode = null;
    let currentReason = '';
    let currentPage = null;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // HS 코드 라인 확인
      const codeMatch = trimmedLine.match(/\*\*HS 코드:\s*(\d+\.\d+)\*\*/);
      if (codeMatch) {
        // 이전 코드가 있다면 결과에 추가
        if (currentCode) {
          results.push({
            code: currentCode,
            reason: currentReason.trim(),
            page: currentPage
          });
        }
        // 새로운 코드 저장
        currentCode = codeMatch[1];
        currentReason = '';
        currentPage = null;
      }
      // 설명 라인 확인 (하이픈으로 시작하는 줄)
      else if (trimmedLine.startsWith('-')) {
        currentReason = trimmedLine.substring(1).trim();
      }
      // 섹션 페이지 라인 확인 (공백으로 시작하는 줄)
      else if (trimmedLine.match(/^\s*([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+)-(\d+)-(\d+)/)) {
        const pageMatch = trimmedLine.match(/([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ]+)-(\d+)-(\d+)/);
        if (pageMatch) {
          currentPage = {
            section: pageMatch[1],
            sectionPage: pageMatch[0]
          };
        }
      }
    });
    
    // 마지막 항목 추가
    if (currentCode && currentReason) {
      results.push({
        code: currentCode,
        reason: currentReason.trim(),
        page: currentPage
      });
    }
    
    return results;
  };

  // PDF 뷰어를 여는 함수 수정
  const openPdfAtPage = async (page) => {
    try {
      if (!page || !page.sectionPage) {
        console.error('유효하지 않은 페이지 정보:', page);
        return;
      }
      
      const apiBaseUrl = window.location.origin;
      const pdfPath = `${apiBaseUrl}/pdf`;
      
      // API 호출 경로 수정
      const mappingUrl = `${apiBaseUrl}/page-mapping/${encodeURIComponent(page.sectionPage)}`;
      console.log('API 요청 URL:', mappingUrl);
      
      const response = await fetch(mappingUrl);
      console.log('API 응답 상태:', response.status, response.statusText);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 오류 응답:', errorText);
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
      }
      
      const responseText = await response.text();
      console.log('API 응답 내용:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('서버 응답을 파싱할 수 없습니다');
      }
      
      const actualPage = data.actualPage;
      
      console.log('PDF 페이지 정보:', {
        path: pdfPath,
        sectionPage: page.sectionPage,
        actualPage
      });

      // 특정 페이지로 이동하는 URL 생성
      const pdfUrl = `${pdfPath}#page=${actualPage}`;
      
      // 새 창에서 PDF 열기
      window.open(pdfUrl, '_blank');

    } catch (error) {
      console.error('PDF 열기 중 오류 발생:', error);
      console.error('오류 상세:', error.message);
      alert('PDF 열기 중 오류가 발생했습니다. 자세한 내용은 콘솔을 확인해주세요.');
    }
  };

  // 페이지 참조 렌더링 함수 수정
  const renderPageRef = (page) => {
    if (!page || !page.section || !page.sectionPage) {
      return (
        <p className="page-ref">
          출처: HS해설서 전문 (페이지 정보 없음)
        </p>
      );
    }
    
    return (
      <p 
        className="page-ref"
        onClick={() => openPdfAtPage(page)}
        style={{ cursor: 'pointer' }}
        title="PDF에서 해당 섹션 찾기"
      >
        출처: HS해설서 전문 {page.sectionPage}
      </p>
    );
  };

  return (
    <div className="hscode-search">
      <h2>HS 코드 검색</h2>
      <form onSubmit={handleSearch}>
        <div className="input-group">
          <label htmlFor="productInfo">제품 정보 입력</label>
          <textarea
            id="productInfo"
            value={productInfo}
            onChange={(e) => setProductInfo(e.target.value)}
            placeholder="제품의 특징, 소재, 용도 등을 자세히 입력해주세요."
            rows={4}
          />
        </div>
        <button type="submit" disabled={loading || !productInfo.trim()}>
          {loading ? '검색 중...' : 'HS 코드 검색'}
        </button>
      </form>
      {errorMsg && <div className="error-msg">{errorMsg}</div>}
      {results && results.length > 0 && (
        <div className="results-container">
          <h3>검색 결과</h3>
          <div className="results-grid">
            {results.map((result, index) => (
              <div key={index} className="result-card">
                <h4>추천 {index + 1}</h4>
                <p className="hs-code">HS 코드: {result.code}</p>
                <p className="reason">추천 사유: {result.reason}</p>
                {renderPageRef(result.page)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HSCodeSearch;