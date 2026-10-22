"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Toast com limpeza automática.
 *
 * O padrão anterior (`setTimeout` solto dentro do handler) vazava o timer e
 * chamava `setState` depois do unmount, além de não cancelar o timer anterior
 * quando duas mensagens eram disparadas em sequência. Centralizar evita repetir
 * o mesmo bug em cada tela.
 */
export function useToast(duration = 2500) {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setMessage(null)
  }, [])

  const show = useCallback(
    (msg: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setMessage(msg)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        setMessage(null)
      }, duration)
    },
    [duration]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { message, show, hide }
}
