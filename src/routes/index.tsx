import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTeacherStore, type TeacherRecord } from '../store/useTeacherStore'
import { formatDateTime, formatDuration } from '../utils/time'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Play,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  FastForward,
  FlagOff,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: TeacherTimerPage,
})

function TeacherTimerPage() {
  const {
    teachers,
    isMeetingEnded,
    addTeacher,
    startTimer,
    stopTimer,
    resumeTimer,
    resetTimer,
    removeTeacher,
    endMeeting,
    reopenMeeting,
    resetAllTimers,
  } = useTeacherStore()

  const [now, setNow] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  // 添加老师表单状态
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState('30')
  const [seconds, setSeconds] = useState('0')

  useEffect(() => {
    setNow(Date.now())
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const totalSec =
      parseInt(minutes || '0', 10) * 60 + parseInt(seconds || '0', 10)
    if (totalSec <= 0) return

    addTeacher(name, totalSec)
    setName('')
  }

  // 计算每位老师的实时总时长（秒）
  const getTeacherTotalSeconds = (t: TeacherRecord) => {
    const runningSec =
      t.status === 'running' && t.startTime && now
        ? Math.max(0, Math.floor((now - t.startTime) / 1000))
        : 0
    return t.accumulatedSeconds + runningSec
  }

  // 生成用于展示和复制的会议汇总纯文本
  const summaryText = [
    '会议已结束 各位老师发言时长如下：',
    ...teachers.map(
      (t) => `${t.name}老师 ${formatDuration(getTeacherTotalSeconds(t))}`,
    ),
  ].join('\n')

  const handleCopySummary = async () => {
    await navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 顶部：标题、当前时间与会议控制按钮 */}
        <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center border">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              医疗会议计时
            </h1>
            <p className="text-sm text-slate-500">
              自动保存本地进度，支持中断后继续补时与会议汇总
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-slate-800">
              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
              <div className="text-sm">
                <span className="text-slate-500 mr-1.5">当前时间:</span>
                <span className="font-mono font-semibold">
                  {now ? formatDateTime(now) : '同步中...'}
                </span>
              </div>
            </div>

            {!isMeetingEnded ? (
              <Button
                onClick={endMeeting}
                variant="destructive"
                disabled={teachers.length === 0}
              >
                <FlagOff className="mr-1.5 h-4 w-4" />
                结束会议
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={reopenMeeting} variant="outline">
                  返回继续会议
                </Button>
                <Button onClick={resetAllTimers} variant="secondary">
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  开启新会议
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 会议结束汇总展示框 */}
        {isMeetingEnded && now !== null && (
          <Card className="border-emerald-300 bg-emerald-50/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-emerald-950">
                会议统计结果
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySummary}
                className="bg-white hover:bg-emerald-100 text-emerald-900 border-emerald-300"
              >
                {copied ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                    已复制结果
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 h-4 w-4" />
                    一键复制文本
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-white p-4 font-mono text-sm leading-relaxed text-slate-800 border border-emerald-200 whitespace-pre-line">
                {summaryText}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 添加老师卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">添加老师与满足时长</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleAddTeacher}
              className="grid grid-cols-1 gap-4 sm:grid-cols-4 sm:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="teacher-name">老师姓名</Label>
                <Input
                  id="teacher-name"
                  placeholder="例如：王小韵"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="req-minutes">满足时长（分钟）</Label>
                <Input
                  id="req-minutes"
                  type="number"
                  min="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="req-seconds">满足时长（秒）</Label>
                <Input
                  id="req-seconds"
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                <Plus className="mr-1.5 h-4 w-4" />
                添加老师
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 老师计时列表 */}
        <div className="space-y-4">
          {now === null ? (
            <div className="rounded-xl border p-12 text-center text-slate-400">
              正在加载本地计时数据...
            </div>
          ) : teachers.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-slate-400">
              暂无老师记录，请在上方添加老师
            </div>
          ) : (
            teachers.map((teacher) => (
              <TeacherTimerCard
                key={teacher.id}
                teacher={teacher}
                now={now}
                onStart={() => startTimer(teacher.id)}
                onStop={() => stopTimer(teacher.id)}
                onResume={() => resumeTimer(teacher.id)}
                onReset={() => resetTimer(teacher.id)}
                onRemove={() => removeTeacher(teacher.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TeacherTimerCard({
  teacher,
  now,
  onStart,
  onStop,
  onResume,
  onReset,
  onRemove,
}: {
  teacher: TeacherRecord
  now: number
  onStart: () => void
  onStop: () => void
  onResume: () => void
  onReset: () => void
  onRemove: () => void
}) {
  const currentRunningSeconds =
    teacher.status === 'running' && teacher.startTime
      ? Math.max(0, Math.floor((now - teacher.startTime) / 1000))
      : 0

  const totalElapsedSeconds = teacher.accumulatedSeconds + currentRunningSeconds
  const isSatisfied = totalElapsedSeconds >= teacher.requiredSeconds
  const remainingSeconds = Math.max(
    0,
    teacher.requiredSeconds - totalElapsedSeconds,
  )

  const expectedSatisfyTime = (() => {
    if (teacher.status === 'running' && teacher.startTime) {
      const neededFromThisSession = Math.max(
        0,
        teacher.requiredSeconds - teacher.accumulatedSeconds,
      )
      return teacher.startTime + neededFromThisSession * 1000
    }
    if (teacher.firstStartTime) {
      return teacher.firstStartTime + teacher.requiredSeconds * 1000
    }
    return null
  })()

  const displayStartTime = teacher.firstStartTime ?? teacher.startTime

  return (
    <Card className="transition-all">
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold text-slate-900">
                {teacher.name}老师
              </h3>
              <Badge variant="outline">
                需满足时长：{formatDuration(teacher.requiredSeconds)}
              </Badge>
              {teacher.status === 'running' && (
                <Badge className="bg-blue-600">
                  {teacher.accumulatedSeconds > 0 ? '补时计时中' : '计时中'}
                </Badge>
              )}
              {teacher.status === 'ended' && (
                <Badge variant={isSatisfied ? 'default' : 'destructive'}>
                  {isSatisfied ? '已达标' : '未达标'}
                </Badge>
              )}
            </div>

            <div className="text-sm text-slate-600">
              当前累计计时时长：
              <span className="ml-1 font-mono text-lg font-bold text-slate-900">
                {formatDuration(totalElapsedSeconds)}
              </span>
              {teacher.accumulatedSeconds > 0 &&
                teacher.status === 'running' && (
                  <span className="ml-2 text-xs text-slate-400">
                    (含前序累计 {formatDuration(teacher.accumulatedSeconds)})
                  </span>
                )}
            </div>

            {teacher.status !== 'idle' &&
              displayStartTime &&
              expectedSatisfyTime && (
                <div className="space-y-1.5 pt-2 text-sm">
                  <p className="text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
                    <span className="font-semibold">{teacher.name}</span> 老师于{' '}
                    <span className="font-mono font-medium text-blue-700">
                      {formatDateTime(displayStartTime)}
                    </span>{' '}
                    开始，需{' '}
                    <span className="font-mono font-medium text-blue-700">
                      {formatDateTime(expectedSatisfyTime)}
                    </span>{' '}
                    可以结束满足时长
                  </p>

                  {teacher.status === 'ended' && teacher.endTime && (
                    <>
                      {isSatisfied ? (
                        <p className="rounded-md bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700 border border-emerald-200">
                          {teacher.name} 老师于{' '}
                          <span className="font-mono">
                            {formatDateTime(teacher.endTime)}
                          </span>{' '}
                          结束满足时长
                        </p>
                      ) : (
                        <p className="rounded-md bg-red-50 px-3 py-1.5 font-medium text-red-700 border border-red-200">
                          {teacher.name} 老师不满足时长需要补充{' '}
                          <span className="font-mono font-bold">
                            {formatDuration(remainingSeconds)}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {teacher.status === 'idle' && (
              <Button
                onClick={onStart}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="mr-1.5 h-4 w-4" />
                开始计时
              </Button>
            )}

            {teacher.status === 'running' && (
              <Button onClick={onStop} variant="destructive">
                <Square className="mr-1.5 h-4 w-4" />
                结束计时
              </Button>
            )}

            {teacher.status === 'ended' && !isSatisfied && (
              <Button
                onClick={onResume}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <FastForward className="mr-1.5 h-4 w-4" />
                继续补时
              </Button>
            )}

            {teacher.status === 'ended' && (
              <Button onClick={onReset} variant="outline">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                重新计时
              </Button>
            )}

            <Button
              onClick={onRemove}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-600"
              title="删除老师"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
