const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Assistant ID를 환경 변수에서 가져옵니다
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.post('/api/search-hscode', async (req, res) => {
  const { query } = req.body;
  console.log("클라이언트로부터 받은 query:", query);
  
  try {
    // 1. 새로운 Thread 생성
    const thread = await openai.beta.threads.create();

    // 2. 메시지 추가
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: query
    });

    // 3. Assistant를 사용하여 실행
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });

    // 4. 실행 완료 대기
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'failed') {
        throw new Error('Assistant run failed');
      }
    }

    // 5. 메시지 조회
    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data[0];

    console.log("Assistant 응답:", lastMessage);
    res.json({ choices: [{ message: { content: lastMessage.content[0].text.value } }] });

  } catch (error) {
    console.error('백엔드 API 호출 중 오류 발생:', error);
    res.status(500).json({ error: '요청 처리 중 오류가 발생했습니다. ' + error.message });
  }
});

// PDF 파일 제공을 위한 라우트 추가
app.get('/api/pdf', (req, res) => {
  const pdfPath = path.join(__dirname, 'public', 'pdfs', 'HS해설서_전문.pdf');
  res.sendFile(pdfPath);
});

app.listen(port, () => {
  console.log(`백엔드 서버가 포트 ${port}에서 실행 중입니다.`);
}); 