import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { AnchorHTMLAttributes } from 'react'

type CustomLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  children: React.ReactNode
  className?: string
}

export default function ExternalLink({ href, children, className = '', ...props }: CustomLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('www')

  if (isExternal) {
    return (
      <a
        href={href}
        className={`inline-flex items-center text-blue-600 hover:underline ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
        <ExternalLinkIcon className="ml-1 h-4 w-4" />
      </a>
    )
  }

  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  )
}
