import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import questionPdfUrl from '../Questions_Only_TieuHoc_STEM.docx.pdf?url'

export type PdfQuestion = {
  id: string
  prompt: string
  options: string[]
  category: string
  grade: number
  questionNumber: number
  sourcePage: number
  kind: 'choice' | 'short' | 'open'
  context?: string
}

export { questionPdfUrl }

const gradeRanges = [
  { grade: 1, first: 1, last: 35 },
  { grade: 2, first: 36, last: 70 },
  { grade: 3, first: 71, last: 137 },
  { grade: 4, first: 138, last: 214 },
  { grade: 5, first: 215, last: 291 },
]

const getCategory = (number: number): string => {
  if (number <= 20 || (number >= 36 && number <= 55) || (number >= 71 && number <= 96) || (number >= 138 && number <= 168) || (number >= 215 && number <= 245)) return 'Toán học'
  if ((number >= 21 && number <= 35) || (number >= 56 && number <= 70) || (number >= 97 && number <= 117)) return 'Tự nhiên và Xã hội'
  if ((number >= 118 && number <= 127) || (number >= 195 && number <= 204) || (number >= 272 && number <= 281)) return 'Tin học'
  if ((number >= 128 && number <= 137) || (number >= 205 && number <= 214) || (number >= 282 && number <= 291)) return 'Công nghệ'
  return 'Khoa học'
}

const cleanQuestionText = (text: string): string => text
  .replace(/hieunc278@gmail\.com\s*-\s*0903408862/gi, ' ')
  .replace(/Hướng dẫn giáo viên đọc\s*:\s*.*?(?=(?:\s[A-D]\.\s)|\s*ANSWER_TYPE\s*:|$)/gi, ' ')
  .replace(/ANSWER_TYPE\s*:[\s\S]*$/i, ' ')
  .replace(/_{3,}/g, ' ')
  .replace(/\s+LỚP\s+[1-5]\s*[—–-][\s\S]*$/i, ' ')
  .replace(/\s+(?:Toán|Khoa học|Tin học|Công nghệ|Tự nhiên và Xã hội)\s+[1-5]\s*\(Q\d+[–-]Q\d+\)[\s\S]*$/i, ' ')
  .replace(/\s+/g, ' ')
  .trim()

const getOptionMatches = (text: string): Array<{ label: string; index: number; contentIndex: number }> =>
  [...text.matchAll(/(?:^|\s)([A-D])\.\s*/g)].map((match) => {
    const labelOffset = match[0].indexOf(match[1])
    return {
      label: match[1],
      index: (match.index ?? 0) + labelOffset,
      contentIndex: (match.index ?? 0) + match[0].length,
    }
  })

const getQuestionParts = (text: string): { prompt: string; options: string[] } => {
  const optionMatches = getOptionMatches(text)
  const firstOption = optionMatches.findIndex((match, index) =>
    match.label === 'A' && optionMatches[index + 1]?.label === 'B' && optionMatches[index + 2]?.label === 'C',
  )

  if (firstOption < 0) return { prompt: text, options: [] }

  const matches = optionMatches.slice(firstOption, firstOption + 4)
  const prompt = text.slice(0, matches[0].index).trim()
  const options = matches.map((match, index) => text
    .slice(match.contentIndex, matches[index + 1]?.index ?? text.length)
    .trim())
  return { prompt, options: options.filter(Boolean) }
}

export async function loadPdfQuestionBank(): Promise<PdfQuestion[]> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const pdf = await getDocument({ url: questionPdfUrl }).promise
  const pageTexts: Array<{ start: number; end: number; text: string }> = []
  let documentText = ''

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items.filter((item) => 'str' in item).map((item) => item.str).join(' ')
    const start = documentText.length
    documentText += `${text}\n`
    pageTexts.push({ start, end: documentText.length, text })
  }

  const questionMarkers = [...documentText.matchAll(/\bQ(\d{1,3})\s*\./g)]
  const contextEntries = new Map<number, string>()

  for (let index = 0; index < questionMarkers.length; index += 1) {
    const marker = questionMarkers[index]
    const end = questionMarkers[index + 1]?.index ?? documentText.length
    const text = cleanQuestionText(documentText.slice((marker.index ?? 0) + marker[0].length, end))
    if (!/CONTEXT\s*\/.*không chấm điểm/i.test(text)) continue

    const referencedQuestions = text.match(/các câu\s+([\d,\s và]+)/i)?.[1]?.match(/\d+/g)?.map(Number) ?? []
    for (const referencedNumber of referencedQuestions) contextEntries.set(referencedNumber, text.replace(/\s*\(CONTEXT\s*\/.*$/i, '').trim())
  }

  const questions: PdfQuestion[] = []
  for (let index = 0; index < questionMarkers.length; index += 1) {
    const marker = questionMarkers[index]
    const questionNumber = Number(marker[1])
    const end = questionMarkers[index + 1]?.index ?? documentText.length
    const text = cleanQuestionText(documentText.slice((marker.index ?? 0) + marker[0].length, end))
    if (!text || /CONTEXT\s*\/.*không chấm điểm/i.test(text)) continue

    const page = pageTexts.find((entry) => (marker.index ?? 0) >= entry.start && (marker.index ?? 0) < entry.end)
    const { prompt, options } = getQuestionParts(text)
    const grade = gradeRanges.find((range) => questionNumber >= range.first && questionNumber <= range.last)?.grade ?? 1
    const kind = options.length
      ? 'choice'
      : /vẽ|thiết kế|mô tả|trình bày|đề xuất|kể cho|giải thích|nêu/i.test(prompt)
        ? 'open'
        : 'short'

    questions.push({
      id: `pdf-q${questionNumber}`,
      prompt,
      options,
      category: getCategory(questionNumber),
      grade,
      questionNumber,
      sourcePage: pageTexts.indexOf(page!) + 1,
      kind,
      context: contextEntries.get(questionNumber),
    })
  }

  if (questions.length !== 285) throw new Error(`Trích xuất được ${questions.length}/285 câu chấm điểm từ PDF.`)
  return questions
}
