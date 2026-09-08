import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Breadcrumb = ({ items = [] }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5C6B64] dark:text-[#A9AEA7] mb-2">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1.5">
        {i > 0 && <ChevronRight className="h-3 w-3 text-[#72766F] dark:text-[#A9AEA7]" />}
        {item.href ? (
          <Link to={item.href} className="hover:text-[#8A643F] dark:hover:text-[#C5A47E] transition-colors">{item.label}</Link>
        ) : (
          <span className="text-[#183B35] dark:text-[#F2EFE8] font-medium">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

const PageHeader = ({ title, description, breadcrumb, actions }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
    <div>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <h1 className="text-2xl md:text-[28px] font-semibold text-[#183B35] dark:text-[#F2EFE8] tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-[#5C6B64] dark:text-[#A9AEA7]">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
