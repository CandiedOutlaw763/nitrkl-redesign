'use client'

/**
 * @author: @emerald-ui
 * @description: Editorial-style team member card with overlapping layers and motion
 * @version: 2.0.0
 * @date: 2026-02-19
 * @license: MIT
 * @website: https://emerald-ui.com
 *
 */
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
function cn(...inputs: any[]) { return twMerge(clsx(inputs)) }

export interface TeamMemberCardProps {
  position?: 'left' | 'right'
  jobPosition?: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  description?: string
  ctaHref?: string
  className?: string
}

/**
 * Editorial-style team member card with overlapping portrait, large display
 * typography, circular CTA toggle, and staggered entrance animations.
 */
export default function TeamMemberCard({
  position = 'left',
  jobPosition = 'Director, NIT Rourkela',
  firstName = 'Prof. K.',
  lastName = 'Umamaheshwar Rao',
  imageUrl = 'assets/images/director.webp',
  description = 'It is a privilege for me to have assumed the position of Director, NIT Rourkela. NIT Rourkela has a rich legacy of sixty dedicated years of service to the nation and is the pride of Odisha. Excellence in teaching and high-quality research are the pillars on which the Institute is built.',
  ctaHref = '/About/DirectorsMessage/',
  className,
}: TeamMemberCardProps) {
  const fullName = `${firstName} ${lastName}`
  const isPositionRight = position === 'right'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative my-8 flex flex-col justify-center font-sans', className)}
    >
      {/* jobPosition label — editorial uppercase tracking */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <p
          className={cn(
            'mb-4 text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase dark:text-zinc-500',
            isPositionRight && 'text-right'
          )}
        >
          {jobPosition}
        </p>
      </motion.div>

      <div className='flex items-center justify-end'>
        {/* Portrait image with reveal animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative h-125 w-90 shrink-0 overflow-hidden rounded-2xl bg-zinc-900/40 border border-white/10 shadow-2xl',
            isPositionRight && 'order-1'
          )}
        >
          {/* Subtle grain/gradient overlay for texture */}
          <div className='pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
          <img
            src={imageUrl}
            alt={fullName}
            className='h-full w-full object-cover duration-500 ease-[0.22,1,0.36,1] hover:scale-105'
          />
        </motion.div>

        {/* Info block — overlaps image via negative margin */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative -left-8 z-2 flex w-[calc(100%-350px)] flex-col gap-10 bg-zinc-950/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl',
            isPositionRight && 'left-8 items-end'
          )}
        >
          {/* Display name — large editorial type */}
          <div>
            <p className='text-5xl leading-[1.1] font-extralight tracking-tight text-white'>
              {firstName}
              <br />
              <span className='font-normal text-amber-400'>{lastName}</span>
            </p>
          </div>

          {/* Details row — toggle + bio */}
          <div className={cn('flex items-center gap-8', isPositionRight && 'justify-end')}>
            {/* Circular CTA with hover pulse */}
            <motion.a
              href={ctaHref}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Read full message from director"
              className={cn(
                'group flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 transition-all duration-300 hover:border-amber-400 hover:bg-amber-400/20',
                isPositionRight && 'order-1'
              )}
            >
              <ArrowRight
                size={22}
                className={cn(
                  'text-zinc-300 transition-all duration-300 group-hover:-rotate-45 group-hover:text-amber-300',
                  isPositionRight && 'rotate-180 group-hover:rotate-225'
                )}
              />
            </motion.a>

            {/* Bio copy — restrained body text */}
            <div className='max-w-md'>
              <p
                className={cn(
                  'text-sm leading-[1.8] text-zinc-300',
                  isPositionRight && 'text-right'
                )}
              >
                {description}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
