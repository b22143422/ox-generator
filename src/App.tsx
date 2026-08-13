import { useState } from 'react';

// ─────────────────────────────────────────────
// 프롬프트: 쉬움 (현행 수준 — 본문 암기 확인용)
// ─────────────────────────────────────────────
const PROMPT_EASY = `너는 한국 고등학교 1학년 영어 내신 대비 "O/X 내용일치 문제" 출제 전문가다.
입력으로 [영어 본문]과 [한글 해석]이 주어진다. 둘 다 빈 줄로 단락이 구분되어 있고, n번째 영어 단락과 n번째 한글 단락은 같은 내용이다.

## 출제 규칙
1. 단락별로 본문 묶음을 구성한다. 각 본문의 한글 O/X·영어 O/X 문항 수는 사용자 메시지의 [문항 수 지시]를 정확히 그대로 따른다. 늘리거나 줄이지 않는다.
2. 모든 본문이 끝난 뒤 지문 전체에 대한 객관식(5지선다)을 정확히 단락 수만큼 출제한다.
3. O/X 정답 비율: 한글 문항들 중 X가 40~60%, 영어 문항들 중에서도 X가 40~60%가 되도록 한다.
4. X(불일치) 문항의 함정은 아래 6종을 골고루 섞는다:
   ① 숫자·수치 교체 ② 주체·대상·경로 교체 ③ 정서·분위기 반전 ④ 행위·수단 교체 ⑤ 지문에 없는 내용 삽입 ⑥ 극단 표현 삽입(only, never, immediately, without any, plenty of 등)
5. 극단 표현 함정(⑥)은 전체 X 문항의 20% 이하로 제한한다.
6. X 문항의 왜곡은 본문과 명백히 모순되어야 한다. 해석에 따라 O로도 볼 수 있는 미묘한 왜곡(뉘앙스 차이, 지엽적 표현 차이)은 금지한다.
7. [중복 금지 — 가장 중요한 규칙] 본문의 각 문장은 시험지 전체에서 단 1개의 문항에만 근거로 사용한다.
   한글 O/X, 영어 O/X, 객관식은 별개 섹션이 아니라 하나의 시험지다:
   한글 문항이 다룬 문장은 영어 문항과 객관식에서 다시 다루지 않는다. 그 반대도 마찬가지다.
   같은 본문의 한글 문항과 영어 문항은 반드시 서로 다른 문장들을 근거로 삼는다.
   객관식끼리도 소재가 겹치면 안 되며, 한 객관식의 정답이 다른 객관식의 선지에 등장하면 안 된다.
8. 객관식이 5문항이면 정답 번호는 1,2,3,4,5를 정확히 한 번씩 사용한다(순서는 섞는다).
   5문항이 아니면 같은 번호가 2회를 넘지 않게 분산한다.
9. 객관식 정답 선지는 본문의 사실과 정확히 일치해야 한다. 본문 표현을 과장하거나 바꾸지 않는다.
10. 영어 문항은 본문 문장을 그대로 복사하지 말고 고1 수준 어휘로 패러프레이즈한다. 끊어읽기 슬래시(/)는 사용하지 않는다.`;

