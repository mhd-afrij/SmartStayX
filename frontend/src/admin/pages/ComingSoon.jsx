import { Construction } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/States';

const ComingSoon = ({ title }) => (
  <div>
    <PageHeader title={title} />
    <EmptyState icon={Construction} title="Under construction" description="This section is being built out in a later phase." />
  </div>
);

export default ComingSoon;
