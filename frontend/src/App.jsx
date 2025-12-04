import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

/* Question pools by difficulty.
   You can expand each list — currently there are 8-10 each for demo. */
const QUESTIONS_BY_LEVEL = {
  easy: [
    { q: "What color is the sky on a clear day?", options:["Blue","Green","Red","Black"], a:0 },
    { q: "What is 2 + 2?", options:["3","4","5","6"], a:1 },
    { q: "Which animal barks?", options:["Cat","Dog","Bird","Fish"], a:1 },
    { q: "What do we call frozen water?", options:["Steam","Ice","Fog","Rain"], a:1 },
    { q: "Which shape has 4 equal sides?", options:["Triangle","Circle","Square","Line"], a:2 },
    { q: "Which fruit is yellow and curved?", options:["Apple","Banana","Grapes","Orange"], a:1 },
    { q: "What is the opposite of 'up'?", options:["Left","Right","Down","Across"], a:2 },
    { q: "Which season is hot and sunny (generally)?", options:["Winter","Spring","Autumn","Summer"], a:3 },
    { q: "Which one is a vehicle?", options:["Car","Tree","House","Shoe"], a:0 },
    { q: "What sound does a cow make?", options:["Moo","Baa","Neigh","Meow"], a:0 },
  ],
  intermediate: [
    { q: "Capital of France?", options:["Lyon","Paris","Marseille","Nice"], a:1 },
    { q: "Which language powers React?", options:["Python","JavaScript","Ruby","Go"], a:1 },
    { q: "What does CSS stand for?", options:["Cascading Style Sheets","Computer Style Sheets","Creative Style System","Control Style Sheet"], a:0 },
    { q: "HTML stands for?", options:["HyperText Markup Language","Home Tool Markup","Hyperlinks Text","Hyperlink Machine"], a:0 },
    { q: "Which one is a JavaScript framework?", options:["Laravel","Django","Vue","Rails"], a:2 },
    { q: "Which planet is known as the Red Planet?", options:["Venus","Earth","Mars","Mercury"], a:2 },
    { q: "Which company created Windows OS?", options:["Apple","Microsoft","Google","IBM"], a:1 },
    { q: "Which is a package manager for JavaScript?", options:["npm","pip","gem","composer"], a:0 },
    { q: "2 * 6 - 3 = ?", options:["9","12","15","10"], a:0 },
    { q: "In CSS, which property controls flex direction?", options:["flex-direction","direction","flow","layout"], a:0 },
  ],
  hard: [
    { q: "Which sorting algorithm has average O(n log n)?", options:["Bubble","Selection","QuickSort","Insertion"], a:2 },
    { q: "What is a closure in JavaScript?", options:["A function and its lexical environment","A database","A CSS rule","An HTML tag"], a:0 },
    { q: "Which HTTP status means 'Not Found'?", options:["200","301","404","500"], a:2 },
    { q: "What does SQL stand for?", options:["Structured Query Language","Simple Query Language","Sequential Query Logic","Server Query Language"], a:0 },
    { q: "Which data structure uses FIFO?", options:["Stack","Queue","Tree","Graph"], a:1 },
    { q: "Which complexity is exponential growth?", options:["O(n)","O(log n)","O(n^2)","O(2^n)"], a:3 },
    { q: "Which protocol secures traffic with TLS?", options:["HTTP","FTP","HTTPS","SMTP"], a:2 },
    { q: "What is memoization?", options:["Caching results of function calls","Sorting technique","Database replication","A CSS concept"], a:0 },
    { q: "Which keyword creates a new class instance in JS?", options:["init","new","create","instance"], a:1 },
    { q: "In React, which hook is used for side effects?", options:["useState","useEffect","useRef","useMemo"], a:1 },
  ]
}

/* Level settings:
   - timer: seconds per question
   - opponentAggressiveness: probability the opponent gains a point per tick
*/
const LEVEL_SETTINGS = {
  easy: { timer: 15, opponentAggressiveness: 0.35 },
  intermediate: { timer: 12, opponentAggressiveness: 0.55 },
  hard: { timer: 9, opponentAggressiveness: 0.72 },
}