// ─────────────────────────────────────────────
// 프롬프트: 어려움 (상위권 변별 — 표면 스캔 무력화)
// ─────────────────────────────────────────────
const PROMPT_HARD = `너는 한국 고등학교 영어 내신 "O/X 내용일치 문제" 출제 전문가다. 이번 시험지는 상위권 변별용 고난도 시험지다.
입력으로 [영어 본문]과 [한글 해석]이 주어진다. 둘 다 빈 줄로 단락이 구분되어 있고, n번째 영어 단락과 n번째 한글 단락은 같은 내용이다.

## [최상위 원칙] "판정은 명백하게, 근거 찾기는 어렵게"
근거 문장을 찾아낸 학생에게는 정답이 반드시 명백해야 한다. 해석에 따라 O로도 X로도 볼 수 있는 뉘앙스 논쟁형 문항은 절대 금지.
난이도는 애매함에서 나오는 것이 아니라, 키워드 표면 대조만으로는 풀 수 없고 문장의 논리 구조를 읽어야만 풀리게 만드는 데서 나온다.

## 출제 규칙
1. 각 본문의 한글 O/X·영어 O/X 문항 수는 사용자 메시지의 [문항 수 지시]를 정확히 그대로 따른다. 늘리거나 줄이지 않는다.
2. 모든 본문이 끝난 뒤 지문 전체에 대한 객관식(5지선다)을 정확히 단락 수만큼 출제한다.
3. O/X 정답 비율: 한글 문항들 중 X가 40~60%, 영어 문항들 중에서도 X가 40~60%.
4. X(불일치) 문항의 함정은 아래 6종만 사용한다. 단어 하나를 다른 사물·숫자로 바꾸는 단순 치환형 함정은 금지한다:
   ① 인과 왜곡 — 원인과 결과를 뒤집거나 무관한 두 사실을 인과로 연결. 어휘는 전부 본문 것을 재사용
   ② 조건·범위 왜곡 — 본문의 한정어(특정 상황·대상·시점)를 지우고 일반화하거나, 없던 한정을 추가
   ③ 수단↔목적 교체 — "A를 위해 B를 했다"를 "B를 위해 A를 했다"로
   ④ 관계 보존형 주체 교차 — 등장 요소는 전부 본문 그대로 두고 누가-누구에게의 관계만 교차. 단어 대조로는 전부 일치하게
   ⑤ 부분↔전체 — 한 사례를 일반 원칙으로 승격하거나, 일반 진술을 특정 사례에 한정
   ⑥ 2문장 합성 — 문장 A의 앞부분과 문장 B의 뒷부분을 자연스럽게 접합. 각 부분은 본문에 실재하지만 결합된 진술은 거짓
5. only, never, always, immediately, without any 같은 극단 표현 함정은 완전 금지한다 — 그 자체가 학생에게 단서가 된다.
6. O(일치) 문항 규칙:
   - 본문과 어순·구문이 비슷한 패러프레이즈 금지. 태 전환, 절↔구 변환, 서술 관점 전환으로 문장 구조를 완전히 재조립한다.
   - 영어 O 문항의 약 3분의 1은 인접한 두 문장의 정보를 종합해야만 참임이 확인되는 2문장 종합형으로 만든다.
7. [중복 금지] 본문의 각 문장은 시험지 전체에서 단 1개의 문항에만 근거로 사용한다(2문장 종합형은 두 문장을 함께 소진한 것으로 친다). 한글 O/X, 영어 O/X, 객관식은 하나의 시험지로 취급한다. 같은 본문의 한글 문항과 영어 문항은 서로 다른 문장을 근거로 삼는다.
8. 객관식 규칙 (변별력 핵심):
   - 오답 선지 4개 전부 본문의 어휘·소재·인물을 재사용하되 인과·범위·관계만 왜곡한다. 본문에 없는 내용으로 만든 상식 소거형 오답 금지.
   - 문항마다 정답과 같은 근거 문장을 다루되 세부 하나만 틀린 매력 오답을 1개 이상 포함한다.
   - 발문 유형을 혼합한다: 세부 확인형 / NOT true형(일치하지 않는 것 고르기) / 추론형(글의 내용으로 보아 가장 적절한 것).
   - 객관식이 5문항이면 정답 번호 1~5를 정확히 한 번씩(순서는 섞기), 아니면 같은 번호 2회 초과 금지.
9. 객관식 정답 선지는 본문의 사실과 정확히 일치해야 하며 표현을 과장·왜곡하지 않는다.
10. 영어 문항은 고1 상위권 수준 어휘로 작성한다. 끊어읽기 슬래시(/)는 사용하지 않는다.`;

