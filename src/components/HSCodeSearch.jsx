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
    let currentPage = '';
    
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
            page: currentPage.trim()
          });
        }
        // 새로운 코드 저장
        currentCode = codeMatch[1];
        currentReason = '';
        currentPage = '';
      }
      // 설명 라인 확인 (하이픈으로 시작하는 줄)
      else if (trimmedLine.startsWith('-')) {
        const reasonText = trimmedLine.substring(1).trim();
        
        // 페이지 정보 추출 (섹션 페이지와 PDF 페이지 모두)
        const pageMatch = reasonText.match(/([ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫ])-[\d]+-[\d]+\s*\(PDF p\.(\d+)\)/);
        
        if (pageMatch) {
          currentPage = {
            section: pageMatch[1],
            page: pageMatch[2]
          };
          // 페이지 정보를 제외한 나머지를 추천 사유로 저장
          currentReason = reasonText
            .replace(pageMatch[0], '')
            .replace(/\(\s*\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          currentReason = reasonText;
        }
      }
    });
    
    // 마지막 항목 추가
    if (currentCode && currentReason) {
      results.push({
        code: currentCode,
        reason: currentReason,
        page: currentPage
      });
    }
    
    console.log("파싱된 결과:", results);
    return results;
  };

  // PDF 뷰어를 여는 함수
  const openPdfAtPage = (page) => {
    try {
      if (!page || !page.page) {
        console.error('유효하지 않은 페이지 정보:', page);
        return;
      }
      
      const pdfPath = `${window.location.origin}/api/pdf`;
      const pageNumber = parseInt(page.page);
      
      console.log('PDF 열기 시도:', {
        path: pdfPath,
        page: pageNumber
      });

      fetch(pdfPath)
        .then(response => {
          if (response.ok) {
            window.open(`${pdfPath}#page=${pageNumber}`, '_blank', 'noopener,noreferrer');
          } else {
            throw new Error(`PDF 파일을 찾을 수 없습니다 (${response.status})`);
          }
        })
        .catch(error => {
          console.error('PDF 파일 오류:', error);
          alert('PDF 파일을 찾을 수 없습니다. 파일 경로를 확인해주세요.');
        });
    } catch (error) {
      console.error('PDF 열기 중 오류 발생:', error);
      alert('PDF 열기 중 오류가 발생했습니다.');
    }
  };

  // 페이지 참조가 있는 경우에만 클릭 가능하도록 수정
  const renderPageRef = (page) => {
    if (!page || !page.section || !page.page) {
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
        title="PDF에서 해당 페이지 열기"
      >
        출처: HS해설서 전문 {page.section} (PDF p.{page.page})
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