function ProgressBar({ value=0, max=100 }){
  const pct = Math.round((value/max)*100)
  return (
    <div className="w-full bg-white/40 rounded-full h-3 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({length: 18}).map((_,i)=>(
    <div key={i} className={"confetti confetti-"+(i%6)} style={{ left: `${(i*7)%100}%`, animationDelay: `${(i%5)*0.12}s` }}>🎉</div>
  ))
  return <div className="confetti-wrap pointer-events-none">{pieces}</div>
}

export default function App(){
  const [name, setName] = useState('')
  const [level, setLevel] = useState('intermediate') // default
  const [stage, setStage] = useState('home') // home, searching, playing, result
  const [questions, setQuestions] = useState(QUESTIONS_BY_LEVEL[level])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'correct'|'wrong'|null
  const [timeLeft, setTimeLeft] = useState(LEVEL_SETTINGS[level].timer)
  const timerRef = useRef(null)
  const [opponentScore, setOpponentScore] = useState(0)
  const [opponentName, setOpponentName] = useState('')

  // reset questions when level changes on home screen
  useEffect(()=>{
    if(stage === 'home'){
      setQuestions(QUESTIONS_BY_LEVEL[level])
      setTimeLeft(LEVEL_SETTINGS[level].timer)
    }
  },[level, stage])

  useEffect(()=>{
    if(stage === 'searching'){
      // simulate matchmaking then start with chosen level
      const t = setTimeout(()=>{
        setOpponentName('Player_'+Math.floor(Math.random()*900+100))
        startGame()
      }, 900 + Math.random()*900)
      return ()=>clearTimeout(t)
    }
  },[stage, level])

  useEffect(()=>{
    if(stage === 'playing'){
      resetTimer()
    } else {
      clearTimer()
    }
    return ()=>clearTimer()
  },[stage, index, level])

  useEffect(()=>{
    // opponent simulated progress while playing; aggressiveness depends on level
    if(stage === 'playing'){
      const aggressiveness = LEVEL_SETTINGS[level].opponentAggressiveness || 0.5
      const oint = setInterval(()=>{
        if(Math.random() < aggressiveness){
          setOpponentScore(s => Math.min(s + 1, questions.length))
        }
      }, 1200 + Math.random()*1200)
      return ()=>clearInterval(oint)
    }
  },[stage, questions.length, level])

  function resetTimer(){
    setTimeLeft(LEVEL_SETTINGS[level].timer)
    clearTimer()
    timerRef.current = setInterval(()=>{
      setTimeLeft(t => {
        if(t <= 1){
          clearTimer()
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }
  function clearTimer(){ if(timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }

  function startMatch(){ if(!name.trim()) return alert('Please enter your name'); setStage('searching') }
  function startGame(){
    setStage('playing')
    setIndex(0)
    setScore(0)
    setOpponentScore(0)
    setSelected(null)
    setFeedback(null)
    // shuffle questions for this match to vary the experience
    const pool = QUESTIONS_BY_LEVEL[level] || QUESTIONS_BY_LEVEL.intermediate
    setQuestions(shuffleArray(pool).slice(0, 10))
    setTimeLeft(LEVEL_SETTINGS[level].timer)
  }

  function handleTimeout(){
    setFeedback('wrong')
    setSelected(null)
    setTimeout(()=> nextQuestion(), 800)
  }

  function choose(i){
    if(selected !== null) return
    setSelected(i)
    clearTimer()
    const correct = questions[index].a === i
    if(correct){
      setScore(s => s + 1)
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }
    setTimeout(()=> nextQuestion(), 900)
  }

  function nextQuestion(){
    setFeedback(null)
    setSelected(null)
    if(index < questions.length - 1){
      setIndex(idx => idx + 1)
    } else {
      setStage('result')
    }
  }

  function playAgain(){
    setStage('home')
    setName('')
    setIndex(0)
    setScore(0)
    setOpponentScore(0)
  }

  const q = questions[index]
  const winner = score === opponentScore ? 'draw' : (score > opponentScore ? 'you' : 'opponent')

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-pink-50 to-yellow-50">
      <div className="w-full max-w-5xl">
        <div className="card relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 flex items-center gap-3">
                <span className="text-4xl">🎯</span> Game Quiz Arena
              </h1>
              <p className="text-sm text-gray-600 mt-1">Live-style quiz — pick a level and challenge yourself.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Level</div>
              <div className="font-medium text-gray-700">{capitalize(level)}</div>
            </div>
          </div>

          {stage === 'home' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600">Your name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. StarPlayer" className="mt-2 w-full p-3 rounded-lg shadow-sm border focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                <label className="text-sm text-gray-600 mt-4 block">Choose level</label>
                <select value={level} onChange={e=>setLevel(e.target.value)} className="mt-2 w-44 p-2 rounded-lg border shadow-sm">
                  <option value="easy">Easy</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="hard">Hard</option>
                </select>

                <div className="mt-6 flex gap-3">
                  <button className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold shadow-lg hover:scale-105 transition" onClick={startMatch}>Find Opponent</button>
                  <button className="px-4 py-3 rounded-full border" onClick={()=>setName('Guest'+Math.floor(Math.random()*999))}>Random name</button>
                </div>

                <div className="mt-6 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Level affects question difficulty, timer and opponent strength.</li>
                    <li>Easy: more time, gentle opponent. Hard: less time, tougher opponent.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-full p-6 rounded-xl bg-gradient-to-tr from-white/60 to-white/30 border-dashed border-2 border-gray-200 text-center">
                  <h3 className="text-lg font-semibold text-gray-800">How the duel works</h3>
                  <p className="text-sm text-gray-600 mt-3">You and an opponent will answer the same questions. Fast + correct wins.</p>
                </div>
              </div>
            </div>
          )}

          {stage === 'searching' && (
            <div className="py-10 text-center">
              <div className="mx-auto w-48 h-48 rounded-full bg-gradient-to-tr from-indigo-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold shadow-lg animate-pulse">
                <div>
                  <div className="text-xs opacity-90">Searching</div>
                  <div className="text-2xl mt-1">Finding Match</div>
                </div>
              </div>
              <p className="mt-6 text-gray-600">Finding {capitalize(level)} opponent... {name ? `Player: ${name}` : ''}</p>
            </div>
          )}

          {stage === 'playing' && q && (
            <div className="md:flex md:gap-6">
              <div className="md:flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">You</div>
                    <div className="font-semibold">{name || 'You'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Opponent</div>
                    <div className="font-semibold">{opponentName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Question</div>
                    <div className="font-semibold">{index+1}/{questions.length}</div>
                  </div>
                </div>

                <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-md relative">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <ProgressBar value={index} max={questions.length} />
                    </div>
                    <div className="w-48 text-right text-sm text-gray-600">Time left: <span className="font-semibold text-indigo-600">{timeLeft}s</span></div>
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800">{q.q}</h2>

                  <div className="mt-5 grid gap-3 grid-cols-1 md:grid-cols-2">
                    {q.options.map((opt, i)=>{
                      const isSelected = selected === i
                      const correct = q.a === i
                      const showCorrect = feedback && correct
                      const wrongSelected = feedback === 'wrong' && isSelected
                      return (
                        <motion.button
                          key={i}
                          onClick={()=>choose(i)}
                          whileHover={{ scale: 1.02 }}
                          className={
                            "text-left p-3 rounded-lg shadow-sm border transition-all " +
                            (showCorrect ? "ring-2 ring-emerald-400 bg-emerald-50/80" : "") +
                            (wrongSelected ? "ring-2 ring-rose-400 bg-rose-50/80" : "") +
                            (!feedback ? " hover:scale-[1.01] bg-white" : " bg-white/60")
                          }>
                          <div className="text-sm font-semibold">{String.fromCharCode(65+i)}. {opt}</div>
                        </motion.button>
                      )
                    })}
                  </div>

                  <AnimatePresence>
                    {feedback === 'correct' && (
                      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="absolute right-6 top-6 bg-emerald-500 text-white px-3 py-2 rounded-full shadow">Correct +1</motion.div>
                    )}
                    {feedback === 'wrong' && (
                      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="absolute right-6 top-6 bg-rose-500 text-white px-3 py-2 rounded-full shadow">Wrong</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Score: <span className="font-semibold text-indigo-600">{score}</span></div>
                  <div>
                    <button onClick={()=>setStage('home')} className="px-3 py-2 rounded-md border">Quit</button>
                  </div>
                </div>
              </div>

              <div className="md:w-72 mt-6 md:mt-0 space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-tr from-pink-50 to-indigo-50 shadow-inner text-center">
                  <div className="text-xs text-gray-500">Opponent</div>
                  <div className="text-lg font-semibold">{opponentName}</div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-600">Score</div>
                    <div className="text-2xl font-bold text-pink-600">{opponentScore}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/70 text-sm">Tip: Answer fast — timer counts down for each question.</div>
                <div className="p-3 rounded-lg bg-white/70 text-sm">Level: <span className="font-semibold">{capitalize(level)}</span></div>
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div className="text-center py-8 relative">
              <Confetti />
              <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} className="mx-auto w-56 h-56 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg">
                {winner === 'you' ? '🏆' : winner === 'opponent' ? '🤝' : '⚖️'}
              </motion.div>

              <motion.h3 initial={{ y: 8, opacity:0 }} animate={{ y:0, opacity:1 }} className="mt-6 text-2xl font-bold">
                {winner === 'you' ? 'You Won!' : winner === 'opponent' ? 'Opponent Wins' : `It's a Draw`}
              </motion.h3>

              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-gray-600 mt-2">
                You: <span className="font-semibold text-indigo-600">{score}</span> — Opponent: <span className="font-semibold text-pink-600">{opponentScore}</span>
              </motion.p>

              <div className="mt-6 flex items-center justify-center gap-4">
                <motion.button whileTap={{ scale:0.98 }} onClick={playAgain} className="px-5 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow">Play Again</motion.button>
                <motion.button whileTap={{ scale:0.98 }} onClick={()=>setStage('home')} className="px-4 py-3 rounded-full border">Home</motion.button>
                <motion.button whileTap={{ scale:0.98 }} onClick={()=>navigator.clipboard?.writeText(`I scored ${score} in Game Quiz Arena (Level: ${capitalize(level)})! Try it yourself.`)} className="px-4 py-3 rounded-full border">Share</motion.button>
              </div>

              <motion.div initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} className="mt-6 flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Your rank</div>
                  <div className="text-xl font-bold text-indigo-600">{Math.min(100, 100 - (questions.length - score) * 5)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500">Streak</div>
                  <div className="text-xl font-bold text-pink-600">{Math.max(0, score - Math.floor(opponentScore/2))}</div>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .confetti-wrap { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .confetti { position: absolute; top: -8%; font-size: 20px; opacity: 0.95; transform: translateY(-10px); animation: fall 2.2s linear infinite; }
        .confetti-0 { animation-duration: 2.6s; }
        .confetti-1 { animation-duration: 2.8s; }
        .confetti-2 { animation-duration: 3s; }
        .confetti-3 { animation-duration: 2.4s; }
        .confetti-4 { animation-duration: 3.2s; }
        .confetti-5 { animation-duration: 2.7s; }
        @keyframes fall { to { transform: translateY(120vh) rotate(360deg); opacity: 0.6; } }
      `}</style>
    </div>
  )
}

/* Helper utils */
function shuffleArray(arr){
  const a = arr.slice()
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1))
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
function capitalize(s){ return s && s[0].toUpperCase() + s.slice(1) }
