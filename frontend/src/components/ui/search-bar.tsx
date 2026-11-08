import { forwardRef } from 'react'
import { Search } from 'lucide-react'

export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
  className?: string
  searchRef?: React.RefObject<HTMLInputElement>
  containerRef?: React.RefObject<HTMLDivElement>
}

export const SearchBar = forwardRef<HTMLDivElement, SearchBarProps>(({ 
  placeholder = 'Search...', 
  className,
  searchRef,
  containerRef,
  ...inputProps
}, ref) => {
  // Use the containerRef if provided, otherwise use the forwarded ref
  const effectiveContainerRef = containerRef || ref;
  
  return (
    <div 
      ref={effectiveContainerRef}
      className={[
        'search-group',
        className
      ].filter(Boolean).join(' ')}
    >
      <Search 
        className="search-icon" 
        aria-hidden="true" 
      />
      <input
        className="search-input"
        type="search"
        placeholder={placeholder}
        ref={searchRef}
        {...inputProps}
      />
    </div>
  )
})

SearchBar.displayName = 'SearchBar'