// 공통: 해설 규칙 + 출력 형식
const PROMPT_COMMON = `

## 해설 규칙
- 영어 O/X 문항: 전 문항에 자연스러운 한글 해석(translation)을 단다.
- O/X 문항 중 정답이 X인 문항만 evidence에 간략한 한글 근거를 쓴다. 이때 "본문은 ~인데, 문항은 ~로 바꿔 놓았다" 식으로 왜곡 지점을 명시한다. O 문항의 evidence는 빈 문자열.
- 객관식: choiceTranslations에 5개 선지 전부의 한글 해석, evidence에 정답의 간략한 한글 근거를 쓴다.

## 출력 형식
아래 스키마의 JSON만 출력한다. JSON 외 다른 텍스트, 마크다운 코드펜스 금지.
{
  "sets": [
    {
      "passage": "단락 영어 원문 그대로",
      "koreanOX": [ { "text": "한글 문항", "answer": "O 또는 X", "evidence": "X일 때만 근거, O면 빈 문자열" } ],
      "englishOX": [ { "text": "영어 문항", "answer": "O 또는 X", "translation": "문항의 한글 해석", "evidence": "X일 때만 근거" } ]
    }
  ],
  "multipleChoice": [
    {
      "question": "영어 발문",
      "choices": ["선지1","선지2","선지3","선지4","선지5"],
      "answer": 1,
      "choiceTranslations": ["해석1","해석2","해석3","해석4","해석5"],
      "evidence": "정답 근거 (한글)"
    }
  ]
}`;

const CIRCLED = ['①', '②', '③', '④', '⑤'];
const TRANS_LINE = '   해석: ______________________________';

// ─────────────────────────────────────────────
// 문항 수 계획 — 코드가 계산해서 프롬프트에 숫자로 박아준다
// (비율식 vs 검증기 경계 충돌로 인한 미달 버그의 근본 픽스)
// ─────────────────────────────────────────────
function countSentences(p) {
  return ((p || '').match(/[.!?](\s|$)/g) || []).length;
}

function planCounts(paragraphs) {
  return paragraphs.map((p) => {
    const sent = Math.max(countSentences(p), 1);
    return {
      sent,
      kor: Math.max(2, Math.floor(sent / 6)),
      eng: Math.max(2, Math.floor(sent / 3)),
    };
  });
}

function planDirective(plan) {
  const lines = plan.map(
    (c, i) =>
      `본문 ${i + 1} (${c.sent}문장): 한글 O/X ${c.kor}문항, 영어 O/X ${c.eng}문항`
  );
  return (
    `[문항 수 지시 — 반드시 이 숫자 그대로 출제]\n` +
    lines.join('\n') +
    `\n객관식: 정확히 ${plan.length}문항`
  );
}

