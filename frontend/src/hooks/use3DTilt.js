/**
 * use3DTilt — Tracks mouse position over an element and returns spring-animated
 * rotateX/rotateY motion values for a 3D perspective tilt effect.
 *
 * @param {Object}   options
 * @param {number}   options.maxTilt      — Max rotation angle in degrees (default 8)
 * @param {number}   options.perspective  — CSS perspective value in px (default 1200)
 * @param {Object}   options.springConfig — framer-motion spring config (default stiffness 300, damping 30)
 * @returns {{ ref, handleMouseMove, handleMouseLeave, rotateX, rotateY, style }}
 */
import { useCallback, useRef } from 'react'
import { useMotionValue, useSpring, useTransform } from 'framer-motion'

export const use3DTilt = (options = {}) => {
  const {
    maxTilt = 8,
    perspective = 1200,
    springConfig = { stiffness: 300, damping: 30 },
  } = options

  const ref = useRef(null)

  // Normalised cursor position within the element (0–1)
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)

  // Map cursor position to rotation and spring-animate for smoothness
  const rotateX = useSpring(useTransform(y, [0, 1], [maxTilt, -maxTilt]), springConfig)
  const rotateY = useSpring(useTransform(x, [0, 1], [-maxTilt, maxTilt]), springConfig)

  const handleMouseMove = useCallback((e) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - rect.left) / rect.width)
    y.set((e.clientY - rect.top) / rect.height)
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0.5)
    y.set(0.5)
  }, [x, y])

  return {
    ref,
    handleMouseMove,
    handleMouseLeave,
    rotateX,
    rotateY,
    style: { perspective, transformStyle: 'preserve-3d' },
  }
}
