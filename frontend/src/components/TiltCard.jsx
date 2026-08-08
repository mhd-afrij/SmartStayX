/**
 * TiltCard — Wraps children in a 3D perspective container that tilts toward
 * the cursor on mouse move. Accepts all standard framer-motion props.
 *
 * @param {Object}   props
 * @param {ReactNode} props.children
 * @param {string}   props.className    — Tailwind classes for the outer container
 * @param {Function} [props.onClick]
 * @param {number}   [props.maxTilt=6] — Max rotation angle in degrees
 * @param {string}   [props.as='div']   — HTML element tag for the inner motion component
 */
import React from 'react'
import { motion } from 'framer-motion'
import { use3DTilt } from '../hooks/use3DTilt'

const TiltCard = ({ children, className, onClick, maxTilt = 6, as = 'div' }) => {
  const { ref, handleMouseMove, handleMouseLeave, rotateX, rotateY, style } = use3DTilt({ maxTilt })
  const InnerComponent = motion[as] || motion.div

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={style}
      className={className}
    >
      <InnerComponent
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        {children}
      </InnerComponent>
    </motion.div>
  )
}

export default TiltCard