// ─────────────────────────────────────────────
// 정량 자동 검증 (계획과 정확 일치 요구)
// ─────────────────────────────────────────────
function validateData(data, plan, difficulty) {
  const issues = [];
  const setCount = data.sets.length;

  if (setCount !== plan.length)
    issues.push(`본문 수 불일치: 생성 ${setCount} / 입력 ${plan.length}`);

  data.sets.forEach((s, i) => {
    const c = plan[i];
    if (!c) return;
    if ((s.koreanOX?.length ?? 0) !== c.kor)
      issues.push(`본문 ${i + 1}: 한글 O/X ${s.koreanOX?.length ?? 0}문항 (지시: ${c.kor})`);
    if ((s.englishOX?.length ?? 0) !== c.eng)
      issues.push(`본문 ${i + 1}: 영어 O/X ${s.englishOX?.length ?? 0}문항 (지시: ${c.eng})`);
  });

  const mc = data.multipleChoice || [];
  if (mc.length !== plan.length)
    issues.push(`객관식 ${mc.length}문항 — 단락 수(${plan.length})와 일치해야 함`);

  mc.forEach((m, i) => {
    if (!Array.isArray(m.choices) || m.choices.length !== 5)
      issues.push(`객관식 ${i + 1}: 선지가 5개가 아님`);
    if (!(m.answer >= 1 && m.answer <= 5))
      issues.push(`객관식 ${i + 1}: 정답 번호가 1~5가 아님`);
    if (!Array.isArray(m.choiceTranslations) || m.choiceTranslations.length !== 5)
      issues.push(`객관식 ${i + 1}: 선지 해석이 5개가 아님`);
  });

  if (mc.length === 5) {
    const sorted = mc.map((m) => m.answer).slice().sort().join(',');
    if (sorted !== '1,2,3,4,5')
      issues.push(
        `객관식 정답 분산 위반: [${mc.map((m) => CIRCLED[m.answer - 1]).join(' ')}] — 1~5 각 1회여야 함`
      );
  } else if (mc.length >= 3) {
    const counts = {};
    mc.forEach((m) => (counts[m.answer] = (counts[m.answer] || 0) + 1));
    Object.entries(counts).forEach(([num, c]) => {
      if (c > 2) issues.push(`객관식 정답 ${CIRCLED[num - 1]}번이 ${c}회 — 쏠림`);
    });
  }

  // O/X 비율
  const kAll = data.sets.flatMap((s) => s.koreanOX || []);
  const eAll = data.sets.flatMap((s) => s.englishOX || []);
  const ratio = (arr) => arr.filter((q) => q.answer === 'X').length / Math.max(arr.length, 1);
  const kr = ratio(kAll);
  const er = ratio(eAll);
  if (kr < 0.35 || kr > 0.65)
    issues.push(`한글 O/X 비율 쏠림: X ${Math.round(kr * 100)}% (40~60% 필요)`);
  if (er < 0.35 || er > 0.65)
    issues.push(`영어 O/X 비율 쏠림: X ${Math.round(er * 100)}% (40~60% 필요)`);

  // 완전 동일 문항 중복
  const seen = new Set();
  [...kAll, ...eAll].forEach((q) => {
    const t = (q.text || '').trim();
    if (seen.has(t)) issues.push(`동일 문항 중복 발견: "${t.slice(0, 40)}..."`);
    seen.add(t);
  });

  // 본문 문장 통째 복사 검사
  data.sets.forEach((s, i) => {
    const p = (s.passage || '').replace(/\s+/g, ' ');
    (s.englishOX || []).forEach((q, qi) => {
      const t = (q.text || '').trim().replace(/\s+/g, ' ').replace(/[.?!]$/, '');
      if (t.length > 30 && p.includes(t))
        issues.push(`본문 ${i + 1} 영어 ${qi + 1}번: 본문 문장을 그대로 복사함`);
    });
  });

  // 극단 표현: 쉬움 = 20% 이하 / 어려움 = 완전 금지
  const extremeRe = /\b(only|never|immediately|always|without any|plenty of|entirely|completely)\b/i;
  const engX = eAll.filter((q) => q.answer === 'X');
  const extremeCount = engX.filter((q) => extremeRe.test(q.text)).length;
  if (difficulty === 'hard') {
    if (extremeCount > 0)
      issues.push(`극단 표현 함정 ${extremeCount}개 발견 — 어려움 모드에서는 금지`);
  } else if (engX.length > 0 && extremeCount / engX.length > 0.34) {
    issues.push(`극단 표현 함정 과다: 영어 X ${engX.length}개 중 ${extremeCount}개`);
  }

  return issues;
}

