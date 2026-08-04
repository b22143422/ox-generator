import { useState } from 'react';

// ─────────────────────────────────────────────
// 출제 규칙 프롬프트 (v3 — 중복금지 강화, 비율·최소문항 강제, 애매함정 금지)
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `너는 한국 고등학교 1학년 영어 내신 대비 "O/X 내용일치 문제" 출제 전문가다.
입력으로 [영어 본문]과 [한글 해석]이 주어진다. 둘 다 빈 줄로 단락이 구분되어 있고, n번째 영어 단락과 n번째 한글 단락은 같은 내용이다.

## 출제 규칙
1. 단락별로 본문를 구성한다. 각 본문마다:
   - 한글 O/X 문항: 영어 문장 6개당 1문항, 어떤 본문든 반드시 최소 2문항
   - 영어 O/X 문항: 영어 문장 3개당 1문항, 어떤 본문든 반드시 최소 3문항
   - 단, 문장 수가 5개 이하인 짧은 단락은 영어 O/X를 최소 2문항으로 한다. 중복 금지 규칙이 문항 수보다 우선한다.
2. 모든 본문가 끝난 뒤 지문 전체에 대한 객관식(5지선다)을 정확히 단락 수만큼 출제한다.
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
9. 객관식 정답 선지는 본문의 사실과 정확히 일치해야 한다. 본문 표현을 과장하거나 바꾸지 않는다(예: "잠시 후"를 "quickly"로 바꾸지 말 것).
10. 영어 문항은 본문 문장을 그대로 복사하지 말고 고1 수준 어휘로 패러프레이즈한다. 끊어읽기 슬래시(/)는 사용하지 않는다.

## 해설 규칙
- 영어 O/X 문항: 전 문항에 자연스러운 한글 해석(translation)을 단다.
- O/X 문항 중 정답이 X인 문항만 evidence에 "본문에는 ~라고 나와 있다" 식의 간략한 한글 근거를 쓴다. O 문항의 evidence는 빈 문자열.
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
// 정량 자동 검증 — 규칙 위반을 기계적으로 잡는다
// ─────────────────────────────────────────────
function validateData(data) {
  const issues = [];
  const setCount = data.sets.length;

  data.sets.forEach((s, i) => {
    const sentCount = ((s.passage || '').match(/[.!?](\s|$)/g) || []).length;
    const engMin = sentCount > 0 && sentCount <= 5 ? 2 : 3;
    if (!Array.isArray(s.koreanOX) || s.koreanOX.length < 2)
      issues.push(
        `본문 ${i + 1}: 한글 O/X ${s.koreanOX?.length ?? 0}문항 (최소 2 필요)`
      );
    if (!Array.isArray(s.englishOX) || s.englishOX.length < engMin)
      issues.push(
        `본문 ${i + 1}: 영어 O/X ${
          s.englishOX?.length ?? 0
        }문항 (최소 ${engMin} 필요)`
      );
  });

  if (data.multipleChoice.length !== setCount)
    issues.push(
      `객관식 ${data.multipleChoice.length}문항 — 단락 수(${setCount})와 일치해야 함`
    );

  data.multipleChoice.forEach((m, i) => {
    if (!Array.isArray(m.choices) || m.choices.length !== 5)
      issues.push(`객관식 ${i + 1}: 선지가 5개가 아님`);
    if (!(m.answer >= 1 && m.answer <= 5))
      issues.push(`객관식 ${i + 1}: 정답 번호가 1~5가 아님`);
    if (
      !Array.isArray(m.choiceTranslations) ||
      m.choiceTranslations.length !== 5
    )
      issues.push(`객관식 ${i + 1}: 선지 해석이 5개가 아님`);
  });

  if (data.multipleChoice.length === 5) {
    const sorted = data.multipleChoice
      .map((m) => m.answer)
      .slice()
      .sort()
      .join(',');
    if (sorted !== '1,2,3,4,5')
      issues.push(
        `객관식 정답 분산 위반: [${data.multipleChoice
          .map((m) => CIRCLED[m.answer - 1])
          .join(' ')}] — 1~5 각 1회여야 함`
      );
  }

  // O/X 비율 (한글/영어 각각)
  const kAll = data.sets.flatMap((s) => s.koreanOX);
  const eAll = data.sets.flatMap((s) => s.englishOX);
  const ratio = (arr) =>
    arr.filter((q) => q.answer === 'X').length / Math.max(arr.length, 1);
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

  // 본문 문장 통째 복사 검사 (영어 문항)
  data.sets.forEach((s, i) => {
    const p = (s.passage || '').replace(/\s+/g, ' ');
    s.englishOX.forEach((q, qi) => {
      const t = (q.text || '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[.?!]$/, '');
      if (t.length > 30 && p.includes(t))
        issues.push(
          `본문 ${i + 1} 영어 ${
            qi + 1
          }번: 본문 문장을 그대로 복사함 (패러프레이즈 필요)`
        );
    });
  });

  // 극단 표현 함정 비율
  const extremeRe =
    /\b(only|never|immediately|always|without any|plenty of|entirely|completely)\b/i;
  const engX = eAll.filter((q) => q.answer === 'X');
  const extremeCount = engX.filter((q) => extremeRe.test(q.text)).length;
  if (engX.length > 0 && extremeCount / engX.length > 0.34)
    issues.push(
      `극단 표현 함정 과다: 영어 X ${engX.length}개 중 ${extremeCount}개`
    );

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
  data.multipleChoice.forEach((m, i) => {
    L.push(`${i + 1}. ${m.question}`);
    m.choices.forEach((c, ci) => {
      L.push(`   ${CIRCLED[ci]} ${c}`);
      L.push('   ' + TRANS_LINE);
    });
    L.push('');
  });

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
  data.multipleChoice.forEach((m, i) => {
    const transStr = m.choiceTranslations
      .map((t, ti) => `${CIRCLED[ti]} ${t}`)
      .join(' ');
    L.push(
      `${i + 1}. **${
        CIRCLED[m.answer - 1]
      }** — 선지 해석: ${transStr} / 근거: ${m.evidence}`
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
  return `${prefix}${Date.now()}_${uidCounter}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function buildStudioJson(data, title) {
  const groups = [];
  const questions = [];

  data.sets.forEach((set, si) => {
    const groupId = uid('g');
    groups.push({
      id: groupId,
      commonQuestionText: `[본문 ${
        si + 1
      }] 다음 글을 읽고, 각 문장이 본문 내용과 일치하면 O, 일치하지 않으면 X 표시하시오.`,
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

  // 객관식 공통 발문 그룹
  let mcGroupId = null;
  if (data.multipleChoice.length > 0) {
    mcGroupId = uid('g');
    groups.push({
      id: mcGroupId,
      commonQuestionText:
        '[객관식] 다음 글의 내용에 관한 물음에 답하고, 각 선지 아래에 해석을 쓰시오.',
      hasCommonPassage: false,
      commonPassage: '',
    });
  }

  data.multipleChoice.forEach((m) => {
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
// Gemini 호출 공통
// ─────────────────────────────────────────────
// models: 문자열 또는 배열. 앞 모델이 실패하면 다음 모델로 자동 폴백.
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
        dataRes?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ||
        '';
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
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('gemini_key') || ''
  );
  const [title, setTitle] = useState('');
  const [engText, setEngText] = useState('');
  const [korText, setKorText] = useState('');
  const [result, setResult] = useState(null); // { data, markdown, studioJson, title, issues }
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

    const engParas = engText.trim().split(/\n\s*\n/).length;
    const korParas = korText.trim().split(/\n\s*\n/).length;
    if (engParas !== korParas) {
      return setError(
        `단락 수가 다릅니다. 영어 ${engParas}개 / 한글 ${korParas}개 — 빈 줄 구분을 맞춰주세요.`
      );
    }

    setError('');
    setLoading(true);
    setResult(null);
    setVerifyReport(null);
    localStorage.setItem('gemini_key', apiKey);

    const t = title.trim() || '고1 교과서';
    const baseUserPrompt = `[영어 본문]\n${engText.trim()}\n\n[한글 해석]\n${korText.trim()}`;

    try {
      let best = null;
      const MAX_TRIES = 3;

      for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
        setStatus(
          attempt === 1
            ? '생성 중... (30초~1분)'
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
          SYSTEM_PROMPT,
          userPrompt
        );
        if (!Array.isArray(data.sets) || !Array.isArray(data.multipleChoice)) {
          throw new Error('응답 형식이 올바르지 않습니다. 다시 시도하세요.');
        }
        const issues = validateData(data);
        if (!best || issues.length < best.issues.length)
          best = { data, issues };
        if (issues.length === 0) break;
      }

      setResult({
        data: best.data,
        markdown: buildMarkdown(best.data, t),
        studioJson: buildStudioJson(best.data, t),
        title: t,
        issues: best.issues,
      });
      setTab('md');
    } catch (e) {
      setError('생성 실패: ' + e.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  // ── 2차 AI 재판정 (상위 모델이 전 문항 O/X를 본문과 대조해 다시 판정) ──
  const verify = async () => {
    if (!result) return;
    setVerifying(true);
    setVerifyReport(null);

    try {
      const d = result.data;
      const lines = [];
      d.sets.forEach((s, si) => {
        lines.push(`[단락 ${si + 1}]\n${s.passage}\n`);
      });
      let idx = 0;
      const flat = [];
      d.sets.forEach((s, si) => {
        s.koreanOX.forEach((q) => {
          idx++;
          flat.push({
            n: idx,
            expected: q.answer,
            label: `한글 ${idx}`,
            text: q.text,
            set: si + 1,
          });
        });
      });
      d.sets.forEach((s, si) => {
        s.englishOX.forEach((q) => {
          idx++;
          flat.push({
            n: idx,
            expected: q.answer,
            label: `영어`,
            text: q.text,
            set: si + 1,
          });
        });
      });

      const itemList = flat
        .map((f) => `${f.n}. (단락 ${f.set}) ${f.text}`)
        .join('\n');

      const verifySystem = `너는 영어 내신 문제 검수자다. 주어진 본문과 문항을 대조하여, 각 문항이 본문 내용과 일치하면 "O", 불일치하면 "X"로만 판정한다.
출력은 JSON 배열만: [{"n": 문항번호, "judge": "O 또는 X"}] — 다른 텍스트 금지.`;
      const verifyUser = `[본문]\n${lines.join(
        '\n'
      )}\n\n[문항 목록 — 각각 O/X 판정하라]\n${itemList}`;

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
            `⚠ 본문 ${f.set} — "${f.text.slice(0, 60)}..." : 1차 ${
              f.expected
            } vs 재판정 ${judgeMap.get(f.n)}`
        ),
      });
    } catch (e) {
      setVerifyReport({
        total: 0,
        checked: 0,
        mismatches: [`검증 실패: ${e.message}`],
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyCurrent = () => {
    const text =
      tab === 'md'
        ? result.markdown
        : JSON.stringify(result.studioJson, null, 2);
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
        <h1>OX 내용일치 문제 생성기 v3.3</h1>
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
          {/* 자동 검증 결과 배지 */}
          {result && (
            <div
              className={result.issues.length === 0 ? 'badge ok' : 'badge warn'}
            >
              {result.issues.length === 0
                ? '✅ 정량 검증 통과 (문항 수 · O/X 비율 · 정답 분산 · 중복 · 복사)'
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

          {/* 2차 재판정 결과 */}
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
              : '생성 결과가 여기에 표시됩니다.\n\n· 생성 직후 정량 검증(문항 수·비율·분산·중복·복사)이 자동으로 돌고, 위반이 있으면 최대 3회까지 자동 재생성합니다.\n· [2차 AI 검증] 버튼: 상위 모델(gemini-3-pro)이 전 O/X 문항을 본문과 대조해 다시 판정하고, 1차 정답과 다른 문항만 ⚠로 표시합니다. 그 문항들만 사람이 확인하면 됩니다.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
