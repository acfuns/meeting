import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type TimerStatus = 'idle' | 'running' | 'ended'

export interface TeacherRecord {
  id: string
  name: string
  requiredSeconds: number    // 需满足的总时长（秒）
  accumulatedSeconds: number // 已累计的秒数
  status: TimerStatus
  firstStartTime: number | null // 首次点击开始的时间戳（毫秒）
  startTime: number | null      // 当前这一段计时的开始时间戳（毫秒）
  endTime: number | null        // 最近一次点击结束的时间戳（毫秒）
}

interface TeacherStore {
  teachers: TeacherRecord[]
  isMeetingEnded: boolean
  meetingEndTime: number | null
  addTeacher: (name: string, requiredSeconds: number) => void
  startTimer: (id: string) => void
  stopTimer: (id: string) => void
  resumeTimer: (id: string) => void
  resetTimer: (id: string) => void
  removeTeacher: (id: string) => void
  endMeeting: () => void
  reopenMeeting: () => void
  resetAllTimers: () => void
}

export const useTeacherStore = create<TeacherStore>()(
  persist(
    (set) => ({
      teachers: [
        { id: '1', name: '王小韵', requiredSeconds: 900, accumulatedSeconds: 877, status: 'ended', firstStartTime: null, startTime: null, endTime: null },
        { id: '2', name: '程易凡', requiredSeconds: 1800, accumulatedSeconds: 2275, status: 'ended', firstStartTime: null, startTime: null, endTime: null },
        { id: '3', name: '楼晓琳', requiredSeconds: 1800, accumulatedSeconds: 1889, status: 'ended', firstStartTime: null, startTime: null, endTime: null },
        { id: '4', name: '熊娜群', requiredSeconds: 600, accumulatedSeconds: 606, status: 'ended', firstStartTime: null, startTime: null, endTime: null },
        { id: '5', name: '张慧雅', requiredSeconds: 600, accumulatedSeconds: 603, status: 'ended', firstStartTime: null, startTime: null, endTime: null },
      ],
      isMeetingEnded: false,
      meetingEndTime: null,

      addTeacher: (name, requiredSeconds) =>
        set((state) => ({
          teachers: [
            ...state.teachers,
            {
              // 兼容用户直接输入“王小韵”或“王小韵老师”，统一去除末尾的“老师”二字方便渲染
              id: crypto.randomUUID(),
              name: name.trim().replace(/老师$/, ''),
              requiredSeconds,
              accumulatedSeconds: 0,
              status: 'idle',
              firstStartTime: null,
              startTime: null,
              endTime: null,
            },
          ],
        })),

      startTimer: (id) =>
        set((state) => {
          const now = Date.now()
          return {
            teachers: state.teachers.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: 'running',
                    accumulatedSeconds: 0,
                    firstStartTime: now,
                    startTime: now,
                    endTime: null,
                  }
                : t
            ),
          }
        }),

      stopTimer: (id) =>
        set((state) => {
          const now = Date.now()
          return {
            teachers: state.teachers.map((t) => {
              if (t.id !== id || t.status !== 'running' || !t.startTime) return t
              const currentSessionSeconds = Math.max(
                0,
                Math.floor((now - t.startTime) / 1000)
              )
              return {
                ...t,
                status: 'ended',
                accumulatedSeconds: t.accumulatedSeconds + currentSessionSeconds,
                startTime: null,
                endTime: now,
              }
            }),
          }
        }),

      resumeTimer: (id) =>
        set((state) => {
          const now = Date.now()
          return {
            teachers: state.teachers.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: 'running',
                    startTime: now,
                    endTime: null,
                  }
                : t
            ),
          }
        }),

      resetTimer: (id) =>
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status: 'idle',
                  accumulatedSeconds: 0,
                  firstStartTime: null,
                  startTime: null,
                  endTime: null,
                }
              : t
          ),
        })),

      removeTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
        })),

      // 结束会议：自动停止所有还在运行中的老师计时并结算时长
      endMeeting: () =>
        set((state) => {
          const now = Date.now()
          return {
            isMeetingEnded: true,
            meetingEndTime: now,
            teachers: state.teachers.map((t) => {
              if (t.status === 'running' && t.startTime) {
                const currentSessionSeconds = Math.max(
                  0,
                  Math.floor((now - t.startTime) / 1000)
                )
                return {
                  ...t,
                  status: 'ended',
                  accumulatedSeconds: t.accumulatedSeconds + currentSessionSeconds,
                  startTime: null,
                  endTime: now,
                }
              }
              return t
            }),
          }
        }),

      // 继续会议（解除结束状态）
      reopenMeeting: () =>
        set({
          isMeetingEnded: false,
          meetingEndTime: null,
        }),

      // 开启新会议（重置所有老师的计时数据）
      resetAllTimers: () =>
        set((state) => ({
          isMeetingEnded: false,
          meetingEndTime: null,
          teachers: state.teachers.map((t) => ({
            ...t,
            status: 'idle',
            accumulatedSeconds: 0,
            firstStartTime: null,
            startTime: null,
            endTime: null,
          })),
        })),
    }),
    {
      name: 'teacher-timer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