// ─────────────────────────────────────────────
// 마크다운 빌더
// ─────────────────────────────────────────────
function buildMarkdown(data, title) {
  const L = [];
  L.push(`# ${title} 내용확인 문제`, '');

  let kNum = 0;
  let eNum = 0;

  data.sets.forEach((set, si) => {
    L.push(`## [본문 ${si + 1}]`, '');
    L.push('> ' + set.passage.replace(/\n/g, '\n> '), '');
    L.push('**한글 O/X**', '');
    set.koreanOX.forEach((q) => {
      kNum++;
      L.push(`${kNum}. ${q.text} (O / X)`);
    });
    L.push('', '**영어 O/X**', '');
    set.englishOX.forEach((q) => {
      eNum++;
      L.push(`${eNum}. ${q.text} (O / X)`);
      L.push(TRANS_LINE);
    });
    L.push('');
  });

  L.push('## 객관식', '');
  (data.multipleChoice || []).forEach((m, i) => {
    L.push(`${i + 1}. ${m.question}`);
    m.choices.forEach((c, ci) => {
      L.push(`   ${CIRCLED[ci]} ${c}`);
      L.push('   ' + TRANS_LINE);
    });
    L.push('');
  });

  // ── 해설지 ──
  L.push('---', '', `# ${title} 해설지`, '');

  kNum = 0;
  eNum = 0;
  L.push('## 한글 O/X', '');
  data.sets.forEach((set) => {
    set.koreanOX.forEach((q) => {
      kNum++;
      L.push(
        `${kNum}. **${q.answer}**` +
          (q.answer === 'X' && q.evidence ? ` — 근거: ${q.evidence}` : '')
      );
    });
  });
  L.push('', '## 영어 O/X', '');
  data.sets.forEach((set) => {
    set.englishOX.forEach((q) => {
      eNum++;
      L.push(
        `${eNum}. **${q.answer}** — 해석: ${q.translation}` +
          (q.answer === 'X' && q.evidence ? ` / 근거: ${q.evidence}` : '')
      );
    });
  });
  L.push('', '## 객관식', '');
  (data.multipleChoice || []).forEach((m, i) => {
    const transStr = m.choiceTranslations
      .map((t, ti) => `${CIRCLED[ti]} ${t}`)
      .join(' ');
    L.push(
      `${i + 1}. **${CIRCLED[m.answer - 1]}** — 선지 해석: ${transStr} / 근거: ${m.evidence}`
    );
  });

  return L.join('\n');
}

