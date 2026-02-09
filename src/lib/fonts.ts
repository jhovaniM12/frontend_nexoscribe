/**
 * NexoScribe Typography System
 * Plus Jakarta Sans: Modern, professional, highly legible
 * DM Sans: For numbers and data displays
 * JetBrains Mono: For code blocks
 */

import { Plus_Jakarta_Sans, DM_Sans, JetBrains_Mono } from 'next/font/google'

export const jakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
    weight: ['300', '400', '500', '600', '700'],
})

export const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm',
    display: 'swap',
    weight: ['400', '500', '600', '700'],
})

export const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
    weight: ['400', '500'],
})

export const fontVariables = `${jakartaSans.variable} ${dmSans.variable} ${jetbrainsMono.variable}`
