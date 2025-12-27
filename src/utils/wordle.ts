// Wordle game utilities

// Common 5-letter words for the game
export const WORD_LIST = [
  'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult', 'after', 'again',
  'agent', 'agree', 'ahead', 'alarm', 'album', 'alert', 'alike', 'alive', 'allow', 'alone',
  'along', 'alter', 'among', 'anger', 'angle', 'angry', 'apart', 'apple', 'apply', 'arena',
  'argue', 'arise', 'array', 'aside', 'asset', 'avoid', 'award', 'aware', 'awful', 'baby',
  'basic', 'basis', 'beach', 'began', 'begin', 'begun', 'being', 'below', 'bench', 'billy',
  'birth', 'black', 'blame', 'blind', 'block', 'blood', 'board', 'boost', 'booth', 'bound',
  'brain', 'brand', 'bread', 'break', 'breed', 'brief', 'bring', 'broad', 'broke', 'brown',
  'build', 'built', 'buyer', 'cable', 'calif', 'carry', 'catch', 'cause', 'chain', 'chair',
  'chart', 'chase', 'cheap', 'check', 'chest', 'chief', 'child', 'china', 'chose', 'civil',
  'claim', 'class', 'clean', 'clear', 'click', 'climb', 'clock', 'close', 'coach', 'coast',
  'could', 'count', 'court', 'cover', 'craft', 'crash', 'cream', 'crime', 'cross', 'crowd',
  'crown', 'curve', 'cycle', 'daily', 'dance', 'dated', 'dealt', 'death', 'debut', 'delay',
  'depth', 'doing', 'doubt', 'dozen', 'draft', 'drama', 'drank', 'dream', 'dress', 'drill',
  'drink', 'drive', 'drove', 'dying', 'eager', 'early', 'earth', 'eight', 'elite', 'empty',
  'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'event', 'every', 'exact', 'exist',
  'extra', 'faith', 'false', 'fault', 'fiber', 'field', 'fifth', 'fifty', 'fight', 'final',
  'first', 'fixed', 'flash', 'fleet', 'floor', 'fluid', 'focus', 'force', 'forth', 'forty',
  'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front', 'fruit', 'fully', 'funny',
  'giant', 'given', 'glass', 'globe', 'going', 'grace', 'grade', 'grand', 'grant', 'grass',
  'grave', 'great', 'green', 'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide',
  'happy', 'harry', 'heart', 'heavy', 'hence', 'henry', 'horse', 'hotel', 'house', 'human',
  'ideal', 'image', 'index', 'inner', 'input', 'issue', 'japan', 'jimmy', 'joint', 'jones',
  'judge', 'juice', 'known', 'label', 'large', 'laser', 'later', 'laugh', 'layer', 'learn',
  'lease', 'least', 'leave', 'legal', 'level', 'lewis', 'light', 'limit', 'links', 'lives',
  'local', 'logic', 'loose', 'lower', 'lucky', 'lunch', 'lying', 'magic', 'major', 'maker',
  'march', 'maria', 'match', 'maybe', 'mayor', 'meant', 'media', 'metal', 'might', 'minor',
  'minus', 'mixed', 'model', 'money', 'month', 'moral', 'motor', 'mount', 'mouse', 'mouth',
  'movie', 'music', 'needs', 'never', 'newly', 'night', 'noise', 'north', 'noted', 'novel',
  'nurse', 'occur', 'ocean', 'offer', 'often', 'order', 'other', 'ought', 'paint', 'panel',
  'paper', 'party', 'peace', 'peter', 'phase', 'phone', 'photo', 'piece', 'pilot', 'pitch',
  'place', 'plain', 'plane', 'plant', 'plate', 'point', 'pound', 'power', 'press', 'price',
  'pride', 'prime', 'print', 'prior', 'prize', 'proof', 'proud', 'prove', 'queen', 'quick',
  'quiet', 'quite', 'radio', 'raise', 'range', 'rapid', 'ratio', 'reach', 'ready', 'refer',
  'right', 'rival', 'river', 'robin', 'roger', 'roman', 'rough', 'round', 'route', 'royal',
  'rural', 'scale', 'scene', 'scope', 'score', 'sense', 'serve', 'seven', 'shall', 'shape',
  'share', 'sharp', 'sheet', 'shelf', 'shell', 'shift', 'shirt', 'shock', 'shoot', 'short',
  'shown', 'sight', 'since', 'sixth', 'sixty', 'sized', 'skill', 'sleep', 'slide', 'small',
  'smart', 'smile', 'smith', 'smoke', 'solid', 'solve', 'sorry', 'sound', 'south', 'space',
  'spare', 'speak', 'speed', 'spend', 'spent', 'split', 'spoke', 'sport', 'staff', 'stage',
  'stake', 'stand', 'start', 'state', 'steam', 'steel', 'stick', 'still', 'stock', 'stone',
  'stood', 'store', 'storm', 'story', 'strip', 'stuck', 'study', 'stuff', 'style', 'sugar',
  'suite', 'super', 'sweet', 'table', 'taken', 'taste', 'taxes', 'teach', 'teeth', 'terry',
  'texas', 'thank', 'theft', 'their', 'theme', 'there', 'these', 'thick', 'thing', 'think',
  'third', 'those', 'three', 'threw', 'throw', 'tight', 'times', 'tired', 'title', 'today',
  'topic', 'total', 'touch', 'tough', 'tower', 'track', 'trade', 'train', 'treat', 'trend',
  'trial', 'tribe', 'trick', 'tried', 'tries', 'truck', 'truly', 'trust', 'truth', 'twice',
  'under', 'union', 'unity', 'until', 'upper', 'upset', 'urban', 'usage', 'usual', 'valid',
  'value', 'video', 'virus', 'visit', 'vital', 'voice', 'waste', 'watch', 'water', 'wheel',
  'where', 'which', 'while', 'white', 'whole', 'whose', 'width', 'woman', 'women', 'world',
  'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'write', 'wrong', 'wrote', 'yield',
  'young', 'youth', 'zebra', 'zesty'
]

export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd'

export type GuessResult = {
  letter: string
  state: LetterState
}[]

export function getRandomWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase()
}

export function getDailyWord(): string {
  // Use date as seed for consistent daily word
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seed % WORD_LIST.length
  return WORD_LIST[index].toUpperCase()
}

export function checkGuess(guess: string, answer: string): GuessResult {
  const result: GuessResult = []
  const answerChars = answer.split('')
  const guessChars = guess.toUpperCase().split('')
  const used = new Array(5).fill(false)

  // First pass: mark correct positions
  for (let i = 0; i < 5; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = { letter: guessChars[i], state: 'correct' }
      used[i] = true
    }
  }

  // Second pass: mark present/absent
  for (let i = 0; i < 5; i++) {
    if (result[i]) continue
    
    let found = false
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessChars[i] === answerChars[j]) {
        result[i] = { letter: guessChars[i], state: 'present' }
        used[j] = true
        found = true
        break
      }
    }
    
    if (!found) {
      result[i] = { letter: guessChars[i], state: 'absent' }
    }
  }

  return result
}

export function isValidWord(word: string): boolean {
  return WORD_LIST.includes(word.toLowerCase())
}

export const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
]