// ─────────────────────────────────────────────
// EXAM STUDIO 백업 JSON 빌더
// ─────────────────────────────────────────────
let uidCounter = 0;
function uid(prefix) {
  uidCounter++;
  return `${prefix}${Date.now()}_${uidCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildStudioJson(data, title) {
  const groups = [];
  const questions = [];

  data.sets.forEach((set, si) => {
    const groupId = uid('g');
    groups.push({
      id: groupId,
      commonQuestionText: `[본문 ${si + 1}] 다음 글을 읽고, 각 문장이 본문 내용과 일치하면 O, 일치하지 않으면 X 표시하시오.`,
      hasCommonPassage: true,
      commonPassage: set.passage,
    });

    questions.push({
      id: uid('q'),
      type: 'ox',
      questionText: '한글 내용일치',
      hasPassage: false,
      passage: '',
      conditions: [],
      choices: ['', '', '', '', ''],
      answerLines: 3,
      answerGuide: '',
      answer: '',
      oxSentences: set.koreanOX.map((s) => ({
        id: uid('s'),
        text: s.text,
        answer: s.answer,
        explanation: s.answer === 'X' ? s.evidence || '' : '',
        translation: '',
      })),
      groupId,
      showOxTranslationLines: false,
      showChoiceTranslationLines: false,
    });

    questions.push({
      id: uid('q'),
      type: 'ox',
      questionText: '영어 내용일치 — 각 문항 아래에 해석을 쓰시오.',
      hasPassage: false,
      passage: '',
      conditions: [],
      choices: ['', '', '', '', ''],
      answerLines: 3,
      answerGuide: '',
      answer: '',
      oxSentences: set.englishOX.map((s) => ({
        id: uid('s'),
        text: s.text,
        answer: s.answer,
        explanation: s.answer === 'X' ? s.evidence || '' : '',
        translation: s.translation || '',
      })),
      groupId,
      showOxTranslationLines: true,
      showChoiceTranslationLines: false,
    });
  });

  const mcList = data.multipleChoice || [];
  if (mcList.length > 0) {
    const mcGroupId = uid('g');
    groups.push({
      id: mcGroupId,
      commonQuestionText:
        '[객관식] 다음 글의 내용에 관한 물음에 답하고, 각 선지 아래에 해석을 쓰시오.',
      hasCommonPassage: false,
      commonPassage: '',
    });
    mcList.forEach((m) => {
      const transStr = m.choiceTranslations
        .map((t, ti) => `${CIRCLED[ti]} ${t}`)
        .join('\n');
      questions.push({
        id: uid('q'),
        type: 'multiple-choice',
        questionText: m.question,
        hasPassage: false,
        passage: '',
        conditions: [],
        choices: m.choices,
        answerLines: 3,
        answerGuide: '',
        answer: CIRCLED[m.answer - 1],
        oxSentences: [],
        showOxTranslationLines: false,
        showChoiceTranslationLines: true,
        groupId: mcGroupId,
        mcExplanation: `선지 해석\n${transStr}\n근거: ${m.evidence}`,
      });
    });
  }

  return {
    type: 'exam-studio-library',
    version: 2,
    exportedAt: Date.now(),
    papers: [
      {
        id: `paper_${Date.now()}`,
        name: `${title} 내용확인`,
        createdAt: Date.now(),
        mode: 'exam',
        worksheetType: 'grammar',
        header: {
          academyName: '옵티멈N스터디 영어학원',
          grade: '고1',
          title: `${title} 내용확인 문제`,
          scope: title,
        },
        questions,
        groups,
        worksheetItems: [],
      },
    ],
  };
}

// ─────────────────────────────────────────────
// Gemini 호출 (모델 배열 폴백)
// ─────────────────────────────────────────────
async function callGemini(apiKey, models, systemText, userText) {
  const list = [].concat(models);
  let lastErr = null;
  for (const model of list) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemText }] },
            contents: [{ role: 'user', parts: [{ text: userText }] }],
            generationConfig: {
              maxOutputTokens: 65536,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      const dataRes = await res.json();
      if (dataRes.error) throw new Error(`[${model}] ` + dataRes.error.message);
      const raw =
        dataRes?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// ─────────────────────────────────────────────
// 앱
// ─────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_key') || '');
  const [difficulty, setDifficulty] = useState('easy'); // 'easy' | 'hard'
  const [title, setTitle] = useState('');
  const [engText, setEngText] = useState('');
  const [korText, setKorText] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('md');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [verifyReport, setVerifyReport] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const generate = async () => {
    if (!apiKey) return setError('Gemini API 키를 입력하세요.');
    if (!engText.trim() || !korText.trim())
      return setError('영어 본문과 한글 해석을 모두 입력하세요.');

    const engParas = engText.trim().split(/\n\s*\n/);
    const korParas = korText.trim().split(/\n\s*\n/);
    if (engParas.length !== korParas.length) {
      return setError(
        `단락 수가 다릅니다. 영어 ${engParas.length}개 / 한글 ${korParas.length}개 — 빈 줄 구분을 맞춰주세요.`
      );
    }

    setError('');
    setLoading(true);
    setResult(null);
    setVerifyReport(null);
    localStorage.setItem('gemini_key', apiKey);

    const t = title.trim() || '고1 영어';
    const systemPrompt =
      (difficulty === 'hard' ? PROMPT_HARD : PROMPT_EASY) + PROMPT_COMMON;
    const plan = planCounts(engParas);
    const baseUserPrompt = `${planDirective(plan)}\n\n[영어 본문]\n${engText.trim()}\n\n[한글 해석]\n${korText.trim()}`;

    try {
      let best = null;
      const MAX_TRIES = 3;

      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        setStatus(
          attempt === 1
            ? `생성 중... (${difficulty === 'hard' ? '어려움' : '쉬움'} · 30초~1분)`
            : `규칙 위반 발견 → 자동 재생성 중 (${attempt}/${MAX_TRIES})`
        );

        let userPrompt = baseUserPrompt;
        if (best && best.issues.length > 0) {
          userPrompt +=
            `\n\n[중요] 직전 생성 결과가 아래 규칙을 위반했다. 이번에는 반드시 모두 지켜서 전체를 새로 생성하라:\n- ` +
            best.issues.join('\n- ');
        }

        const data = await callGemini(
          apiKey,
          ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'],
          systemPrompt,
          userPrompt
        );
        if (!Array.isArray(data.sets) || !Array.isArray(data.multipleChoice)) {
          throw new Error('응답 형식이 올바르지 않습니다. 다시 시도하세요.');
        }
        const issues = validateData(data, plan, difficulty);
        if (!best || issues.length < best.issues.length) best = { data, issues };
        if (issues.length === 0) break;
      }

      setResult({
        data: best.data,
        markdown: buildMarkdown(best.data, t),
        studioJson: buildStudioJson(best.data, t),
        title: t,
        issues: best.issues,
        difficulty,
      });
      setTab('md');
    } catch (e) {
      setError('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // ── 2차 AI 재판정 ──
  const verify = async () => {
    if (!result) return;
    setVerifying(true);
    setVerifyReport(null);

    try {
      const d = result.data;
      const lines = [];
      d.sets.forEach((s, si) => {
        lines.push(`[본문 ${si + 1}]\n${s.passage}\n`);
      });
      let idx = 0;
      const flat = [];
      d.sets.forEach((s, si) => {
        s.koreanOX.forEach((q) => {
          idx++;
          flat.push({ n: idx, expected: q.answer, text: q.text, set: si + 1 });
        });
      });
      d.sets.forEach((s, si) => {
        s.englishOX.forEach((q) => {
          idx++;
          flat.push({ n: idx, expected: q.answer, text: q.text, set: si + 1 });
        });
      });

      const itemList = flat
        .map((f) => `${f.n}. (본문 ${f.set}) ${f.text}`)
        .join('\n');

      const verifySystem = `너는 영어 내신 문제 검수자다. 주어진 본문과 문항을 대조하여, 각 문항이 본문 내용과 일치하면 "O", 불일치하면 "X"로만 판정한다.
출력은 JSON 배열만: [{"n": 문항번호, "judge": "O 또는 X"}] — 다른 텍스트 금지.`;
      const verifyUser = `[본문]\n${lines.join('\n')}\n\n[문항 목록 — 각각 O/X 판정하라]\n${itemList}`;

      const judged = await callGemini(
        apiKey,
        ['gemini-3-pro', 'gemini-3.6-flash'],
        verifySystem,
        verifyUser
      );
      const judgeMap = new Map(judged.map((j) => [j.n, j.judge]));

      const mismatches = flat.filter(
        (f) => judgeMap.has(f.n) && judgeMap.get(f.n) !== f.expected
      );

      setVerifyReport({
        total: flat.length,
        checked: judged.length,
        mismatches: mismatches.map(
          (f) =>
            `⚠ 본문 ${f.set} — "${f.text.slice(0, 60)}..." : 1차 ${f.expected} vs 재판정 ${judgeMap.get(f.n)}`
        ),
      });
    } catch (e) {
      setVerifyReport({ total: 0, checked: 0, mismatches: [`검증 실패: ${e.message}`] });
    } finally {
      setVerifying(false);
    }
  };

  const copyCurrent = () => {
    const text =
      tab === 'md' ? result.markdown : JSON.stringify(result.studioJson, null, 2);
    navigator.clipboard.writeText(text);
    alert('복사되었습니다.');
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result.studioJson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ox-${result.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header>
        <h1>OX 내용일치 문제 생성기 v3.5</h1>
        <input
          type="password"
          className="key-input"
          placeholder="Gemini API 키"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </header>

      <div className="panes">
        {/* 좌측: 입력 */}
        <div className="pane">
          <div className="mode-toggle">
            <button
              className={difficulty === 'easy' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setDifficulty('easy')}
            >
              쉬움 (본문 확인)
            </button>
            <button
              className={difficulty === 'hard' ? 'mode-btn active' : 'mode-btn'}
              onClick={() => setDifficulty('hard')}
            >
              어려움 (상위권 변별)
            </button>
          </div>
          <input
            className="title-input"
            placeholder="제목 (예: 공통영어2 미래엔(김) 1과)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label>영어 본문 — 단락은 빈 줄로 구분</label>
          <textarea
            value={engText}
            onChange={(e) => setEngText(e.target.value)}
            placeholder={'단락 1 영어...\n\n단락 2 영어...'}
          />
          <label>한글 해석 — 영어와 같은 개수의 단락으로, 빈 줄로 구분</label>
          <textarea
            value={korText}
            onChange={(e) => setKorText(e.target.value)}
            placeholder={'단락 1 해석...\n\n단락 2 해석...'}
          />
          <button className="gen-btn" onClick={generate} disabled={loading}>
            {loading ? status || '생성 중...' : '문제 생성'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>

        {/* 우측: 출력 */}
        <div className="pane">
          {result && (
            <div className={result.issues.length === 0 ? 'badge ok' : 'badge warn'}>
              {result.issues.length === 0
                ? `✅ 정량 검증 통과 (난이도: ${result.difficulty === 'hard' ? '어려움' : '쉬움'} · 문항 수 지시 일치)`
                : `⚠ 자동 재생성 후에도 남은 규칙 위반 ${result.issues.length}건 — 아래 항목 확인 필요`}
              {result.issues.length > 0 && (
                <ul>
                  {result.issues.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {verifyReport && (
            <div
              className={
                verifyReport.mismatches.length === 0 ? 'badge ok' : 'badge warn'
              }
            >
              {verifyReport.mismatches.length === 0
                ? `✅ 2차 AI 재판정 통과 — ${verifyReport.checked}/${verifyReport.total}문항 판정 일치`
                : `⚠ 재판정 불일치 ${verifyReport.mismatches.length}건 — 이 문항들만 사람이 확인`}
              {verifyReport.mismatches.length > 0 && (
                <ul>
                  {verifyReport.mismatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="out-head">
            <div className="tabs">
              <button
                className={tab === 'md' ? 'tab active' : 'tab'}
                onClick={() => setTab('md')}
              >
                마크다운
              </button>
              <button
                className={tab === 'json' ? 'tab active' : 'tab'}
                onClick={() => setTab('json')}
              >
                학습지 툴 JSON
              </button>
            </div>
            {result && (
              <div className="out-btns">
                <button onClick={verify} disabled={verifying}>
                  {verifying ? '재판정 중...' : '2차 AI 검증'}
                </button>
                <button onClick={copyCurrent}>복사</button>
                {tab === 'json' && (
                  <button onClick={downloadJson}>JSON 다운로드</button>
                )}
              </div>
            )}
          </div>
          <pre className="output">
            {result
              ? tab === 'md'
                ? result.markdown
                : JSON.stringify(result.studioJson, null, 2)
              : '생성 결과가 여기에 표시됩니다.\n\n· 쉬움: 본문 암기 확인용 (기존 수준)\n· 어려움: 상위권 변별용 — 키워드 스캔으로 못 풀고 문장 논리를 읽어야 풀리는 함정(인과·범위·관계 왜곡, 2문장 합성), 구조 재조립 패러프레이즈, 본문 어휘 재사용 오답 선지\n\n문항 수는 단락별 문장 수 기준으로 자동 계산되어 지시되며, 정량 검증과 정확히 일치해야 통과합니다.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
